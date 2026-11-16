import { PATH, LEVELS, WARMUP, levelById } from "./levels.js";
import * as store from "./store.js";
import * as reminders from "./reminders.js";
import { mountFigure } from "./figure.js";

const view = document.getElementById("view");
let cleanups = [];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function cleanup() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return m ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}
function unitOf(level) {
  return level.pass.type === "hold" ? "sec" : level.pass.type === "reps" ? (level.id === "walk" ? "steps" : "reps") : "session";
}
function setLabel(level, v) {
  const u = unitOf(level);
  return u === "sec" ? fmtTime(v) : `${v} ${u}`;
}

function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2800);
}

// ---------- Views ----------

function renderHome() {
  const current = store.currentLevel();
  const done = LEVELS.filter((l) => store.isPassed(l.id)).length;
  const streak = store.streak();
  const today = store.trainedToday();

  view.innerHTML = `
    <section class="hero card">
      <div>
        <p class="eyebrow">Path 1 of your training</p>
        <h1>${esc(PATH.name)}</h1>
        <p class="muted">${esc(PATH.description)}</p>
        <div class="stats">
          <div><strong>${done}/${LEVELS.length}</strong><span>levels passed</span></div>
          <div><strong>${streak}</strong><span>day streak</span></div>
          <div><strong>${today ? "Done" : "Not yet"}</strong><span>today</span></div>
        </div>
      </div>
      ${current ? `<a class="btn primary big" href="#/train/${current.id}">Train level ${current.number}</a>` : `<p class="win">You finished the Handstand path. Next paths are coming.</p>`}
    </section>

    <ol class="path">
      ${LEVELS.map((l) => {
        const passed = store.isPassed(l.id);
        const unlocked = store.isUnlocked(l.id);
        const pr = store.progressToward(l);
        const state = passed ? "passed" : unlocked ? "current" : "locked";
        return `
        <li class="level ${state}">
          <a href="#/level/${l.id}" aria-label="Level ${l.number}, ${esc(l.name)}, ${state}">
            <span class="badge">${passed ? "✓" : unlocked ? l.number : "🔒"}</span>
            <span class="level-text">
              <strong>${l.number}. ${esc(l.name)}</strong>
              <span class="muted small">${esc(l.passText)}</span>
              ${unlocked && !passed ? `<span class="bar"><span style="width:${Math.round(pr.ratio * 100)}%"></span></span>` : ""}
            </span>
          </a>
        </li>`;
      }).join("")}
    </ol>
    <p class="muted small center">More paths (planche, front lever) unlock after the handstand.</p>
  `;
}

