// 合言葉（共通パスワード）による簡易認証。
// Cookie の値は「有効期限.HMAC署名」の形式で、SESSION_SECRET により改ざんを検知する。
// Edge (proxy.ts) と Node (Server Actions) の両方で動くよう Web Crypto (crypto.subtle) のみを使用する。

export const SESSION_COOKIE_NAME = "dm_dashboard_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30日

const encoder = new TextEncoder();

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.DASHBOARD_PASSWORD;
  if (!secret) {
    throw new Error("SESSION_SECRET (or at least DASHBOARD_PASSWORD) must be set.");
  }
  return secret;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(): Promise<{ value: string; expiresAt: Date }> {
  const expiresAtMs = Date.now() + SESSION_TTL_MS;
  const payload = String(expiresAtMs);
  const signature = await hmacHex(getSessionSecret(), payload);
  return { value: `${payload}.${signature}`, expiresAt: new Date(expiresAtMs) };
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expiresAtMs = Number(payload);
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) return false;

  const expectedSignature = await hmacHex(getSessionSecret(), payload);
  return timingSafeEqual(signature, expectedSignature);
}

export async function checkPassword(password: string): Promise<boolean> {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return false;
  // 長さの違いによるタイミング差を避けるため、ハッシュ同士を比較する。
  const [a, b] = await Promise.all([hmacHex("compare", password), hmacHex("compare", expected)]);
  return timingSafeEqual(a, b);
}
