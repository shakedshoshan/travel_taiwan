import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--test", "lib/data/googleMapsUrl.test.ts"],
  { stdio: "inherit" }
);

process.exit(result.status ?? 1);
