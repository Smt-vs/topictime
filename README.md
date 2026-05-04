# TopicTime Applicativo

MVP Next.js per TopicTime: stanze tematiche a tempo, ingresso con monete, streak, profilo per interessi e login magic link tramite Supabase.

## Avvio locale

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Compila `.env.local` con le chiavi Supabase del progetto:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Supabase

Lo schema iniziale e in `supabase/schema.sql`. Include:

- profili utente collegati ad `auth.users`
- topic e room a tempo
- membership delle stanze
- messaggi protetti da RLS
- amicizie post-room
- transazioni wallet

## Deploy Vercel

Il progetto e pronto per Vercel con:

- `npm run build`
- framework Next.js
- env `NEXT_PUBLIC_SUPABASE_URL`
- env `NEXT_PUBLIC_SUPABASE_ANON_KEY`
