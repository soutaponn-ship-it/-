import type { CookieOptions, Request } from "express";

export function getSessionCookieOptions(req: Request): CookieOptions {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const host = String(req.headers.host || "");
  const forwardedHttps = forwardedProto === "https" || (Array.isArray(forwardedProto) && forwardedProto.includes("https"));
  const isLocalHttp = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host) && !forwardedHttps && !req.secure;
  // Preview/Render/Tailscale traffic is HTTPS at the browser even when the app sees an internal HTTP hop.
  const isHttps = !isLocalHttp; 
  return { httpOnly: true, path: "/", sameSite: isHttps ? "none" : "lax", secure: isHttps };
}
