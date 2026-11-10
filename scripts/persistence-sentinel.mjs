import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const action = process.argv[2];
const storage = process.env.PERSISTENT_STORAGE_DIR;

if (!storage || !["create", "verify", "delete"].includes(action)) {
  console.error(
    "Usage: PERSISTENT_STORAGE_DIR=/private/path node scripts/persistence-sentinel.mjs create|verify|delete",
  );
  process.exit(1);
}

const directory = path.resolve(storage);
const file = path.join(directory, ".hosting-validation-sentinel.json");

if (action === "create") {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(
    file,
    JSON.stringify({ id: randomUUID(), createdAt: new Date().toISOString() }),
    { encoding: "utf8", flag: "wx", mode: 0o600 },
  );
  console.log("Persistence sentinel created.");
}

if (action === "verify") {
  const value = JSON.parse(await readFile(file, "utf8"));
  if (!value.id || !value.createdAt) throw new Error("Invalid sentinel contents");
  console.log("Persistence sentinel survived the restart.");
}

if (action === "delete") {
  await unlink(file);
  console.log("Persistence sentinel deleted.");
}
