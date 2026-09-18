import { useSyncExternalStore } from "react";

export type Status = "pending" | "in_progress" | "resolved";
export type Role = "student" | "admin";
export type Provider = "google" | "outlook";

export interface Report {
  id: string;
  ticketNo: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  building: string;
  room: string;
  issueType: string;
  description: string;
  issueImage?: string | undefined;
  speedtestImage?: string | undefined;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  studentId: string;
  from: Role;
  text: string;
  createdAt: string;
}

export interface Session {
  role: Role;
  provider: Provider;
  name: string;
  email: string;
  studentId: string;
  major: string;
}

interface State {
  session: Session | null;
  reports: Report[];
  messages: Message[];
  counter: number;
}

const KEY = "campusnet:v1";
const EMPTY: State = { session: null, reports: [], messages: [], counter: 1000 };

let cache: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as State) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function save(next: State) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded: keep in-memory state so the UI still works this session.
  }
  listeners.forEach((l) => l());
}

function update(fn: (s: State) => State) {
  save(fn(load()));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePortalState(): State {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export const STATUS_LABEL: Record<Status, { my: string; en: string }> = {
  pending: { my: "စောင့်ဆိုင်းဆဲ", en: "Pending" },
  in_progress: { my: "ဆောင်ရွက်နေဆဲ", en: "In Progress" },
  resolved: { my: "ဖြေရှင်းပြီး", en: "Resolved" },
};

export const BUILDINGS = [
  "Main Building (ပင်မဆောင်)",
  "Library (စာကြည့်တိုက်)",
  "Engineering Block A",
  "Engineering Block B",
  "Computer Lab (ကွန်ပျူတာခန်း)",
  "Hostel 1 (အဆောင် ၁)",
  "Hostel 2 (အဆောင် ၂)",
  "Canteen (စားသောက်ဆိုင်)",
];

export const ISSUE_TYPES = [
  { value: "no_wifi", my: "Wi-Fi လုံးဝမရ", en: "No Wi-Fi signal" },
  { value: "slow", my: "အင်တာနက် နှေးသည်", en: "Slow speed" },
  { value: "dropping", my: "မကြာခဏ ပြတ်တောက်သည်", en: "Keeps disconnecting" },
  { value: "login", my: "Login ဝင်မရ", en: "Cannot log in / captive portal" },
  { value: "blocked", my: "Website ဖွင့်မရ", en: "Cannot access a website" },
  { value: "other", my: "အခြား", en: "Other" },
];

export function issueLabel(value: string) {
  const t = ISSUE_TYPES.find((i) => i.value === value);
  return t ? `${t.my} · ${t.en}` : value;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const portal = {
  login(session: Session) {
    update((s) => ({ ...s, session }));
  },
  logout() {
    update((s) => ({ ...s, session: null }));
  },
  addReport(input: Omit<Report, "id" | "ticketNo" | "status" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    let created: Report | null = null;
    update((s) => {
      const counter = s.counter + 1;
      created = {
        ...input,
        id: uid(),
        ticketNo: `CN-${counter}`,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };
      return { ...s, counter, reports: [created, ...s.reports] };
    });
    return created as unknown as Report;
  },
  setStatus(id: string, status: Status) {
    update((s) => ({
      ...s,
      reports: s.reports.map((r) =>
        r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r,
      ),
    }));
  },
  deleteReport(id: string) {
    update((s) => ({ ...s, reports: s.reports.filter((r) => r.id !== id) }));
  },
  sendMessage(studentId: string, from: Role, text: string) {
    update((s) => ({
      ...s,
      messages: [
        ...s.messages,
        { id: uid(), studentId, from, text, createdAt: new Date().toISOString() },
      ],
    }));
  },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Resize an uploaded image to keep localStorage usage small. */
export function fileToDataUrl(file: File, max = 1100): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
