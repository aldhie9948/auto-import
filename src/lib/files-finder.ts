import fs from "fs-extra";
import path from "path";

export function getPlanFiles(filesPath: string) {
  if (!fs.existsSync(filesPath)) {
    fs.mkdirSync(filesPath, { recursive: true });
  }

  const files = fs.readdirSync(filesPath);

  const regex = /^\d{2}-\d{2}-\d{6}-\((\d+|[A-Z]-\d+)\)(-OT)?\.xls$/;

  const filtered = files.filter((file) => {
    const filepath = path.join(filesPath, file);
    const valid = regex.test(file);
    const stat = fs.statSync(filepath);
    return !stat.isDirectory() && valid;
  });

  return filtered;
}
