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

const MINIMUM_ADMIN_TOKEN_LENGTH = 32;

export function isAdminTokenConfigured(): boolean {
  return (process.env.ADMIN_TOKEN?.length ?? 0) >= MINIMUM_ADMIN_TOKEN_LENGTH;
}

/** Admin setup endpoint auth: ADMIN_TOKEN bearer or (dev only) same as health token. */
export function isAdminRequest(request?: NextRequest): boolean {
  if (!isAdminTokenConfigured()) return false;
  if (!request) return false;
  const expected = process.env.ADMIN_TOKEN as string;
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!bearer) return false;
  return timingSafeEqual(digest(bearer), digest(expected));
}
