// Daily Wisdom Engine — one rotating discipline/growth line per day.
// Deterministic by date so the same day always shows the same line.

export interface Wisdom {
  quote: string;
  author?: string;
}

export const WISDOM: Wisdom[] = [
  { quote: "Discipline is remembering what you want." },
  { quote: "A year from now, you'll wish you started today." },
  { quote: "The future is built by today's actions." },
  { quote: "Comfort is expensive. Growth is earned." },
  { quote: "You don't rise to your goals. You fall to your systems.", author: "James Clear" },
  { quote: "Suffer the pain of discipline or suffer the pain of regret." },
  { quote: "Motivation gets you started. Discipline keeps you going." },
  { quote: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { quote: "Win the morning, win the day." },
  { quote: "What you do every day matters more than what you do once in a while." },
  { quote: "Your future self is watching you right now through memories." },
  { quote: "Be stronger than your strongest excuse." },
  { quote: "Small steps every day become miles you never thought possible." },
  { quote: "The craving is temporary. The pride of resisting is permanent." },
  { quote: "You are not behind. You are exactly one decision away." },
  { quote: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
  { quote: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { quote: "The body achieves what the mind believes." },
  { quote: "One clean day is a vote for the person you're becoming." },
  { quote: "Consistency is the algorithm of success." },
  { quote: "When you feel like quitting, remember why you started." },
  { quote: "Energy flows where attention goes. Guard your attention." },
  { quote: "You can't go back and make a new start, but you can start now and make a new ending." },
  { quote: "Become so disciplined that your old self wouldn't recognise you." },
  { quote: "The dragon only survives on the days you give in. Don't feed it." },
  { quote: "Excellence is not an act, but a habit.", author: "Aristotle" },
  { quote: "Fall seven times, stand up eight.", author: "Japanese proverb" },
  { quote: "Today's pain is tomorrow's power." },
  { quote: "You owe your future self everything. Pay him today." },
  { quote: "The grind you do in silence builds the life everyone will see." },
  { quote: "Master your minutes and you master your life." },
  { quote: "Strength is doing it when no one is clapping." },
  { quote: "Every rep, every page, every clean hour is compounding." },
  { quote: "Be the CEO of your life, not a passenger in it." },
  { quote: "Pressure is a privilege. It means something matters." },
  { quote: "The best time was yesterday. The second best time is now." },
];

export function wisdomForDay(dateKey: string): Wisdom {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 33 + dateKey.charCodeAt(i)) >>> 0;
  return WISDOM[h % WISDOM.length];
}
