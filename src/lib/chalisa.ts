// Hanuman Chalisa — loads the verified data file. Text is never hand-written here.
import chalisaData from "@/data/spiritual/hanuman-chalisa.json";

export interface ChalisaLine { index: number; type: string; devanagari: string; transliteration: string; meaning: string }

export const CHALISA_TITLE = (chalisaData as { title?: string }).title ?? "Hanuman Chalisa";
export const CHALISA_LINES = ((chalisaData as { lines?: ChalisaLine[] }).lines ?? []);
export const HAS_CHALISA = CHALISA_LINES.length > 0;
export const CHALISA_SOURCE = (chalisaData as { _source?: string })._source ?? "";
