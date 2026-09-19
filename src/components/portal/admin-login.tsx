import { useState } from "react";
import { ShieldCheck, Lock, User } from "lucide-react";
import { portal } from "@/lib/portal-store";
import { Brand } from "@/components/portal/shared";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Kmd@dmin123!@#";

export function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ my: string; en: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (!u) {
      setError({ my: "အသုံးပြုသူအမည် ထည့်ပါ", en: "Username is required" });
      return;
    }
    if (!password) {
      setError({ my: "စကားဝှက် ထည့်ပါ", en: "Password is required" });
      return;
    }
    if (u !== ADMIN_USERNAME) {
      setError({ my: "အသုံးပြုသူအမည် မမှန်ပါ", en: "Incorrect username" });
      return;
    }
    if (password !== ADMIN_PASSWORD) {
      setError({ my: "စကားဝှက် မမှန်ပါ", en: "Incorrect password" });
      return;
    }
    setError(null);
    setBusy(true);
    portal.login({
      role: "admin",
      provider: "outlook",
      name: "IT Support Admin",
      email: "admin@campusnet.edu",
      studentId: "ADMIN",
      major: "Network Operations",
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-5 py-12 text-ink-foreground">
      <div className="pointer-events-none absolute -left-32 -top-32 size-[460px] rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 size-[420px] rounded-full bg-chart-2/20 blur-3xl" />

      <div className="relative w-full max-w-md animate-rise">
        <div className="mb-8 flex justify-center">
          <Brand dark />
        </div>

        <div className="rounded-2xl border border-ink-border bg-ink-foreground/5 p-7 backdrop-blur-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-border px-3 py-1 text-xs font-semibold text-ink-muted">
            <ShieldCheck className="size-3.5" />
            Restricted area
          </span>
          <h1 className="font-myanmar mt-4 text-2xl font-bold">စီမံခန့်ခွဲသူ အကောင့်ဖြင့် ဝင်ရန်</h1>
          <p className="mt-1 text-sm text-ink-muted">Admin sign in — authorised IT staff only.</p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-muted">
                အသုံးပြုသူအမည် · Username
              </span>
              <span className="relative block">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                <input
                  className="field pl-9"
                  value={username}
                  autoComplete="username"
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="admin"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-muted">
                စကားဝှက် · Password
              </span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                <input
                  type="password"
                  className="field pl-9"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                />
              </span>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-ink-foreground"
              >
                <span className="font-myanmar font-semibold">{error.my}</span>
                <span className="ml-1 text-ink-muted">· {error.en}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              <span className="font-myanmar">{busy ? "ဝင်နေသည်…" : "ဝင်မည်"}</span>
              <span className="ml-1 opacity-80">· {busy ? "Signing in" : "Sign in"}</span>
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          ကျောင်းသားများအတွက် · Students sign in on the{" "}
          <a href="/" className="font-semibold underline">
            main page
          </a>
        </p>
      </div>
    </div>
  );
}
