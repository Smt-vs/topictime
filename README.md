# TopicTime Applicativo

Applicativo Next.js per TopicTime: login, stanze tematiche a tempo generate con topic casuali, chatroom complete, utenti in stanza, wallet con valuta Star, regalo gratuito giornaliero, temi acquistabili, Premium, profilo per interessi, match post-room, Community Hub, notifiche e moderazione.

## Avvio locale

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Compila `.env.local` con le chiavi pubbliche del progetto Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Se usi una chiave legacy puoi ancora impostare `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Se le variabili non sono presenti, l'app mostra il login ma non permette l'accesso.

## Funzionalita

- Login solo con account: nome visibile, email, password, verifica email e recupero password.
- Landing collegata al flusso reale: `/rooms?auth=register` apre la registrazione, `/rooms?auth=login` apre l'accesso e gli inviti stanza usano `/rooms?room=slug`.
- Stanze generate all'avvio con topic casuali, utenti gia presenti, capienza, costo e stato leggibile.
- Ingresso stanza con RPC Supabase, sessione autenticata, addebito Star e saldo riallineato dalla risposta del database.
- Chat per stanza con salvataggio messaggi, utenti online, typing indicator, risposte rapide, citazioni, reazioni toggle persistite, mute, invito e uscita stanza.
- Wallet con regalo gratuito giornaliero, missioni Star, streak, movimenti recenti e pacchetti Star preparati per un checkout reale.
- Piano Premium acquistabile con Star; solo utenti Premium possono creare chatroom.
- Temi acquistabili con Star e blocco Premium.
- Community Hub: feedback aperti, voti, roadmap trasparente e reward +5 Star per proposta salvata.
- Supporto integrato per bug, sicurezza, FAQ e idee: il form salva ticket anche quando l'utente non riesce ancora ad accedere.
- Profilo modificabile con bio, username, interessi e tema attivo.
- Match post-conversazione, notifiche lette persistite, percorso demo guidato, onboarding e pannello moderazione con segnalazioni stanza salvate via RPC.
- Snapshot iniziale da Supabase: stanze, profilo, temi, movimenti, notifiche e messaggi recenti, con errori tradotti in messaggi sicuri per l'utente.

## Database Supabase

Esegui il contenuto di `supabase/schema.sql` nell'SQL editor di Supabase. Lo schema include:

- tabelle `profiles`, `themes`, `topics`, `rooms`, `room_members`, `messages`
- tabelle social e prodotto: `friendships`, `wallet_transactions`, `notifications`, `moderation_reports`, `community_feedback`, `support_tickets`
- view `room_cards` per la dashboard delle stanze
- trigger su `auth.users` per creare automaticamente profilo e tema base
- funzioni RPC `ensure_random_rooms`, `join_room`, `leave_room`, `post_message`, `toggle_message_reaction`, `claim_free_gift`, `claim_daily_streak`, `activate_premium_plan`, `purchase_theme`, `save_profile`, `submit_community_feedback`, `create_room`, `report_room`
- policy RLS e grant per `anon` e `authenticated`
- seed iniziale per topic, temi e stanze di partenza

Le password non sono e non devono essere salvate in `public.profiles` o in altre tabelle pubbliche. Supabase Auth le gestisce nella tabella interna `auth.users`, dove conserva solo l'hash nella colonna `encrypted_password`.

## Deploy Vercel

Il progetto e configurato per Vercel con `vercel.json`.

Su Vercel usa `applicativo` come Root Directory del progetto. La landing e l'app ora vivono nello stesso deploy Next.js: `/` e le pagine marketing sono la landing, `/rooms` e il flusso autenticato sono l'applicativo. Le vecchie URL statiche della landing (`/index.html`, `/funziona.html`, `/community.html`, ecc.) vengono reindirizzate alle nuove route Next.

Imposta su Vercel queste environment variables per Production, Preview e Development:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

In Supabase apri `Authentication > URL Configuration` e imposta il dominio dell'app in `Site URL`.
Aggiungi anche gli stessi domini in `Redirect URLs`, includendo il ritorno alla app per verifica email e recupero password: `http://localhost:3000/**`, `http://localhost:3000/rooms`, `http://localhost:3000/auth/confirm`, l'URL production Vercel con `/**`, `/rooms` e `/auth/confirm`, e se usi preview il pattern Vercel del team. In `Authentication > Providers > Email` abilita Email/Password e lascia attiva la conferma email per verificare i nuovi account.

Se personalizzi il template della mail di conferma, usa un link verso `/auth/confirm` con `token_hash`, `type` e `next`, ad esempio:

```html
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/rooms
```

Per test reali con utenti esterni configura anche `Authentication > SMTP Settings`: il mailer standard di Supabase e pensato per sviluppo, ha limiti stretti e puo non consegnare email a indirizzi non autorizzati nel progetto. Se la registrazione va a buon fine ma non arriva la verifica, controlla spam/promozioni, i rate limit Auth e l'SMTP personalizzato.

Il comando di build e:

```bash
npm run build
```
