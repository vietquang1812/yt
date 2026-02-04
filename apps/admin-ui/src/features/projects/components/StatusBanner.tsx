"use client";

import type { StatusAlert } from "../lib/types";

export function StatusBanner({ alert }: { alert: StatusAlert }) {
  if (!alert) return null;
  return (
    <div className={`alert alert-${alert.variant} border-0 rounded-4`} role="alert">
      <span dangerouslySetInnerHTML={{ __html: alert.html }} />
    </div>
  );
}