function renderLevel(id) {
  const level = levelById(id);
  if (!level) return renderNotFound();
  const passed = store.isPassed(level.id);
  const unlocked = store.isUnlocked(level.id);
  const pr = store.progressToward(level);
  const vurl = store.get().settings.videos[level.id];
  const vid = youtubeId(vurl);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(level.videoSearch)}`;
  const sessions = store.sessionsFor(level.id).slice().reverse();

  view.innerHTML = `
    <a class="back" href="#/">← All levels</a>
    <section class="card">
      <p class="eyebrow">Level ${level.number} of ${LEVELS.length}${passed ? " · Passed" : unlocked ? "" : " · Locked"}</p>
      <h1>${esc(level.name)}</h1>
      <p>${esc(level.goal)}</p>
      <div class="pass"><span>Pass mark</span><strong>${esc(level.passText)}</strong></div>
      ${unlocked ? `<div class="bar big"><span style="width:${Math.round(pr.ratio * 100)}%"></span></div><p class="muted small">${esc(pr.label)}</p>` : `<p class="muted">Pass level ${level.number - 1} to unlock this level. You can still read about it.</p>`}
      ${unlocked ? `<a class="btn primary big" href="#/train/${level.id}">${passed ? "Practice again" : "Start session"}</a>` : ""}
    </section>

    <section class="card demo">
      <h2>How it looks</h2>
      <div class="figure-wrap" id="fig"></div>
      <p class="muted small center">Simple diagram. Watch a video below for the details.</p>
    </section>

    <section class="card">
      <h2>How to do it</h2>
      <ol class="steps">${level.howTo.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <h3>Key cues</h3>
      <ul class="chips">${level.cues.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      <h3>Common mistakes</h3>
      <ul>${level.mistakes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
    </section>

    <section class="card">
      <h2>Demo video</h2>
      ${vid ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${vid}" title="Demo video for ${esc(level.name)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>` : `<p class="muted">No video chosen yet. Find one you like from a coach you trust, then paste the link here.</p>`}
      <p><a class="btn" href="${searchUrl}" target="_blank" rel="noopener">Find videos on YouTube</a></p>
      <form id="video-form" class="row">
        <input name="url" type="url" placeholder="Paste a YouTube link" value="${esc(vurl || "")}" aria-label="YouTube link for this level">
        <button class="btn" type="submit">Save</button>
        ${vurl ? `<button class="btn ghost" type="button" id="video-clear">Remove</button>` : ""}
      </form>
    </section>

    <section class="card">
      <h2>Your sessions</h2>
      ${sessions.length ? `<ul class="log">${sessions.map((s) => `
        <li>
          <div><strong>${fmtDate(s.date)}</strong>${store.sessionMeetsPass(level, s) ? ' <span class="tag">pass</span>' : ""}</div>
          <div class="muted small">${s.sets.length ? s.sets.map((v) => setLabel(level, v)).join(" · ") : "Routine completed"}${s.note ? ` · ${esc(s.note)}` : ""}</div>
        </li>`).join("")}</ul>` : `<p class="muted">No sessions yet.</p>`}
    </section>
  `;

  cleanups.push(mountFigure(document.getElementById("fig"), level.figure, { label: `Diagram of ${level.name}` }));

  document.getElementById("video-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const url = new FormData(e.target).get("url").trim();
    if (url && !youtubeId(url)) return toast("That does not look like a YouTube video link.");
    store.get().settings.videos[level.id] = url || undefined;
    if (!url) delete store.get().settings.videos[level.id];
    store.save();
    toast(url ? "Video saved for this level." : "Video removed.");
    route();
  });
  const clear = document.getElementById("video-clear");
  if (clear) clear.addEventListener("click", () => {
    delete store.get().settings.videos[level.id];
    store.save();
    route();
  });
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.25);
    o.onended = () => ctx.close();
  } catch {}
  if (navigator.vibrate) navigator.vibrate(200);
}

function renderTrain(id) {
  const level = levelById(id);
  if (!level) return renderNotFound();
  if (!store.isUnlocked(level.id)) {
    location.hash = `#/level/${level.id}`;
    return;
  }
  const type = level.pass.type;
  const sets = [];

  view.innerHTML = `
    <a class="back" href="#/level/${level.id}">← Level ${level.number}</a>
    <section class="card">
      <p class="eyebrow">Training · Level ${level.number}</p>
      <h1>${esc(level.name)}</h1>
      <div class="pass"><span>Today's target</span><strong>${esc(level.passText)}</strong></div>
    </section>

    <section class="card">
      <h2>1. Warm up</h2>
      <ul class="checklist">${WARMUP.map((w, i) => `<li><label><input type="checkbox" data-warm="${i}"> ${esc(w)}</label></li>`).join("")}</ul>
    </section>

    <section class="card">
      <h2>2. ${type === "sessions" ? "Prep routine" : "Your sets"}</h2>
      <div class="train-grid">
        <div class="figure-wrap small" id="fig"></div>
        <div id="controls"></div>
      </div>
      <ul class="sets" id="sets"></ul>
    </section>

    <section class="card">
      <h2>3. Finish</h2>
      <label class="field">How did it feel? (optional)
        <input id="note" type="text" maxlength="200" placeholder="For example: wrists felt fine, shaky on set 3">
      </label>
      <button class="btn primary big" id="finish">Save session</button>
      <p class="muted small">Stop if you feel sharp pain. Wrist and shoulder soreness should fade within a day.</p>
    </section>
  `;

  cleanups.push(mountFigure(document.getElementById("fig"), level.figure, { label: `Diagram of ${level.name}` }));
  const controls = document.getElementById("controls");
  const setsEl = document.getElementById("sets");

  function drawSets() {
    setsEl.innerHTML = sets.map((v, i) => `
      <li class="${v >= level.pass.target ? "hit" : ""}">
        <span>Set ${i + 1}</span><strong>${setLabel(level, v)}</strong>
        <button class="icon" data-del="${i}" aria-label="Remove set ${i + 1}">✕</button>
      </li>`).join("");
  }
  setsEl.addEventListener("click", (e) => {
    const i = e.target.dataset.del;
    if (i !== undefined) { sets.splice(Number(i), 1); drawSets(); }
  });

  if (type === "hold") {
    controls.innerHTML = `
      <div class="timer" id="timer" aria-live="polite">0s</div>
      <p class="muted small center">Target ${fmtTime(level.pass.target)}. Tap start when you are in position.</p>
      <div class="row center">
        <button class="btn primary" id="tbtn">Start</button>
      </div>
      <details class="manual"><summary>Enter a time by hand</summary>
        <form id="manual" class="row"><input name="v" type="number" min="1" max="600" placeholder="Seconds" aria-label="Seconds held"><button class="btn" type="submit">Add</button></form>
      </details>`;
    const tEl = document.getElementById("timer"), btn = document.getElementById("tbtn");
    let startAt = 0, raf = 0, beeped = false;
    const tick = () => {
      const s = (performance.now() - startAt) / 1000;
      tEl.textContent = fmtTime(s);
      if (!beeped && s >= level.pass.target) { beeped = true; beep(); tEl.classList.add("hit"); }
      raf = requestAnimationFrame(tick);
    };
    btn.addEventListener("click", () => {
      if (!startAt) {
        startAt = performance.now(); beeped = false; tEl.classList.remove("hit");
        btn.textContent = "Stop"; tick();
      } else {
        cancelAnimationFrame(raf);
        const s = Math.floor((performance.now() - startAt) / 1000);
        startAt = 0; btn.textContent = "Start";
        if (s >= 1) { sets.push(s); drawSets(); }
        tEl.textContent = "0s"; tEl.classList.remove("hit");
      }
    });
    cleanups.push(() => cancelAnimationFrame(raf));
  } else if (type === "reps") {
    const u = unitOf(level);
    controls.innerHTML = `
      <p class="muted small">Target ${level.pass.target} ${u} per set.</p>
      <form id="manual" class="row"><input name="v" type="number" min="1" max="200" placeholder="${u === "steps" ? "Steps" : "Reps"}" aria-label="${u} done"><button class="btn primary" type="submit">Add set</button></form>`;
  } else {
    controls.innerHTML = `
      <p>Do 3 rounds of 30 seconds of shoulder rocks after the warm-up.</p>
      <p class="muted small">Sessions completed: ${store.sessionsFor(level.id).length} of ${level.pass.target}</p>`;
  }

  const manual = document.getElementById("manual");
  if (manual) manual.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = Number(new FormData(manual).get("v"));
    if (v > 0) { sets.push(Math.round(v)); drawSets(); manual.reset(); }
  });

  document.getElementById("finish").addEventListener("click", () => {
    if (type !== "sessions" && !sets.length) return toast("Add at least one set first.");
    const warmup = [...document.querySelectorAll("[data-warm]")].every((c) => c.checked);
    const wasPassed = store.isPassed(level.id);
    store.addSession({ levelId: level.id, unit: unitOf(level), sets: [...sets], warmup, note: document.getElementById("note").value.trim() });
    const nowPassed = store.evaluatePass(level);
    store.save();
    if (nowPassed && !wasPassed) {
      const next = LEVELS[level.number];
      showPassed(level, next);
    } else {
      toast("Session saved. Nice work.");
      location.hash = `#/level/${level.id}`;
    }
  });
}

