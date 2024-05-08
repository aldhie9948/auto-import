import initKnex from "./knex";
import moment from "moment";
import type { IArea, IPlan, IPlanDetail } from "./types";
import _ from "lodash";
import path from "path";
import fs from "fs-extra";
import { error } from "./logger";

const dbStokBarang = initKnex("stok_barang");
const dbPayroll = initKnex("m-payroll");

export async function checkPlan(plan: IPlan) {
  return await (<Promise<IPlan>>dbStokBarang.first().from("im_plan").where({
    plan_no: plan.plan_no,
    pic: plan.pic,
    shift: plan.shift,
  }));
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
  const areaDb = await (<Promise<IArea>>(
    dbStokBarang.first().from("im_area").where("kode_area", area)
  ));
  const karyawanDb = await dbPayroll
    .first()
    .from("data_karyawan")
    .where("nik", karyawan);
    
  return {
    plan_no: [shift, area, unformattedTanggal].join("-"),
    pic: karyawan,
    shift,
    tanggal,
    bagian: areaDb.nama_area.toUpperCase(),
    dept: karyawanDb.departemen,
  };
}

export async function checkPlanDetail(
  plans: IPlanDetail[],
  filename: string,
  callback?: Function
) {
  await Promise.all(
    _.map(plans, async (plan) => {
      // check plan_no nama file dengan plan_no isi file
      const pattern = new RegExp(plan.plan_no);
      if (!pattern.test(filename))
        throw new Error(
          `Plan No. '${plan.plan_no}' berbeda dengan '${filename}'`
        );
      const detailPlan = await dbStokBarang
        .first()
        .from("im_plan_detail")
        .where({
          plan_no: plan.plan_no,
          id_barang: plan.id_barang,
          keterangan: plan.keterangan,
          mesin: plan.mesin,
        });
      callback && (await callback(detailPlan));
    })
  );
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
