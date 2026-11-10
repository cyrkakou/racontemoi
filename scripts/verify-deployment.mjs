const baseUrl = process.env.BASE_URL?.replace(/\/$/, "");
const token = process.env.HEALTHCHECK_TOKEN;

if (!baseUrl || !token) {
  console.error(
    "Set BASE_URL and HEALTHCHECK_TOKEN before running the remote validation.",
  );
  process.exit(1);
}

const checks = [
  { name: "homepage", path: "/", protected: false },
  { name: "public API", path: "/api/health", protected: false },
  {
    name: "database",
    path: "/api/health/database",
    protected: true,
  },
  { name: "storage", path: "/api/health/storage", protected: true },
  { name: "public asset", path: "/proof-mark.svg", protected: false },
];

let failed = false;

for (const check of checks) {
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      headers: check.protected ? { Authorization: `Bearer ${token}` } : {},
      redirect: "error",
    });
    const passed = response.ok;
    failed ||= !passed;
    console.log(
      `${passed ? "PASS" : "FAIL"} ${check.name}: HTTP ${response.status}`,
    );
  } catch (error) {
    failed = true;
    console.log(
      `FAIL ${check.name}: ${error instanceof Error ? error.message : "request failed"}`,
    );
  }
}

process.exitCode = failed ? 1 : 0;
