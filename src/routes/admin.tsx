import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  MessageSquare,
  FileSpreadsheet,
  FileDown,
  Search,
  Trash2,
  Inbox,
  Loader,
  CheckCircle2,
  Users,
} from "lucide-react";
import {
  STATUS_LABEL,
  formatDate,
  issueLabel,
  portal,
  usePortalState,
  type Report,
  type Session,
  type Status,
} from "@/lib/portal-store";
import { Avatar, Brand, ChatPanel, Heading, Lightbox, LogoutButton, StatusBadge, Thumb, useRequireRole } from "@/components/portal/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Panel — CampusNet" },
      { name: "description", content: "စီမံခန့်ခွဲသူ ပန်နယ် — Ticket dashboard, status management, Excel/PDF export and student chat for the campus IT team." },
      { property: "og:title", content: "Admin Panel — CampusNet" },
      { property: "og:description", content: "Manage campus internet issue tickets and reply to students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const session = useRequireRole("admin");
  if (!session) return null;
  return <AdminPanel session={session} />;
}

type View = "dashboard" | "chat";
const STATUSES: Status[] = ["pending", "in_progress", "resolved"];

function AdminPanel({ session }: { session: Session }) {
  const { reports, messages } = usePortalState();
  const [view, setView] = useState<View>("dashboard");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (!q ||
          [r.ticketNo, r.studentName, r.studentId, r.building, r.room, r.description, issueLabel(r.issueType)]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
  }, [reports, query, filter]);

  const metrics = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    in_progress: reports.filter((r) => r.status === "in_progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    students: new Set(reports.map((r) => r.studentId)).size,
  };

  const exportExcel = async () => {
    setExporting("xlsx");
    try {
      const XLSX = await import("xlsx");
      const rows = filtered.map((r) => ({
        Ticket: r.ticketNo,
        "Student Name": r.studentName,
        "Student ID": r.studentId,
        Email: r.studentEmail,
        Building: r.building,
        Room: r.room,
        "Issue Type": issueLabel(r.issueType),
        Description: r.description,
        Status: `${STATUS_LABEL[r.status].en} / ${STATUS_LABEL[r.status].my}`,
        "Has Screenshot": r.issueImage ? "Yes" : "No",
        "Has Speedtest": r.speedtestImage ? "Yes" : "No",
        "Created At": formatDate(r.createdAt),
        "Updated At": formatDate(r.updatedAt),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = Object.keys(rows[0] ?? { a: 1 }).map((k) => ({ wch: k === "Description" ? 50 : 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tickets");
      XLSX.writeFile(wb, `campusnet-tickets-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel ထုတ်ပြီးပါပြီ · Excel exported");
    } catch (e) {
      console.error(e);
      toast.error("Excel export failed");
    } finally {
      setExporting(null);
    }
  };

  const exportPdf = async () => {
    if (!tableRef.current) return;
    setExporting("pdf");
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 8,
          filename: `campusnet-tickets-${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: "jpeg", quality: 0.92 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        })
        .from(tableRef.current)
        .save();
      toast.success("PDF ထုတ်ပြီးပါပြီ · PDF exported");
    } catch (e) {
      console.error(e);
      toast.error("PDF export failed");
    } finally {
      setExporting(null);
    }
  };

  const unreadStudents = new Set(messages.filter((m) => m.from === "student").map((m) => m.studentId)).size;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="flex flex-col gap-6 bg-ink p-5 text-ink-foreground lg:sticky lg:top-0 lg:h-screen">
        <Brand dark />
        <nav className="flex gap-1 lg:flex-col">
          <NavItem active={view === "dashboard"} onClick={() => setView("dashboard")} icon={LayoutDashboard} my="ဒက်ရှ်ဘုတ်" en="Dashboard" />
          <NavItem active={view === "chat"} onClick={() => setView("chat")} icon={MessageSquare} my="ကျောင်းသား Chat" en="Student chat" badge={unreadStudents || undefined} />
        </nav>
        <div className="mt-auto hidden rounded-xl border border-ink-border bg-ink-foreground/5 p-4 lg:block">
          <div className="flex items-center gap-3">
            <Avatar name={session.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{session.name}</p>
              <p className="truncate text-xs text-ink-muted">{session.email}</p>
            </div>
          </div>
          <div className="mt-3">
            <LogoutButton dark />
          </div>
        </div>
        <div className="lg:hidden">
          <LogoutButton dark />
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 lg:px-10">
        {view === "dashboard" ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Heading my="စီမံခန့်ခွဲသူ ဒက်ရှ်ဘုတ်" en="Admin dashboard · Live from student reports" />
              <div className="flex gap-2">
                <ExportButton icon={FileSpreadsheet} label="Excel" onClick={exportExcel} busy={exporting === "xlsx"} disabled={filtered.length === 0 || exporting !== null} />
                <ExportButton icon={FileDown} label="PDF" onClick={exportPdf} busy={exporting === "pdf"} disabled={filtered.length === 0 || exporting !== null} />
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
              <Metric icon={Inbox} my="စုစုပေါင်း" en="Total tickets" n={metrics.total} onClick={() => setFilter("all")} active={filter === "all"} />
              <Metric icon={Loader} my="စောင့်ဆိုင်းဆဲ" en="Pending" n={metrics.pending} tone="pending" onClick={() => setFilter("pending")} active={filter === "pending"} />
              <Metric icon={Loader} my="ဆောင်ရွက်နေဆဲ" en="In progress" n={metrics.in_progress} tone="in_progress" onClick={() => setFilter("in_progress")} active={filter === "in_progress"} />
              <Metric icon={CheckCircle2} my="ဖြေရှင်းပြီး" en="Resolved" n={metrics.resolved} tone="resolved" onClick={() => setFilter("resolved")} active={filter === "resolved"} />
              <Metric icon={Users} my="ကျောင်းသား" en="Students" n={metrics.students} />
            </div>

            {/* Table */}
            <section className="surface-card mt-6 overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
                <div className="relative flex-1 basis-60">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input className="field pl-9" placeholder="ရှာဖွေရန်… Search ticket, student, building" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <select className="field w-auto" value={filter} onChange={(e) => setFilter(e.target.value as Status | "all")}>
                  <option value="all">All statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s].en}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-muted-foreground">{filtered.length} / {reports.length}</span>
              </div>

              <div ref={tableRef} className="overflow-x-auto bg-card">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead>
                    <tr className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <Th>Ticket / Time</Th>
                      <Th>ကျောင်းသား · Student</Th>
                      <Th>တည်နေရာ · Location</Th>
                      <Th>ပြဿနာ · Issue</Th>
                      <Th>ပုံများ · Images</Th>
                      <Th>အခြေအနေ · Status</Th>
                      <Th className="text-right" data-html2canvas-ignore>Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-muted-foreground">
                          <span className="font-myanmar">တိုင်ကြားချက် မရှိသေးပါ</span> · No tickets match
                        </td>
                      </tr>
                    )}
                    {filtered.map((r) => (
                      <Row key={r.id} r={r} onOpen={(src, title) => setLightbox({ src, title })} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <AdminChat />
        )}
      </main>

      <Lightbox src={lightbox?.src ?? null} title={lightbox?.title} onClose={() => setLightbox(null)} />
    </div>
  );
}

function Th({ children, className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("px-4 py-3 font-semibold", className)} {...rest}>
      {children}
    </th>
  );
}

function Row({ r, onOpen }: { r: Report; onOpen: (src: string, title: string) => void }) {
  return (
    <tr className="align-top transition hover:bg-muted/40">
      <td className="px-4 py-3">
        <p className="font-mono text-xs font-bold">{r.ticketNo}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
        {r.updatedAt !== r.createdAt && <p className="text-[11px] text-muted-foreground">upd. {formatDate(r.updatedAt)}</p>}
      </td>
      <td className="px-4 py-3">
        <p className="font-semibold">{r.studentName}</p>
        <p className="font-mono text-xs text-muted-foreground">{r.studentId}</p>
        <p className="text-xs text-muted-foreground">{r.studentEmail}</p>
      </td>
      <td className="px-4 py-3">
        <p>{r.building}</p>
        <p className="text-xs text-muted-foreground">Room {r.room}</p>
      </td>
      <td className="max-w-xs px-4 py-3">
        <p className="font-myanmar font-semibold">{issueLabel(r.issueType)}</p>
        <p className="font-myanmar mt-0.5 text-xs text-muted-foreground" title={r.description}>
          {r.description}
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Thumb src={r.issueImage} label="issue screenshot" onOpen={(s) => onOpen(s, `${r.ticketNo} · Issue screenshot`)} />
          <Thumb src={r.speedtestImage} label="WiFiman speedtest" onOpen={(s) => onOpen(s, `${r.ticketNo} · WiFiman speedtest`)} />
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={r.status} />
      </td>
      <td className="px-4 py-3 text-right" data-html2canvas-ignore>
        <div className="flex items-center justify-end gap-2">
          <select
            className="field w-auto py-1.5 text-xs"
            value={r.status}
            onChange={(e) => {
              const s = e.target.value as Status;
              portal.setStatus(r.id, s);
              toast.success(`${r.ticketNo} → ${STATUS_LABEL[s].en}`);
            }}
            aria-label="Change status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s].my} · {STATUS_LABEL[s].en}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (confirm(`Delete ticket ${r.ticketNo}?`)) {
                portal.deleteReport(r.id);
                toast("Ticket deleted");
              }
            }}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

const TONE: Record<Status, string> = {
  pending: "bg-status-pending text-status-pending-foreground",
  in_progress: "bg-status-progress text-status-progress-foreground",
  resolved: "bg-status-resolved text-status-resolved-foreground",
};

function Metric({ icon: Icon, my, en, n, tone, onClick, active }: { icon: typeof Inbox; my: string; en: string; n: number; tone?: Status | undefined; onClick?: (() => void) | undefined; active?: boolean | undefined }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "surface-card animate-rise p-5 text-left transition disabled:cursor-default",
        onClick && "hover:-translate-y-0.5 hover:shadow-lift",
        active && "ring-2 ring-ring",
      )}
    >
      <span className={cn("grid size-9 place-items-center rounded-lg", tone ? TONE[tone] : "bg-accent text-accent-foreground")}>
        <Icon className="size-4" />
      </span>
      <p className="mt-4 text-3xl font-extrabold tabular-nums">{n}</p>
      <p className="font-myanmar mt-1 text-sm font-semibold">{my}</p>
      <p className="label-en">{en}</p>
    </button>
  );
}

