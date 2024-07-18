import fs from "fs-extra";
import _ from "lodash";
import moment from "moment";
import path from "path";
import initKnex from "./knex";
import { error, info } from "./logger";
import type { IArea, IPlan, IPlanDetail } from "./types";

const dbStokBarang = initKnex("stok_barang");
const dbPayroll = initKnex("m-payroll");

export async function checkPlan(plan: IPlan) {
  const result = (await dbStokBarang("im_plan").first().where({
    plan_no: plan.plan_no,
    pic: plan.pic,
    shift: plan.shift,
  })) as IPlan;
  if (result) {
    error("[×] : Plan No: ".concat(plan.plan_no));
    throw new Error(
      "[FAILED] : Plan No. ".concat(plan.plan_no, " sudah terdaftar di MMS")
    );
  } else info("[✓] : Plan No: ".concat(plan.plan_no));
}

export async function filenameToPlan(filename: string): Promise<IPlan> {
  // regex untuk capture "-" kecuali di dalam "()"
  const pattern = new RegExp(/(?!\([^)]*)-(?![^(]*\))/gi);
  const data = filename.split(pattern);
  const shift = data[0];
  const area = data[1];
  //   DDMMYY
  const unformattedTanggal = data[2];
  const tanggal = moment(unformattedTanggal, "DDMMYY").format("YYYY-MM-DD");
  //   (<ID>).<ext>
  const unformattedKaryawan = data[3];
  const karyawan = unformattedKaryawan
    .replace(/[()]/gi, "")
    .replace(/[.].*/gi, "");
  const areaDb = (await dbStokBarang("im_area")
    .first()
    .where("kode_area", area)) as IArea;
  const karyawanDb = await dbPayroll("data_karyawan")
    .first()
    .where("nik", karyawan);
  if (karyawanDb)
    info(
      "Planner : ".concat(
        karyawanDb.nm_depan_karyawan,
        " (",
        karyawanDb.nik,
        ")"
      )
    );
  return {
    plan_no: [shift, area, unformattedTanggal].join("-"),
    pic: karyawan,
    shift,
    tanggal,
    bagian: areaDb.nama_area.toUpperCase(),
    dept: karyawanDb.departemen,
    tanggal_selesai: null,
  };
}

export async function checkPlanDetail(plans: IPlanDetail[], filename: string) {
  const result = await Promise.all(
    _.map(plans, async (plan) => {
      // check plan_no nama file dengan plan_no isi file
      const pattern = new RegExp(plan.plan_no);
      if (!pattern.test(filename))
        throw new Error(
          `[FAILED] : Plan No. '${plan.plan_no}' berbeda dengan '${filename}'`
        );
      const detailPlan = await dbStokBarang("im_plan_detail AS ipd")
        .first()
        .where({
          plan_no: plan.plan_no,
          id_barang: plan.id_barang,
          keterangan: plan.keterangan,
          mesin: plan.mesin,
        });
      if (!detailPlan)
        info("[✓] : Plan Detail: ".concat(plan.id_barang, " - ", plan.mesin));
      else
        error("[×] : Plan Detail: ".concat(plan.id_barang, " - ", plan.mesin));
      return { id: plan.id_barang, plan: detailPlan };
    })
  );
  if (result.some((r) => r.plan))
    throw new Error("[FAILED] : Plan Detail sudah terdaftar di MMS");
}

export function renameFile(newName: string, oldName: string, pathDir: string) {
  try {
    const PATH_OLD_NAME = path.join(pathDir, oldName);
    const PATH_NEW_NAME = path.join(pathDir, newName);
    fs.renameSync(PATH_OLD_NAME, PATH_NEW_NAME);
  } catch (err) {
    let msg = "";
    if (err instanceof Error) msg = err.message;
    error(msg);
  }
}
