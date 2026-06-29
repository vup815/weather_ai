import fs from "fs";

export function loadChunks(filePath: string): string[] {
  const text = fs.readFileSync(filePath, "utf-8");
  return text.split("\n").filter((chunk) => chunk.trim().length > 0);
}
