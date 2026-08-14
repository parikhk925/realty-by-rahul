export type LeadStatus =
  | "new"
  | "contacted"
  | "viewing"
  | "negotiating"
  | "won"
  | "lost";

/** Ordered as the buyer moves through the pipeline. */
export const leadStatuses: LeadStatus[] = [
  "new",
  "contacted",
  "viewing",
  "negotiating",
  "won",
  "lost",
];

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  viewing: "Viewing",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
};
