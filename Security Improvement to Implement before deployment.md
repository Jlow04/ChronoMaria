# Security Improvement to Implement before deployment

This checklist is for ChronoMaria production readiness. Complete these items before deploying to live servers.

## 1) Authentication and Session Security
- Replace localStorage-based auth persistence with HttpOnly, Secure, SameSite cookies.
- Add session timeout and token expiration policies.
- Implement refresh token rotation and revoke-on-logout.
- Enforce strong password policy for admin/super-admin accounts.
- Add account lockout or progressive delay after repeated failed login attempts.

## 2) Data Leak Prevention
- Never log raw credentials, tokens, cookies, or full request bodies.
- Add centralized log redaction for keys such as: password, token, authorization, cookie, email.
- Return generic error messages to clients; keep technical details in server logs only.
- Disable debug logging in production.
- Review frontend console usage and remove sensitive diagnostic logs.

## 3) API and Backend Hardening
- Add security headers with helmet.
- Configure strict CORS (allow only trusted frontend origin(s), no wildcard in production).
- Add rate limiting to login and sensitive endpoints.
- Validate and sanitize all request inputs (body, params, query) with schema validation.
- Enforce payload size limits for JSON and URL-encoded inputs.

## 4) Authorization and Access Control
- Enforce role checks on all sensitive routes (do not rely only on frontend visibility).
- Protect settings and user-management endpoints with server-side authorization middleware.
- Audit all routes for least-privilege access.
- Deny by default and explicitly allow required roles.

## 5) Secrets and Environment Management
- Store secrets in environment variables only; never commit to source control.
- Use separate secrets for dev/staging/prod.
- Rotate keys and credentials on a regular schedule.
- Remove or rotate any secrets previously exposed in logs or history.

## 6) Database and Storage Security
- Use least-privilege database users/roles.
- Enforce row-level security (RLS) where applicable.
- Verify backup encryption and restoration procedures.
- Ensure only backend has access to privileged DB/service-role credentials.

## 7) Transport and Infrastructure Security
- Enforce HTTPS for all traffic.
- Redirect HTTP to HTTPS.
- Use secure TLS settings and valid certificates.
- Restrict server/network access via firewall rules and private networking where possible.

## 8) Dependency and Supply Chain Security
- Run npm audit and patch known vulnerabilities.
- Pin or lock critical dependency versions.
- Remove unused dependencies.
- Use secret scanning and dependency scanning in CI.

## 9) Monitoring, Alerting, and Incident Readiness
- Add monitoring for auth failures, unusual API usage, and privilege changes.
- Configure alerts for suspicious activity and repeated failed logins.
- Keep audit logs immutable and retained according to policy.
- Prepare an incident response playbook (containment, recovery, communication).

## 10) Production Go-Live Verification
- Run a final security smoke test in staging with production-like settings.
- Confirm no sensitive information appears in frontend or backend logs.
- Validate access control for all admin/super-admin actions.
- Confirm CORS, headers, and rate limiting behavior from real client origins.
- Document rollback steps and recovery contacts.

## Recommended Immediate Actions for ChronoMaria
1. Implement HttpOnly cookie-based auth flow.
2. Add helmet plus strict production CORS.
3. Add rate limiting to /api/users/login and user-management endpoints.
4. Add centralized request validation (Joi/Zod/express-validator).
5. Add log redaction middleware and production log level controls.
