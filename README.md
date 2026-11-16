# Handstand Path

A calisthenics training web app with a fixed path: you master one level before the next one unlocks. The first path takes you from wrist prep to walking on your hands.

## Features (version 1)

- **8 levels** with clear pass marks: wrist prep, hollow body, pike push-ups, wall L-hold, chest-to-wall handstand, kick-up and first freestanding hold, 30 second freestanding handstand, handstand walk.
- **Locking:** a level unlocks only after the previous level is passed.
- **Training screen:** warm-up checklist, hold timer with a beep at the target, rep counter, notes.
- **Animated diagrams** for every level, plus a slot to pick a demo YouTube video per level.
- **History:** streak, last 4 weeks calendar, all sessions.
- **Daily reminder:** a time inside your training window, repeating every few hours until you log a session. Also exports a daily calendar event for reminders that work when the app is closed.
- **Installable** as an app (PWA) and works offline.
- **Backup:** download and restore your progress as a file.

Progress is saved in the browser for now. Online saving with Supabase is the next step.

## Run it locally

It is a static site with no build step:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish with GitHub Pages

1. In the repo, go to **Settings**, then **Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose branch **main** and folder **/ (root)**, then **Save**.
4. After a minute the site is live at `https://hben1817.github.io/fitness-app/`.

## Project layout

```
index.html            App shell
css/styles.css        Styles (dark and light)
js/levels.js          The handstand path: levels, pass marks, how-to, cues
js/store.js           Saving and progress rules (localStorage now, Supabase later)
js/figure.js          Animated stick-figure diagrams
js/reminders.js       Daily reminders and calendar export
js/app.js             Screens and navigation
sw.js                 Offline support and notifications
```

## Changing the path

Edit `js/levels.js`. Each level has a `pass` rule:

- `{ type: "hold", sets: 3, target: 30 }` means 3 holds of at least 30 seconds in one session
- `{ type: "reps", sets: 3, target: 10 }` means 3 sets of at least 10 reps in one session
- `{ type: "sessions", target: 5 }` means 5 logged sessions

## Safety

This app gives general training guidance, not medical advice. Warm up, progress slowly, and stop on sharp or joint pain.
