export const BODY_PARTS = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Abs",
  "Cardio",
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];

export const EXERCISES: Record<BodyPart, string[]> = {
  Chest: ["Bench Press", "Incline Press", "Dumbbell Fly", "Cable Fly", "Push Ups", "Dips"],
  Back: ["Lat Pulldown", "Pull Ups", "Seated Row", "Deadlift", "Barbell Row", "Face Pull"],
  Legs: ["Squats", "Leg Press", "Lunges", "Romanian Deadlift", "Leg Curl", "Calf Raise"],
  Shoulders: ["Overhead Press", "Lateral Raise", "Front Raise", "Arnold Press", "Rear Delt Fly"],
  Biceps: ["Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl", "Cable Curl"],
  Triceps: ["Tricep Pushdown", "Skull Crushers", "Overhead Extension", "Close-Grip Bench", "Dips"],
  Abs: ["Crunches", "Hanging Leg Raise", "Plank", "Cable Crunch", "Russian Twist"],
  Cardio: ["Running", "Cycling", "Rowing", "Incline Walk", "Jump Rope", "Stair Climber"],
};

export const PART_COLORS: Record<BodyPart, string> = {
  Chest: "#fb7185",
  Back: "#22d3ee",
  Legs: "#a78bfa",
  Shoulders: "#fbbf24",
  Biceps: "#34f5c5",
  Triceps: "#f97316",
  Abs: "#a3e635",
  Cardio: "#60a5fa",
};

export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Gym",
  "Medical",
  "Education",
  "Bills",
  "Entertainment",
  "Other",
] as const;

export const TRIGGERS = ["Stress", "Boredom", "Loneliness", "Habit", "Celebration"] as const;
export const CRAVING_TIMES = ["Morning", "Afternoon", "Night"] as const;

export const PLANNER_BLOCKS = [
  { time: "08:00–10:00", label: "Morning Routine", key: "morning" },
  { time: "10:00–14:00", label: "NCLEX Australia", key: "nclex" },
  { time: "14:00–16:00", label: "Food / Rest / Room", key: "rest" },
  { time: "16:00–17:00", label: "BharatFare", key: "bharatfare" },
  { time: "17:00–19:00", label: "Life / NHS / AHPRA", key: "life" },
  { time: "19:00–21:00", label: "Gym", key: "gym" },
  { time: "21:00–23:00", label: "Dinner / Recovery / Sleep", key: "recovery" },
] as const;

/** Common protein foods for quick-add (name → grams protein, approx kcal). */
export const QUICK_FOODS: { name: string; proteinG: number; calories: number }[] = [
  { name: "Protein Shake", proteinG: 25, calories: 130 },
  { name: "Chicken Breast (100g)", proteinG: 31, calories: 165 },
  { name: "Eggs (2)", proteinG: 12, calories: 140 },
  { name: "Oats (50g)", proteinG: 8, calories: 190 },
  { name: "Rice (150g)", proteinG: 4, calories: 200 },
  { name: "Milk (250ml)", proteinG: 8, calories: 120 },
  { name: "Banana", proteinG: 1, calories: 105 },
  { name: "Greek Yogurt (170g)", proteinG: 17, calories: 100 },
];
