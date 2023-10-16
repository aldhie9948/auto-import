require("dotenv").config();
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import _ from "lodash";
import moment from "moment";
import path from "path";
import { Server } from "socket.io";
import * as XLSX from "xlsx";
import { plansFinder } from "./src/lib/files-finder";
import { error } from "./src/lib/logger";
import { parseExcel } from "./src/lib/parse-excel";
import { uploadPlan, uploadPlanTambahan } from "./src/lib/upload-plan";
import logsRouter from "./src/routes/logs";

export const FILES_DIR = path.join(__dirname, "import");
export const TEMP_DIR = path.join(__dirname, "temp");
export const FILES_DIR_PLANNER = path.join(FILES_DIR, "plan");
export const TEMP_DIR_PLANNER = path.join(TEMP_DIR, "plan");
export const LOGS_DIR = path.join(__dirname, "src", "logs");

moment.locale("id");
let filenames: string[] = [];
const interval = 1000 * 10;

// auto import
async function main() {
  try {
    filenames = await plansFinder(FILES_DIR_PLANNER);
    _.forEach(filenames, async function (filename) {
      const workbook = XLSX.readFile(path.join(FILES_DIR_PLANNER, filename));
      const plans = parseExcel(workbook, "Export");
      if (/TAMBAHAN/gi.test(filename))
        return await uploadPlanTambahan(filename, plans);
      else return await uploadPlan(filename, plans);
    });
    io.emit("main");
    setTimeout(main, interval);
  } catch (err) {
    error(err instanceof Error && error(err.message));
    io.emit("main");
    setTimeout(main, interval);
  }
}
main();

// server
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.use(express.json());
app.use(cors());

app.use("/", express.static(path.join(__dirname, "src", "public")));
app.use("/logs", logsRouter);
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  res.status(500);
  let message = "";
  if (err instanceof Error) message = err.message;
  return res.json(message);
});

server.listen(process.env.PORT || 3000, () => {
  console.log("server running at *:3000");
});
