"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-300">
          合言葉
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          autoComplete="current-password"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
        />
      </div>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {isPending ? "確認中..." : "入室する"}
      </button>
    </form>
  );
}
