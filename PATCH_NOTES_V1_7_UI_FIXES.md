SBTS Professional v1.7 – UI / UX / Certificate / Branding Fixes

Implemented fixes:
1. App image, company logo, and certificate logo uploads no longer depend on Forge storage env vars.
   - Images are now saved inline as data URLs in settings.
2. Blind certificate page rebuilt to avoid blank-screen behavior and to print reliably.
3. Project Detail:
   - Bulk add from Excel dialog widened and reorganized.
   - Workflow settings dialog widened, scroll-safe, and redesigned as cards.
   - Workflow Phases & Ownership redesigned into a compact executive layout.
4. System Settings:
   - Audit Trail redesigned into a more professional “Audit & Compliance Center” section.

Files changed:
- server/routers/settings.ts
- client/src/pages/BlindCertificate.tsx
- client/src/pages/ProjectDetail.tsx
- client/src/components/dashboard/WorkflowPhases.tsx
- client/src/pages/SystemSettings.tsx
