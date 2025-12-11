import path from "path";
import initKnex from "./knex";
import { error, info } from "./logger";
import { parseExcel } from "./parse-excel";
import { filenameToPlan, renameFile } from "./plan-utils";
import _ from "lodash";
import { PLAN_FILES_PATH } from "..";

const SB = initKnex("stok_barang");

const uploadPlan = async (filename: string) => {
  let prefix = "";

  try {
    const filepath = path.join(PLAN_FILES_PATH, filename);
    const plan = await filenameToPlan(filename);
    const parsedPlan = parseExcel(filepath);
    const plans = _.filter(parsedPlan, "plan_no");

    // check plan detail
    for (const item of plans) {
      // skip blank row
      if (!item.plan_no) continue;

      const valid = new RegExp(plan.plan_no).test(item.plan_no);
      if (!valid) throw new Error("Nomor plan tidak sama dengan nama file");
    }

    await SB.transaction(async (trx) => {
      // upsert plan
      await trx("im_plan").where("plan_no", plan.plan_no).delete();
      await trx("im_plan").insert(plan);
      info(`Menambahkan plan nomor '${plan.plan_no}' ke MMS.`);

      // upsert plan detail
      await trx("im_plan_detail").where("plan_no", plan.plan_no).delete();
      for (const item of plans) {
        const { plan_time } = item;
        let planHour = 0;

        if (typeof plan_time === "string")
          planHour = Number((plan_time || "0")?.replace(",", "."));
        else if (typeof plan_time === "number") planHour = plan_time;

        const data = { ...item, plan_time: planHour };

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
    renameFile(newFileName, filename, PLAN_FILES_PATH);
  }
};

export default uploadPlan;
