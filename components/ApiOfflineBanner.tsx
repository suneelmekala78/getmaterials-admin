import { isHostedProduction } from "@/lib/api-origin";

export function ApiOfflineBanner({ detail }: { detail?: string }) {
  const hosted = isHostedProduction();
  return (
    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      {hosted
        ? "Live data is unavailable because the admin app could not reach the API. Set Amplify API_INTERNAL_URL to https://api.getmaterials.in and make JWT_SECRET match the Express AUTH_SECRET."
        : "API is offline, so live data is unavailable. Start Express on port 4000 and refresh."}
      {detail ? (
        <span className="block mt-1 text-xs text-amber-600 font-mono break-all">
          {detail}
        </span>
      ) : null}
    </p>
  );
}
