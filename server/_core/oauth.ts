import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { randomBytes, timingSafeEqual } from "node:crypto";

const GOOGLE_STATE_COOKIE = "study-manager-google-state";

function googleRedirectUri(req: Request) {
  return process.env.GOOGLE_REDIRECT_URI?.trim() || `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
}

function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function isPrivateLanHost(hostname: string) {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return false;
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
  const match = hostname.match(/^172\.(\d{1,3})\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!googleConfigured()) {
      res.status(503).send("Googleログインを使うにはGOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRETを設定してください。");
      return;
    }
    if (isPrivateLanHost(req.hostname)) {
      res.status(400).send("GoogleログインはLANのIPアドレスでは利用できません。PC上で http://127.0.0.1:3000 を開いてGoogleログインしてください。スマホでGoogleログインを使う場合は、HTTPSドメインを設定してください。スマホのLAN画面ではメールログインを利用できます。");
      return;
    }
    const state = randomBytes(24).toString("hex");
    res.cookie(GOOGLE_STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 10 * 60 * 1000, path: "/" });
    const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: googleRedirectUri(req), response_type: "code", scope: "openid email profile", access_type: "offline", prompt: "select_account", state });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const savedState = parseCookieHeader(req.headers.cookie ?? "")[GOOGLE_STATE_COOKIE];
    res.clearCookie(GOOGLE_STATE_COOKIE, { path: "/" });
    if (!googleConfigured() || !code || !state || !savedState) { res.status(400).send("Googleログインの設定または認証情報が不足しています。"); return; }
    const a = Buffer.from(state); const b = Buffer.from(savedState);
    if (a.length !== b.length || !timingSafeEqual(a, b)) { res.status(403).send("Googleログインの状態確認に失敗しました。"); return; }
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: googleRedirectUri(req), grant_type: "authorization_code" }) });
      if (!tokenResponse.ok) throw new Error("Google token exchange failed");
      const token = await tokenResponse.json() as { access_token?: string };
      if (!token.access_token) throw new Error("Google access token missing");
      const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
      if (!userResponse.ok) throw new Error("Google userinfo failed");
      const googleUser = await userResponse.json() as { sub?: string; email?: string; name?: string };
      if (!googleUser.sub || !googleUser.email) throw new Error("Google profile is incomplete");
      const openId = `google:${googleUser.sub}`;
      const name = googleUser.name || googleUser.email.split("@")[0];
      await db.upsertUser({ openId, email: googleUser.email, name, loginMethod: "google", lastSignedIn: new Date() });
      const sessionToken = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect("/");
    } catch (error) { console.error("[Google OAuth] Callback failed", error instanceof Error ? error.message : "unknown error"); res.status(502).send("Googleログインに失敗しました。設定とリダイレクトURLを確認してください。"); }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error instanceof Error ? error.message : "unknown error");
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
