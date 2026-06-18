// AmanOS — "Krishna Explains It To Aman".
// Turns the Gita from a textbook into a personal mentor system: each verse has a
// modern Story, a direct Aman application, Krishna's conversational advice, a
// life-mission impact map, and a daily reflection question. Verse selection is
// recovery-aware — on a hard day it surfaces self-control / discipline verses,
// not random ones. Structured so each layer is independently narratable (audio).

export type Theme =
  | "self-control" | "discipline" | "action" | "mind-mastery"
  | "equanimity" | "self-compassion" | "perseverance" | "detachment" | "surrender";

/** Hero's-journey chapters — Aman progresses through the Gita as he progresses
 *  through his own life. */
export interface JourneyStage { stage: number; title: string; subtitle: string }
export const JOURNEY: JourneyStage[] = [
  { stage: 1, title: "The Confused Warrior", subtitle: "Standing at the edge of the battle, full of doubt." },
  { stage: 2, title: "Learning Self-Mastery", subtitle: "Understanding action, desire and the self as ally." },
  { stage: 3, title: "The Discipline Warrior", subtitle: "Acting without waiting to feel ready." },
  { stage: 4, title: "Master of the Mind", subtitle: "Steadying the mind so cravings can't move it." },
  { stage: 5, title: "Knowledge & Surrender", subtitle: "Wisdom, self-compassion and trust." },
];
export const journeyStage = (n: number): JourneyStage => JOURNEY.find((j) => j.stage === n) ?? JOURNEY[0];

export interface MissionImpact { recovery: number; discipline: number; wealth: number; health: number; career: number; spiritual: number }

export interface MentorVerse {
  ref: string;
  sanskrit: string;
  transliteration: string;
  translation: string;
  themes: Theme[];
  stage: number;
  /** Narratable layers (each can later be sent to TTS independently). */
  story: string;
  aman: string;
  krishna: string;
  mission: MissionImpact;
  reflection: string;
}

const m = (recovery: number, discipline: number, wealth: number, health: number, career: number, spiritual: number): MissionImpact =>
  ({ recovery, discipline, wealth, health, career, spiritual });

