import { Router } from "express";
import fs from "fs-extra";
import path from "path";
import { LOGS_DIR } from "../lib/logger";
import _ from "lodash";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { search = "" } = req.query as any;
    const dirs = fs.readdirSync(LOGS_DIR);
    const logs = _(dirs)
      .filter((f) => /\w{8}.+/g.test(f))
      .filter((log) => {
        if (!search) return true;
        return new RegExp(search, "gi").test(log);
      })
      .take(10)
      .value();

    return res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.get("/:log", async (req, res, next) => {
  try {
    const { log } = req.params;
    const data = await fs.readFile(path.join(LOGS_DIR, log), {
      encoding: "utf-8",
    });
    const splited = data
      .split("\r\n")
      .filter((f) => f !== "")
      .map((m) => {
        const s = m.split("|");
        return {
          time: s[0],
          category: s[1],
          text: s[2],
        };
      });

    return res.json({
      name: log,
      data: splited,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