function showPassed(level, next) {
  view.innerHTML = `
    <section class="card celebrate">
      <div class="big-emoji" aria-hidden="true">🎉</div>
      <h1>Level ${level.number} passed</h1>
      <p>You hit the pass mark for <strong>${esc(level.name)}</strong>.</p>
      ${next ? `<p>Unlocked: <strong>Level ${next.number}, ${esc(next.name)}</strong>.</p>
        <p class="muted small">Keep some practice of the earlier levels in your warm-up. They keep you strong for what comes next.</p>
        <a class="btn primary big" href="#/level/${next.id}">See level ${next.number}</a>` : `<p>You finished the whole Handstand path.</p><a class="btn primary big" href="#/">Back home</a>`}
    </section>`;
}

function renderHistory() {
  const sessions = store.get().sessions.slice().reverse();
  const days = new Set(store.get().sessions.map((s) => store.dayKey(s.date)));
  // last 28 days calendar
  const cells = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    cells.push(`<span class="day ${days.has(store.dayKey(d)) ? "on" : ""}" title="${d.toDateString()}"></span>`);
  }
  view.innerHTML = `
    <section class="card">
      <h1>History</h1>
      <div class="stats">
        <div><strong>${store.get().sessions.length}</strong><span>sessions</span></div>
        <div><strong>${store.streak()}</strong><span>day streak</span></div>
        <div><strong>${days.size}</strong><span>days trained</span></div>
      </div>
      <h3>Last 4 weeks</h3>
      <div class="days">${cells.join("")}</div>
    </section>
    <section class="card">
      <h2>All sessions</h2>
      ${sessions.length ? `<ul class="log">${sessions.map((s) => {
        const l = levelById(s.levelId);
        return `<li>
          <div><strong>${fmtDate(s.date)}</strong> · Level ${l ? l.number : "?"} ${l ? esc(l.name) : ""}</div>
          <div class="muted small">${s.sets.length && l ? s.sets.map((v) => setLabel(l, v)).join(" · ") : "Routine completed"}${s.note ? ` · ${esc(s.note)}` : ""}</div>
          <button class="icon" data-del="${s.id}" aria-label="Delete this session">✕</button>
        </li>`;
      }).join("")}</ul>` : `<p class="muted">Your sessions will show here.</p>`}
    </section>`;
  view.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      if (!confirmInline(b)) return;
      store.deleteSession(b.dataset.del);
      store.save();
      route();
    })
  );
}

