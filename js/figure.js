// Simple animated stick-figure diagrams, drawn as SVG.
// Each animation is a list of key poses. The figure moves smoothly between them in a loop.
// Joints: head, sh (shoulder), el/ha (elbow/hand), hip, kn/ft (knee/foot).
// el2/ha2/kn2/ft2 are the far-side limbs, drawn lighter. They copy the near side when missing.

const G = 185; // ground line

const handstand = (x, sway = 0) => ({
  ha: [x, G], el: [x + sway * 0.3, G - 25], sh: [x + sway * 0.6, G - 50],
  head: [x - 7 + sway * 0.6, G - 40], hip: [x + sway, G - 102],
  kn: [x + sway * 1.2, G - 137], ft: [x + sway * 1.3, G - 172],
  // far side: hands a little apart, legs together
  ha2: [x + 9, G], el2: [x + 6 + sway * 0.3, G - 25],
  kn2: [x + 3 + sway * 1.2, G - 137], ft2: [x + 3 + sway * 1.3, G - 172],
});

const ANIMS = {
  prep: {
    duration: 2400,
    scene: {},
    poses: [
      { ha: [70, G], el: [70, G - 25], sh: [70, G - 50], head: [55, G - 60], hip: [130, G - 50], kn: [130, G], ft: [168, G] },
      { ha: [70, G], el: [77, G - 24], sh: [86, G - 48], head: [72, G - 58], hip: [142, G - 50], kn: [130, G], ft: [168, G] },
    ],
  },
  hollow: {
    duration: 2600,
    scene: {},
    poses: [
      { ha: [18, G - 32], el: [38, G - 27], sh: [60, G - 22], head: [46, G - 30], hip: [104, G - 12], kn: [134, G - 22], ft: [166, G - 32] },
      { ha: [18, G - 36], el: [38, G - 30], sh: [60, G - 25], head: [46, G - 33], hip: [104, G - 11], kn: [134, G - 25], ft: [166, G - 37] },
    ],
  },
  pike: {
    duration: 2400,
    scene: {},
    poses: [
      { ha: [70, G], el: [80, G - 22], sh: [90, G - 46], head: [80, G - 36], hip: [124, G - 92], kn: [146, G - 46], ft: [168, G] },
      { ha: [70, G], el: [94, G - 14], sh: [86, G - 30], head: [74, G - 14], hip: [120, G - 80], kn: [146, G - 42], ft: [168, G] },
    ],
  },
  wallL: {
    duration: 3600,
    scene: { wall: 172 },
    poses: [
      { ha: [104, G], el: [108, G - 24], sh: [112, G - 48], head: [104, G - 40], hip: [144, G - 82], kn: [158, G - 60], ft: [170, G - 34] },
      { ha: [92, G], el: [92, G - 25], sh: [92, G - 50], head: [84, G - 42], hip: [94, G - 102], kn: [132, G - 102], ft: [170, G - 102] },
      { ha: [92, G], el: [92, G - 25], sh: [92, G - 50], head: [84, G - 42], hip: [94, G - 102], kn: [132, G - 102], ft: [170, G - 102] },
    ],
  },
  chestWall: {
    duration: 3000,
    scene: { wall: 112 },
    poses: [
      { ...handstand(100), ft: [108, G - 172], kn: [106, G - 137], hip: [104, G - 102], sh: [101, G - 48], head: [93, G - 40] },
      { ...handstand(100), ft: [108, G - 174], kn: [106, G - 139], hip: [104, G - 104], sh: [101, G - 52], head: [93, G - 43] },
    ],
  },
  kickUp: {
    duration: 4200,
    scene: {},
    poses: [
      // standing, arms up
      { ha: [102, 22], el: [102, 46], sh: [100, 72], head: [92, 60], hip: [100, 122], kn: [100, 154], ft: [100, G],
        ha2: [98, 22], el2: [98, 46], kn2: [112, 154], ft2: [118, G] },
      // lunge, hands down, back leg rising
      { ha: [78, G], el: [80, G - 25], sh: [84, G - 50], head: [74, G - 46], hip: [112, G - 86], kn: [134, G - 110], ft: [158, G - 132],
        kn2: [120, G - 46], ft2: [124, G] },
      // handstand
      { ...handstand(80) },
      { ...handstand(80) },
      // step down
      { ha: [78, G], el: [80, G - 25], sh: [84, G - 50], head: [74, G - 46], hip: [112, G - 86], kn: [134, G - 110], ft: [158, G - 132],
        kn2: [120, G - 46], ft2: [124, G] },
    ],
  },
  freestanding: {
    duration: 3000,
    scene: {},
    poses: [handstand(100, -3), handstand(100, 3)],
  },
  walk: {
    duration: 4000,
    scene: {},
    poses: [
      { ...handstand(70, 2), ha2: [70, G], el2: [70, G - 25] },
      { ...handstand(80, 2), ha: [90, G - 6], el: [86, G - 28], ha2: [70, G], el2: [74, G - 25] },
      { ...handstand(90, 2), ha: [90, G], el: [90, G - 25], ha2: [80, G - 6], el2: [84, G - 28] },
      { ...handstand(100, 2), ha: [110, G - 6], el: [106, G - 28], ha2: [100, G], el2: [100, G - 25] },
      { ...handstand(110, 2), ha: [110, G], el: [110, G - 25], ha2: [110, G], el2: [110, G - 25] },
    ],
    noReturn: false,
  },
};