export const MENTOR_VERSES: MentorVerse[] = [
  {
    ref: "Bhagavad Gita 6.6",
    sanskrit: "बन्धुरात्मात्मनस्तस्य येनात्मैवात्मना जितः।",
    transliteration: "ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ",
    translation: "For one who has conquered the mind, the mind is the best friend; for the unconquered, it is the worst enemy.",
    themes: ["self-control", "mind-mastery"],
    stage: 4,
    story: "Imagine a warrior who wins every battle except the one inside his own head. Each night the same enemy slips past the gate — not with a sword, but with a whisper: 'just once more.' He realises the enemy was never outside the walls. It was the part of him he never trained.",
    aman: "Today this verse is speaking to the part of you that wants to smoke or light up even though you know it costs you your future. The joint and the cigarette aren't your enemy — your unmastered mind is. Conquer the first ten minutes of the craving and the same mind becomes the ally that carries you through the day.",
    krishna: "Aman, your problem is not the craving itself. Your problem is believing the craving deserves obedience. It is a thought, not a command. Sit with it, watch it, and do not move. When you stop obeying it, it stops ruling you.",
    mission: m(3, 3, 1, 2, 1, 3),
    reflection: "What craving are you treating as a command today, when it is only a thought?",
  },
  {
    ref: "Bhagavad Gita 6.5",
    sanskrit: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।",
    transliteration: "uddhared ātmanātmānaṁ nātmānam avasādayet",
    translation: "Lift yourself by your own self; never let the self sink down.",
    themes: ["self-control", "perseverance"],
    stage: 4,
    story: "A man waited at the bottom of a well for someone to lower a rope. He shouted for his family, his luck, the perfect Monday. No rope came. One day he noticed footholds in the wall he'd been leaning on the whole time — climbing was always his to do.",
    aman: "No one is coming to do your recovery, your NCLEX hours, or BharatFare for you. Not the NHS, not a better mood, not next week. The footholds are here: one clean hour, one glass of water, one page.",
    krishna: "Aman, you keep waiting to feel strong before you climb. That is backwards. You climb first, and the strength arrives on the way up. Lift yourself by your own hand — it is the only hand that can reach you.",
    mission: m(3, 3, 2, 2, 2, 2),
    reflection: "What is one foothold you can use in the next hour instead of waiting to feel ready?",
  },
  {
    ref: "Bhagavad Gita 2.14",
    sanskrit: "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।",
    transliteration: "mātrā-sparśhās tu kaunteya śhītoṣhṇa-sukha-duḥkha-dāḥ",
    translation: "The contacts of the senses give heat and cold, pleasure and pain; they come and go — endure them.",
    themes: ["self-control", "equanimity"],
    stage: 1,
    story: "A boy stood in the sea and panicked every time a wave rose to his chest. An old fisherman told him: don't fight the wave, don't run from it — just breathe and let it pass under you. Every wave that terrified him broke and vanished within seconds.",
    aman: "That urge to smoke will rise like a wave and fall just as fast. You don't have to win a war with it — you just have to outlast ninety seconds. Set a timer, breathe, and let it pass under you.",
    krishna: "Aman, you suffer because you believe the craving will last forever if you don't feed it. It won't. It is weather, not climate. Endure the wave; it has never once failed to break.",
    mission: m(3, 2, 1, 2, 0, 2),
    reflection: "Can you name the last craving that felt unbearable — and notice that it passed?",
  },
  {
    ref: "Bhagavad Gita 2.62-63",
    sanskrit: "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।",
    transliteration: "dhyāyato viṣhayān puṁsaḥ saṅgas teṣhūpajāyate",
    translation: "Dwelling on objects of the senses breeds attachment; attachment breeds desire; desire breeds anger.",
    themes: ["self-control", "mind-mastery"],
    stage: 2,
    story: "A traveller fed one stray thought at his door. It came back with friends, then moved in, then ran the house. He swore he'd been invaded — but he had opened the door himself, every single time, with one small 'just thinking about it.'",
    aman: "The relapse never starts with the cigarette. It starts five thoughts earlier — the daydream you let run. Cut it at the first link: the second the thought appears, move your body, open this verse, text someone.",
    krishna: "Aman, you think you're being honest by 'just imagining' it. You are not imagining — you are rehearsing. Stop the rehearsal and there is no performance.",
    mission: m(3, 3, 1, 1, 1, 2),
    reflection: "What thought did you let yourself rehearse today that you should have cut at the root?",
  },
  {
    ref: "Bhagavad Gita 6.35",
    sanskrit: "अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते।",
    transliteration: "abhyāsena tu kaunteya vairāgyeṇa cha gṛihyate",
    translation: "The restless mind is mastered by practice and detachment.",
    themes: ["discipline", "mind-mastery"],
    stage: 4,
    story: "A blacksmith's apprentice complained his arm was too weak for the hammer. The master said nothing and handed him the hammer the next day, and the next. A year later the apprentice lifted it without thinking. Nothing changed but the reps.",
    aman: "Your clean streak is reps for the mind. Every resisted craving is one strike on the anvil — abhyasa, practice. You are literally rewiring yourself. Don't break the chain that's making you strong.",
    krishna: "Aman, you want the strong mind without the practice that builds it. There is no such gift. Repeat the right action on the dull days especially — that is where the rewiring happens.",
    mission: m(3, 3, 1, 2, 2, 2),
    reflection: "Which 'rep' will you log today, even though no one is watching?",
  },
  {
    ref: "Bhagavad Gita 2.47",
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
    transliteration: "karmaṇy-evādhikāras te mā phaleṣhu kadāchana",
    translation: "You have a right to your actions, but never to the fruits of your actions.",
    themes: ["action", "detachment"],
    stage: 2,
    story: "Two students planted seeds. One dug his up every morning to check the roots, anxious and exhausted. The other simply watered his each day and went to sleep. By summer, only one had a tree — the one who did the work and released the result.",
    aman: "Stop measuring today by the result — the pass, the body, the first BharatFare sale. Do the three NCLEX hours, hit the protein, stay clean. Effort is yours; the harvest is downstream. Water the seed and sleep.",
    krishna: "Aman, your anxiety comes from gripping a result you cannot control while neglecting the action you can. Let go of the fruit. Pour everything into the deed in front of you.",
    mission: m(2, 3, 3, 2, 3, 2),
    reflection: "What outcome are you anxiously gripping that you could release back to the work?",
  },
  {
    ref: "Bhagavad Gita 3.8",
    sanskrit: "नियतं कुरु कर्म त्वं कर्म ज्यायो ह्यकर्मणः।",
    transliteration: "niyataṁ kuru karma tvaṁ karma jyāyo hyakarmaṇaḥ",
    translation: "Perform your prescribed duty, for action is better than inaction.",
    themes: ["action", "discipline"],
    stage: 3,
    story: "A student dreamed of becoming great but kept trading his future for one more comfortable hour. He called it resting. The clock called it the years of his life. Greatness, it turned out, was never a feeling — it was the boring page he kept skipping.",
    aman: "On the heavy days the rule is simple: do the minimum, but do it. One page, one set, one glass of water. Action breaks the fog that thinking only thickens.",
    krishna: "Aman, waiting for motivation is itself a choice — the choice to do nothing. Move first. Even clumsy action beats the paralysis you mistake for rest.",
    mission: m(2, 3, 2, 2, 3, 1),
    reflection: "What is the one small action you've been calling 'rest' to avoid?",
  },
  {
    ref: "Bhagavad Gita 2.48",
    sanskrit: "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।",
    transliteration: "yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya",
    translation: "Established in steadiness, perform your duty, abandoning attachment.",
    themes: ["discipline", "equanimity"],
    stage: 3,
    story: "Two versions of Aman stood before you. One waited for the perfect mood, the perfect plan, the perfect start date — and never moved. The other took one breath, steadied himself, and simply began. A year later only one of them was unrecognisable.",
    aman: "Don't wait to 'feel motivated' to study, train, or build. Steady yourself with a single breath, then begin. Calm, boring discipline will out-travel any burst of hype.",
    krishna: "Aman, hype is a loan with brutal interest. Steadiness is savings. Act from the quiet centre, not the noise, and you will still be standing when the excitement runs out.",
    mission: m(2, 3, 2, 2, 3, 2),
    reflection: "Which version of Aman are you choosing in this hour — the waiter or the one who begins?",
  },
  {
    ref: "Bhagavad Gita 4.7",
    sanskrit: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।",
    transliteration: "yadā yadā hi dharmasya glānir bhavati bhārata",
    translation: "Whenever righteousness declines, I manifest myself.",
    themes: ["self-compassion", "discipline"],
    stage: 5,
    story: "A lamp went out in the night and the room despaired, certain the darkness was permanent. But the one who lit it the first time still held the match. Light was never gone — only waiting to be struck again.",
    aman: "If yesterday slipped, today is the relighting. You don't need a Monday or a 1st of the month. Rebuild the standard right now, this hour. The match is in your hand.",
    krishna: "Aman, a fall is not the end of the story — it is the moment the hero is rebuilt. Do not wait for a clean date to be worthy of starting. Begin again now; that is the whole practice.",
    mission: m(3, 3, 1, 1, 1, 3),
    reflection: "Where has your standard slipped — and what would relighting it look like in the next hour?",
  },
  {
    ref: "Bhagavad Gita 2.40",
    sanskrit: "नेहाभिक्रमनाशोऽस्ति प्रत्यवायो न विद्यते।",
    transliteration: "nehābhikrama-nāśho 'sti pratyavāyo na vidyate",
    translation: "On this path no effort is ever lost, and no obstacle prevails.",
    themes: ["perseverance"],
    stage: 2,
    story: "A man saving coins in a jar felt foolish — a coin a day seemed like nothing. Then a hard winter came, he opened the jar, and the 'nothing' carried him through. None of it had been wasted; it had only been waiting.",
    aman: "Even today's half-effort counts forever. The twenty minutes of study, the one clean hour, the single gym set — none of it is wasted. You are depositing into a jar that will carry you through a hard season.",
    krishna: "Aman, you discount small efforts because you can't see them growing. They compound in the dark. Keep depositing; a relapse is a dip in the account, never a deletion.",
    mission: m(2, 3, 3, 2, 2, 2),
    reflection: "What small deposit can you make today that 'feels like nothing'?",
  },
  {
    ref: "Bhagavad Gita 12.13-14",
    sanskrit: "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च।",
    transliteration: "adveṣhṭā sarva-bhūtānāṁ maitraḥ karuṇa eva cha",
    translation: "One who is free from malice, friendly and compassionate, is dear to me.",
    themes: ["self-compassion"],
    stage: 5,
    story: "A coach screamed at a runner for every stumble until the runner stopped running altogether. A second coach knelt, named the stumble plainly, and said 'again.' The second runner finished the race. Cruelty ends races; firm kindness finishes them.",
    aman: "If you slipped, don't drown in self-hate — that's the relapse's second weapon, and it pulls you toward the next one. Be firm but kind with yourself, then get back up. Shame feeds the dragon; resolve starves it.",
    krishna: "Aman, you would never speak to a friend the way you speak to yourself on a bad day. Be your own ally. Compassion is not softness here — it is the fuel that keeps you in the fight.",
    mission: m(3, 2, 1, 2, 1, 3),
    reflection: "What would you say to a friend in your exact situation — and can you say it to yourself?",
  },
  {
    ref: "Bhagavad Gita 6.19",
    sanskrit: "यथा दीपो निवातस्थो नेङ्गते सोपमा स्मृता।",
    transliteration: "yathā dīpo nivāta-stho neṅgate sopamā smṛitā",
    translation: "As a lamp in a windless place does not flicker — so is the disciplined mind.",
    themes: ["mind-mastery", "discipline"],
    stage: 4,
    story: "Two lamps burned the same flame. One sat in an open doorway and guttered with every gust; the other sat in a sheltered alcove and burned perfectly still. Same fire — different room.",
    aman: "Build the windless room: a morning routine, a plan for the day, triggers removed, the supply thrown out. A protected mind doesn't flicker when the craving wind blows through.",
    krishna: "Aman, do not test your flame in the storm to prove it's strong. Wise warriors shape the room, not just the will. Remove the wind and the steadiness takes care of itself.",
    mission: m(3, 3, 1, 2, 2, 2),
    reflection: "What 'gust' can you remove from your room today so your mind doesn't have to fight it?",
  },
  {
    ref: "Bhagavad Gita 2.38",
    sanskrit: "सुखदुःखे समे कृत्वा लाभालाभौ जयाजयौ।",
    transliteration: "sukha-duḥkhe same kṛitvā lābhālābhau jayājayau",
    translation: "Treating pleasure and pain, gain and loss, victory and defeat alike — then engage in battle.",
    themes: ["equanimity"],
    stage: 2,
    story: "A gambler rode every win to euphoria and every loss to despair, and the swings wrecked him long before the money did. A trader beside him logged each result the same way — a number, a lesson — and was still standing years later.",
    aman: "A good day and a bad day are both just data. Don't get high on the clean week or crushed by the slip. Stay level and fight the next round — the swing itself is what defeats you.",
    krishna: "Aman, your moods are not your master. Win or lose today, the next clean hour is the same task. Steady the inner weather and the outer battle becomes winnable.",
    mission: m(2, 3, 2, 2, 2, 2),
    reflection: "Did a win or a loss swing you today more than it deserved?",
  },
  {
    ref: "Bhagavad Gita 18.66",
    sanskrit: "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।",
    transliteration: "sarva-dharmān parityajya mām ekaṁ śharaṇaṁ vraja",
    translation: "Abandon all varieties of duty and simply surrender; do not fear.",
    themes: ["surrender"],
    stage: 5,
    story: "A man stood frozen before a mountain of tasks, paralysed by the whole of it. A guide touched his shoulder: 'You don't carry the mountain. You take the next step.' He breathed, took one step, and the mountain became a path.",
    aman: "When the to-do list — NCLEX, money, BharatFare, recovery — crushes you, surrender the whole tangle for one moment. Breathe, trust, and do the next right thing. Fear is optional; the next step is not.",
    krishna: "Aman, you are trying to lift the entire future at once, and of course it crushes you. Put it down. Trust the path, take one step, and let me carry what you cannot.",
    mission: m(2, 2, 2, 2, 2, 3),
    reflection: "What is the single next right step, if you put the whole mountain down for now?",
  },
];

