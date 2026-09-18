import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Wifi, X, Send, ImagePlus } from "lucide-react";
import { STATUS_LABEL, portal, usePortalState, type Message, type Role, type Session, type Status } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

/* ---------- Brand ---------- */
export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lift">
        <Wifi className="size-5" />
      </span>
      <span className="leading-tight">
        <span className={cn("block text-base font-extrabold tracking-tight", dark && "text-ink-foreground")}>
          CampusNet
        </span>
        <span className={cn("label-en block", dark && "text-ink-muted")}>Internet Help Desk</span>
      </span>
    </Link>
  );
}

/* ---------- Bilingual heading ---------- */
export function Heading({ my, en, size = "lg" }: { my: string; en: string; size?: "lg" | "md" }) {
  return (
    <div>
      <h2 className={cn("font-myanmar font-bold tracking-tight", size === "lg" ? "text-2xl md:text-3xl" : "text-lg")}>
        {my}
      </h2>
      <p className="label-en mt-1">{en}</p>
    </div>
  );
}

/* ---------- Status badge ---------- */
const STATUS_CLASS: Record<Status, string> = {
  pending: "bg-status-pending text-status-pending-foreground",
  in_progress: "bg-status-progress text-status-progress-foreground",
  resolved: "bg-status-resolved text-status-resolved-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  const l = STATUS_LABEL[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_CLASS[status],
      )}
    >
      <span className={cn("size-1.5 rounded-full bg-current", status === "in_progress" && "animate-pulse-dot")} />
      <span className="font-myanmar">{l.my}</span>
      <span className="opacity-70">· {l.en}</span>
    </span>
  );
}

/* ---------- Lightbox ---------- */
export function Lightbox({ src, title, onClose }: { src: string | null; title?: string | undefined; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, onClose]);
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-ink-foreground/10 text-ink-foreground hover:bg-ink-foreground/20"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
      {title && <p className="absolute left-5 top-6 text-sm font-semibold text-ink-foreground">{title}</p>}
      <img
        src={src}
        alt={title ?? "Preview"}
        className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-lift animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ---------- Thumbnail ---------- */
export function Thumb({ src, label, onOpen }: { src?: string | undefined; label: string; onOpen: (src: string) => void }) {
  if (!src) {
    return (
      <span className="grid size-12 place-items-center rounded-lg border border-dashed border-border text-muted-foreground" title={`No ${label}`}>
        <ImagePlus className="size-4 opacity-50" />
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(src)}
      className="size-12 overflow-hidden rounded-lg border border-border ring-offset-2 transition hover:ring-2 hover:ring-ring"
      title={`View ${label}`}
    >
      <img src={src} alt={label} className="size-full object-cover" />
    </button>
  );
}

/* ---------- Chat ---------- */
export function ChatPanel({ studentId, me, title, className }: { studentId: string; me: Role; title?: ReactNode; className?: string }) {
  const { messages } = usePortalState();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const thread = messages.filter((m) => m.studentId === studentId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    portal.sendMessage(studentId, me, t);
    setText("");
  };

  return (
    <div className={cn("surface-card flex flex-col overflow-hidden", className)}>
      {title && <div className="border-b border-border px-5 py-4">{title}</div>}
      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/40 p-4" style={{ minHeight: 260 }}>
        {thread.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            <span className="font-myanmar">စကားပြောမှတ်တမ်း မရှိသေးပါ</span>
            <br />
            No messages yet
          </p>
        )}
        {thread.map((m) => (
          <Bubble key={m.id} m={m} mine={m.from === me} />
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="စာရိုက်ပါ… (Type a message)"
        />
        <button
          type="submit"
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
          disabled={!text.trim()}
          aria-label="Send"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

function Bubble({ m, mine }: { m: Message; mine: boolean }) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-card",
          mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card text-card-foreground",
        )}
      >
        <p className="font-myanmar whitespace-pre-wrap">{m.text}</p>
        <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {m.from === "admin" ? "Admin" : "Student"} ·{" "}
          {new Date(m.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

/* ---------- Session guard ---------- */
export function useRequireRole(role: Role): Session | null {
  const { session } = usePortalState();
  const navigate = useNavigate();
  useEffect(() => {
    if (!session) navigate({ to: "/", replace: true });
    else if (session.role !== role) navigate({ to: session.role === "admin" ? "/admin" : "/student", replace: true });
  }, [session, role, navigate]);
  return session && session.role === role ? session : null;
}

export function LogoutButton({ dark = false }: { dark?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        portal.logout();
        navigate({ to: "/", replace: true });
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
        dark ? "text-ink-muted hover:bg-ink-foreground/10 hover:text-ink-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <LogOut className="size-4" />
      <span className="font-myanmar">ထွက်မည်</span>
      <span className="opacity-60">Sign out</span>
    </button>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className={cn("grid size-10 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground", className)}>
      {initials || "?"}
    </span>
  );
}
