# SBTS Professional v2.3 — Management Reporting, SLA, and Resource Planning

## الهدف
تحويل ملاحظات الإدارة والمشرفين إلى صفحة تنفيذية مرتبطة بالـ DB: SLA, overdue blinds, resource gaps, daily progress report, and project health.

## الجديد
- صفحة `/management` باسم Management & Planning Center.
- جداول: `management_daily_reports`, `resource_plan_entries`, `sla_rule_settings`.
- API: `trpc.management.summary`, `dailyReports`, `createDailyReport`, `resourcePlan`, `createResourcePlan`, `slaRules`, `upsertSlaRule`.
- ربط Audit لكل عمليات الإدارة.
- صلاحيات: `management.view`, `management.manage`.

## ملاحظات النشر
هذه النسخة تستخدم migration ثابت `0016_management_reporting_sla_resource_plan.sql` مع `drizzle-kit migrate`.


## نتيجة الفحص الثابت
| الفحص | النتيجة |
|---|---:|
| Missing local imports | 0 |
| Arabic executable text | 0 |
| Routes | 27 |
| New route | `/management` |
| New migration | `0016` |

## المتبقي بعد v2.3
- Email notification foundation.
- Gantt / timeline visual view.
- Planner calendar capacity view.
- PDF management pack export.
- Power BI ready aggregated endpoint.
