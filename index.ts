require("dotenv").config();
require("moment/locale/id");
import cors from "cors";
import express from "express";
import { createServer } from "http";
import _ from "lodash";
import moment from "moment";
import path from "path";
import { Server } from "socket.io";
import { filesFinder, plansFinder } from "./src/lib/files-finder";
import { createLogs, trace } from "./src/lib/logger";
import { uploadPlanOrigin } from "./src/lib/upload-plan-origin";
import errorHandler from "./src/routes/error";
import logsRouter from "./src/routes/logs";

moment.locale("id");
const interval = 1000 * 1;

// auto import
async function main() {
  // create logs
  createLogs();

  const files = filesFinder();

  _.forEach(files, async function (filename) {
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
