import { isHostedProduction } from "@/lib/api-origin";

export function ApiOfflineBanner({ detail }: { detail?: string }) {
  const hosted = isHostedProduction();
  const unauthorized = /unauthorized/i.test(detail || "");
  const unreachable = /unreachable|ECONNREFUSED|fetch failed|API server unavailable/i.test(
    detail || ""
  );

  let message: string;
  if (unauthorized) {
    message = hosted
      ? "The API rejected the admin session token. Log out and log back in. If it continues, confirm JWT_SECRET / AUTH_SECRET match between admin and the API."
      : "Admin session was rejected by the API (Unauthorized). Log out and log back in. Confirm JWT_SECRET in admin and server .env files match.";
  } else if (!hosted && unreachable) {
    message =
      "API is offline, so live data is unavailable. Start Express on port 4000 and refresh.";
  } else if (hosted) {
    message =
      "Live data is unavailable because the admin app could not reach the API. Confirm Amplify API_INTERNAL_URL is https://api.getmaterials.in.";
  } else {
    message =
      "Live data is unavailable. Check that Express is running on port 4000 and that you are logged in as an admin.";
  }

  return (
    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      {message}
      {detail ? (
        <span className="block mt-1 text-xs text-amber-600 font-mono break-all">
          {detail}
        </span>
      ) : null}
    </p>
  );
}
