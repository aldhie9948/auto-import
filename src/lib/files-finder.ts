import moment from "moment";
import initKnex from "./knex";
import { existsSync } from "fs";
import _ from "lodash";
import { info } from "./logger";
import * as p from "path";

const db = initKnex("stok_barang");

export async function plansFinder(path: string) {
  const shifts = ["01", "02", "03"];
  const date = moment().format("DDMMYY");
  const tags = ["", "-UPDATE"];
  const extenstions = ["xls", "xlsx"];
  const areas = await db.select("*").from("im_area");
  const files = _.flatMap(shifts, (shift) => {
    return _.flatMap(areas, (area) => {
      return _.flatMap(tags, (tag) => {
        return _.flatMap(extenstions, (ext) => {
          return `${shift}-${area.kode_area}-${date}${tag}.${ext}`;
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
