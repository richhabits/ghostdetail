# Ghost Detail Autos — Cron Job Registry

All cron jobs run via `pg_cron` directly in Supabase Postgres. No Vercel Cron, no external schedulers.

**Last audited:** 2026-04-29 — 38 jobs, all active and verified.

To list all jobs live: `SELECT * FROM cron.job;`
To see run history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;`

## Job Inventory by Frequency

### High-frequency (every 30 min during business hours)

| Job | Schedule | Purpose |
|---|---|---|
| `ghost-calendar-sync` | `*/30 8-18 * * 1-6` | Sync pending bookings to Google Calendar |
| `ghost-job-tracker` | `*/30 8-18 * * 1-6` | Alert if any job has been "in_progress" for >8 hours |

### Hourly

| Job | Schedule | Purpose |
|---|---|---|
| `ghost-upsell-engine` | `0 * * * *` | Auto-create upsell prompts for confirmed bookings |
| `ghost-expire-sessions` | `15 * * * *` | Expire old user sessions |
| `ghost-review-fire` | `0 */2 * * *` | Process queued review-request WhatsApps |
| `ghost-pipeline-scorer` | `0 */4 * * *` | Recompute lead scores in kanban |

### Daily — early morning (cleanup + intelligence)

| Job | Schedule | Purpose |
|---|---|---|
| `ghost-daily-learn` | `0 2 * * *` | Pattern recognition and learning runs |
| `ghost-memory-consolidate` | `0 3 * * *` | Consolidate vehicle/service preferences from booking history |
| `ghost-rate-limit-cleanup` | `30 3 * * *` | Delete rate_limit_log entries older than 24h |
| `ghost-security-events-prune` | `45 3 * * *` | Prune old security_events |
| `ghost-cleanup-expired-sessions` | `0 4 * * *` | Clean expired sessions (different table) |
| `ghost-service-engine-bulk` | `0 4 * * *` | Bulk-recompute vehicle_service_map recommendations |

### Daily — business hours

| Job | Schedule | Purpose |
|---|---|---|
| `ghost-morning-brief` | `0 6 * * 1-6` | Send Romeo's daily morning briefing (Mon-Sat) |
| `ghost-warmup` | `0 7,12,17 * * 1-6` | Keep AI router warm 3x daily during business hours |
| `ghost-ceramic-anniversaries` | `0 8 * * *` | Alert when ceramic-coated cars are ~1 year old (recoat due) |
| `ghost-lead-chase` | `0 9 * * *` | Alert JADE to chase leads not contacted in 24h |
| `ghost-loyalty-process` | `0 9 * * *` | Process loyalty/rebooking alerts |
| `ghost-mot-reminders` | `0 9 * * *` | Insert MOT reminder rows for vehicles 30 days from MOT |
| `ghost-followup-queue` (10am) | `0 10,18 * * *` | Process queued WhatsApp followups (twice daily) |
| `ghost-mot-send-reminders` | `0 10 * * *` | Send the actual MOT reminder WhatsApps |
| `ghost-review-requests` | `0 10 * * *` | Queue review-request follow-ups for completed bookings |
| `ghost-abandoned-recovery` | `0 14,18 * * *` | Re-engage abandoned bookings (2pm + 6pm) |
| `ghost-deposit-chase` | `0 18 * * *` | Alert about unpaid deposits |
| `ghost-followup-queue` (6pm) | `0 10,18 * * *` | (same job, runs at 6pm too) |
| `ghost-referral-tracker` | `0 18 * * *` | Track referral code usage from past 24h bookings |

### Weekly

| Job | Schedule | Purpose |
|---|---|---|
| `ghost-rebooking-predict` | `0 3 * * 1` | Mondays 3am: predict who's due to rebook |
| `ghost-weekly-cleanup` | `0 8 * * 1` | Mondays 8am: ghost-cleanup-agent runs full system tidy |
| `ghost-stock-check` (Mon) | `0 8 * * 1,3,5` | Mon/Wed/Fri 8am: low stock alerts |
| `ghost-rebooking-alerts` | `0 10 * * 2,4` | Tue/Thu 10am: send rebooking-due alerts |

### Weekly — Sundays (data resets + reporting)

| Job | Schedule | Purpose |
|---|---|---|
| `ghost-availability-refresh` | `0 0 * * 0` | Sunday midnight: extend availability slots forward |
| `ghost-availability-seed` | `0 0 * * 0` | Sunday midnight: seed slots for next 4 weeks |
| `ghost-pricing-analysis` | `0 0 * * 0` | Sunday midnight: review surge pricing rules |
| `ghost-stripe-webhook-cleanup` | `0 4 * * 0` | Sunday 4am: prune stripe_webhook_events older than 90d (180d for failed) |
| `ghost-cron-history-cleanup` | `15 4 * * 0` | Sunday 4:15am: prune cron.job_run_details older than 30d |
| `ghost-health-report` | `0 20 * * 0` | Sunday 8pm: weekly health report via cleanup agent |
| `ghost-weekly-snapshot` | `0 23 * * 0` | Sunday 11pm: financial_snapshots for the week |

### Monthly — 1st of the month

| Job | Schedule | Purpose |
|---|---|---|
| `ghost-monthly-campaign` | `0 8 1 * *` | 1st @ 8am: AI generates monthly marketing angle |
| `ghost-content-calendar` | `0 9 1 * *` | 1st @ 9am: AI generates content calendar |
| `ghost-membership-renewals` | `0 9 1 * *` | 1st @ 9am: alert about Ghost Pass members renewing in 7d |

## Recently Fixed

**2026-04-29 — Smart-alerts NOT NULL bug**
- 7 cron jobs were inserting into `smart_alerts` without the required `title` column
- 2 actively failing (`ghost-lead-chase`, `ghost-stock-check`)
- 5 succeeding only because no rows matched their query (latent bug)
- All 7 fixed: `title` column now populated in every insert
- Verified by manual trigger of `ghost-lead-chase` — now successfully inserts rows

**2026-04-29 — Wasteful warmup**
- `ghost-warmup` was firing every 15 minutes (96 invocations/day) hitting the AI router
- Supabase edge functions don't suffer cold starts the way AWS Lambda does
- Reduced to 3x daily during business hours (Mon-Sat 7am, 12pm, 5pm)
- Saves ~92 unnecessary edge function invocations per day

**2026-04-29 — Missing cleanup crons added**
- Created `cleanup_rate_limit_log()` function but never scheduled it → now runs daily 3:30am
- `prune_security_events()` existed but never scheduled → now runs daily 3:45am
- `expire_old_sessions()` existed but never scheduled → now runs hourly at :15
- `cleanup_expired_sessions()` existed but never scheduled → now runs daily 4am
- Created `cleanup_stripe_webhook_events()` + scheduled weekly Sunday 4am (90d retention, 180d for failed)
- Created `cleanup_cron_history()` + scheduled weekly Sunday 4:15am (30d retention)

## How to add a new cron

```sql
SELECT cron.schedule(
  'job-name-kebab-case',
  '0 9 * * *',  -- standard 5-field cron
  $$
  -- Your SQL or HTTP call here
  SELECT net.http_post(
    url := 'https://slzawehsiotvkjzaehqw.supabase.co/functions/v1/your-function',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "do_thing"}'::jsonb
  );
  $$
);
```

## How to remove a cron

```sql
SELECT cron.unschedule('job-name-kebab-case');
```

## How to check a cron is healthy

```sql
SELECT 
  j.jobname, j.schedule,
  COUNT(jrd.runid) FILTER (WHERE jrd.status = 'succeeded') as succeeded,
  COUNT(jrd.runid) FILTER (WHERE jrd.status = 'failed') as failed,
  MAX(jrd.start_time) as last_run
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON jrd.jobid = j.jobid 
  AND jrd.start_time > NOW() - INTERVAL '7 days'
WHERE j.jobname = 'job-name-kebab-case'
GROUP BY j.jobid, j.jobname, j.schedule;
```

If a job shows `failed > 0`, query the error:

```sql
SELECT return_message FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'job-name-kebab-case')
  AND status = 'failed'
ORDER BY start_time DESC LIMIT 1;
```
