import { Router } from "express";
import fs from "fs-extra";
import path from "path";
import { LOGS_DIR } from "../lib/logger";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const logs = (await fs.readdir(LOGS_DIR)).reverse();
    const keyword = req.query.search;
    let results: string[] = [];
    if (!keyword) results = logs.slice(0, 10);
    else results = logs.filter((l) => l.includes(keyword as string));
    return res.json(results);
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
