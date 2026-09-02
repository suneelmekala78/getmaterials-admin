import { NextRequest } from "next/server";
import { proxyAdminToExpress } from "@/lib/express-proxy";

export async function POST(req: NextRequest) {
  return proxyAdminToExpress(req, "/api/auth/send-otp");
}