const JOINTS = ["head", "sh", "el", "ha", "el2", "ha2", "hip", "kn", "ft", "kn2", "ft2"];

function fill(p) {
  return {
    ...p,
    el2: p.el2 || p.el, ha2: p.ha2 || p.ha,
    kn2: p.kn2 || p.kn, ft2: p.ft2 || p.ft,
  };
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function lerpPose(a, b, t) {
  const out = {};
  for (const j of JOINTS) out[j] = [a[j][0] + (b[j][0] - a[j][0]) * t, a[j][1] + (b[j][1] - a[j][1]) * t];
  return out;
}

const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

/**
 * Mount an animated figure into `container`. Returns a stop() function.
 */
export function mountFigure(container, name, { label } = {}) {
  const anim = ANIMS[name];
  container.innerHTML = "";
  if (!anim) return () => {};
  const poses = anim.poses.map(fill);
  // Ping-pong through the poses so the loop is smooth.
  const seq = poses.length > 2 ? [...poses, ...poses.slice(1, -1).reverse()] : [...poses];

  const svg = el("svg", { viewBox: "0 0 200 200", class: "figure", role: "img", "aria-label": label || "Exercise diagram" });
  svg.appendChild(el("line", { x1: 0, y1: G + 2, x2: 200, y2: G + 2, class: "fig-ground" }));
  if (anim.scene.wall) svg.appendChild(el("rect", { x: anim.scene.wall, y: 0, width: 200 - anim.scene.wall, height: G + 2, class: "fig-wall" }));

  const far = el("g", { class: "fig-far" });
  const near = el("g", { class: "fig-near" });
  const mk = (g) => { const p = el("polyline", { fill: "none" }); g.appendChild(p); return p; };
  const farArm = mk(far), farLeg = mk(far);
  const torso = mk(near), arm = mk(near), leg = mk(near);
  const head = el("circle", { r: 9, class: "fig-head" });
  svg.append(far, near, head);
  container.appendChild(svg);

  const pts = (...ps) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  function draw(p) {
    farArm.setAttribute("points", pts(p.sh, p.el2, p.ha2));
    farLeg.setAttribute("points", pts(p.hip, p.kn2, p.ft2));
    torso.setAttribute("points", pts(p.sh, p.hip));
    arm.setAttribute("points", pts(p.sh, p.el, p.ha));
    leg.setAttribute("points", pts(p.hip, p.kn, p.ft));
    head.setAttribute("cx", p.head[0]);
    head.setAttribute("cy", p.head[1]);
  }

  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || seq.length < 2) { draw(seq[0]); return () => {}; }

  const segMs = anim.duration / seq.length;
  let raf = 0, start = 0, stopped = false;
  function frame(ts) {
    if (stopped) return;
    if (!start) start = ts;
    const total = (ts - start) % anim.duration;
    const i = Math.floor(total / segMs);
    const t = ease((total - i * segMs) / segMs);
    draw(lerpPose(seq[i], seq[(i + 1) % seq.length], t));
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}