function NavItem({ active, onClick, icon: Icon, my, en, badge }: { active: boolean; onClick: () => void; icon: typeof Inbox; my: string; en: string; badge?: number | undefined }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition lg:flex-none",
        active ? "bg-ink-foreground/10 font-semibold" : "text-ink-muted hover:bg-ink-foreground/5 hover:text-ink-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="font-myanmar block truncate">{my}</span>
        <span className="hidden text-[11px] opacity-60 lg:block">{en}</span>
      </span>
      {badge ? <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">{badge}</span> : null}
    </button>
  );
}

function ExportButton({ icon: Icon, label, onClick, busy, disabled }: { icon: typeof Inbox; label: string; onClick: () => void; busy: boolean; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-card transition hover:bg-muted disabled:opacity-50"
    >
      <Icon className="size-4 text-primary" />
      {busy ? "Exporting…" : `Export ${label}`}
    </button>
  );
}

/* ---------- Admin chat ---------- */
function AdminChat() {
  const { reports, messages } = usePortalState();
  const students = useMemo(() => {
    const map = new Map<string, { id: string; name: string; last?: string; lastAt?: string; open: number }>();
    for (const r of reports) {
      const s = map.get(r.studentId) ?? { id: r.studentId, name: r.studentName, open: 0 };
      if (r.status !== "resolved") s.open++;
      map.set(r.studentId, s);
    }
    for (const m of messages) {
      const s = map.get(m.studentId) ?? { id: m.studentId, name: m.studentId, open: 0 };
      if (!s.lastAt || m.createdAt > s.lastAt) {
        s.last = m.text;
        s.lastAt = m.createdAt;
      }
      map.set(m.studentId, s);
    }
    return [...map.values()].sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
  }, [reports, messages]);

  const [selected, setSelected] = useState<string | null>(null);
  const current = students.find((s) => s.id === selected) ?? students[0];

  return (
    <>
      <Heading my="ကျောင်းသားများနှင့် စကားပြောရန်" en="Student conversations" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="surface-card overflow-hidden">
          <ul className="divide-y divide-border">
            {students.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No students yet</li>}
            {students.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setSelected(s.id)}
                  className={cn("flex w-full items-center gap-3 p-4 text-left transition hover:bg-muted/60", current?.id === s.id && "bg-accent/60")}
                >
                  <Avatar name={s.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.name}</span>
                    <span className="font-myanmar block truncate text-xs text-muted-foreground">{s.last ?? `${s.id}`}</span>
                  </span>
                  {s.open > 0 && <span className="rounded-full bg-status-pending px-2 py-0.5 text-[11px] font-bold text-status-pending-foreground">{s.open}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {current ? (
          <ChatPanel
            key={current.id}
            className="h-[600px]"
            studentId={current.id}
            me="admin"
            title={
              <div className="flex items-center gap-3">
                <Avatar name={current.name} />
                <div>
                  <p className="font-semibold">{current.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{current.id}</p>
                </div>
              </div>
            }
          />
        ) : (
          <div className="surface-card grid h-[600px] place-items-center text-sm text-muted-foreground">Select a student to start chatting</div>
        )}
      </div>
    </>
  );
}
