import fs from "fs";
import path from "path";

const backendDir = path.resolve("./"); // adjust if your backend folder is different

function scanFiles(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanFiles(fullPath);
    } else if (fullPath.endsWith(".js")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        // check for suspicious URLs in routes
        if (line.includes("https://git.new") || line.match(/['"`].*:.+['"`]/)) {
          console.log(`Potential issue in file: ${fullPath} at line ${idx + 1}`);
          console.log(`  >> ${line.trim()}`);
        }
      });
    }
  });
}

scanFiles(backendDir);
