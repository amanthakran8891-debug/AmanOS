-- Nicotine Command Center: events + goal.
CREATE TABLE "NicotineEvent" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "nicotineMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trigger" TEXT,
    "location" TEXT,
    "emotion" TEXT,
    "outcome" TEXT,
    "shift" TEXT,
    "note" TEXT,
    CONSTRAINT "NicotineEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NicotineEvent_at_idx" ON "NicotineEvent"("at");
CREATE INDEX "NicotineEvent_type_idx" ON "NicotineEvent"("type");

CREATE TABLE "NicotineGoal" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "quitDate" TIMESTAMP(3),
    "dailyLimit" INTEGER NOT NULL DEFAULT 0,
    "reductionPlan" TEXT,
    "pricePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "mgPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "baselinePerDay" INTEGER NOT NULL DEFAULT 10,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NicotineGoal_pkey" PRIMARY KEY ("id")
);
