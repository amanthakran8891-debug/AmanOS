import { notFound } from "next/navigation";
import { getChapter, chapterVerses } from "@/lib/gita-library";
import { getSpiritualData } from "@/lib/data";
import { GitaReader } from "@/components/spiritual/gita-reader";

export const dynamic = "force-dynamic";

export default async function GitaChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  const n = parseInt(chapter, 10);
  const ch = getChapter(n);
  if (!ch) notFound();

  const verses = chapterVerses(n);
  const sp = await getSpiritualData();
  const bookmarks = sp.bookmarks.filter((m) => m.kind === "gita" && m.ref.startsWith(`${n}.`)).map((m) => m.ref);
  const favourites = sp.favourites.filter((m) => m.kind === "gita" && m.ref.startsWith(`${n}.`)).map((m) => m.ref);
  const notes: Record<string, string> = {};
  for (const note of sp.notes) if (note.kind === "gita" && note.ref.startsWith(`${n}.`)) notes[note.ref] = note.text;

  return (
    <GitaReader
      chapter={ch}
      verses={verses}
      bookmarks={bookmarks}
      favourites={favourites}
      notes={notes}
      current={{ chapter: sp.gita.chapter, verse: sp.gita.verse }}
    />
  );
}
