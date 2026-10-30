---
id: SPEC-000010001-S6
type: spec-part
status: published
version: 1.0.0
depends_on: [SPEC-000010001]
last_reviewed: 2026-10-30
owner_role: spec-author
---

# Architecture options

Three alternatives. Criteria weights: interactivity 25 percent, offline behavior 15, collaborative updates 20, implementation cost 20, operational cost 20. No technology is imposed; each option names a shape, not a product.

## Option A · Single-page application over a REST API

Client renders all views from one load; a typed contract client exchanges JSON with the server; mutations are optimistic with a local queue.

| Criterion | Score | Note |
|---|---|---|
| Interactivity | 5 | optimistic updates, zero page transitions |
| Offline | 4 | queue plus cached reads |
| Collaborative updates | 3 | requires polling or push channel addition |
| Implementation cost | 4 | one contract surface |
| Operational cost | 3 | static delivery plus API |

Weighted: 3.95 of 5.

## Option B · Server-rendered application with progressive enhancement

Pages render on the server; interactivity hydrates per view; moves and comments post as form or fetch actions.

| Criterion | Score | Note |
|---|---|---|
| Interactivity | 3 | hydration boundaries add latency to first interaction |
| Offline | 2 | limited to service worker caching |
| Collaborative updates | 4 | server owns state, updates natural |
| Implementation cost | 3 | two render paths to test |
| Operational cost | 4 | one deployable |

Weighted: 3.25 of 5.

## Option C · Local-first client with a sync engine

Full replica in the client; a sync protocol merges changes; conflicts resolve by rule.

| Criterion | Score | Note |
|---|---|---|
| Interactivity | 5 | all operations local |
| Offline | 5 | first-class |
| Collaborative updates | 3 | conflict resolution complexity |
| Implementation cost | 2 | sync engine is the product's hardest artifact |
| Operational cost | 3 | sync infrastructure |

Weighted: 3.55 of 5.

## Recommendation

Option A for the first release: best interactivity to cost ratio; the offline queue satisfies NFR-006; a push channel upgrades collaborative updates later. Option C is the growth path if offline becomes primary.
