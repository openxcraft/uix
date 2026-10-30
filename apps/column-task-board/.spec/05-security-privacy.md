---
id: SPEC-000010001-S5
type: spec-part
status: published
version: 1.0.0
depends_on: [SPEC-000010001]
last_reviewed: 2026-10-30
owner_role: spec-author
---

# Security and privacy

## Threat model

| Threat | Vector | Control |
|---|---|---|
| Spoofing | Stolen session | Short-lived tokens, revoke on logout, device binding optional |
| Tampering | Client-side rule edits | Rules and quotas enforced server-side only |
| Repudiation | Denied card changes | Append-only activity log with actor and timestamp |
| Information disclosure | Guest overreach | Guest scope limited to one board at the authorization layer |
| Denial of service | Rule flooding, request floods | Monthly rule quota, 600 requests per minute per member |
| Attachment abuse | Malicious uploads | Type and size validation, malware scan, storage isolation |

## Data minimization

Account data: address, display name, avatar reference. Card content is user-authored and retained until deletion plus 30 days. No tracking beyond product analytics of aggregate counts. No third-party trackers.

## Controls

1. Transport encryption everywhere; tokens never in URLs.
2. Authorization checks on every board-scoped request; board id and member role verified together.
3. Guests pass an explicit board allowlist check.
4. Quota enforcement is server-side; client quota display is advisory.
5. Export and deletion of all user data on request within 30 days.
6. Audit entries are immutable and retained without limit.
