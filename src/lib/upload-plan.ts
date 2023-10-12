import fs from "fs-extra";
import _ from "lodash";
import { FILES_DIR_PLANNER, TEMP_DIR_PLANNER } from "../../index";
import initKnex from "./knex";
import { error, info } from "./logger";
import type { IPlanDetail } from "./types";
import path from "path";

const db = initKnex("stok_barang");
const TABLE_NAME = "im_plan_detail";

export async function updatePlan(plans: IPlanDetail[], file: string) {
  try {
    await Promise.all(
      _.map(plans, async function (plan) {
        const { plan_no, id_barang } = plan;
        await db
          .from(TABLE_NAME)
          .where("plan_no", plan_no)
          .andWhere("id_barang", id_barang)
          .update(plan);
        info(
          `Berhasil update plan_no='${plan_no}' dengan id_barang='${id_barang}'`
        );
      })
    );
    await removeFile(file);
  } catch (err) {
    error(err instanceof Error && err.message);
  }
}
export async function createPlan(plans: IPlanDetail[], file: string) {
  try {
    await Promise.all(
      _.map(plans, async function (plan) {
        const { plan_no, mesin, id_barang, keterangan } = plan;
        const isRowDuplicate = await db
          .from(TABLE_NAME)
          .where({ plan_no })
          .andWhere({ id_barang })
          .andWhere({ mesin })
          .andWhere({ keterangan });
        if (isRowDuplicate.length > 0)
          return error(
            `Gagal upload plan_no='${plan_no}' dengan id_barang='${id_barang}' dikarenakan duplikat`
          );
        await db.insert(plan).into(TABLE_NAME);
        info(
          `Berhasil upload plan_no='${plan_no}' dengan id_barang='${id_barang}'`
        );
      })
    );
    await removeFile(file);
  } catch (err) {
    error(err instanceof Error && err.message);
  }
}

async function removeFile(file: string) {
  try {
    const FILE_PATH = path.join(FILES_DIR_PLANNER, file);
    const UPLOADED_FILE_PATH = path.join(TEMP_DIR_PLANNER, file);
    await fs.copy(FILE_PATH, UPLOADED_FILE_PATH);
    info(`Menyalin '${file}' ke '${UPLOADED_FILE_PATH}'`);
    await fs.remove(FILE_PATH);
    info(`Menghapus plan '${file}'`);
  } catch (err) {
    error(err instanceof Error && err.message);
  }
}
