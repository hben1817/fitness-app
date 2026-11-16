// Storage layer. Version 1 saves to this browser (localStorage).
// Later, a Supabase adapter can implement the same load/save functions,
// so the rest of the app does not change.

import { LEVELS } from "./levels.js";

const KEY = "handstand-path-v1";

const DEFAULT_STATE = () => ({
  version: 1,
  sessions: [], // { id, levelId, date (ISO), unit: "sec"|"reps"|"session", sets: number[], warmup: boolean, note }
  passed: {}, // levelId -> ISO date when passed
  settings: {
    reminder: { enabled: false, from: "09:00", to: "21:00", at: "18:00", repeatHours: 2 },
    videos: {}, // levelId -> YouTube URL chosen by the user
  },
  meta: { lastNotified: null },
});

let state = null;
const listeners = new Set();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? merge(DEFAULT_STATE(), JSON.parse(raw)) : DEFAULT_STATE();
  } catch {
    state = DEFAULT_STATE();
  }
  return state;
}

function merge(base, saved) {
  return {
    ...base,
    ...saved,
    settings: {
      ...base.settings,
      ...(saved.settings || {}),
      reminder: { ...base.settings.reminder, ...((saved.settings || {}).reminder || {}) },
      videos: { ...((saved.settings || {}).videos || {}) },
    },
    meta: { ...base.meta, ...(saved.meta || {}) },
  };
}

export function get() {
  return state || load();
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not save progress", e);
  }
  listeners.forEach((fn) => fn(state));
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function exportJSON() {
  return JSON.stringify(get(), null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.sessions)) throw new Error("This file is not a Handstand Path backup.");
  state = merge(DEFAULT_STATE(), data);
  save();
}

export function resetAll() {
  state = DEFAULT_STATE();
  save();
}

// ---------- Progress logic ----------

export function sessionsFor(levelId) {
  return get().sessions.filter((s) => s.levelId === levelId);
}

export function isPassed(levelId) {
  return Boolean(get().passed[levelId]);
}

/** A level is unlocked when it is the first level or the level before it is passed. */
export function isUnlocked(levelId) {
  const i = LEVELS.findIndex((l) => l.id === levelId);
  return i === 0 || isPassed(LEVELS[i - 1].id);
}

export function currentLevel() {
  return LEVELS.find((l) => !isPassed(l.id)) || null;
}

/** Does this one session meet the pass mark of its level? */
export function sessionMeetsPass(level, session) {
  const p = level.pass;
  if (p.type === "sessions") return false; // counted across sessions
  const good = session.sets.filter((v) => v >= p.target).length;
  return good >= p.sets;
}

export function evaluatePass(level) {
  if (isPassed(level.id)) return true;
  const list = sessionsFor(level.id);
  let passed = false;
  if (level.pass.type === "sessions") passed = list.length >= level.pass.target;
  else passed = list.some((s) => sessionMeetsPass(level, s));
  if (passed) {
    get().passed[level.id] = new Date().toISOString();
  }
  return passed;
}

/** Progress toward the pass mark, 0..1, plus a short label. */
export function progressToward(level) {
  const p = level.pass;
  const list = sessionsFor(level.id);
  if (isPassed(level.id)) return { ratio: 1, label: "Passed" };
  if (p.type === "sessions") {
    return { ratio: Math.min(1, list.length / p.target), label: `${list.length} of ${p.target} sessions` };
  }
  // best session: the one with the most qualifying sets, then the best single set
  let bestGood = 0, bestValue = 0;
  for (const s of list) {
    bestGood = Math.max(bestGood, s.sets.filter((v) => v >= p.target).length);
    bestValue = Math.max(bestValue, ...s.sets, 0);
  }
  const unit = p.type === "hold" ? "s" : " reps";
  const ratio = bestGood > 0 ? bestGood / p.sets : Math.min(0.99, bestValue / p.target) / p.sets;
  return {
    ratio: Math.min(1, ratio),
    label: list.length ? `Best: ${bestGood} of ${p.sets} sets at target, top set ${bestValue}${unit}` : "No sessions yet",
  };
}

export function addSession(session) {
  const s = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), date: new Date().toISOString(), ...session };
  get().sessions.push(s);
  return s;
}

export function deleteSession(id) {
  const st = get();
  st.sessions = st.sessions.filter((s) => s.id !== id);
}

// ---------- Day helpers ----------

export function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function trainedToday() {
  const today = dayKey();
  return get().sessions.some((s) => dayKey(s.date) === today);
}

/** Consecutive days with at least one session, ending today or yesterday. */
export function streak() {
  const days = new Set(get().sessions.map((s) => dayKey(s.date)));
  let count = 0;
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
