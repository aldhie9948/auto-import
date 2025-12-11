// @ts-ignore
import fs from "fs-extra";
import * as log4js from "log4js";
import path from "path";
import day from "./day";

export const LOGS_DIR = path.join(__dirname, "..", "..", "logs");

export function createLogs() {
  const logName = day().format("YYYYMMDD").concat(".log");
  const filename = path.join(LOGS_DIR, logName);
  if (!fs.existsSync(filename)) fs.createFileSync(filename);
  configure(filename);
}

function configure(filename: string) {
  return log4js.configure({
    appenders: {
      main: {
        type: "fileSync",
        filename,
        layout: { type: "pattern", pattern: "%d|%p|%m" },
      },
      console: {
        type: "console",
      },
    },
    categories: {
      default: {
        appenders: ["console", "main"],
        level: "trace",
        enableCallStack: true,
      },
    },
  });
}

const logger = log4js.getLogger();

export function info(args: any) {
  logger.level = "info";
  logger.info(args);
}

export function trace(args: any) {
  logger.level = "trace";
  logger.trace(args);
}

export function error(args: any) {
  logger.level = "error";
  logger.error(args);
}
