"use client";

import type { IntelligenceData } from "@/lib/data";
import { DailyCoach } from "./daily-coach";
import { MissionBoardCard } from "./mission-board";
import { RiskForecast } from "./risk-forecast";
import { DragonAttackMode } from "./dragon-attack";
import { RecoveryXpCard } from "./recovery-xp";
import { ForecastAccuracyCard } from "./forecast-accuracy";
import { TimelineHealthCard } from "./timeline-health";
import { DragonIntelPanel } from "./dragon-intel";
import { RecoveryRecords } from "./recovery-records";
import { IntelligenceReportCard } from "./intelligence-report";
import { CostDashboardCard } from "./cost-dashboard";
import { RecoveryTimelineCard } from "./recovery-timeline";
import { FutureMessages } from "./future-messages";
import { DataCleanup } from "./data-cleanup";

export function IntelligenceClient({ data }: { data: IntelligenceData }) {
  return (
    <div className="space-y-4">
      {/* Act now */}
      <DailyCoach briefing={data.coach} />
      <MissionBoardCard board={data.missionBoard} />
      <DragonAttackMode />

      {/* Why — risk */}
      <RiskForecast forecast={data.forecast} />

      {/* Progression */}
      <RecoveryXpCard xp={data.recoveryXp} lastJointAt={data.lastJointAt} detailed />

      {/* Trust + accuracy */}
      <ForecastAccuracyCard accuracy={data.forecastAccuracy} />
      <TimelineHealthCard health={data.timelineHealth} />

      {/* Strategy + records */}
      <DragonIntelPanel intel={data.dragonIntel} />
      <RecoveryRecords records={data.records} lastJointAt={data.lastJointAt} />

      {/* Patterns + cost */}
      <IntelligenceReportCard report={data.report} />
      <CostDashboardCard cost={data.cost} />

      {/* History */}
      <RecoveryTimelineCard timeline={data.timeline} />

      {/* Motivation */}
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
