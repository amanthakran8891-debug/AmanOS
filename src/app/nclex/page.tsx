import { getNclexData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { NclexClient } from "@/components/nclex-client";
import { getNclexCommand } from "@/lib/nclex-command";
import { NclexCommand } from "@/components/nclex-command";

export const dynamic = "force-dynamic";

export default async function NclexPage() {
  const [data, command] = await Promise.all([getNclexData(), getNclexCommand()]);
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="NCLEX Command Center" subtitle="Questions, accuracy, weak topics, and the countdown to exam day." accent="#22d3ee" />
      <NclexClient data={data} />
      <div className="mt-4">
        <NclexCommand data={command} />
      </div>
    </main>
  );
}
