import * as XLSX from "xlsx";
import type { IPlanDetail } from "./types";
import _ from "lodash";
const header = [
  "plan_no",
  "id_barang",
  "plan_time",
  "plan_qty",
  "mesin",
  "mulai",
  "selesai",
  "keterangan",
];

export function parseExcel(filepath: string) {
  const workbook = XLSX.readFile(filepath);
  const { SheetNames } = workbook;
  const data = XLSX.utils.sheet_to_json<IPlanDetail>(
    workbook.Sheets[SheetNames[0]],
    {
      header,
      defval: "",
      rawNumbers: true,
    }
  );
  _.pullAt(data, 0);
  return _.map(data, (d) => {
    return _.forOwn(d, (value, key) => {
      if (typeof value === "string") return value.trim();
    });
  });
}
