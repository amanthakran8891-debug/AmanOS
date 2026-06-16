import { getDashboardData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { EntriesClient } from "@/components/entries-client";

export const dynamic = "force-dynamic";

export default async function EntriesPage() {
  const data = await getDashboardData();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <PageHeader title="Entries" subtitle="Log the details — add, edit, delete anything." accent="#a78bfa" />
      <EntriesClient data={data} />
    </main>
  );
}
