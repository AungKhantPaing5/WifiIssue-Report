import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, ShieldCheck, Wifi, Gauge, MessageSquare, FileSpreadsheet } from "lucide-react";
import { portal, usePortalState, type Provider, type Role } from "@/lib/portal-store";
import { Brand } from "@/components/portal/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusNet — Campus Internet Issue Reporting Portal" },
      { name: "description", content: "ကျောင်းဝင်း အင်တာနက် ပြဿနာ တိုင်ကြားရေး စနစ် — Report Wi-Fi issues, upload WiFiman speedtests, and chat with IT admins." },
      { property: "og:title", content: "CampusNet — Campus Internet Issue Reporting Portal" },
      { property: "og:description", content: "Report campus Wi-Fi problems and track them with the IT help desk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { session } = usePortalState();
  const navigate = useNavigate();
  const [name, setName] = useState("Aung Khant Paing");
  const [studentId, setStudentId] = useState("IT-2024-0187");
  const [major, setMajor] = useState("Information Technology");
  const [busy, setBusy] = useState<Provider | null>(null);

  useEffect(() => {
    if (session) navigate({ to: session.role === "admin" ? "/admin" : "/student", replace: true });
  }, [session, navigate]);

  const signIn = (provider: Provider) => {
    setBusy(provider);
    // Simulated OAuth handshake
    setTimeout(() => {
      const domain = provider === "google" ? "gmail.com" : "outlook.com";
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
      portal.login({
        role: "student",
        provider,
        name: name.trim() || "Student",
        email: `${slug || "user"}@${domain}`,
        studentId: studentId.trim() || "STU-0000",
        major,
      });
      setBusy(null);
    }, 700);
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Left: hero */}
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-ink-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-32 -top-32 size-[480px] rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 size-[420px] rounded-full bg-chart-2/20 blur-3xl" />
        <Brand dark />
        <div className="relative max-w-lg">
          <p className="label-en text-ink-muted">University IT Help Desk</p>
          <h1 className="font-myanmar mt-4 text-4xl font-extrabold leading-snug text-balance">
            ကျောင်းဝင်း အင်တာနက် ပြဿနာများကို လွယ်ကူစွာ တိုင်ကြားပါ
          </h1>
          <p className="mt-3 text-lg text-ink-muted">Report Wi-Fi problems, attach proof, and get answers fast.</p>
          <ul className="mt-10 grid grid-cols-2 gap-4 text-sm">
            <Feature icon={Wifi} my="ပြဿနာ တိုင်ကြားရန်" en="Issue report form" />
            <Feature icon={Gauge} my="WiFiman ရလဒ် တင်ရန်" en="Speedtest upload" />
            <Feature icon={MessageSquare} my="Admin နှင့် စကားပြော" en="Direct chat" />
            <Feature icon={FileSpreadsheet} my="Excel / PDF ထုတ်ရန်" en="Admin exports" />
          </ul>
        </div>
        <p className="relative text-xs text-ink-muted">© 2026 CampusNet · Network Operations Center</p>
      </aside>

      {/* Right: auth card */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md animate-rise">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <GraduationCap className="size-4" />
            <span className="font-myanmar">ကျောင်းသား ပေါ်တယ်</span>
            <span className="opacity-70">· Student Portal</span>
          </div>

          <div className="surface-card mt-5 p-7">
            <h2 className="font-myanmar text-2xl font-bold">ကျောင်းသား အကောင့်ဖြင့် ဝင်ရန်</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your campus account to report issues.
            </p>

            <div className="mt-6 space-y-4">
              <Field label="အမည် · Full name">
                <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ကျောင်းသား ID · Student ID">
                  <input className="field font-mono" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                </Field>
                <Field label="မေဂျာ · Major">
                  <input className="field" value={major} onChange={(e) => setMajor(e.target.value)} />
                </Field>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <ProviderButton provider="google" busy={busy} onClick={() => signIn("google")} />
              <ProviderButton provider="outlook" busy={busy} onClick={() => signIn("outlook")} />
            </div>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Sign-in is simulated for this demo — no real account is contacted.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, my, en }: { icon: typeof Wifi; my: string; en: string }) {
  return (
    <li className="rounded-xl border border-ink-border bg-ink-foreground/5 p-4">
      <Icon className="size-5 text-primary-foreground/90" />
      <p className="font-myanmar mt-3 font-semibold">{my}</p>
      <p className="text-xs text-ink-muted">{en}</p>
    </li>
  );
}

function RoleTab({ active, onClick, icon: Icon, my, en }: { active: boolean; onClick: () => void; icon: typeof Wifi; my: string; en: string }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition",
        active ? "bg-card font-semibold shadow-card" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      <span>
        <span className="font-myanmar">{my}</span>
        <span className="ml-1 hidden text-xs opacity-60 sm:inline">{en}</span>
      </span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ProviderButton({ provider, busy, onClick }: { provider: Provider; busy: Provider | null; onClick: () => void }) {
  const isGoogle = provider === "google";
  return (
    <button
      onClick={onClick}
      disabled={busy !== null}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
    >
      {isGoogle ? <GoogleMark /> : <OutlookMark />}
      {busy === provider ? "Connecting…" : (
        <span>
          <span className="font-myanmar">{isGoogle ? "Google" : "Outlook"} ဖြင့် ဝင်မည်</span>
          <span className="ml-1 text-muted-foreground">· Continue with {isGoogle ? "Google" : "Outlook"}</span>
        </span>
      )}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg className="size-5" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function OutlookMark() {
  return (
    <svg className="size-5" viewBox="0 0 32 32" aria-hidden>
      <rect x="11" y="6" width="19" height="20" rx="2" fill="#0F6CBD" />
      <rect x="11" y="6" width="19" height="10" fill="#28A8EA" opacity=".9" />
      <rect x="2" y="9" width="15" height="14" rx="2" fill="#0364B8" />
      <ellipse cx="9.5" cy="16" rx="4" ry="4.6" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}
