-- CreateTable: Craving (Craving Analytics Engine). Run `npm run db:deploy`.
CREATE TABLE "Craving" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intensity" INTEGER NOT NULL DEFAULT 5,
    "trigger" TEXT,
    "location" TEXT,
    "emotion" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'won',
    "note" TEXT,
    CONSTRAINT "Craving_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Craving_at_idx" ON "Craving"("at");
CREATE INDEX "Craving_outcome_idx" ON "Craving"("outcome");
