# CODFlow

Multi-tenant cash-on-delivery (COD) order management: a NestJS API on PostgreSQL with row-level security, and a Next.js web app in French, English and Arabic (RTL).

Status: work in progress (private). This README is completed as the features land.

## Why

Cash on delivery is how a large share of online orders are paid in Morocco. Shops and delivery companies need one platform where several businesses share the same database without ever seeing each other's data, and where each role (owner, manager, agent, courier) sees only what it should. CODFlow is a small, tested version of that: it was designed from what Moroccan full-stack job listings ask for (Next.js App Router, TypeScript, Node.js, PostgreSQL, JWT, role-based access, multi-tenant, Docker, CI).
