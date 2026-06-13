import type { UIMessage } from "ai";

export type ThreadMode = "writer" | "brainstorm" | "code";

export interface Thread {
  id: string;
  title: string;
  mode: ThreadMode;
  messages: UIMessage[];
  createdAt: number;
  updatedAt: number;
}

const KEY = "atelier.threads.v1";

function safeRead(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Thread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(threads: Thread[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(threads));
  } catch {
    /* ignore */
  }
}

export const threadStore = {
  list(): Thread[] {
    return safeRead().sort((a, b) => b.updatedAt - a.updatedAt);
  },
  get(id: string): Thread | undefined {
    return safeRead().find((t) => t.id === id);
  },
  upsert(thread: Thread) {
    const all = safeRead();
    const idx = all.findIndex((t) => t.id === thread.id);
    if (idx >= 0) all[idx] = thread;
    else all.push(thread);
    safeWrite(all);
  },
  remove(id: string) {
    safeWrite(safeRead().filter((t) => t.id !== id));
  },
  create(mode: ThreadMode): Thread {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const now = Date.now();
    const thread: Thread = {
      id,
      title: "New conversation",
      mode,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    const all = safeRead();
    all.push(thread);
    safeWrite(all);
    return thread;
  },
};

const MODE_EMITTER = "atelier:threads-changed";

export function emitThreadsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MODE_EMITTER));
}

export function subscribeThreads(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(MODE_EMITTER, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(MODE_EMITTER, handler);
    window.removeEventListener("storage", handler);
  };
}

export interface ImageItem {
  id: string;
  prompt: string;
  url: string;
  createdAt: number;
}

const IMG_KEY = "atelier.images.v1";

export const imageStore = {
  list(): ImageItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(IMG_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ImageItem[];
      return Array.isArray(parsed) ? parsed.sort((a, b) => b.createdAt - a.createdAt) : [];
    } catch {
      return [];
    }
  },
  add(item: ImageItem) {
    if (typeof window === "undefined") return;
    const all = this.list();
    all.unshift(item);
    window.localStorage.setItem(IMG_KEY, JSON.stringify(all.slice(0, 100)));
  },
  remove(id: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      IMG_KEY,
      JSON.stringify(this.list().filter((i) => i.id !== id)),
    );
  },
};
