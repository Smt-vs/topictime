# TopicTime Applicativo

Applicativo Next.js per TopicTime: login, stanze tematiche a tempo generate con topic casuali, chatroom complete, utenti in stanza, wallet con monete, regalo gratuito giornaliero, temi acquistabili, Premium, profilo per interessi, match post-room, notifiche e moderazione.

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

Se le variabili non sono presenti, l'app resta esplorabile in modalita prova con dati locali.

## Funzionalita

- Login iniziale con link sicuro via email e ingresso di prova locale.
- Stanze generate all'avvio con topic casuali, utenti gia presenti, capienza, costo e stato leggibile.
- Ingresso stanza con RPC Supabase, addebito monete e fallback locale.
- Chat per stanza con salvataggio messaggi, utenti online, typing indicator, risposte rapide, citazioni, reazioni, mute, invito e uscita stanza.
- Wallet con regalo gratuito giornaliero, streak, ricompense annuncio, pacchetti monete e movimenti recenti.
- Piano Premium acquistabile con monete; solo utenti Premium possono creare chatroom.
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
- funzioni RPC `ensure_random_rooms`, `join_room`, `leave_room`, `post_message`, `toggle_message_reaction`, `claim_free_gift`, `claim_daily_streak`, `activate_premium_plan`, `purchase_theme`, `save_profile`, `create_room`
- policy RLS e grant per `anon` e `authenticated`
- seed iniziale per topic, temi e stanze di prova

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
