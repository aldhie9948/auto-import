import moment from "moment";
import initKnex from "./knex";
import { existsSync } from "fs";
import _ from "lodash";
import { info } from "./logger";
import * as p from "path";
import fs from "fs-extra";

const db = initKnex("stok_barang");
const dbPayroll = initKnex("m-payroll");

export async function plansFinder(path: string) {
  const shifts = ["01", "02", "03", "T01", "T02", "T03"];
  const dates = [0, 1].map((item) =>
    moment().add(item, "day").format("DDMMYY")
  );
  const tags = [""];
  const extenstions = ["xls", "xlsx"];
  const areas = await db("im_area").select("*");
  const workers = await dbPayroll("data_karyawan")
    .select("*")
    .where("departemen", "like", "PPIC");
  const files = _.flatMap(shifts, (shift) => {
    return _.flatMap(areas, (area) => {
      return _.flatMap(dates, (date) => {
        return _.flatMap(workers, (worker) => {
          return _.flatMap(tags, (tag) => {
            return _.flatMap(extenstions, (ext) => {
              return `${shift}-${area.kode_area}-${date}-(${worker.nik})${tag}.${ext}`;
            });
          });
        });
      });
    });
  });
  return _.filter(files, function (file) {
    const filePath = p.join(path, file);
    const fileExist = existsSync(filePath);
    if (fileExist) info(`File plan '${file}' ditemukan`);
    return fileExist;
  });
}

export const filesFinder = () => {
  const FILES_DIR = p.join(process.cwd(), "import", "plan");
  const files = fs.readdirSync(FILES_DIR);

  const regex = /^\d{2}-\d{2}-\d{6}-\((\d+|[A-Z]-\d+)\)\.xls$/;

  const filteredFiles = files.filter((file) => regex.test(file));

  return filteredFiles;
};
