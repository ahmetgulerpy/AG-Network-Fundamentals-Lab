import type { ModuleDef } from "./types";
import { m1, m2, m3 } from "./content1";
import { m4, m5, m6 } from "./content2";
import { m7, m8 } from "./content3";
import { getStore } from "../lib/store";

export const MODULES: ModuleDef[] = [m1, m2, m3, m4, m5, m6, m7, m8];
export const getModule = (id: string) => MODULES.find((m) => m.id === id);

export function moduleProgress(m: ModuleDef, s = getStore()) {
  const tasksDone = m.tasks.filter((t) => s.tasks[`${m.id}:${t.id}`]).length;
  const q = s.quiz[m.id];
  const quizPassed = !!q && q.score >= 3;
  const lesson = !!s.lessonRead[m.id];
  const value = ((lesson ? 1 : 0) + tasksDone / m.tasks.length + (quizPassed ? 1 : 0)) / 3;
  const complete = lesson && tasksDone === m.tasks.length && quizPassed;
  return { value, complete, tasksDone, quizPassed, lesson, quiz: q };
}
