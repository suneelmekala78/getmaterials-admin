import { NextRequest } from "next/server";
import { proxyAdminToExpress } from "@/lib/express-proxy";

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const targetPath = path.join("/");
  return proxyAdminToExpress(req, `/api/${targetPath}`);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
