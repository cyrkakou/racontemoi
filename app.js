"use strict";

/* eslint-disable @typescript-eslint/no-require-imports -- cPanel Passenger loads this startup adapter as CommonJS. */

const fs = require("node:fs");
const path = require("node:path");

const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  if (typeof process.loadEnvFile !== "function") {
    throw new Error("Node.js 20.12 or newer is required to load the runtime .env file.");
  }
  process.loadEnvFile(envFile);
}

process.env.NODE_ENV = "production";
process.env.HOSTNAME ||= "0.0.0.0";
process.env.PERSISTENT_STORAGE_DIR ||= path.join(
  path.dirname(__dirname),
  "private",
  "african-storybook-poc",
);

const standaloneServer = path.join(
  __dirname,
  ".next",
  "standalone",
  "server.js",
);

if (!fs.existsSync(standaloneServer)) {
  console.error(
    "Standalone build not found. Run `npm run build:cpanel` before starting the application.",
  );
  process.exit(1);
}

// Passenger/CloudLinux supplies or intercepts the listening port. Never hard-code PORT.
require(standaloneServer);
