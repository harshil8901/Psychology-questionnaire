# Predictors of Flourishing at Workplace

Premium psychology research questionnaire platform — config-driven survey engine with a minimal admin control panel.

## Features

### Participant experience
- Multi-step survey (1–2 questions per screen)
- Glassmorphism dark UI with Framer Motion
- Auto-save to Supabase + localStorage resume
- Consent modal (separate from questionnaire config)
- Animated Likert pill scales

### Admin control panel (`/admin`)
- **Questionnaires** — list, activate, validate & upload JSON configs, preview
- **Responses** — search, filter, paginate, view details, delete test data
- **Export** — CSV and XLSX (one row per participant, one column per question)

No analytics charts — research-focused, not a SaaS dashboard.

## Setup

1. Copy `.env.example` → `.env.local` and add Supabase credentials.
2. Run migrations in Supabase SQL editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_questionnaire_configs.sql`
3. Create admin user in Supabase Auth, then:

```sql
insert into admin_users (id, email)
values ('your-auth-user-uuid', 'admin@example.com');
```

4. `npm install && npm run dev` → http://localhost:3000

## Questionnaire configuration

**File-based (version controlled):**  
`data/questionnaires/flourishing-workplace.ts`  
Register new files in `data/questionnaires/registry.ts`.

**Admin-uploaded (no redeploy):**  
Paste JSON in Admin → Questionnaires → Validate → Save & activate.

## Deploy

Deploy to [Vercel](https://vercel.com) with the same environment variables.
