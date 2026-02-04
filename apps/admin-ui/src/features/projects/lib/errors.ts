import type { ApiError } from "@/lib/api/client";

export function errorMessage(e: unknown) {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) return String((e as any).message);
  const ae = e as Partial<ApiError>;
  if (ae?.message) return ae.message;
  return "Request failed";
}
