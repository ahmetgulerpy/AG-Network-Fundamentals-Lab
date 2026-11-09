import { useSyncExternalStore } from "react";
import type { LabState } from "./net";

export interface Persist {
  lessonRead: Record<string, boolean>;
  tasks: Record<string, boolean>; // "m1:t1"
  quiz: Record<string, { score: number; total: number }>;
  events: Record<string, string[]>;
  labs: Record<string, LabState>;
}

const KEY = "agcyberlab_network_v1";
const empty: Persist = { lessonRead: {}, tasks: {}, quiz: {}, events: {}, labs: {} };

function load(): Persist {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...empty, ...JSON.parse(raw) };
  } catch {
    /* yoksay */
  }
  return empty;
}

let state: Persist = load();
const listeners = new Set<() => void>();

function set(next: Persist) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* yoksay */
  }
  listeners.forEach((l) => l());
}

export function useStore(): Persist {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state
  );
}
export const getStore = () => state;

export const actions = {
  markLesson(m: string) {
    if (!state.lessonRead[m]) set({ ...state, lessonRead: { ...state.lessonRead, [m]: true } });
  },
  setTask(m: string, t: string, v: boolean) {
    const k = `${m}:${t}`;
    if (!!state.tasks[k] !== v) set({ ...state, tasks: { ...state.tasks, [k]: v } });
  },
  setQuiz(m: string, score: number, total: number) {
    const prev = state.quiz[m];
    set({ ...state, quiz: { ...state.quiz, [m]: prev && prev.score > score ? { ...prev, total } : { score, total } } });
  },
  addEvents(m: string, evs: string[]) {
    const cur = state.events[m] || [];
    const add = evs.filter((e) => !cur.includes(e));
    if (add.length) set({ ...state, events: { ...state.events, [m]: [...cur, ...add] } });
  },
  clearEvents(m: string) {
    set({ ...state, events: { ...state.events, [m]: [] } });
  },
  saveLab(m: string, lab: LabState) {
    set({ ...state, labs: { ...state.labs, [m]: lab } });
  },
  resetAll() {
    set({ ...empty });
  },
};
