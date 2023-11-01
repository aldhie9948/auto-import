/**
 * Ketentuan upload plan tambahan
 * 1. Plan di im_plan sudah ada
 * 2. Format file name harus ada tags "[TAMBAHAN]"
 * 3. Cek satu persatu plan apa sudah ada di im_plan_detail
 * 4. Indikator pencarian im_plan_detail
 *    [plan_no, id_barang, mesin, keterangan]
 * 5. Isi plan dengan filename plan harus sama
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

export async function uploadPlanTambahan(filename: string, dir?: string) {
  try {
    const plan = await filenameToPlan(filename);
    const plans = parseExcel(path.join(dir || FILES_DIR_PLANNER, filename));
    // check plan
    const checkedPlan = await checkPlan(plan);
    if (!checkedPlan)
      throw new Error(
        `Check Dok. Plan: Plan No. '${plan.plan_no}' tidak ada di database`
      );
    info(`Lolos pengecekan dokumen plan no. "${plan.plan_no}"`);

    // check plan detail
    await checkPlanDetail(plans, filename, function (item: IPlanDetail) {
      if (item)
        throw new Error(
          `Check Plan Detail: Barang '${item.id_barang}' sudah ada di database`
        );
    });
    info(`Lolos pengecekan plan detail no. "${plan.plan_no}"`);

    // insert plan
    await Promise.all(
      _.map(plans, async (item) => {
        const result = await db.insert(item).into("im_plan_detail");
        if (result.length < 1)
          throw new Error(
            `Barang '${item.id_barang}' gagal import ke database`
          );
        return result[0];
      })
    );
    // rename file
    renameFile("[DONE] ".concat(filename), filename, dir || FILES_DIR_PLANNER);
    info(`[UPLOAD TAMBAHAN] Import file plan '${filename}' berhasil`);
    return true;
  } catch (err) {
    let message = "";
    if (err instanceof Error) message = err.message;
    error("[UPLOAD TAMBAHAN] ".concat(message));
    // rename file
    renameFile(
      "[REJECT] ".concat(filename),
      filename,
      dir || FILES_DIR_PLANNER
    );
    error(`Import file plan '${filename}' gagal`);
    return false;
  }
}
