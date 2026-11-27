export const STATUSES = ["new", "confirmed", "shipped", "delivered", "refused", "returned"] as const;
export type Status = (typeof STATUSES)[number];

/** Mirrors the API rules, only to decide which buttons to show. The API stays the source of truth. */
/** A status an order can be moved to (nothing moves back to "new"). */
export type Target = Exclude<Status, "new">;

export const NEXT: Record<Status, Target[]> = {
  new: ["confirmed", "refused"],
  confirmed: ["shipped", "refused"],
  shipped: ["delivered", "refused"],
  refused: ["returned"],
  delivered: [],
  returned: [],
};

export const DOT: Record<Status, string> = {
  new: "bg-slate-400",
  confirmed: "bg-blue-500",
  shipped: "bg-amber-500",
  delivered: "bg-emerald-500",
  refused: "bg-rose-500",
  returned: "bg-purple-500",
};

export const BADGE: Record<Status, string> = {
  new: "bg-slate-100 text-slate-700",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-amber-100 text-amber-800",
  delivered: "bg-emerald-100 text-emerald-800",
  refused: "bg-rose-100 text-rose-800",
  returned: "bg-purple-100 text-purple-800",
};
