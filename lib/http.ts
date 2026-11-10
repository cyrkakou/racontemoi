import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isAuthorizedHealthRequest,
  isHealthTokenConfigured,
} from "./auth";

const PRIVATE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export function privateJson(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

export function rejectUnauthorizedHealthRequest(request: NextRequest) {
  if (!isHealthTokenConfigured()) {
    return privateJson(
      { status: "error", code: "DIAGNOSTICS_NOT_CONFIGURED" },
      503,
    );
  }

  if (!isAuthorizedHealthRequest(request)) {
    return NextResponse.json(
      { status: "error", code: "UNAUTHORIZED" },
      {
        status: 401,
        headers: {
          ...PRIVATE_HEADERS,
          "WWW-Authenticate": "Bearer",
        },
      },
    );
  }

  return null;
}
