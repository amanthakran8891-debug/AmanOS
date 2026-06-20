// AmanOS — Career Command Center (manual v0, no database).
// Edit this file by hand. When ready, we promote to Prisma models
// (CareerProfile + JobApplication) without changing the lib/component output.

export type NmcStatus = "registered" | "conditions" | "suspended" | "lapsed" | "removed";
export type RevalidationStatus = "up-to-date" | "due-soon" | "overdue";
export type NhsInvestigationStatus = "none" | "ongoing" | "suspended" | "resolved";
export type ApplicationStage = "applied" | "interview" | "offer" | "rejected";

export interface CareerStatus {
  nmcStatus: NmcStatus;
  revalidationStatus: RevalidationStatus;
  revalidationDate?: string; // "YYYY-MM-DD" — revalidation due date
  nhsInvestigationStatus: NhsInvestigationStatus;
  suspensionReviewDate?: string; // "YYYY-MM-DD" — next review/hearing date
  notes?: string;
}

export interface JobApplication {
  organisation: string;
  role: string;
  dateSent: string; // "YYYY-MM-DD"
  stage: ApplicationStage;
  note?: string;
}

/** Current career status — edit to reflect reality. */
export const CAREER_STATUS: CareerStatus = {
  nmcStatus: "registered",
  revalidationStatus: "up-to-date",
  revalidationDate: undefined,
  nhsInvestigationStatus: "none",
  suspensionReviewDate: undefined,
  notes: "",
};

/** Job applications — add one row per application; update `stage` as it moves. */
export const JOB_APPLICATIONS: JobApplication[] = [
  // { organisation: "Example NHS Trust", role: "Staff Nurse (Band 5)", dateSent: "2026-06-10", stage: "applied", note: "" },
];
