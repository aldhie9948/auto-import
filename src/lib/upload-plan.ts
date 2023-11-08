import fs from "fs-extra";
import _, { findLast } from "lodash";
import moment from "moment";
import path from "path";
import { FILES_DIR_PLANNER, TEMP_DIR_PLANNER } from "../../index";
import initKnex from "./knex";
import { error, info } from "./logger";
import type { IPlanDetail, IPlan, IArea } from "./types";

const logError = (err: unknown) => {
  let message = "";
  if (err instanceof Error) {
    message = err.message;
  }
  return message;
};

const db = initKnex("stok_barang");
const dbPayroll = initKnex("m-payroll");
const TABLE_NAME = "im_plan_detail";

export async function uploadPlan(filename: string, plans: IPlanDetail[]) {
  try {
    const plan = await extractDataFromFilename(filename);
    if (!plan) throw new Error(`Gagal ekstrak data dari file '${filename}'`);
    if (typeof plan === "string")
      throw new Error(`Gagal ekstrak data dari file '${filename}'`);

    // check im_plan
    const im_plan = await (<Promise<IPlan[]>>(
      db
        .from("im_plan")
        .where("plan_no", plan.plan_no)
        .andWhere("pic", plan.pic)
        .andWhere("shift", plan.shift)
    ));
    info("-----");
    info(`Proses pengecekan data plan di database`);
    if (im_plan.length > 0)
      throw new Error(`Plan No. '${im_plan[0].plan_no}' sudah ada`);
    // check im_plan_detail
    for (const item of plans) {
      const check = async () => {
        const pattern = new RegExp(item.plan_no);
        // check plan inside the file has same value with format filename
        if (!pattern.test(filename))
          throw new Error(
            `Nomor plan '${item.plan_no}' tidak sesuai dengan '${filename}'`
          );

        const plan_detail = await (<Promise<IPlanDetail>>(
          db.first().from("im_plan_detail").where(item)
        ));

        // check plan in im_plan_detail
        if (!plan_detail) return info(`Barang '${item.id_barang}' valid`);
        else throw new Error(`Barang '${plan_detail.id_barang}' duplikat`);
      };
      await check();
    }
    // upload im_plan
    const addedPlan = await createPlan(plan);
    const addedPlans = await createPlanDetail(plans);
    // renameFilename(filename, "[DONE] ");
    info("-----");
    return { addedPlan, addedPlans };
  } catch (err) {
    const msg = logError(err);
    error(msg);
    // renameFilename(filename);
    info("-----");
    return msg;
  }
}

export async function uploadPlanTambahan(
  filename: string,
  plans: IPlanDetail[]
) {
  try {
    const plan = await extractDataFromFilename(filename);
    if (!plan) throw new Error(`Gagal ekstrak data dari file '${filename}'`);
    info("-----");
    info(`Proses pengecekan data plan di database`);
    // check im_plan
    const im_plan = await (<Promise<IPlan[]>>(
      db
        .from("im_plan")
        .where("plan_no", plan.plan_no)
        .andWhere("pic", plan.pic)
        .andWhere("shift", plan.shift)
    ));
    if (im_plan.length < 1)
      throw new Error(`Plan No. '${plan.plan_no}' tidak ada`);

    // check im_plan_detail
    const plansItem = await Promise.all(
      _.map(plans, async (item) => {
        if (item.plan_no !== plan.plan_no)
          throw new Error(
            `Plan di dalam file '${item.plan_no}' tidak sesuai dengan format file '${filename}'`
          );
        const check = await (<Promise<IPlanDetail>>(
          db
            .from("im_plan_detail")
            .first()
            .where("plan_no", item.plan_no)
            .andWhere("id_barang", item.id_barang)
            .andWhere("mesin", item.mesin)
            .andWhere("keterangan", item.keterangan)
        ));
        if (check)
          info(
            `Plan '${check.plan_no}' barang '${check.id_barang}' sudah ada di database`
          );
        else
          info(
            `Plan '${item.plan_no}' barang '${item.id_barang}' akan di import sebagai PLAN TAMBAHAN`
          );
        if (!check) return item;
      })
    );
    const plansToUpdate = plansItem.filter((item) => item);
    if (plansToUpdate.length < 1)
      throw new Error(`Plan Tambahan sama dengan sebelumnya`);

    await createPlanDetail(<IPlanDetail[]>plansToUpdate);
    // removeFile(filename);
    // renameFilename(filename, "[DONE] ");
    info("-----");
  } catch (err) {
    const msg = logError(err);
    error(msg);
    // renameFilename(filename);
    info("-----");
    return msg;
  }
}

export async function createPlanDetail(plans: IPlanDetail[]) {
  try {
    let planIds: number[] = [];
    for (const plan of plans) {
      const { id_barang } = plan;
      const result = await db.insert(plan).into(TABLE_NAME);
      info(`Berhasil import barang '${id_barang}'`);
      planIds.concat(...result);
    }
    return planIds;
  } catch (err) {
    const msg = logError(err);
    error(msg);
    return msg;
  }
}

export async function createPlan(plan: IPlan) {
  try {
    const id = await db.insert(plan).into("im_plan");
    if (id.length < 1) throw new Error(`Gagal buat plan no '${plan.plan_no}'`);
    info(`Berhasil membuat plan nomor '${plan.plan_no}'`);
    return await (<Promise<IPlan>>(
      db.first().from("im_plan").where("id", id[0])
    ));
  } catch (err) {
    const msg = logError(err);
    error(msg);
    return msg;
  }
}

export async function extractDataFromFilename(file: string) {
  try {
    // pattern regex untuk menangkap
    // character "-" kecuali di dalam kurung
    const pattern = new RegExp(/(?!\([^)]*)-(?![^(]*\))/gi);
    const data = file.split(pattern);
    const shift = data[0];
    const area = data[1];
    const areaDetail = await (<Promise<IArea>>(
      db.first().from("im_area").where("kode_area", area)
    ));

    const date = data[2];
    const worker = data[3].replace(/[()]/gi, "").replace(/[.].*/gi, "");
    const workerDetail = await dbPayroll
      .first()
      .from("data_karyawan")
      .where("nik", worker);

    const plan: IPlan = {
      plan_no: [shift, area, date].join("-"),
      tanggal: moment(date, "DDMMYY").format("YYYY-MM-DD"),
      pic: worker,
      dept: workerDetail.departemen,
      bagian: areaDetail.nama_area.toUpperCase(),
      shift,
    };

    return plan;
  } catch (err) {
    const msg = logError(err);
    error(msg);
  }
}

function renameFilename(filename: string, suffix?: string) {
  if (!suffix) suffix = "[REJECT] ";
  const name = suffix.concat(filename);
  fs.renameSync(
    path.join(FILES_DIR_PLANNER, filename),
    path.join(FILES_DIR_PLANNER, name)
  );
  info(`Ubah file '${filename}' ke '${name}'`);
}

function removeFile(filename: string) {
  const FILE_PATH = path.join(FILES_DIR_PLANNER, filename);
  const UPLOADED_FILE_PATH = path.join(TEMP_DIR_PLANNER, filename);
  fs.copySync(FILE_PATH, UPLOADED_FILE_PATH);
  info(`Menyalin ke '${UPLOADED_FILE_PATH}'`);
  fs.removeSync(FILE_PATH);
  info(`Menghapus plan '${filename}'`);
}
