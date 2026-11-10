# NexHRMS architecture audit and safe implementation plan

**Audit date:** 2026-11-09
**Scope:** Existing repository inspection only; no existing app module, route, database collection, or feature was removed or rewritten.

## Existing architecture

- **Frontend:** React 19 + Vite, React Router, Redux Toolkit, Firebase client authentication, Axios API client, Tailwind CSS. Pages are grouped by module under `client/src/pages`; feature state/API actions live under `client/src/features`; navigation is in `components/layout/Sidebar.jsx` and `MobileNav.jsx`; route guards are in `routes/ProtectedRoute.jsx`.
- **Backend:** Express API (`server/app.js`) with Firebase Admin ID-token authentication (`middleware/auth.middleware.js`), Mongoose models/controllers/routes, and MongoDB. API modules are mounted under `/api/v1`.
- **Authentication and roles:** Firebase verifies identity; MongoDB `User` stores employee profile and one of `admin`, `hr`, or `employee`. The `authorize(...roles)` middleware is available. Employees can be linked to an existing profile by verified email.
- **Existing database models:** User, Department, Attendance, Payroll, WorkSchedule, Company, Leave, Task, Complaint, Reimbursement, PerformanceReview, Candidate, Job, and Notification. MongoDB collections are not to be dropped as part of this project.
- **Existing modules/pages:** Dashboard, employee directory/forms, attendance and punch-exception review, leave, payroll/payslips, recruitment, tasks, performance, reimbursements, complaints, reports, profile, company, and work schedules. These are existing features to preserve; navigation visibility can be role/configuration controlled without deleting their routes or implementation.
- **Existing validation:** Server tests cover attendance policy helpers and Firebase service-account parsing. The seed script currently in this worktree is development-only and separate from application startup.

## Current gaps against the requested role model

This is an authorization audit, not an assumption that frontend hiding alone is sufficient:

- **HR is not read-only today.** Several backend routes authorize both `admin` and `hr` for writes, including employee update, attendance marking and exception review, payroll processing, company/settings changes, schedules, departments, leave decisions, recruitment, performance, reimbursements, and complaints. Client role checks also commonly group HR with Admin (`isAdminOrHR`).
- **Employee self-service has writes today.** Employee profile update, punch-in/out, leave application/cancel, task status/comment, performance self-review, reimbursement submission, complaint creation, notification reads, and some schedule lookups are currently supported. These should be considered individually against the intended future employee experience; do not remove them from source or data.
- **Some employee data boundaries need tightening.** `GET /employees/:id` checks employee ownership in the controller, while other sensitive endpoints need a systematic per-role/per-owner review. `GET /schedules/employee/:empId` currently has no ownership restriction visible at its route. Payroll self-reports currently return all statuses, rather than only finalized records.
- **Employee management routes:** HR can currently reach create/edit forms in the frontend; backend `/employees/:id` update is allowed for HR. These conflict with the new view-only HR policy.
- **Attendance exceptions:** HR is currently allowed to review/resolve exceptions; the new operational policy reserves modifications for Admin.

## Attendance/payroll data readiness

- Existing `Attendance` stores one employee/date record with punch times, minutes, a status enum, manual-entry marker, policy snapshot, and punch-review history. It has a unique employee/date index, useful for duplicate prevention. It does not yet retain original-import file references, source row/cell data, Excel duration/break values, configurable source attendance codes, or import batch/preview state.
- Existing `Payroll` stores monthly figures and has a unique employee/month/year index, but only draft/processed/paid status. It has no monthly review/finalization lock, immutable calculation snapshot/version, revision workflow, or general audit history.
- `payroll.controller.js` calculates with hard-coded allowances, statutory thresholds and deductions and marks a record processed during calculation. This is not the requested configurable, traceable Admin-led review/finalization workflow. Do not silently change existing historical records when replacing the calculation path.
- Current work schedules and company settings are reusable starting points, but holiday calendars, attendance-code catalogs, salary rule versions, monthly import batches, and audit/revision records are not implemented as dedicated models yet.
- No Excel parsing/upload-preview flow or Excel export is present in the inspected package routes/dependencies. Add this as an additive module and preserve existing punch-attendance paths unless an explicit migration is approved.

## Reference-file check

The attachment available to this session is `October_2026_Monthly_Performance_Report.pdf` (284 KB), not an `.xlsx`. I inspected its text layer: it has 15 pages, with repeated employee sections; page text includes report month `October-2026`, employee code/name, monthly summary values, and day columns 1–31 with IN, OUT, WORK, Break, OT, and Status rows. Attendance codes `P`, `A`, `WO`, and `P/2` appear in the extracted text. The file is text-based rather than an image-only scan, which makes PDF extraction feasible, but parser accuracy must still be verified against page positions and a preview before any data is written. Preserve the original PDF with its import batch. Do not interpret blank or `--:--` times as absence without status/rules, and do not substitute another holiday list for October 2026.

## Safe implementation sequence

1. **Preserve baseline:** Keep every existing model, API, page, and capability. Record current behavior and add regression coverage around sensitive access before tightening it. Use feature visibility/role configuration to hide existing modules without deleting them.
2. **Centralize permissions:** Introduce a single backend permission policy and align `authorize` checks, owner scoping, frontend route guards, and desktop/mobile navigation. Define Admin as the only operational writer for the new workflow; make HR read-only for employee, attendance, payroll, and finalized-report data. Keep the requested Employee personal-record boundary server-enforced. Decide explicitly which existing self-service features remain available.
3. **Additive monthly data layer:** Add import batch/reference, configurable attendance code/rule snapshots, monthly review/finalization state, calculation snapshot/version, and admin audit/revision records. Preserve legacy records and add indexes/migrations in a backward-compatible way.
4. **PDF/Excel import pipeline:** Implement a PDF parser for the supplied text-based monthly report and make the upload interface clearly identify accepted formats. If Excel is also retained as an input, parse it through a separate adapter into the same normalized preview format. Validate Employee Code matching, date/time/duration parsing, status mapping, error/warning separation, duplicate detection, summary-vs-daily discrepancy checks, original-file retention, preview/diff, and explicit Admin confirmation. Validate the PDF parser against all pages and never overwrite silently.
5. **Rule-driven calculations:** Separate attendance and salary calculations into tested pure services using versioned Admin-configured rules. Preserve the exact inputs/rules used for each month; retain applicable statutory/eligibility decisions and audit history rather than applying current rules retroactively.
6. **Admin review/finalization:** Add monthly employee review, corrections with audit entries, review markers, all-required-records validation, explicit finalization confirmation, ordinary-write lock, and Admin-only controlled revision.
7. **Read-only reporting:** Build reports and exports on finalized snapshots. HR sees all permitted finalized reports; each Employee sees only their own finalized records. Ensure unfinalized payroll is not represented as final.
8. **Incremental validation:** Add route-level authorization/ownership tests, calculation/import tests using the actual workbook, UI role tests, and regression checks. Run server tests, client lint/build, and `git diff --check` at each stage.

## Initial visibility direction from the request

- **Admin:** show the operational attendance, import, rules, review, finalization, payroll and reporting controls, plus existing Admin capabilities that remain in scope.
- **HR:** show employee directory and read-only attendance/finalized reports; hide all mutation and administrative controls.
- **Employee:** show own profile, attendance history and finalized personal reports. Keep or hide existing employee self-service modules only after their desired status is confirmed; do not delete them.

This document captures findings and a plan; it does not itself change permissions or production behavior.
