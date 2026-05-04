# TopicTime Applicativo

Applicativo Next.js per TopicTime: stanze tematiche a tempo, chat, wallet con monete, temi acquistabili, streak giornaliera, profilo per interessi, match post-room, notifiche, moderazione e login magic link tramite Supabase.

## Avvio locale

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Compila `.env.local` con le chiavi pubbliche del progetto Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Se le variabili non sono presenti, l'app resta usabile in modalita demo con dati locali.

## Funzionalita

- Stanze filtrabili per topic, ricerca, capienza, costo, stato live/scheduled e vincoli Premium.
- Ingresso stanza con RPC Supabase, addebito monete e fallback demo.
- Chat per stanza con salvataggio messaggi per utenti autenticati.
- Wallet con streak giornaliera, ricompense annuncio demo, pacchetti monete simulati e ledger movimenti.
- Temi acquistabili con monete e blocco Premium.
- Profilo modificabile con bio, username, interessi e tema attivo.
- Match post-conversazione, notifiche e pannello moderazione.
- Snapshot iniziale da Supabase: stanze, profilo, temi, movimenti, notifiche e messaggi recenti.

## Database Supabase

Esegui il contenuto di `supabase/schema.sql` nell'SQL editor di Supabase. Lo schema include:

- tabelle `profiles`, `themes`, `topics`, `rooms`, `room_members`, `messages`
- tabelle social e prodotto: `friendships`, `wallet_transactions`, `notifications`, `moderation_reports`
- view `room_cards` per la dashboard delle stanze
- trigger su `auth.users` per creare automaticamente profilo e tema base
- funzioni RPC `join_room`, `post_message`, `claim_daily_streak`, `purchase_theme`, `save_profile`, `create_room`
- policy RLS e grant per `anon` e `authenticated`
- seed iniziale per topic, temi e stanze demo

## Deploy Vercel

Il progetto e configurato per Vercel con `vercel.json`.

Imposta su Vercel queste environment variables per Production, Preview e Development:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Il comando di build e:

```bash
npm run build
```
