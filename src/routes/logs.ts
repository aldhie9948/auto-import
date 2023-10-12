import { Router } from "express";
import fs from "fs-extra";
import path from "path";
import { LOGS_DIR } from "../../index";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const logs = await fs.readdir(LOGS_DIR);
    return res.json(logs.reverse());
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
    return res.json({
      name: log,
      text: data.split("\n").reverse(),
    });
  } catch (error) {
    next(error);
  }
});

const logsRouter = router;
export default logsRouter;
