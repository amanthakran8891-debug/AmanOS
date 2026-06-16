import { getSpiritualData } from "@/lib/data";
import { CHALISA_LINES, HAS_CHALISA, CHALISA_TITLE } from "@/lib/chalisa";
import { ChalisaReader } from "@/components/spiritual/chalisa-reader";

export const dynamic = "force-dynamic";

export default async function ChalisaPage() {
  const sp = await getSpiritualData();
  const favourites = sp.favourites.filter((m) => m.kind === "chalisa").map((m) => m.ref);
  return (
    <ChalisaReader
      title={CHALISA_TITLE}
      lines={CHALISA_LINES}
      hasText={HAS_CHALISA}
      streak={sp.streak}
      favourites={favourites}
      readToday={sp.today.readChalisa}
    />
  );
}