const RECOVERY_THEMES: Theme[] = ["self-control", "mind-mastery", "discipline", "action"];

export interface MentorContext {
  relapseToday?: boolean;
  highCraving?: boolean;
  lowDiscipline?: boolean;
  dateKey: string;
}

function hash(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h;
}

/** Recovery-aware daily selection. On a struggling day, choose from the
 *  self-control / discipline pool; otherwise rotate through everything. */
export function selectMentorVerse(ctx: MentorContext): { verse: MentorVerse; prioritised: boolean } {
  const struggling = !!(ctx.relapseToday || ctx.highCraving || ctx.lowDiscipline);
  const pool = struggling
    ? MENTOR_VERSES.filter((v) => v.themes.some((t) => RECOVERY_THEMES.includes(t)))
    : MENTOR_VERSES;
  const list = pool.length ? pool : MENTOR_VERSES;
  return { verse: list[hash(ctx.dateKey) % list.length], prioritised: struggling };
}

export const MISSION_META: { key: keyof MissionImpact; label: string; icon: string }[] = [
  { key: "recovery", label: "Recovery", icon: "🛡️" },
  { key: "discipline", label: "Discipline", icon: "⚔️" },
  { key: "wealth", label: "Wealth", icon: "💰" },
  { key: "health", label: "Health", icon: "💪" },
  { key: "career", label: "Career", icon: "🎓" },
  { key: "spiritual", label: "Spiritual", icon: "🕉️" },
];

export const REFLECTION_PROMPTS = [
  "What temptation are you obeying today?",
  "What future version of yourself are you betraying — or building?",
  "What would Krishna tell you to do in the next hour?",
];
