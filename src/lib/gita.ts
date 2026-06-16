export interface Verse {
  ref: string;
  verse: string;
  translation: string;
  meaning: string;
  /** Personal application — coaching voice for the day's battle. */
  application: string;
}

// A curated, accurate set of well-known verses. Structured so it can grow toward
// the 200+ goal in batches without touching the engine. (Quality over fabricated
// volume — every entry here is a real, verifiable verse.)
export const VERSES: Verse[] = [
  {
    ref: "Bhagavad Gita 2.47",
    verse: "karmaṇy-evādhikāras te mā phaleṣhu kadāchana",
    translation: "You have a right to your actions, but never to the fruits of your actions.",
    meaning: "Do the work — the study, the rep, the clean day — without obsessing over the outcome. Effort is yours; results follow.",
    application: "Aman — stop measuring today by the result. Do the 3 NCLEX hours, hit the protein, stay clean. The pass, the body, the business are downstream. Own the action.",
  },
  {
    ref: "Bhagavad Gita 6.5",
    verse: "uddhared ātmanātmānaṁ nātmānam avasādayet",
    translation: "Lift yourself by your own self; never let the self sink down.",
    meaning: "You are your own ally or your own enemy. Today, be the force that pulls you up.",
    application: "Your battle today is not the NHS, not money, not BharatFare. It is defeating the habit that steals your future. Lift yourself — no one else is coming to do it.",
  },
  {
    ref: "Bhagavad Gita 6.6",
    verse: "ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ",
    translation: "For one who has conquered the mind, the mind is the best friend; for the unconquered, it is the worst enemy.",
    meaning: "The craving is just the mind unmastered. Win the morning and you win the mind.",
    application: "The joint isn't your enemy — your unmastered mind is. Conquer the first 10 minutes of the craving and the mind becomes your ally for the rest of the day.",
  },
  {
    ref: "Bhagavad Gita 2.14",
    verse: "mātrā-sparśhās tu kaunteya śhītoṣhṇa-sukha-duḥkha-dāḥ",
    translation: "The contacts of the senses give heat and cold, pleasure and pain; they come and go — endure them.",
    meaning: "Cravings are temporary sensations. Sit with the discomfort; it passes.",
    application: "That urge will rise and fall like a wave. You don't have to fight it — just outlast it. Set a timer for 15 minutes and breathe. It always passes.",
  },
  {
    ref: "Bhagavad Gita 2.62-63",
    verse: "dhyāyato viṣhayān puṁsaḥ saṅgas teṣhūpajāyate",
    translation: "Dwelling on objects of the senses breeds attachment; attachment breeds desire; desire breeds anger.",
    meaning: "Don't feed the thought. Redirect the moment the craving appears.",
    application: "The relapse starts as a thought you entertained. Cut it at the root — the second it appears, move your body, open a verse, text a friend. Don't let the chain start.",
  },
  {
    ref: "Bhagavad Gita 3.35",
    verse: "śhreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣhṭhitāt",
    translation: "Better to do your own duty imperfectly than another's perfectly.",
    meaning: "Your path — health, study, BharatFare — is yours. Run it imperfectly but relentlessly.",
    application: "Stop comparing your timeline to anyone else's. Your dharma is NCLEX, your body, BharatFare, your recovery. Run your race, even on a bad day.",
  },
  {
    ref: "Bhagavad Gita 4.7",
    verse: "yadā yadā hi dharmasya glānir bhavati bhārata",
    translation: "Whenever righteousness declines, I manifest myself.",
    meaning: "On the days discipline drops, rebuild it deliberately. Renewal is always available.",
    application: "If yesterday slipped, today is the manifestation. You don't need a Monday or a 1st of the month. Rebuild the standard right now, this hour.",
  },
  {
    ref: "Bhagavad Gita 18.48",
    verse: "saha-jaṁ karma kaunteya sa-doṣham api na tyajet",
    translation: "One should not abandon the work suited to one's nature, even if flawed.",
    meaning: "Keep showing up to the work that is yours. Consistency beats intensity.",
    application: "Don't quit BharatFare or the books because today was messy. Imperfect action repeated daily is what builds the empire. Show up flawed, but show up.",
  },
  {
    ref: "Bhagavad Gita 2.48",
    verse: "yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya",
    translation: "Established in steadiness, perform your duty, abandoning attachment.",
    meaning: "Steady the mind first, then act. Calm discipline outlasts hype.",
    application: "Don't wait to 'feel motivated.' Steady yourself with one breath, then begin. Calm, boring discipline will take you further than any burst of hype.",
  },
  {
    ref: "Bhagavad Gita 6.35",
    verse: "abhyāsena tu kaunteya vairāgyeṇa cha gṛihyate",
    translation: "The restless mind is mastered by practice and detachment.",
    meaning: "Practice + letting go. Every clean hour is a rep that rewires you.",
    application: "Your streak is reps for the mind. Each clean day is abhyasa — practice. You are literally rewiring yourself. Don't break the chain.",
  },
  {
    ref: "Bhagavad Gita 2.40",
    verse: "nehābhikrama-nāśho 'sti pratyavāyo na vidyate",
    translation: "On this path no effort is ever lost, and no obstacle prevails.",
    meaning: "Nothing you invest in yourself is wasted. Even a small step counts permanently.",
    application: "Even today's half-effort counts forever. The 20 minutes of study, the one clean hour — none of it is wasted. Keep depositing.",
  },
  {
    ref: "Bhagavad Gita 12.13-14",
    verse: "adveṣhṭā sarva-bhūtānāṁ maitraḥ karuṇa eva cha",
    translation: "One who is free from malice, friendly and compassionate... is dear to me.",
    meaning: "Be kind to yourself on the hard days. Self-compassion is fuel, not weakness.",
    application: "If you slipped, don't drown in self-hate — that's the relapse's second weapon. Be firm but kind with yourself, then get back up. Shame feeds the dragon; resolve starves it.",
  },
  {
    ref: "Bhagavad Gita 2.50",
    verse: "yogaḥ karmasu kauśhalam",
    translation: "Yoga is skill in action.",
    meaning: "Mastery is doing the ordinary thing excellently and without attachment.",
    application: "Greatness isn't a grand gesture — it's doing today's small tasks with full presence. Make the protein, the set, the study a craft, not a chore.",
  },
  {
    ref: "Bhagavad Gita 6.19",
    verse: "yathā dīpo nivāta-stho neṅgate sopamā smṛitā",
    translation: "As a lamp in a windless place does not flicker — so is the disciplined mind.",
    meaning: "A steady mind is shielded from the winds of impulse and mood.",
    application: "Build the windless room: a morning routine, a plan for the day, removed triggers. A protected mind doesn't flicker when the craving wind blows.",
  },
  {
    ref: "Bhagavad Gita 4.38",
    verse: "na hi jñānena sadṛiśhaṁ pavitram iha vidyate",
    translation: "In this world there is nothing as purifying as knowledge.",
    meaning: "Understanding yourself and your patterns is the deepest cleansing.",
    application: "Every craving you log, every trigger you name, purifies you. Knowledge of your own patterns is the weapon. Study yourself like you study NCLEX.",
  },
  {
    ref: "Bhagavad Gita 9.22",
    verse: "yoga-kṣhemaṁ vahāmyaham",
    translation: "I carry what they lack and preserve what they have.",
    meaning: "Do your part fully; trust that what you need will be provided.",
    application: "Carry your effort; let the universe carry the rest. Do the work on BharatFare and the books — provision follows the disciplined, not the anxious.",
  },
  {
    ref: "Bhagavad Gita 2.38",
    verse: "sukha-duḥkhe same kṛitvā lābhālābhau jayājayau",
    translation: "Treating pleasure and pain, gain and loss, victory and defeat alike — then engage in battle.",
    meaning: "Equanimity, not outcome-obsession, is the warrior's stance.",
    application: "A good day and a bad day are both just data. Don't get high on the wins or crushed by the losses — stay level and keep fighting the next round.",
  },
  {
    ref: "Bhagavad Gita 6.40",
    verse: "na hi kalyāṇa-kṛit kaśhchid durgatiṁ tāta gachchhati",
    translation: "One who does good never comes to grief.",
    meaning: "No sincere step toward the good is ever truly lost, even after a setback.",
    application: "Even if you fall, the work you've done to become better is never erased. The good in you is permanent equity. A relapse is a dip, not a deletion.",
  },
  {
    ref: "Bhagavad Gita 3.8",
    verse: "niyataṁ kuru karma tvaṁ karma jyāyo hyakarmaṇaḥ",
    translation: "Perform your prescribed duty, for action is better than inaction.",
    meaning: "Doing something imperfectly beats the paralysis of doing nothing.",
    application: "On the heavy days, the rule is simple: do the minimum, but do it. One page, one set, one glass of water. Action breaks the fog.",
  },
  {
    ref: "Bhagavad Gita 18.66",
    verse: "sarva-dharmān parityajya mām ekaṁ śharaṇaṁ vraja",
    translation: "Abandon all varieties of duty and simply surrender; do not fear.",
    meaning: "When overwhelmed, drop the noise, surrender the outcome, and act from faith — not fear.",
    application: "When the to-do list crushes you, surrender the whole tangle for one moment. Breathe, trust, and do the next right thing. Fear is optional.",
  },
];

/** Deterministic daily verse so the same day always shows the same verse. */
export function verseForDay(dateKey: string): Verse {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  return VERSES[h % VERSES.length];
}
