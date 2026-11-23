// The types of calendar entry, and their badge colours. Shared by several pages.
export const KINDS = ["Event", "Deadline", "Exam", "Hackathon"];

export function kindBadge(kind) {
  switch (kind) {
    case "Deadline":
      return "badge-red";
    case "Exam":
      return "badge-amber";
    case "Hackathon":
      return "badge-blue";
    default:
      return "badge-accent";
  }
}