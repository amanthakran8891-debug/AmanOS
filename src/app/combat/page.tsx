import { getCombatData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { CombatClient } from "@/components/combat-client";

export const dynamic = "force-dynamic";

export default async function CombatPage() {
  const data = await getCombatData();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Dragon Arena" subtitle="Every real action damages the Dragon. Every relapse feeds it." accent="#fb7185" />
      <div className="mb-3">
        <a href="/character" className="inline-flex items-center gap-1 rounded-full border border-neon-violet/40 bg-neon-violet/10 px-3 py-1 text-xs font-semibold text-neon-violet">⚔ View your Character →</a>
      </div>
      <CombatClient data={data} />
    </main>
  );
}
