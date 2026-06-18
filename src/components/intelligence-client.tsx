"use client";

import type { IntelligenceData } from "@/lib/data";
import { DailyCoach } from "./daily-coach";
import { RiskForecast } from "./risk-forecast";
import { DragonAttackMode } from "./dragon-attack";
import { RecoveryXpCard } from "./recovery-xp";
import { DragonIntelPanel } from "./dragon-intel";
import { IntelligenceReportCard } from "./intelligence-report";
import { CostDashboardCard } from "./cost-dashboard";
import { RecoveryTimelineCard } from "./recovery-timeline";
import { FutureMessages } from "./future-messages";
import { DataCleanup } from "./data-cleanup";

export function IntelligenceClient({ data }: { data: IntelligenceData }) {
  return (
    <div className="space-y-4">
      <DailyCoach briefing={data.coach} />

      <DragonAttackMode />

      <div className="grid gap-4 lg:grid-cols-2">
        <RiskForecast forecast={data.forecast} />
        <RecoveryXpCard xp={data.recoveryXp} lastJointAt={data.lastJointAt} />
      </div>

      <DragonIntelPanel intel={data.dragonIntel} />

      <IntelligenceReportCard report={data.report} />

      <CostDashboardCard cost={data.cost} />

      <RecoveryTimelineCard timeline={data.timeline} />

      <FutureMessages messages={data.futureMessages} next={data.nextFutureMessage} />

      {data.dragonAttackStats.total > 0 && (
        <div className="card flex items-center justify-between">
          <div>
            <p className="label text-neon-red">Dragon Attack Interventions</p>
            <p className="mt-1 text-sm text-slate-300">{data.dragonAttackStats.survived}/{data.dragonAttackStats.total} survived</p>
          </div>
          <p className="text-3xl font-black text-neon-green">{data.dragonAttackStats.survivalRate}%</p>
        </div>
      )}

      <DataCleanup />
    </div>
  );
}
