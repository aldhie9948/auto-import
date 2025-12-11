import fs from "fs-extra";
import path from "path";
import day from "./day";
import initKnex from "./knex";
import { error, info } from "./logger";
import { IArea, IPlan } from "./types";

const SB = initKnex("stok_barang");
const PY = initKnex("m-payroll");

export async function checkPlan(plan: IPlan) {
  const result: IPlan = await SB("im_plan").first().where({
    plan_no: plan.plan_no,
    pic: plan.pic,
    shift: plan.shift,
  });

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
  const [shift, areaCode, planDate, worker, flag] = filename.split(pattern);
  //   DDMMYY
  const date = day(planDate, "DDMMYY").format("YYYY-MM-DD");
  //   (<ID>).<ext>
  const employeeId = worker.replace(/[()]/gi, "").replace(/[.].*/gi, "");
  const area: IArea = await SB("im_area").first().where("kode_area", areaCode);
  const employee = await PY("data_karyawan").first().where("nik", employeeId);

  if (employee) {
    const { nm_depan_karyawan: name, nik } = employee;
    const text = `Planner: ${name} (${nik})`;
    info(text);
  }

  let planStructure = [shift, areaCode, planDate];

  if (flag) {
    const formatted = flag.replace(/[.].*/gi, "");
    planStructure.push(formatted);
  }

  return {
    plan_no: planStructure.join("-"),
    pic: employeeId,
    shift,
    tanggal: date,
    bagian: area.nama_area.toUpperCase(),
    dept: employee.departemen,
    tanggal_selesai: null,
  };
}

export function renameFile(newName: string, oldName: string, pathDir: string) {
  try {
    const PATH_OLD_NAME = path.join(pathDir, oldName);
    const PATH_NEW_NAME = path.join(pathDir, newName);
    fs.renameSync(PATH_OLD_NAME, PATH_NEW_NAME);
  } catch (err) {
    const msg = (err as Error)?.message ?? "Error occurred whn renaming.";
    error(msg);
  }
}
