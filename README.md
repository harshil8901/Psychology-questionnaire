# Predictors of Flourishing at Workplace

Premium psychology research questionnaire platform built with Next.js, Supabase, and a JSON-driven survey engine.

## Features

- Multi-step survey (1–2 questions per screen)
- Glassmorphism dark UI with Framer Motion
- Auto-save to Supabase + localStorage resume
- Consent modal flow (separate from questionnaire config)
- Admin dashboard with Recharts analytics
- CSV / XLSX export via SheetJS

## Setup

1. Copy `.env.example` to `.env.local` and add Supabase credentials.
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql` in your Supabase project.
3. Create an admin user in Supabase Auth, then insert into `admin_users`:

```sql
insert into admin_users (id, email)
values ('your-auth-user-uuid', 'admin@example.com');
```

4. Install and run:

```bash
npm install
npm run dev
```

## Questionnaire configuration

Edit **`data/questionnaires/flourishing-workplace.ts`** to add, remove, or reorder questions and sections. The UI reads this file dynamically — no component changes required.

## Deploy

Deploy to [Vercel](https://vercel.com) and set environment variables in the project settings.
