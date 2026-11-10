import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const MINIMUM_TOKEN_LENGTH = 32;

export function isHealthTokenConfigured(): boolean {
  return (process.env.HEALTHCHECK_TOKEN?.length ?? 0) >= MINIMUM_TOKEN_LENGTH;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function isAuthorizedHealthRequest(request: NextRequest): boolean {
  const expected = process.env.HEALTHCHECK_TOKEN;
  if (!expected || expected.length < MINIMUM_TOKEN_LENGTH) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;
  const supplied = bearer ?? request.headers.get("x-health-token");

  if (!supplied) {
    return false;
  }

  return timingSafeEqual(digest(supplied), digest(expected));
}
