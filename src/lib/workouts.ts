// Gym engine — workout modes, suggested exercises per body part with full
// coaching metadata, and a recovery-based daily suggestion.

export const MODES = ["Gym", "Home", "Dumbbell", "Rod/Bar", "Bodyweight", "Recovery"] as const;
export type Mode = (typeof MODES)[number];

export const GYM_BODY_PARTS = ["Chest", "Back", "Legs", "Shoulders", "Biceps", "Triceps", "Abs", "Cardio", "Full Body"] as const;
export type GymBodyPart = (typeof GYM_BODY_PARTS)[number];

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Exercise {
  name: string;
  equipment: string;
  sets: number;
  reps: string;
  difficulty: Difficulty;
  motivation: string;
  formTip: string;
  progressionTip: string;
}

const E = (
  name: string,
  equipment: string,
  sets: number,
  reps: string,
  difficulty: Difficulty,
  motivation: string,
  formTip: string,
  progressionTip: string,
): Exercise => ({ name, equipment, sets, reps, difficulty, motivation, formTip, progressionTip });

export const WORKOUTS: Partial<Record<GymBodyPart, Partial<Record<Mode, Exercise[]>>>> = {
  Chest: {
    Gym: [
      E("Bench Press", "Barbell + bench", 4, "8–10", "Intermediate", "Push the world off your chest.", "Shoulder blades pinned, bar to mid-chest.", "Add 2.5kg when you hit 10 clean reps."),
      E("Incline Press", "Barbell/dumbbell", 4, "8–10", "Intermediate", "Build the upper shelf.", "30° incline, elbows ~45°.", "Increase incline or load slowly."),
      E("Cable Fly", "Cable machine", 3, "12–15", "Beginner", "Squeeze, don't swing.", "Slight elbow bend, hug a tree.", "Pause 1s at the contraction."),
    ],
    Home: [
      E("Push-ups", "None", 4, "12", "Beginner", "One rep is better than zero.", "Body straight, chest to floor.", "Elevate feet to add difficulty."),
      E("Dumbbell Floor Press", "Dumbbells", 4, "10", "Beginner", "Floor presses save your shoulders.", "Triceps to floor, then press.", "Add reps, then weight."),
      E("Dumbbell Fly", "Dumbbells", 3, "12", "Beginner", "Stretch and squeeze.", "Soft elbows, control the stretch.", "Slow the lowering to 3s."),
      E("Chair Dips", "Chair", 3, "10", "Beginner", "Bodyweight builds you anywhere.", "Elbows back, chest up.", "Straighten legs for more load."),
    ],
    Dumbbell: [
      E("DB Bench Press", "Dumbbells + bench/floor", 4, "10", "Beginner", "Future Aman is built here.", "Wrists stacked over elbows.", "Add 1 rep each session."),
      E("Incline DB Press", "Dumbbells", 3, "10–12", "Intermediate", "Upper chest = the difference.", "Don't flare the elbows.", "Pause at the bottom."),
      E("DB Fly", "Dumbbells", 3, "12", "Beginner", "Control beats ego.", "Wide arc, soft elbows.", "Lower for 3s each rep."),
    ],
    Bodyweight: [
      E("Push-ups", "None", 4, "12–15", "Beginner", "The dragon weakens every rep.", "Tight core, full range.", "Diamond → archer → one-arm progressions."),
      E("Decline Push-ups", "Chair/bed", 3, "12", "Intermediate", "Raise the stakes, raise the feet.", "Hands under shoulders.", "Add a pause at the bottom."),
    ],
  },
  Back: {
    Gym: [
      E("Lat Pulldown", "Cable machine", 4, "10–12", "Beginner", "Build the V.", "Pull elbows to ribs, chest up.", "Slow the negative."),
      E("Seated Row", "Cable machine", 4, "10", "Beginner", "Row your way to a strong back.", "Squeeze shoulder blades.", "Pause 1s at the squeeze."),
      E("Deadlift", "Barbell", 3, "5", "Advanced", "The king of strength.", "Flat back, drive through heels.", "Add load only with perfect form."),
    ],
    "Rod/Bar": [
      E("Bent-over Row", "Barbell", 4, "10", "Intermediate", "Pull like you mean it.", "Hinge ~45°, bar to belly.", "Add 2.5kg when 10 feels easy."),
      E("Romanian Deadlift", "Barbell", 4, "8", "Intermediate", "Hamstrings + back, one move.", "Soft knees, bar close, hinge.", "Feel the stretch before adding weight."),
      E("Upright Row", "Barbell", 3, "12", "Beginner", "Traps and upper back.", "Lead with elbows, no shrug.", "Widen grip if shoulders pinch."),
    ],
    Dumbbell: [
      E("One-arm DB Row", "Dumbbell + bench", 4, "10/side", "Beginner", "Build both sides equally.", "Flat back, pull to hip.", "Add a 1s squeeze."),
      E("DB Romanian Deadlift", "Dumbbells", 3, "10", "Beginner", "Hinge, don't squat.", "Hips back, neutral spine.", "Slow the lowering."),
    ],
    Bodyweight: [
      E("Pull-ups", "Bar", 4, "AMRAP", "Advanced", "Pull your future toward you.", "Full hang, chin over bar.", "Use bands, then negatives, then full."),
      E("Inverted Rows", "Table/low bar", 3, "12", "Beginner", "Show up, the rest follows.", "Body straight, pull chest up.", "Lower feet to increase difficulty."),
    ],
  },
  Legs: {
    Gym: [
      E("Squats", "Barbell", 4, "8", "Intermediate", "Legs build the whole body.", "Chest up, knees track toes.", "Depth before weight."),
      E("Leg Press", "Machine", 4, "10–12", "Beginner", "No skipping leg day.", "Feet shoulder-width, controlled.", "Add a plate when 12 is easy."),
      E("Leg Curl", "Machine", 3, "12", "Beginner", "Hamstrings matter.", "Squeeze at the top.", "Slow the negative."),
    ],
    "Rod/Bar": [
      E("Back Squat", "Barbell", 4, "6–8", "Intermediate", "Earn your strength.", "Brace core, sit between heels.", "Micro-load 2.5kg weekly."),
      E("Romanian Deadlift", "Barbell", 4, "8", "Intermediate", "Posterior chain power.", "Hinge, bar close, flat back.", "Feel the hamstring stretch."),
      E("Walking Lunges", "Barbell", 3, "10/leg", "Intermediate", "One leg at a time, like life.", "Long stride, torso tall.", "Add load slowly."),
    ],
    Dumbbell: [
      E("Goblet Squat", "Dumbbell", 4, "12", "Beginner", "The most honest squat.", "Elbows inside knees, chest up.", "Pause at the bottom."),
      E("DB Lunges", "Dumbbells", 3, "10/leg", "Beginner", "Balance is built.", "Knee over ankle, tall torso.", "Add reps then weight."),
    ],
    Bodyweight: [
      E("Bodyweight Squats", "None", 4, "20", "Beginner", "Anywhere, anytime.", "Full depth, knees out.", "Slow tempo or jump squats."),
      E("Bulgarian Split Squat", "Chair", 3, "10/leg", "Intermediate", "Brutal and effective.", "Front heel down, drop straight.", "Add a backpack of books."),
    ],
  },
  Shoulders: {
    Gym: [
      E("Overhead Press", "Barbell", 4, "8", "Intermediate", "Press the sky.", "Brace core, bar over mid-foot.", "Add 1kg microplates."),
      E("Lateral Raise", "Dumbbells/cable", 4, "15", "Beginner", "Width is built in the side delts.", "Lead with elbows, no swing.", "Drop-set the last set."),
    ],
    Dumbbell: [
      E("DB Shoulder Press", "Dumbbells", 4, "10", "Beginner", "Strong shoulders, strong frame.", "Don't arch the lower back.", "Add a pause at the top."),
      E("Lateral Raise", "Dumbbells", 4, "15", "Beginner", "Light weight, big results.", "Soft elbows, control down.", "Go slower, not heavier."),
      E("Rear Delt Fly", "Dumbbells", 3, "15", "Beginner", "Don't neglect the back delts.", "Hinge over, pull wide.", "Pause at the squeeze."),
    ],
    "Rod/Bar": [
      E("Military Press", "Barbell", 4, "8", "Intermediate", "Old-school strength.", "Glutes tight, full lockout.", "Strict before push press."),
      E("Upright Row", "Barbell", 3, "12", "Beginner", "Traps + delts.", "Elbows lead, bar close.", "Widen grip if it pinches."),
    ],
    Bodyweight: [
      E("Pike Push-ups", "None", 4, "10", "Intermediate", "Build pressing power free.", "Hips high, head between hands.", "Elevate feet → handstand work."),
    ],
  },
  Biceps: {
    Gym: [E("Cable Curl", "Cable", 4, "12", "Beginner", "Constant tension, constant growth.", "Elbows pinned, no swing.", "Drop-set the last set.")],
    Dumbbell: [
      E("DB Curl", "Dumbbells", 4, "12", "Beginner", "Curls for the girls and the grind.", "No momentum, full range.", "Slow the negative to 3s."),
      E("Hammer Curl", "Dumbbells", 3, "12", "Beginner", "Builds thickness.", "Neutral grip, elbows still.", "Pause at the top."),
    ],
    "Rod/Bar": [E("Barbell Curl", "Barbell", 4, "10", "Beginner", "The classic mass builder.", "Elbows fixed, no leaning.", "Strict before adding weight.")],
    Home: [E("Backpack Curl", "Loaded backpack", 4, "15", "Beginner", "Improvise and overcome.", "Control up and down.", "Add books for resistance.")],
  },
  Triceps: {
    Gym: [
      E("Tricep Pushdown", "Cable", 4, "12", "Beginner", "Horseshoes are forged here.", "Elbows pinned, full lockout.", "Drop-set to finish."),
      E("Skull Crushers", "EZ bar", 3, "10", "Intermediate", "70% of the arm is triceps.", "Elbows still, lower to forehead.", "Slow the negative."),
    ],
    Dumbbell: [E("Overhead DB Extension", "Dumbbell", 4, "12", "Beginner", "Stretch builds size.", "Elbows close, full stretch.", "Pause at the bottom.")],
    Bodyweight: [
      E("Diamond Push-ups", "None", 4, "12", "Intermediate", "Free triceps anywhere.", "Hands together, elbows tucked.", "Elevate feet to progress."),
      E("Chair Dips", "Chair", 3, "12", "Beginner", "Show up, sleeves fill out.", "Elbows back, dip deep.", "Straighten legs for more."),
    ],
  },
  Abs: {
    Bodyweight: [
      E("Plank", "None", 3, "45–60s", "Beginner", "Stillness is strength.", "Straight line, squeeze glutes.", "Add time or a weight on back."),
      E("Hanging Leg Raise", "Bar", 3, "12", "Advanced", "Core of steel.", "No swing, curl the pelvis.", "Bent knee → straight leg."),
      E("Bicycle Crunch", "None", 3, "20", "Beginner", "Rotation builds the obliques.", "Slow, elbow to opposite knee.", "Slow the tempo."),
    ],
    Home: [E("Leg Raises", "Floor", 3, "15", "Beginner", "Lower abs, every day's reach.", "Press lower back down.", "Add a pause at the top.")],
    Gym: [E("Cable Crunch", "Cable", 4, "15", "Beginner", "Load the abs to grow them.", "Curl spine, hips fixed.", "Add weight slowly.")],
  },
  Cardio: {
    Recovery: [
      E("Incline Walk", "Treadmill/outdoors", 1, "20–30 min", "Beginner", "The most underrated fat-burner.", "Brisk pace, slight incline.", "Add 5 min weekly."),
      E("Zone-2 Cycle", "Bike", 1, "30 min", "Beginner", "Build the engine.", "Keep it conversational.", "Hold zone 2 longer."),
    ],
    Bodyweight: [E("Jump Rope", "Rope", 4, "60s", "Beginner", "Coordination + conditioning.", "Light bounces, wrists turn.", "Increase rounds.")],
  },
  "Full Body": {
    Bodyweight: [
      E("Burpees", "None", 4, "10", "Intermediate", "The whole body, no excuses.", "Chest to floor, jump tall.", "Add reps or a tuck jump."),
      E("Mountain Climbers", "None", 4, "30s", "Beginner", "Cardio + core in one.", "Hips low, fast knees.", "Increase duration."),
    ],
    Dumbbell: [E("DB Thruster", "Dumbbells", 4, "12", "Intermediate", "Squat to press = everything.", "Drive from legs into press.", "Add load slowly.")],
  },
};

