# SBTS Professional v2.4 — Blind Detail Hub Full Integration

## Objective
v2.4 introduces the unified **Blind Detail Hub** experience:
Add Blind → Overview → Workflow → Compliance → Field Actions → QR & Mobile → Certificate & History.

## New routes
- `/projects/:projectId/blinds/:tag/hub`
- `/areas/:areaId/projects/:projectId/blinds/:tag/hub`
- `/settings/blind-hub`

## New frontend files
- `client/src/pages/BlindDetailHub.tsx`
- `client/src/pages/BlindHubSettings.tsx`

## New backend files
- `server/db/blindHub.ts`
- `server/routers/blindHub.ts`

## New migration
- `drizzle/0017_blind_detail_hub_full_integration.sql`

## New tables
- `blind_hub_settings`
- `blind_certificates`
- `blind_certificate_events`
- `blind_field_notes`
- `blind_required_actions`

## New tRPC API
- `blindHub.detail`
- `blindHub.settings`
- `blindHub.updateSettings`
- `blindHub.addFieldNote`
- `blindHub.generateCertificate`

## What the hub does
1. **Overview tab**
   - Shows industrial metadata, specification table, location context, progress, and quick actions.

2. **Workflow tab**
   - Shows 5-phase pipeline, current phase, required actions, electronic approval states, and phase transition log.

3. **Compliance tab**
   - Shows checklist, torque records, inspection records, and photo/document evidence.

4. **Field Actions tab**
   - Shows PTW, LOTO, Risk Assessment, and field notes with audit logging.

5. **QR & Mobile tab**
   - Shows QR identity, token link, public verification preview, evidence count, and mobile execution status.

6. **Certificate & History tab**
   - Shows readiness engine, blockers, certificate preview, print/download actions, hash and audit trail.

## Feature control
Blind Hub Settings can enable/disable:
- Tabs
- PTW / LOTO / Risk / Gas Test
- Torque / NDE / MTR / Leak Test
- Evidence / QR Public View / Offline Mobile / Shift Handover
- Certificate hash and email share
- Certificate readiness rules

## Certificate readiness rules
The certificate engine checks:
- Workflow phase completed
- Required approvals
- Checklist
- Torque
- Inspection
- Leak test
- Evidence count
- PTW/LOTO
- Risk assessment

## Railway note
This package keeps fixed migration files and uses `drizzle-kit migrate`; do not generate migrations inside Railway pre-deploy.
