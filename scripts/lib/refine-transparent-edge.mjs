import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const refinerPath = fileURLToPath(new URL("../refine-transparent-edge.py", import.meta.url));

/**
 * Run the shared deterministic edge-refinement pass before any resize, warp,
 * placement or shadow generation. Accepts either an image path or a Buffer and
 * returns a clean straight-alpha PNG Buffer.
 */
export async function refineTransparentEdge(input) {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "rose-edge-"));
  const sourcePath = path.join(temporaryDirectory, "source.png");
  const outputPath = path.join(temporaryDirectory, "refined.png");

  try {
    if (Buffer.isBuffer(input)) {
      await writeFile(sourcePath, input);
    } else {
      await writeFile(sourcePath, await readFile(input));
    }

    await execFileAsync("python3", [
      refinerPath,
      "--input", sourcePath,
      "--output", outputPath,
    ], { maxBuffer: 1024 * 1024 * 4 });

    return await readFile(outputPath);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
