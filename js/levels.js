// The fixed Handstand path. Each level must be passed before the next unlocks.
//
// pass.type:
//   "hold"     -> sets measured in seconds; pass when one session has `sets` sets of at least `target` seconds
//   "reps"     -> sets measured in reps; same rule with reps
//   "sessions" -> pass after `target` logged sessions on this level
//
// videoSearch is used to build a YouTube search link until you pick a specific video
// for the level in the app (Level page, "Choose demo video").

export const PATH = {
  id: "handstand",
  name: "Handstand",
  description:
    "From your first wrist warm-up to walking on your hands. Short daily practice beats long, rare sessions.",
};

export const WARMUP = [
  "Wrist circles, 10 each direction",
  "Palm-down and palm-up wrist rocks on the floor, 10 each",
  "Finger push-ups or fingertip presses, 10",
  "Arm circles, 10 forward and 10 back",
  "Scapular shrugs overhead, 10",
  "Cat-cow, 8 slow reps",
];

export const LEVELS = [
  {
    id: "prep",
    number: 1,
    name: "Wrist and shoulder prep",
    goal: "Get your wrists and shoulders ready to carry your body weight.",
    figure: "prep",
    pass: { type: "sessions", target: 5 },
    passText: "Complete the prep routine in 5 sessions",
    howTo: [
      "On hands and knees, hands under shoulders, fingers spread wide.",
      "Rock your shoulders slowly forward past your hands, then back.",
      "Keep your elbows straight and push the floor away.",
      "Do the warm-up list, then 3 rounds of 30 seconds of rocking.",
    ],
    cues: ["Spread your fingers and grip the floor", "Elbows locked", "Move slowly, no pain in the wrists"],
    mistakes: ["Rushing the rocks", "Letting the shoulders sink between the arms"],
    videoSearch: "handstand wrist warm up routine beginner",
  },
  {
    id: "hollow",
    number: 2,
    name: "Hollow body hold",
    goal: "Learn the tight, straight body shape you will hold upside down.",
    figure: "hollow",
    pass: { type: "hold", sets: 3, target: 30 },
    passText: "3 holds of 30 seconds in one session",
    howTo: [
      "Lie on your back, press your lower back into the floor.",
      "Lift your shoulders and legs a little off the floor, arms overhead.",
      "Hold the shape and breathe.",
      "Too hard? Bend your knees or keep your arms by your sides first.",
    ],
    cues: ["Lower back glued to the floor", "Squeeze your legs together", "Point your toes"],
    mistakes: ["Lower back lifting off the floor", "Holding your breath"],
    videoSearch: "hollow body hold tutorial beginner progression",
  },
  {
    id: "pike",
    number: 3,
    name: "Pike push-ups",
    goal: "Build pressing strength in the shoulders.",
    figure: "pike",
    pass: { type: "reps", sets: 3, target: 10 },
    passText: "3 sets of 10 reps in one session",
    howTo: [
      "Start in a downward dog: hips high, hands shoulder width apart.",
      "Bend your elbows and lower your head toward the floor in front of your hands.",
      "Press back up to straight arms.",
      "Rest at least one day between hard sessions of this level.",
    ],
    cues: ["Elbows track back, not out to the sides", "Hips stay high", "Head goes forward of the hands"],
    mistakes: ["Turning it into a normal push-up", "Elbows flaring wide"],
    videoSearch: "pike push up tutorial proper form",
  },
  {
    id: "wall-l",
    number: 4,
    name: "Wall L-hold",
    goal: "Get comfortable upside down with your feet on the wall.",
    figure: "wallL",
    pass: { type: "hold", sets: 3, target: 30 },
    passText: "3 holds of 30 seconds in one session",
    howTo: [
      "Sit with your back to a wall and mark where your hips are. Put your hands there.",
      "Walk your feet up the wall until your legs are flat and your body makes an L.",
      "Stack your shoulders over your hands and hold.",
      "Walk down slowly.",
    ],
    cues: ["Shoulders over hands", "Push the floor away", "Straight line from hands to hips"],
    mistakes: ["Hands too far from the wall", "Bent elbows"],
    videoSearch: "wall L handstand hold tutorial",
  },
  {
    id: "chest-wall",
    number: 5,
    name: "Chest-to-wall handstand",
    goal: "Build the straight handstand line and endurance. Most coaches want 30 seconds here before you go freestanding.",
    figure: "chestWall",
    pass: { type: "hold", sets: 3, target: 30 },
    passText: "3 holds of 30 seconds in one session",
    howTo: [
      "From a push-up position with your feet against the wall, walk your feet up the wall.",
      "Walk your hands in until your chest is almost touching the wall.",
      "Hold with straight arms and a straight body.",
      "Walk out and down slowly. Learn to step down to the side if you need to.",
    ],
    cues: ["Push your shoulders up to your ears", "Ribs in, squeeze your glutes", "Look at the floor between your hands"],
    mistakes: ["Banana back (arching)", "Hands too far from the wall"],
    videoSearch: "chest to wall handstand tutorial beginner",
  },
  {
    id: "kick-up",
    number: 6,
    name: "Kick-up and first freestanding hold",
    goal: "Learn to enter a handstand and find balance away from the wall.",
    figure: "kickUp",
    pass: { type: "hold", sets: 3, target: 10 },
    passText: "3 freestanding holds of 10 seconds in one session",
    howTo: [
      "First learn to bail: from a handstand, turn one hand and cartwheel down. Practice 5 to each side.",
      "Kick up softly toward a wall, and try to let your feet float off it.",
      "Then kick up in open space and hold the balance as long as you can.",
      "Spend about half the session on the wall and half on freestanding attempts.",
    ],
    cues: ["Kick softly, not hard", "Press through your fingertips when you fall toward your back", "Body tight like the hollow hold"],
    mistakes: ["Kicking too hard and flipping over", "Never practicing the bail"],
    videoSearch: "handstand kick up and bail tutorial",
  },
  {
    id: "freestanding",
    number: 7,
    name: "Freestanding handstand",
    goal: "A steady 30-second handstand with no wall.",
    figure: "freestanding",
    pass: { type: "hold", sets: 1, target: 30 },
    passText: "1 freestanding hold of 30 seconds",
    howTo: [
      "Kick up to balance, stack hips over shoulders over hands.",
      "Make small corrections with your fingers and the heel of your hand.",
      "Short, frequent attempts: 5 to 10 minutes of practice is enough.",
      "Keep some chest-to-wall holds in your routine for endurance.",
    ],
    cues: ["Fingers steer the balance", "Stay tall through the shoulders", "Squeeze your legs together"],
    mistakes: ["Bending the elbows to save balance", "Arching the back"],
    videoSearch: "freestanding handstand balance tutorial fingers",
  },
  {
    id: "walk",
    number: 8,
    name: "Handstand walk",
    goal: "Walk on your hands with control.",
    figure: "walk",
    pass: { type: "reps", sets: 1, target: 10 },
    passText: "Walk 10 hand steps in one go",
    howTo: [
      "Kick up and let your body lean slightly forward.",
      "Take small steps with your hands to stay under your falling body.",
      "Keep your body tight and the steps short.",
      "Count the hand steps before you come down.",
    ],
    cues: ["Small steps", "Lean comes from the shoulders, not the back", "Look slightly forward"],
    mistakes: ["Big steps", "Legs swinging apart"],
    videoSearch: "how to handstand walk tutorial beginner",
  },
];

export function levelById(id) {
  return LEVELS.find((l) => l.id === id);
}