export const COACHING: string[] = [
  "You don't need a perfect workout. You need to show up.",
  "One set is better than zero.",
  "The dragon weakens every rep.",
  "Future Aman is built here.",
  "Consistency beats intensity. Just start.",
  "Discipline is doing it when you don't feel like it.",
  "The pump is temporary. The discipline is permanent.",
  "Show up tired. Leave stronger.",
];

export function coachingForDay(dateKey: string): string {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 17 + dateKey.charCodeAt(i)) >>> 0;
  return COACHING[h % COACHING.length];
}

/** Recovery-based suggestion: train the most-neglected muscle, or rest. */
export function suggestWorkout(recency: Record<string, number | null>): { bodyPart: GymBodyPart; reason: string; recovery: boolean } {
  const trainable = ["Legs", "Chest", "Back", "Shoulders", "Biceps", "Triceps", "Abs"] as const;
  let pick: GymBodyPart = "Full Body";
  let best = -1;
  let anyFresh = false;
  for (const part of trainable) {
    const d = recency[part];
    if (d == null) {
      // never trained — highest priority
      return { bodyPart: part, reason: `${part} has never been trained — start there.`, recovery: false };
    }
    if (d <= 1) anyFresh = true;
    if (d > best) {
      best = d;
      pick = part;
    }
  }
  // Everything trained within ~2 days and nothing neglected → recovery day.
  if (best <= 2 && anyFresh) {
    return { bodyPart: "Cardio", reason: "Everything's been trained recently — take a recovery / cardio day.", recovery: true };
  }
  return { bodyPart: pick, reason: `${pick} was last trained ${best} day${best === 1 ? "" : "s"} ago — it's the most recovered. Train it today.`, recovery: false };
}
