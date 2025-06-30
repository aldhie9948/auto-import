import path from "path";
import initKnex from "./knex";
import { error, info } from "./logger";
import { parseExcel } from "./parse-excel";
import { filenameToPlan, renameFile } from "./plan-utils";
import _ from "lodash";

const CWD = process.cwd();
const FILES_DIR_PLANNER = path.join(CWD, "import", "plan");
const db = initKnex("stok_barang");

const uploadPlan = async (filename: string) => {
  let prefix = "";
  try {
    const filepath = path.join(FILES_DIR_PLANNER, filename);
    const plan = await filenameToPlan(filename);
    let plans = parseExcel(filepath);
    plans = _.filter(plans, "plan_no");

    // check plan detail
    for (const item of plans) {
      // skip blank row
      if (!item.plan_no) continue;

      const valid = new RegExp(plan.plan_no).test(item.plan_no);
      if (!valid) throw new Error("Nomor plan tidak sama dengan nama file");
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
        const { plan_time } = item;
        const properPlanTime = String(plan_time).replace(",", ".");
        const data = { ...item, plan_time: properPlanTime };

        await trx("im_plan_detail").insert(data);
        const msg = `Menambahkan '${item.id_barang}, ${item.mesin}' - Qty: ${item.plan_qty}.`;
        info(msg);
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
