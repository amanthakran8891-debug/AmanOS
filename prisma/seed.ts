import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Ensure the singleton Settings row exists with sensible defaults.
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      proteinTarget: 140,
      waterTarget: 3000,
      sleepTarget: 8,
      caloriesTarget: 2200,
      stepsTarget: 8000,
      nclexHoursTarget: 4,
      dailyBudget: 1000,
      // Start the clean streak / hourglass from now (change in Settings UI later).
      lastJointAt: new Date(),
      longestStreakDays: 0,
    },
  });
  console.log("✓ AmanOS settings seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
