import type { LabState } from "../lib/net";

export interface Topic {
  title: string;
  what: string; // 1. Bu konu nedir?
  why: string; // 2. Neden kullanılır?
  life: string; // 3. Günlük hayattan örnek
  tech: string; // 4. Teknik olarak nasıl çalışır?
  tip?: string; // sık karıştırılan nokta
}

export interface Instructor {
  start: string;
  example: string;
  emphasize: string[];
  confusions: string[];
  summary: string;
}

export interface TaskCtx {
  lab?: LabState;
  events: string[];
}
export interface Task {
  id: string;
  title: string;
  desc: string;
  hint: string;
  check: (c: TaskCtx) => { ok: boolean; msg: string };
}

export interface Question {
  kind: "mc" | "tf" | "scenario";
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export type LabKind = "network" | "protocol" | "dhcpdns" | "transmission" | "terminal";

export interface LabConfig {
  palette: string[];
  blank: boolean; // yeni PC'ler IP'siz başlasın
  initial: () => LabState;
  sample?: () => LabState;
  hint: string;
  steps: string[]; // laboratuvar yönergeleri
}

export interface ModuleDef {
  id: string;
  no: number;
  title: string;
  tagline: string;
  intro: string; // modül girişi - günlük hayat benzetmesi
  topics: Topic[];
  instructor: Instructor;
  labKind: LabKind;
  lab?: LabConfig;
  tasks: Task[];
  quiz: Question[];
}
