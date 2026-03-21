# ChronoMaria Improvements (Simple English)

This document explains what was improved in the system, using simple language.

## Quick Summary (For Non-Technical Users)

- The schedule system is now cleaner and more reliable.
- Room rules are stricter, so schedules are more realistic.
- The app now checks bad inputs earlier and avoids many common errors.
- Schedule results now include a clearer quality report.
- Testing is much stronger, with many scenarios to catch issues before release.

## 1) Schedule API is now stateless

Before:
- The app still had old endpoints for stored schedule count and master schedule.

Now:
- The app uses only two schedule endpoints:
  - `POST /api/schedule/generate`
  - `POST /api/schedule/validate`
- Removed old contract endpoints:
  - `/api/schedule/count`
  - `/api/schedule/master`

Why this is better:
- Cleaner API design
- Fewer moving parts
- Easier to maintain and test

## 2) Stronger input validation for schedule generation

Before:
- Invalid or empty payloads could pass too far into the flow.

Now:
- Backend checks that `faculty`, `subjects`, and `rooms` are arrays.
- Backend rejects empty arrays.
- Backend clamps constraint values to safe limits.

Why this is better:
- Fewer runtime failures
- More predictable behavior
- Safer requests from UI and scripts

## 3) Better schedule response (includes report)

Before:
- Generate response did not consistently return analysis report data.

Now:
- Generate response includes:
  - schedule
  - fitness
  - generations
  - report
  - effective constraints

Why this is better:
- Frontend can show better schedule quality details
- Easier debugging and monitoring

## 4) Real schedule conflict validation

Before:
- Validate endpoint was mostly a placeholder.

Now:
- Validation checks:
  - faculty conflict (same faculty, same time)
  - room conflict (same room, same time)
  - invalid entries (missing day/time)
- Returns conflict count and detailed conflict list.

Why this is better:
- Immediate feedback on bad schedules
- Better trust in validation results

## 5) Room model upgrade (new room fields)

Added or standardized room fields:
- Room Code
- Description
- Capacity
- Department
- Room Type
- Subject Type
- Status (Available/Unavailable)
- Common Room (usable by any department)

Why this is better:
- Rooms now represent real constraints
- Scheduling decisions are more accurate

## 6) Room code rename with compatibility

Before:
- Codebase used `room_number`.

Now:
- Codebase uses `room_code` as primary.
- Compatibility fallback still supports legacy `room_number`.

Why this is better:
- Better naming consistency
- Safer transition without breaking old data immediately

## 7) Algorithm now respects room rules

Before:
- Algorithm could choose rooms without full room-rule checks.

Now:
- Algorithm prefers eligible rooms only:
  - room must be available
  - room department must match subject department (unless common room)
  - room type/subject type should match
- Added penalties and report fields for room-rule violations.

Why this is better:
- Higher quality schedules
- Fewer invalid room assignments
- Better transparency in report output

## 8) Expanded automated scenario testing

Before:
- Testing coverage was limited.

Now:
- Added a PowerShell scenario suite with 15 scenarios.
- Covers:
  - source data checks
  - generate success
  - constraint clamping
  - invalid payload handling
  - schedule validation conflicts
  - stateless endpoint contract
  - room eligibility rules
  - common-room behavior
  - legacy room fallback
  - default constraints
  - edge/error cases

Why this is better:
- Easier regression testing
- Faster verification after code changes
- More confidence before deployment

Run the test scenarios:

```powershell
cd c:\Users\hp\Desktop\ChronoMaria\backend
powershell -ExecutionPolicy Bypass -File .\test-scenarios.ps1
```

## 9) Overall result

The system is now:
- More stable
- Easier to debug
- Better aligned with real scheduling rules
- Better tested for both normal and edge cases
