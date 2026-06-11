"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAllowedEmailDomain, isAllowedEmail } from "../lib/auth/access-policy";
import { createSupabaseBrowserClient, getSupabaseConfig } from "../lib/supabase/client";

interface AuthGateProps {
  children: (session: Session) => React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const hasSupabaseConfig = !!getSupabaseConfig();
  const isGoogleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED?.trim() === "true";
  const allowedEmailDomain = getAllowedEmailDomain();
  const authRedirectUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!supabase);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !email.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: authRedirectUrl,
      },
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setMessage("로그인 링크를 이메일로 보냈습니다.");
    }

    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;

    setError(null);
    setMessage(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authRedirectUrl,
      },
    });
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  useEffect(() => {
    if (!supabase || !session) return;

    if (!isAllowedEmail(session.user.email)) {
      queueMicrotask(() => {
        setError(`@${allowedEmailDomain} 계정만 사용할 수 있습니다.`);
        supabase.auth.signOut();
      });
    }
  }, [allowedEmailDomain, session, supabase]);

  if (!hasSupabaseConfig) {
    return <SupabaseSetupRequired />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-700 dark:bg-zinc-950 dark:text-zinc-200">
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-teal-500" />
          세션 확인 중
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
        <main className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:border-teal-900/70 dark:bg-teal-950/40 dark:text-teal-300">
              Figma Comment Triage
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-5xl">
                피그마 코멘트를 수정 작업 목록으로 정리합니다.
              </h1>
              <p className="max-w-xl text-base leading-7 text-stone-600 dark:text-zinc-400">
                로그인한 팀원만 Figma 파일 코멘트를 불러오고, 오탈자/띄어쓰기/기능오류/수정사항으로 분류한 뒤 Markdown으로 내려받을 수 있습니다.
              </p>
            </div>
            <div className="grid max-w-xl gap-3 sm:grid-cols-3">
              {["댓글 수집", "자동 분류", "MD 내보내기"].map((label) => (
                <div
                  key={label}
                  className="rounded-xl border border-stone-200 bg-white p-4 text-sm font-semibold text-stone-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {label}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-stone-950 dark:text-white">로그인</h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
                @{allowedEmailDomain} 계정만 접근할 수 있습니다.
              </p>
            </div>

            {isGoogleEnabled ? (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  Google로 계속하기
                </button>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-stone-200 dark:bg-zinc-800" />
                  <span className="text-xs font-medium text-stone-400">또는</span>
                  <div className="h-px flex-1 bg-stone-200 dark:bg-zinc-800" />
                </div>
              </>
            ) : (
              <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
                Google 로그인은 Supabase Google provider를 켠 뒤 `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`로 배포하면 표시됩니다.
              </p>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <label className="block text-sm font-medium text-stone-700 dark:text-zinc-300">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
              <button
                type="submit"
                disabled={!email.trim() || isSubmitting}
                className="h-12 w-full rounded-xl bg-stone-950 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                {isSubmitting ? "전송 중" : "로그인 링크 받기"}
              </button>
            </form>

            {message && (
              <p className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700 dark:border-teal-900/70 dark:bg-teal-950/40 dark:text-teal-300">
                {message}
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-3 py-2 text-xs font-medium text-stone-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300">
        <span className="hidden max-w-[180px] truncate sm:inline">
          {session.user.email}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700 transition hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          로그아웃
        </button>
      </div>
      {children(session)}
    </div>
  );
}

function SupabaseSetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">
            Supabase required
          </p>
          <h1 className="mt-2 text-2xl font-bold text-stone-950 dark:text-white">
            로그인 설정이 필요합니다
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">
            Vercel 또는 로컬 환경변수에 Supabase URL과 anon key를 넣으면 로그인 화면이 활성화됩니다. 설정 후 재배포하면 이 화면은 자동으로 사라집니다.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-bold text-stone-950 dark:text-white">
              필요한 환경변수
            </h2>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-stone-950 p-4 text-xs leading-6 text-stone-100">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://figma-comment-reader.vercel.app
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=false
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=griff.co.kr
FIGMA_ACCESS_TOKEN=figd_optional_server_token`}
            </pre>
            <p className="mt-3 text-xs leading-5 text-stone-500 dark:text-zinc-400">
              `FIGMA_ACCESS_TOKEN`은 선택값입니다. 설정하지 않아도 로그인 후 사용자가 앱 설정에서 개인 Figma token을 입력할 수 있습니다.
            </p>
          </section>

          <section className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            <h2 className="font-bold text-stone-950 dark:text-white">
              운영 설정 순서
            </h2>
            <ol className="mt-3 space-y-2">
              <li>1. Supabase 프로젝트를 만들고 Project Settings에서 URL과 anon key를 복사합니다.</li>
              <li>2. Supabase SQL Editor에서 `supabase/migrations/20260611000000_initial_schema.sql`을 실행합니다.</li>
              <li>3. Auth URL Configuration에 `https://figma-comment-reader.vercel.app`을 Site URL과 Redirect URL로 추가합니다.</li>
              <li>4. Vercel 환경변수에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 추가합니다.</li>
              <li>5. Vercel에서 재배포하면 로그인 화면이 활성화됩니다.</li>
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}
