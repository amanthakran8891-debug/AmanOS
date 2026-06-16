-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "proteinTarget" INTEGER NOT NULL DEFAULT 140,
    "waterTarget" INTEGER NOT NULL DEFAULT 3000,
    "sleepTarget" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "caloriesTarget" INTEGER NOT NULL DEFAULT 2200,
    "stepsTarget" INTEGER NOT NULL DEFAULT 8000,
    "nclexHoursTarget" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "dailyBudget" INTEGER NOT NULL DEFAULT 1000,
    "gymDaysTarget" INTEGER NOT NULL DEFAULT 4,
    "noJointGoalDays" INTEGER NOT NULL DEFAULT 90,
    "weightGoal" DOUBLE PRECISION,
    "lastJointAt" TIMESTAMP(3),
    "longestStreakDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "lesson" TEXT,
    "focus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayLog" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "jointClean" BOOLEAN NOT NULL DEFAULT true,
    "weightKg" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "waterMl" INTEGER NOT NULL DEFAULT 0,
    "proteinG" INTEGER NOT NULL DEFAULT 0,
    "caloriesKcal" INTEGER NOT NULL DEFAULT 0,
    "sleepHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "nclexHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nclexQuestions" INTEGER NOT NULL DEFAULT 0,
    "bharatfareDone" BOOLEAN NOT NULL DEFAULT false,
    "gymDone" BOOLEAN NOT NULL DEFAULT false,
    "spiritualDone" BOOLEAN NOT NULL DEFAULT false,
    "lifeScore" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "proteinG" INTEGER NOT NULL DEFAULT 0,
    "calories" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymSet" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "bodyPart" TEXT NOT NULL,
    "exercise" TEXT NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "weightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JointEvent" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "craving" TEXT,
    "trigger" TEXT,
    "intensity" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "JointEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_period_periodKey_key" ON "Review"("period", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "DayLog_date_key" ON "DayLog"("date");

-- CreateIndex
CREATE INDEX "DayLog_date_idx" ON "DayLog"("date");

-- CreateIndex
CREATE INDEX "FoodEntry_date_idx" ON "FoodEntry"("date");

-- CreateIndex
CREATE INDEX "GymSet_date_idx" ON "GymSet"("date");

-- CreateIndex
CREATE INDEX "GymSet_bodyPart_idx" ON "GymSet"("bodyPart");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "JointEvent_at_idx" ON "JointEvent"("at");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");
