// Daily training reminders.
//
// 1. In-app notifications: while the app is open (a browser tab or an installed app window),
//    it checks every minute. If you have not trained today and the time is inside your
//    window, it sends a notification, then repeats every few hours until the window ends.
// 2. Calendar reminder: a daily repeating calendar event (.ics) with an alert. This works
//    even when the app is closed, so it is the reliable option for now.
//    Real push notifications with the app closed need a server, which comes with Supabase later.

import * as store from "./store.js";

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function notificationsSupported() {
  return "Notification" in window;
}

export async function askPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

async function show(title, body) {
  try {
    const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
    if (reg) return reg.showNotification(title, { body, icon: "icons/icon.svg", tag: "daily-training" });
    return new Notification(title, { body, icon: "icons/icon.svg" });
  } catch (e) {
    console.warn("Notification failed", e);
  }
}

export function shouldRemind(now = new Date()) {
  const st = store.get();
  const r = st.settings.reminder;
  if (!r.enabled) return false;
  if (store.trainedToday()) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = Math.max(toMinutes(r.from), toMinutes(r.at));
  const end = toMinutes(r.to);
  if (mins < start || mins > end) return false;
  const last = st.meta.lastNotified ? new Date(st.meta.lastNotified) : null;
  if (last && store.dayKey(last) === store.dayKey(now)) {
    return now - last >= r.repeatHours * 3600 * 1000;
  }
  return true;
}

export async function check() {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  if (!shouldRemind()) return;
  const level = store.currentLevel();
  await show(
    "Time to train",
    level ? `Level ${level.number}: ${level.name}. Even 10 minutes counts.` : "Keep your handstand sharp today."
  );
  store.get().meta.lastNotified = new Date().toISOString();
  store.save();
}

let timer = null;
export function start() {
  if (timer) return;
  check();
  timer = setInterval(check, 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
}

export async function test() {
  const p = await askPermission();
  if (p !== "granted") return p;
  await show("Reminders are on", "This is how your daily training reminder will look.");
  return p;
}

/** Build a daily repeating calendar event with an alert at the chosen time. */
export function calendarFile() {
  const r = store.get().settings.reminder;
  const [h, m] = r.at.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const local = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const end = new Date(d.getTime() + 20 * 60 * 1000);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const url = location.href.split("#")[0];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Handstand Path//EN",
    "BEGIN:VEVENT",
    `UID:handstand-path-daily-${Date.now()}@handstand-path`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${local(d)}`,
    `DTEND:${local(end)}`,
    "RRULE:FREQ=DAILY",
    "SUMMARY:Handstand training",
    `DESCRIPTION:Open the app and log your session: ${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Time to train",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
