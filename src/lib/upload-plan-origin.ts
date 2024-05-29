/**
 * Ketentuan upload plan
 * 1. Belum ada row dengan [plan_no, pic, shift] sama dengan yang akan di import
 * 2. Belum ada rows dengan [plan_no, id_barang, keterangan, mesin]
 *    yang sama dengan plan yang akan di import
 * 3. Plan no di format file dengan di dalam file tidak boleh beda
 * 4. Jika lolos tiga rules di atas maka akan diimport plan ke im_plan dahulu
 *    return number[]
 * 5. Import plans ke im_plan_detail jika tidak ada error saat import im_plan
 * 6. Append file jika berhasil dengan "[DONE]"
 */

import path from "path";
import { FILES_DIR_PLANNER } from "../..";
import initKnex from "./knex";
import { error, info } from "./logger";
import { parseExcel } from "./parse-excel";
import {
  checkPlan,
  checkPlanDetail,
  filenameToPlan,
  renameFile,
} from "./plan-utils";

const db = initKnex("stok_barang");
export async function uploadPlanOrigin(filename: string, dir?: string) {
  try {
    const plan = await filenameToPlan(filename);
    const plans = parseExcel(path.join(dir || FILES_DIR_PLANNER, filename));

    // check im_plan_detail
    await checkPlanDetail(plans, filename);
    info(`[PASS] : Lolos pengecekan plan detail no. "${plan.plan_no}"`);

    // check im_plan
    await checkPlan(plan);
    info(`[PASS] : Lolos pengecekan dokumen plan no. "${plan.plan_no}"`);

    await db.transaction(async (trx) => {
      await trx.insert(plan).into("im_plan");
      await trx.insert(plans).into("im_plan_detail");
    });
    // rename file
    renameFile("[DONE] ".concat(filename), filename, dir || FILES_DIR_PLANNER);

    info(`[SUCCESS] : Import file plan '${filename}' berhasil`);
  } catch (err) {
    let msg = "";
    if (err instanceof Error) msg = err.message;
    error(msg);
    // rename file
    renameFile(
      "[REJECT] ".concat(filename),
      filename,
      dir || FILES_DIR_PLANNER
    );
    error(`[FAILED] : Import file plan '${filename}' gagal`);
  }
}
