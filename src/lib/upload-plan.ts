import path from "path";
import initKnex from "./knex";
import { error, info } from "./logger";
import { parseExcel } from "./parse-excel";
import { filenameToPlan, renameFile } from "./plan-utils";

const CWD = process.cwd();
const FILES_DIR_PLANNER = path.join(CWD, "import", "plan");
const db = initKnex("stok_barang");

const uploadPlan = async (filename: string) => {
  let prefix = "";
  try {
    const filepath = path.join(FILES_DIR_PLANNER, filename);
    const plan = await filenameToPlan(filename);
    const plans = parseExcel(filepath);

    // check plan detail
    for (const item of plans) {
      const pattern = new RegExp(item.plan_no);
      const isSamePlan = pattern.test(filename);
      if (!isSamePlan)
        throw new Error("Nomor plan tidak sama dengan nama file");
    }

    // upsert plan
    await db.transaction(async (trx) => {
      await trx("im_plan").where("plan_no", plan.plan_no).delete();
      await trx("im_plan").insert(plan);
      info(`Menambahkan plan nomor '${plan.plan_no}' ke MMS.`);
    });

    // upsert plan detail
    await db.transaction(async (trx) => {
      await trx("im_plan_detail").where("plan_no", plan.plan_no).delete();
      for (const item of plans) {
        await trx("im_plan_detail").insert(item);
        info(
          `Menambahkan '${item.id_barang}, ${item.mesin}' - Qty: ${item.plan_qty}.`
        );
      }
    });

    prefix = "[DONE]";

    info(`Import file plan '${filename}' berhasil.`);
  } catch (err) {
    const { message } = <Error>err;
    error(message);

    prefix = "[REJECT]";
  } finally {
    const newFileName = prefix.concat(" ", filename);
    renameFile(newFileName, filename, FILES_DIR_PLANNER);
  }
};

export default uploadPlan;
