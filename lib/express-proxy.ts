import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SignJWT } from "jose";
import { resolveApiOrigin } from "@/lib/api-origin";

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ||
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "fallback-dev-secret"
  );

export type AdminSessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string;
  status?: string;
};

export async function signAdminAccessToken(user: AdminSessionUser) {
  const email = user.email || "";
  return new SignJWT({
    sub: user.id || email,
    email,
    name: user.name || "Admin",
    role: user.role || "admin",
    status: user.status || "active",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setIssuer("getmaterials")
    .setAudience("getmaterials-mobile")
    .sign(getSecret());
}

async function authorizationHeader() {
  try {
    const session = await auth();
    const user = session?.user as AdminSessionUser | undefined;
    if (!user?.email) return null;
    return `Bearer ${await signAdminAccessToken(user)}`;
  } catch {
    return null;
  }
}

export async function proxyAdminToExpress(req: NextRequest, nestPath: string) {
  const origin = resolveApiOrigin();
  const incoming = new URL(req.url);
  const targetUrl = `${origin}${nestPath}${incoming.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const authorization = await authorizationHeader();
  if (authorization) headers.set("authorization", authorization);

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = Buffer.from(await req.arrayBuffer());
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (error) {
    console.error("Admin API proxy error:", targetUrl, error);
    return NextResponse.json(
      { error: "API server unavailable. Please try again." },
      { status: 502 }
    );
  }

  const outHeaders = new Headers();
  for (const key of ["content-type", "cache-control"]) {
    const value = upstream.headers.get(key);
    if (value) outHeaders.set(key, value);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}

/** Server-side fetch to Express using the current admin session. */
export async function adminApi<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const origin = resolveApiOrigin();
  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }
  const authorization = await authorizationHeader();
  if (authorization) headers.set("authorization", authorization);

  let res: Response;
  try {
    res = await fetch(`${origin}${path}`, { ...init, headers });
  } catch (error) {
    console.error("[adminApi] unreachable", origin, path, error);
    throw new Error(`API unreachable at ${origin}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[adminApi] failed", origin, path, res.status, data);
    throw new Error(
      data.error || `API ${res.status} from ${origin}`
    );
  }
  return data as T;
}
