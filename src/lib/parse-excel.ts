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

export function parseExcel(workbook: XLSX.WorkBook, sheetName: string) {
  const data = XLSX.utils.sheet_to_json<IPlanDetail>(
    workbook.Sheets[sheetName],
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
