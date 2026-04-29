# Security Policy

## Reporting a Vulnerability

If you've discovered a security issue with Ghost Detail Autos, we want to hear from you. We take all security reports seriously.

### How to report

**Please do not open a public GitHub issue.** Instead, email us directly:

- **Email:** security@ghostdetail.autos
- **Alternative:** https://ghostdetail.autos/contact (mark as "Security")

Include:
- A clear description of the issue
- Steps to reproduce
- Affected URLs / endpoints / accounts (if relevant)
- Your name and contact info (so we can credit you, optional)

We'll acknowledge receipt within 48 hours and aim to issue a fix or status update within 7 days.

### Disclosure timeline

- **Day 0:** You report, we acknowledge within 48h.
- **Days 1–7:** We triage, reproduce, and start a fix.
- **Days 7–30:** Fix deployed to production.
- **Day 90:** Public disclosure (researcher and Ghost Detail jointly).

### Scope

Within scope:
- ghostdetail.autos and all subdomains
- Supabase backend (slzawehsiotvkjzaehqw.supabase.co)
- Edge functions, REST endpoints, webhook handlers
- Stripe checkout integration

Out of scope:
- Third-party services (Vercel, Stripe, Supabase platform vulnerabilities — report to those vendors)
- Social engineering of employees
- Physical attacks on Watford studio
- DDoS / volumetric attacks
- Self-XSS or vulnerabilities requiring victim cooperation

### What we ask

- **Don't** access customer data beyond what's necessary to demonstrate the issue.
- **Don't** disrupt service for real customers (no DoS testing on production).
- **Do** give us 90 days before public disclosure.
- **Do** test against your own test data wherever possible.

### Recognition

We don't currently run a paid bug bounty programme, but we will:
- Credit you in our public hall of fame (with your permission)
- Provide a written letter of recognition for your CV / portfolio
- Send you a Ghost Detail care package (UK only)

For critical findings (RCE, full database access, payment fraud), we may award a discretionary cash bounty.

### Hall of Fame

_No reports yet — be the first._

---

Last updated: 2026-04-29
