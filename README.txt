CS305 Advanced Java - Job Portal
UNYT Spring 2026

HOW TO RUN
----------
1. Make sure MySQL is running
2. Check credentials in application.properties (default root/root)
3. Run: mvn spring-boot:run
4. Open frontend/login.html in your browser
5. After first run, change ddl-auto from "create" to "update" so data is not wiped on restart

DEMO ACCOUNTS
-------------
Recruiter : recruiter@test.com / pass123
Candidate : candidate@test.com / pass123
Audit     : audit@test.com     / pass123

HOW AUTH WORKS
--------------
- Login sends email+password to POST /api/auth/login
- Backend validates with Spring Security and returns user info
- Frontend stores Base64(email:password) in localStorage
- Every request sends Authorization: Basic <credentials> header
- Spring Security checks the credentials and role on every request
- If you try to access /api/recruiter/** without RECRUITER role, you get 403

API ENDPOINTS
-------------

AUTH (public)
  POST /api/auth/login
  POST /api/auth/register/candidate
  POST /api/auth/register/recruiter

CANDIDATE (requires CANDIDATE role)
  GET  /api/candidate/jobs
  GET  /api/candidate/jobs/filter?category=ENGINEERING
  POST /api/candidate/apply
  GET  /api/candidate/applications
  GET  /api/candidate/me

RECRUITER (requires RECRUITER role, all scoped to logged in user)
  POST   /api/recruiter/jobs
  GET    /api/recruiter/jobs
  PUT    /api/recruiter/jobs/{id}
  DELETE /api/recruiter/jobs/{id}
  GET    /api/recruiter/jobs/{jobId}/applicants
  PATCH  /api/recruiter/applications/{id}/status?status=ACCEPTED
  GET    /api/recruiter/me

AUDIT (requires AUDIT role)
  GET    /api/audit/candidates
  GET    /api/audit/recruiters
  GET    /api/audit/jobs
  GET    /api/audit/candidates/{id}/history
  POST   /api/audit/users
  PUT    /api/audit/users/{id}
  DELETE /api/audit/users/{id}
  GET    /api/audit/users/{id}
  GET    /api/audit/stats
  GET    /api/audit/jobs/by-category

