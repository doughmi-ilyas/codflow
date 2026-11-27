import type { SVGProps } from "react";

const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
type P = SVGProps<SVGSVGElement>;

export const IconDashboard = (p: P) => <svg {...base} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>;
export const IconOrders = (p: P) => <svg {...base} {...p}><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>;
export const IconLogout = (p: P) => <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>;
export const IconSearch = (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
export const IconPlus = (p: P) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const IconClose = (p: P) => <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
export const IconCash = (p: P) => <svg {...base} {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></svg>;
export const IconTruck = (p: P) => <svg {...base} {...p}><path d="M1 3h13v13H1z" /><path d="M14 8h4l3 3v5h-7" /><circle cx="5.5" cy="18.5" r="2" /><circle cx="17.5" cy="18.5" r="2" /></svg>;
export const IconCheck = (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>;
export const IconScale = (p: P) => <svg {...base} {...p}><path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0L5 7ZM19 7l-3 7a4 4 0 0 0 6 0l-3-7Z" /></svg>;
export const IconBack = (p: P) => <svg {...base} {...p} className={`rtl:rotate-180 ${p.className ?? ""}`}><path d="m15 18-6-6 6-6" /></svg>;
export const IconChevron = (p: P) => <svg {...base} {...p} className={`rtl:rotate-180 ${p.className ?? ""}`}><path d="m9 18 6-6-6-6" /></svg>;
export const IconBox = (p: P) => <svg {...base} strokeWidth={1.4} width={40} height={40} {...p}><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /></svg>;
