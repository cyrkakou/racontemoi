import { access, cp, mkdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const standaloneServer = path.join(standaloneRoot, "server.js");

await access(standaloneServer);

const publicSource = path.join(projectRoot, "public");
const publicDestination = path.join(standaloneRoot, "public");
const staticSource = path.join(projectRoot, ".next", "static");
const staticDestination = path.join(standaloneRoot, ".next", "static");

await mkdir(path.dirname(staticDestination), { recursive: true });
await cp(publicSource, publicDestination, { recursive: true, force: true });
await cp(staticSource, staticDestination, { recursive: true, force: true });

console.log("Standalone build prepared for cPanel:");
console.log(`- server: ${path.relative(projectRoot, standaloneServer)}`);
console.log("- public assets: copied");
console.log("- Next.js static assets: copied");
