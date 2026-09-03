import { isHostedProduction } from "@/lib/api-origin";

export function ApiOfflineBanner({ detail }: { detail?: string }) {
  const hosted = isHostedProduction();
  const unauthorized = /unauthorized/i.test(detail || "");

  let message: string;
  if (!hosted) {
    message =
      "API is offline, so live data is unavailable. Start Express on port 4000 and refresh.";
  } else if (unauthorized) {
    message =
      "The API rejected the admin session token. Redeploy admin after the env-file fix, then log out and log back in. Colleges, users, and materials are still in the database.";
  } else {
    message =
      "Live data is unavailable because the admin app could not reach the API. Confirm Amplify API_INTERNAL_URL is https://api.getmaterials.in.";
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
