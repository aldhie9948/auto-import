require("dotenv").config();
import cors from "cors";
import express from "express";
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";
import { getPlanFiles } from "./lib/files-finder";
import { createLogs, error, trace } from "./lib/logger";
import uploadPlan from "./lib/upload-plan";
import errorHandler from "./routes/error";
import logsRouter from "./routes/logs";

const interval = 1_000;

// server
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

export const PLAN_FILES_PATH = path.join(__dirname, "..", "import", "plan");
const PUBLIC_PATH = path.join(__dirname, "..", "public");

async function main() {
  try {
    // create logs
    createLogs();

    const files = getPlanFiles(PLAN_FILES_PATH);
    for (const filename of files) {
      await uploadPlan(filename);
      trace(Array(50).fill("=").join(""));
      io.emit("main");
    }
  } catch (err) {
    const msg = (err as Error)?.message ?? "Error occurred.";
    error(msg);
  } finally {
    setTimeout(main, interval);
  }
}

app.use(express.json());
app.use(cors());

app.use("/", express.static(PUBLIC_PATH));

app.use("/logs", logsRouter);

app.use(errorHandler);

app.use("*splat", async function (req, res) {
  return res.status(404).json({ error: "Pages not found" });
});

main();

server.listen(process.env.PORT || 3000, () => {
  console.log("server running at *:", process.env.PORT);
});
