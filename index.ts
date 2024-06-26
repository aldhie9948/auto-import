require("dotenv").config();
require("moment/locale/id");
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import _ from "lodash";
import moment from "moment";
import path from "path";
import { Server } from "socket.io";
import { plansFinder } from "./src/lib/files-finder";
import { createLogs, info, trace } from "./src/lib/logger";
import { uploadPlanOrigin } from "./src/lib/upload-plan-origin";
import logsRouter from "./src/routes/logs";
import errorHandler from "./src/routes/error";

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
  // create logs
  createLogs(LOGS_DIR);
  filenames = await plansFinder(FILES_DIR_PLANNER);
  _.forEach(filenames, async function (filename) {
    await uploadPlanOrigin(filename).then(() => {
      trace(Array(50).fill("=").join(""));
      io.emit("main");
    });
  });
  setTimeout(main, interval);
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
app.use(errorHandler);
app.use("*", (_req, res) => res.status(404).json({ error: "Pages not found" }));

server.listen(process.env.PORT || 3000, () => {
  console.log("server running at *:", process.env.PORT);
});
