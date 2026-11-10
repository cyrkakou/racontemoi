"use strict";

/* eslint-disable @typescript-eslint/no-require-imports -- cPanel Passenger loads this startup adapter as CommonJS. */

const fs = require("node:fs");
const path = require("node:path");

process.env.NODE_ENV = "production";
process.env.HOSTNAME ||= "0.0.0.0";

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
