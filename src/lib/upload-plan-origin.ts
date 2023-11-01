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

import _ from "lodash";
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
import { IPlanDetail } from "./types";

const db = initKnex("stok_barang");
export async function uploadPlanOrigin(filename: string, dir?: string) {
  try {
    const plan = await filenameToPlan(filename);
    const plans = parseExcel(path.join(dir || FILES_DIR_PLANNER, filename));
    // check im_plan_detail
    await checkPlanDetail(plans, filename, function (item: IPlanDetail) {
      if (item)
        throw new Error(
          `Check Plan Detail : Barang '${item.id_barang}' sudah ada di database`
        );
    });
    info(`Lolos pengecekan plan detail no. "${plan.plan_no}"`);
    // check im_plan
    const checkedPlan = await checkPlan(plan);
    if (checkedPlan)
      throw new Error(
        `Check Dok. Plan : Plan No. '${checkedPlan.plan_no}' sudah ada di database.`
      );
    info(`Lolos pengecekan dokumen plan no. "${plan.plan_no}"`);

    const addedPlan = await db.insert(plan).into("im_plan");
    if (addedPlan.length < 1)
      throw new Error(
        `Insert Dokumen Plan: Gagal import Plan No. '${plan.plan_no}'`
      );
    await Promise.all(
      _.map(plans, async (item) => {
        const result = await db.insert(item).into("im_plan_detail");
        if (result.length < 1)
          throw new Error(
            `Insert Plan Detail: Gagal import Plan Detail No. '${item.plan_no}'`
          );
        return result[0];
      })
    );
    // rename file
    renameFile("[DONE] ".concat(filename), filename, dir || FILES_DIR_PLANNER);
    info(`Import file plan '${filename}' berhasil`);
    return true;
  } catch (err) {
    let msg = "";
    if (err instanceof Error) msg = err.message;
    error("[UPLOAD ORIGIN] ".concat(msg));
    // rename file
    renameFile(
      "[REJECT] ".concat(filename),
      filename,
      dir || FILES_DIR_PLANNER
    );
    error(`[UPLOAD ORIGIN] Import file plan '${filename}' gagal`);

    return false;
  }
}
