"use client";

import { useEffect, useState } from "react";
import { StatusRow, type DisplayStatus } from "./status-row";

type ApiState = {
  status: DisplayStatus;
  value: string;
  detail: string;
};

export function ApiStatus() {
  const [state, setState] = useState<ApiState>({
    status: "pending",
    value: "Checking",
    detail: "Requesting /api/health from this browser.",
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    fetch("/api/health", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unhealthy response");
        }
        const body: unknown = await response.json();
        if (
          !body ||
          typeof body !== "object" ||
          !("status" in body) ||
          body.status !== "ok"
        ) {
          throw new Error("Unexpected response");
        }
        setState({
          status: "ok",
          value: "Connected",
          detail: "The public health endpoint returned HTTP 200.",
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            value: "Unavailable",
            detail: "The browser could not validate /api/health.",
          });
        } else {
          setState({
            status: "error",
            value: "Timed out",
            detail: "The health request exceeded five seconds.",
          });
        }
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return (
    <StatusRow
      label="API connectivity"
      status={state.status}
      value={state.value}
      detail={state.detail}
    />
  );
}
