-- CreateTable
CREATE TABLE "DragonState" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lifetimeDamage" INTEGER NOT NULL DEFAULT 0,
    "dragonsDefeated" INTEGER NOT NULL DEFAULT 0,
    "stageIndex" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DragonState_pkey" PRIMARY KEY ("id")
);
