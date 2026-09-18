import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Gauge, Trash2, Clock, CheckCircle2, ListChecks } from "lucide-react";
import {
  BUILDINGS,
  ISSUE_TYPES,
  fileToDataUrl,
  formatDate,
  issueLabel,
  portal,
  usePortalState,
  type Session,
} from "@/lib/portal-store";
import { Avatar, Brand, ChatPanel, Heading, Lightbox, LogoutButton, StatusBadge, Thumb, useRequireRole } from "@/components/portal/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student Portal — CampusNet" },
      { name: "description", content: "ကျောင်းသား ပေါ်တယ် — Report internet issues, upload screenshots and WiFiman speedtests, track your tickets and chat with IT." },
      { property: "og:title", content: "Student Portal — CampusNet" },
      { property: "og:description", content: "Report campus internet issues and track their status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentPage,
});

function StudentPage() {
  const session = useRequireRole("student");
  if (!session) return null;
  return <StudentPortal session={session} />;
}

function StudentPortal({ session }: { session: Session }) {
  const { reports } = usePortalState();
  const mine = reports.filter((r) => r.studentId === session.studentId);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [tab, setTab] = useState<"report" | "history" | "chat">("report");

  const counts = {
    pending: mine.filter((r) => r.status === "pending").length,
    in_progress: mine.filter((r) => r.status === "in_progress").length,
    resolved: mine.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Brand />
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* Profile */}
        <section className="surface-card animate-rise flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={session.name} className="size-14 text-lg" />
            <div>
              <p className="label-en">ကျောင်းသား ပရိုဖိုင် · Student profile</p>
              <h1 className="mt-0.5 text-xl font-extrabold">{session.name}</h1>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono">{session.studentId}</span> · {session.major} · {session.email}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat icon={Clock} n={counts.pending} label="Pending" />
            <Stat icon={ListChecks} n={counts.in_progress} label="In progress" />
            <Stat icon={CheckCircle2} n={counts.resolved} label="Resolved" />
          </div>
        </section>

        {/* Mobile tabs */}
        <div className="mt-6 grid grid-cols-3 rounded-xl bg-muted p-1 lg:hidden">
          {(["report", "history", "chat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("rounded-lg py-2 text-sm font-semibold", tab === t ? "bg-card shadow-card" : "text-muted-foreground")}
            >
              {t === "report" ? "တိုင်ကြားရန်" : t === "history" ? "မှတ်တမ်း" : "Chat"}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className={cn(tab !== "report" && "hidden lg:block")}>
            <ReportForm session={session} onDone={() => setTab("history")} />
          </div>

          <div className="space-y-6">
            <section className={cn("surface-card p-6", tab !== "history" && "hidden lg:block")}>
              <Heading my="ကျွန်ုပ်၏ တိုင်ကြားချက်များ" en={`My reports · ${mine.length}`} size="md" />
              <ul className="mt-4 space-y-3">
                {mine.length === 0 && (
                  <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    <span className="font-myanmar">တိုင်ကြားချက် မရှိသေးပါ</span> · No reports yet
                  </li>
                )}
                {mine.map((r) => (
                  <li key={r.id} className="rounded-xl border border-border p-4 transition hover:shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">{r.ticketNo} · {formatDate(r.createdAt)}</p>
                        <p className="font-myanmar mt-1 font-semibold">{issueLabel(r.issueType)}</p>
                        <p className="text-xs text-muted-foreground">{r.building} · Room {r.room}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="font-myanmar mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Thumb src={r.issueImage} label="issue screenshot" onOpen={setLightbox} />
                      <Thumb src={r.speedtestImage} label="speedtest" onOpen={setLightbox} />
                      {r.status === "pending" && (
                        <button
                          onClick={() => {
                            portal.deleteReport(r.id);
                            toast("Report withdrawn");
                          }}
                          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" /> Withdraw
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <ChatPanel
              className={cn("h-[460px]", tab !== "chat" && "hidden lg:flex")}
              studentId={session.studentId}
              me="student"
              title={<Heading my="Admin နှင့် စကားပြောရန်" en="Chat with IT admin" size="md" />}
            />
          </div>
        </div>
      </main>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

function Stat({ icon: Icon, n, label }: { icon: typeof Clock; n: number; label: string }) {
  return (
    <div className="rounded-xl bg-muted px-4 py-3">
      <Icon className="mx-auto size-4 text-muted-foreground" />
      <p className="mt-1 text-xl font-extrabold">{n}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* ---------- Report form ---------- */
function ReportForm({ session, onDone }: { session: Session; onDone: () => void }) {
  const [building, setBuilding] = useState<string>(BUILDINGS[0]!);
  const [room, setRoom] = useState("");
  const [issueType, setIssueType] = useState<string>(ISSUE_TYPES[0]!.value);
  const [description, setDescription] = useState("");
  const [issueImage, setIssueImage] = useState<string | undefined>();
  const [speedtestImage, setSpeedtestImage] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.trim() || description.trim().length < 5) {
      toast.error("အခန်းနံပါတ်နှင့် အသေးစိတ်ကို ဖြည့်ပါ · Please fill room and description");
      return;
    }
    setSubmitting(true);
    const r = portal.addReport({
      studentId: session.studentId,
      studentName: session.name,
      studentEmail: session.email,
      building,
      room: room.trim(),
      issueType,
      description: description.trim(),
      issueImage,
      speedtestImage,
    });
    toast.success(`တိုင်ကြားချက် ပေးပို့ပြီးပါပြီ · Ticket ${r.ticketNo} submitted`);
    setRoom("");
    setDescription("");
    setIssueImage(undefined);
    setSpeedtestImage(undefined);
    setSubmitting(false);
    onDone();
  };

  return (
    <form onSubmit={submit} className="surface-card animate-rise p-6 [animation-delay:80ms]">
      <Heading my="အင်တာနက် ပြဿနာ တိုင်ကြားရန်" en="Report an internet issue" />

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">အဆောက်အဦ · Building</span>
          <select className="field" value={building} onChange={(e) => setBuilding(e.target.value)}>
            {BUILDINGS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">အခန်းနံပါတ် · Room / Location</span>
          <input className="field" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. A-204, 2nd floor" required />
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-xs font-semibold text-muted-foreground">ပြဿနာ အမျိုးအစား · Issue type</legend>
        <div className="flex flex-wrap gap-2">
          {ISSUE_TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setIssueType(t.value)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm transition",
                issueType === t.value
                  ? "border-primary bg-primary text-primary-foreground shadow-lift"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              <span className="font-myanmar">{t.my}</span>
              <span className="ml-1 text-xs opacity-70">{t.en}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">အသေးစိတ် ဖော်ပြချက် · Description</span>
        <textarea
          className="field font-myanmar min-h-28 resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="ဘယ်အချိန်က စဖြစ်လဲ၊ ဘယ်စက်နဲ့လဲ၊ ဘာတွေကြုံနေရလဲ… (When did it start, which device, what happens?)"
          required
        />
      </label>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Upload
          icon={ImagePlus}
          my="ပြဿနာ Screenshot"
          en="Issue screenshot"
          value={issueImage}
          onChange={setIssueImage}
        />
        <Upload
          icon={Gauge}
          my="WiFiman Speedtest ရလဒ်"
          en="WiFiman speedtest result"
          value={speedtestImage}
          onChange={setSpeedtestImage}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lift transition hover:brightness-110 disabled:opacity-60"
      >
        <span className="font-myanmar">တိုင်ကြားချက် ပေးပို့မည်</span>
        <span className="ml-2 opacity-75">· Submit report</span>
      </button>
    </form>
  );
}

function Upload({ icon: Icon, my, en, value, onChange }: { icon: typeof ImagePlus; my: string; en: string; value?: string | undefined; onChange: (v?: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("ပုံဖိုင်သာ တင်နိုင်ပါသည် · Images only");
      return;
    }
    try {
      onChange(await fileToDataUrl(file));
    } catch {
      toast.error("Could not read image");
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        <span className="font-myanmar">{my}</span> · {en}
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files[0]);
        }}
        onClick={() => !value && inputRef.current?.click()}
        className={cn(
          "relative flex aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition",
          drag ? "border-primary bg-accent" : "border-border bg-muted/50 hover:border-primary/50",
        )}
      >
        {value ? (
          <>
            <img src={value} alt={en} className="size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 p-2 text-xs text-ink-foreground">
              <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold hover:underline">
                Replace
              </button>
              <button type="button" onClick={() => onChange(undefined)} className="font-semibold hover:underline">
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            <Icon className="mx-auto size-6" />
            <p className="mt-2 text-xs font-semibold">Click or drop image</p>
            <p className="text-[11px]">PNG / JPG</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      </div>
    </div>
  );
}
