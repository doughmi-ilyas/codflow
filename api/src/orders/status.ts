import { Permission } from "../tenants";

export const STATUSES = ["new", "confirmed", "shipped", "delivered", "refused", "returned"] as const;
export type Status = (typeof STATUSES)[number];

/** Allowed moves. delivered and returned are final. */
export const TRANSITIONS: Record<Status, Status[]> = {
  new: ["confirmed", "refused"],
  confirmed: ["shipped", "refused"],
  shipped: ["delivered", "refused"],
  refused: ["returned"],
  delivered: [],
  returned: [],
};

export function canMove(from: Status, to: Status): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Who may make a move: front office confirms, dispatch ships, couriers close the delivery. */
export function permissionFor(from: Status, to: Status): Permission {
  if (to === "confirmed") return "orders:confirm";
  if (to === "shipped") return "orders:ship";
  if (to === "refused" && (from === "new" || from === "confirmed")) return "orders:confirm";
  return "orders:deliver";
}
