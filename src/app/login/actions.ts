"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export interface LoginState {
  error: string | null;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/dashboard");

  if (!password) {
    return { error: "合言葉を入力してください。" };
  }

  const ok = await checkPassword(password);
  if (!ok) {
    return { error: "合言葉が正しくありません。" };
  }

  const session = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });

  redirect(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
}
