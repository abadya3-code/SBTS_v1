# SBTS Professional v1.8 — Full App Audit & Cleanup Report

## Executive summary
This v1.8 package focuses on connecting the application more professionally, removing dead/template UI elements, improving audit visibility, and identifying what is still missing before production use.

## What was fixed in v1.8
- Added a real **Audit & Compliance Center** page at `/audit`.
- Added `/audit` to the main navigation and removed the old inactive “Audit Logs / coming soon” sidebar item.
- Fixed the missing `sapClean` theme import by adding `client/src/themes/sapClean.ts`.
- Cleaned theme metadata so the frontend executable UI remains English-only.
- Removed orphan/template components that were not connected to the app:
  - `client/src/components/AIChatBox.tsx`
  - `client/src/components/ManusDialog.tsx`
  - `client/src/components/Map.tsx`
  - `client/src/pages/Home.tsx`
- Removed remaining “coming soon” and “to be implemented” user-facing messages from Project Detail.
- Updated Project Detail share action to copy the page link instead of showing an inactive message.
- Kept v1.7 fixes:
  - Inline logo/image upload for settings to avoid Forge storage errors.
  - Certificate page no longer blanks silently.
  - Bulk Add and Workflow Settings dialogs are wider and scroll-safe.
  - Workflow Phases & Ownership is compact and executive-style.
  - Audit section in Settings is redesigned.

## Static audit results
| Check | Result |
|---|---:|
| Client executable Arabic text | 0 |
| Missing local imports | 0 |
| Routed pages | 22 |
| Page files | 19 |
| Dead AIChatBox references | 0 |
| Coming soon messages | 0 |
| To-be-implemented messages | 0 |

## Route and page connection matrix
| Route | Component | Access |
|---|---|---|
| `/login` | `Login` | Public / special |
| `/register` | `Register` | Public / special |
| `/approve` | `Approve` | Public / special |
| `/certificate/:projectId/:tag` | `BlindCertificate` | Public / special |
| `/` | `Dashboard` | Protected |
| `/dashboard` | `Dashboard` | Protected |
| `/areas` | `Areas` | Protected |
| `/areas/:areaId/projects/:projectId/blinds/:tag` | `BlindDetail` | Protected |
| `/areas/:areaId/projects/:projectId` | `ProjectDetail` | Protected |
| `/areas/:areaId/projects` | `Projects` | Protected |
| `/projects/:projectId/blinds/:tag` | `BlindDetail` | Protected |
| `/projects/:projectId` | `ProjectDetail` | Protected |
| `/projects` | `Projects` | Protected |
| `/blinds` | `Blinds` | Protected |
| `/workflow-studio` | `WorkflowStudio` | Protected |
| `/access-control` | `AccessControl` | Protected |
| `/users` | `UserManagement` | Protected |
| `/settings` | `SystemSettings` | Protected |
| `/notifications` | `Notifications` | Protected |
| `/reports` | `Reports` | Protected |
| `/audit` | `AuditCenter` | Protected |
| `/profile` | `UserProfile` | Protected |

## Navigation audit
| Nav key | Label | Path | Status |
|---|---|---|---|
| `dashboard` | Dashboard | `/dashboard` | Routed |
| `areas` | Areas | `/areas` | Routed |
| `projects` | Projects | `/projects` | Routed |
| `blinds` | Blinds | `/blinds` | Routed |
| `workflow-studio` | Workflow Studio | `/workflow-studio` | Routed |
| `access-control` | Access Control | `/access-control` | Routed |
| `users` | User Management | `/users` | Routed |
| `settings` | System Settings | `/settings` | Routed |
| `notifications` | Notifications | `/notifications` | Routed |
| `reports` | Reports | `/reports` | Routed |
| `audit` | Audit Center | `/audit` | Routed |

## Large page files that still need refactoring
These files work, but they are too large for long-term maintenance and should be split into feature components.

| File | Lines |
|---|---:|
| `SystemSettings.tsx` | 2676 |
| `ProjectDetail.tsx` | 1766 |
| `Reports.tsx` | 1058 |
| `UserManagement.tsx` | 953 |
| `Blinds.tsx` | 919 |
| `UserProfile.tsx` | 726 |
| `WorkflowStudio.tsx` | 583 |
| `Register.tsx` | 560 |

## Items that are still missing before production
1. **Immutable audit event backend**  
   The new Audit Center is a professional operational page, but a true production audit system still needs a dedicated `audit_events` table with actor, action, entity type, entity ID, before/after JSON, IP address, user agent, hash, and previous hash.

2. **Soft delete / archive model**  
   Delete is intentionally disabled in the UI for traceability. Production should use archive/status fields instead of permanent delete.

3. **QR field-view workflow**  
   Certificates generate verification QR data, but a field-ready `/qr/blind/:token` mobile page is still required.

4. **Forge/template service cleanup**  
   Settings upload no longer depends on Forge, but several template services still exist in the backend:
   - `server/_core/llm.ts`
   - `server/_core/imageGeneration.ts`
   - `server/_core/map.ts`
   - `server/_core/voiceTranscription.ts`
   - `server/storage.ts`
   These are not a core SBTS requirement unless you decide to activate AI, map, voice, or external storage features.

5. **Mock/domain metadata cleanup**  
   `client/src/lib/mockData.ts` still contains navigation/domain metadata and sample workflow templates. For production, workflow templates should come from the database, not static frontend metadata.

6. **Build/test verification on local/Railway**  
   This audit was static. Final technical verification must run on your machine or Railway:
   ```bash
   pnpm install --frozen-lockfile
   pnpm check
   pnpm test
   pnpm build
   ```

## What was random or had no strong programming basis
- Orphan AI and Manus template components were present but not routed or imported.
- `Home.tsx` existed but the app routes `/` directly to Dashboard.
- Old secondary navigation showed an Audit item as an inactive “coming soon” button.
- `sapClean` was imported but the source file did not exist.
- Audit existed only as a settings subsection, not as an operational center.
- Some Forge-related backend helpers are template leftovers and not part of the current SBTS industrial workflow unless explicitly activated.

## Recommended v1.9 scope
- Add real `audit_events` backend table and router.
- Split `SystemSettings`, `ProjectDetail`, `Reports`, `Blinds`, and `WorkflowStudio` into smaller components.
- Create mobile QR field page.
- Replace remaining static workflow templates with database-driven workflow templates.
- Add Playwright E2E test: login → create project → add blind → print certificate → audit event.
