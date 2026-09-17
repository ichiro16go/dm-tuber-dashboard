import LoginForm from "./LoginForm";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const redirectParam = searchParams?.redirect;
  const redirectTo = typeof redirectParam === "string" ? redirectParam : "/dashboard";

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-bold text-white">デュエマYouTuberダッシュボード</h1>
        <p className="mb-6 text-sm text-slate-400">
          閲覧には合言葉が必要です。管理者から共有された合言葉を入力してください。
        </p>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
