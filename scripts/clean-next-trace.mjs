import { rmSync } from "node:fs";
import { join } from "node:path";

const tracePath = join(process.cwd(), ".next", "trace");

try {
  rmSync(tracePath, { force: true });
} catch (error) {
  console.warn(
    "Nao foi possivel limpar .next/trace. Encerre processos antigos do Next e tente novamente."
  );
  console.warn(error instanceof Error ? error.message : error);
}
