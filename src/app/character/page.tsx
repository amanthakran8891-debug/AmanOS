import { getRpgData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { CharacterClient } from "@/components/character-client";

export const dynamic = "force-dynamic";

export default async function CharacterPage() {
  const data = await getRpgData();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Character" subtitle="Your future self — every attribute earned by real action." accent="#a78bfa" />
      <CharacterClient data={data} />
    </main>
  );
}
