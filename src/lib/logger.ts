// @ts-ignore
import fs from "fs-extra";
import * as log4js from "log4js";
import moment from "moment";
import path from "path";

const LOGS_NAME = moment().format("YYYYMMDD") + ".log";
const filename = path.join(__dirname, <string>process.env.LOGS_DIR, LOGS_NAME);
if (!fs.existsSync(filename)) fs.createFileSync(filename);
log4js.configure({
  appenders: {
    main: {
      type: "fileSync",
      filename,
      layout: { type: "pattern", pattern: "[%d] [%p] %m" },
    },
    console: {
      type: "console",
    },
  },
  categories: {
    default: { appenders: ["console", "main"], level: "trace" },
  },
});
const logger = log4js.getLogger();

export function info(args: any) {
  logger.level = "info";
  logger.info(args);
}
export function error(args: any) {
  logger.level = "error";
  logger.error(args);
}