// Two-tap delete instead of a blocking browser dialog.
function confirmInline(btn) {
  if (btn.dataset.armed) return true;
  btn.dataset.armed = "1";
  btn.textContent = "Delete?";
  btn.classList.add("armed");
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = "✕"; btn.classList.remove("armed"); }, 3000);
  return false;
}

function renderSettings() {
  const r = store.get().settings.reminder;
  const perm = reminders.notificationsSupported() ? Notification.permission : "unsupported";
  view.innerHTML = `
    <section class="card">
      <h1>Settings</h1>
      <h2>Daily reminder</h2>
      <form id="rem" class="stack">
        <label class="switch"><input type="checkbox" name="enabled" ${r.enabled ? "checked" : ""}> Remind me to train every day</label>
        <div class="grid3">
          <label class="field">Remind me at<input type="time" name="at" value="${r.at}"></label>
          <label class="field">Training window from<input type="time" name="from" value="${r.from}"></label>
          <label class="field">until<input type="time" name="to" value="${r.to}"></label>
        </div>
        <label class="field">If I have not trained, remind me again every
          <select name="repeatHours">${[1, 2, 3, 4].map((h) => `<option value="${h}" ${r.repeatHours == h ? "selected" : ""}>${h} hour${h > 1 ? "s" : ""}</option>`).join("")}</select>
        </label>
        <p class="muted small">Reminders stop for the day once you log a session. Notification permission: <strong id="perm">${perm}</strong>.</p>
        <div class="row">
          <button class="btn primary" type="submit">Save reminder</button>
          <button class="btn" type="button" id="test">Send a test notification</button>
          <button class="btn" type="button" id="ics">Add to my calendar</button>
        </div>
        <p class="muted small">Browser notifications work while the app is open or installed and running. For a reminder that always arrives, also add the daily event to your calendar. Push reminders with the app closed will come with the online account.</p>
      </form>
    </section>

    <section class="card">
      <h2>Your data</h2>
      <p class="muted">Progress is saved in this browser for now. Online saving with an account comes next. Download a backup to be safe.</p>
      <div class="row">
        <button class="btn" id="export">Download backup</button>
        <label class="btn">Restore backup<input type="file" id="import" accept="application/json" hidden></label>
        <button class="btn ghost danger" id="reset">Reset all progress</button>
      </div>
    </section>

    <section class="card">
      <h2>Train safely</h2>
      <ul>
        <li>Always warm up your wrists and shoulders first.</li>
        <li>Short daily practice is better than long sessions. 10 to 20 minutes is plenty.</li>
        <li>Pressing levels (pike push-ups) need a rest day between hard sessions.</li>
        <li>Stop on sharp or joint pain and rest. See a doctor or physiotherapist if it does not go away.</li>
        <li>Clear the space around you and learn to bail before freestanding work.</li>
      </ul>
    </section>`;

  const form = document.getElementById("rem");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    Object.assign(store.get().settings.reminder, {
      enabled: fd.get("enabled") === "on",
      at: fd.get("at"), from: fd.get("from"), to: fd.get("to"),
      repeatHours: Number(fd.get("repeatHours")),
    });
    store.save();
    if (store.get().settings.reminder.enabled) {
      const p = await reminders.askPermission();
      document.getElementById("perm").textContent = p;
      if (p !== "granted") return toast("Reminder saved, but notifications are blocked. Use the calendar option.");
    }
    toast("Reminder saved.");
  });
  document.getElementById("test").addEventListener("click", async () => {
    const p = await reminders.test();
    document.getElementById("perm").textContent = p;
    if (p !== "granted") toast("Notifications are blocked in this browser. Use the calendar option.");
  });
  document.getElementById("ics").addEventListener("click", () => {
    download("handstand-training.ics", reminders.calendarFile(), "text/calendar");
  });
  document.getElementById("export").addEventListener("click", () => {
    download(`handstand-backup-${store.dayKey()}.json`, store.exportJSON(), "application/json");
  });
  document.getElementById("import").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { store.importJSON(await f.text()); toast("Backup restored."); route(); }
    catch (err) { toast(err.message || "Could not read that file."); }
  });
  document.getElementById("reset").addEventListener("click", (e) => {
    const b = e.currentTarget;
    if (!b.dataset.armed) {
      b.dataset.armed = "1"; b.textContent = "Tap again to erase everything";
      setTimeout(() => { delete b.dataset.armed; b.textContent = "Reset all progress"; }, 4000);
      return;
    }
    store.resetAll();
    toast("All progress erased.");
    location.hash = "#/";
  });
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderNotFound() {
  view.innerHTML = `<section class="card"><h1>Page not found</h1><a class="btn" href="#/">Go home</a></section>`;
}

// ---------- Router ----------

function route() {
  cleanup();
  const parts = (location.hash.replace(/^#\/?/, "") || "").split("/");
  const [page, arg] = parts;
  document.querySelectorAll("nav a").forEach((a) => a.classList.toggle("active", a.dataset.page === (page || "home")));
  if (!page) renderHome();
  else if (page === "level") renderLevel(arg);
  else if (page === "train") renderTrain(arg);
  else if (page === "history") renderHistory();
  else if (page === "settings") renderSettings();
  else renderNotFound();
  window.scrollTo(0, 0);
}

store.load();
window.addEventListener("hashchange", route);
route();
reminders.start();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch((e) => console.warn("Service worker not registered", e));
}
