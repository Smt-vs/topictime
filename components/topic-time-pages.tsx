import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Coins,
  Crown,
  Eye,
  Gift,
  Hash,
  Megaphone,
  MessageCircle,
  Palette,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import {
  communityFeedbacks,
  companionMatches,
  dailyMissions,
  initialProfile,
  initialTransactions,
  notifications,
  planFeatures,
  roadmapUpdates,
  rooms,
  themeOptions,
} from "@/data/topic-time";
import { SupportCenter } from "@/components/support-center";

type PageKey = "home" | "rooms" | "wallet" | "community" | "profile" | "radar" | "support";

const navItems: { href: string; icon: LucideIcon; id: PageKey; label: string }[] = [
  { href: "/", icon: Sparkles, id: "home", label: "Home" },
  { href: "/rooms", icon: Hash, id: "rooms", label: "Stanze" },
  { href: "/wallet", icon: Coins, id: "wallet", label: "Star" },
  { href: "/community", icon: MessageCircle, id: "community", label: "Community" },
  { href: "/profile", icon: Users, id: "profile", label: "Profilo" },
  { href: "/radar", icon: Eye, id: "radar", label: "Radar" },
  { href: "/support", icon: ShieldAlert, id: "support", label: "Supporto" },
];

const radarSignals = [
  ["Intento", "Calmo", "Suggerisce stanze lente quando l'utente salva messaggi riflessivi."],
  ["Energia", "Media", "Evita room troppo affollate se il topic richiede profondita."],
  ["Rischio small talk", "Basso", "Spinge prompt specifici e limita ingressi senza contesto."],
];

function ProductNav({ current }: { current: PageKey }) {
  return (
    <header className="product-nav" aria-label="Navigazione principale">
      <Link className="product-brand" href="/" aria-label="TopicTime home">
        <Image src="/brand/logo-mark.png" alt="" width={44} height={44} priority />
        <span>
          <strong>TopicTime</strong>
          <small>chatroom a tempo</small>
        </span>
      </Link>

      <nav>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} className={item.id === current ? "active" : undefined} href={item.href}>
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link className="nav-cta" href="/rooms">
        Apri app
      </Link>
    </header>
  );
}

function PageShell({ children, current, eyebrow, text, title }: { children: ReactNode; current: PageKey; eyebrow: string; text: string; title: string }) {
  return (
    <main className="product-page">
      <ProductNav current={current} />
      <section className="page-hero compact-hero">
        <p className="eyeline">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </section>
      {children}
    </main>
  );
}

function RoomRail() {
  return (
    <div className="room-rail" aria-label="Stanze in evidenza">
      {rooms.slice(0, 4).map((room) => {
        const Icon = room.icon;
        return (
          <article key={room.id}>
            <Icon size={22} />
            <span>{room.category}</span>
            <strong>{room.title}</strong>
            <small>{room.startsAt} - {room.people}/{room.limit} persone</small>
          </article>
        );
      })}
    </div>
  );
}

function MetricPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="metric-pill">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="product-page landing-page">
      <ProductNav current="home" />
      <section className="landing-hero">
        <div className="hero-copy-block">
          <p className="eyeline">Social senza rumore</p>
          <h1>Entra in una stanza quando hai davvero qualcosa da dire.</h1>
          <p>TopicTime trasforma interessi, tempo e compatibilita in chatroom brevi dove la conversazione ha un inizio, un ritmo e una fine.</p>
          <div className="hero-actions">
            <Link className="primary-action" href="/rooms"><MessageCircle size={18} />Entra nelle stanze</Link>
            <Link className="secondary-action" href="/radar"><Wand2 size={18} />Scopri il Radar</Link>
          </div>
        </div>
        <div className="hero-orbit" aria-label="Anteprima TopicTime">
          <div className="orbit-core">
            <Image src="/brand/logo-mark.png" alt="" width={86} height={86} priority />
            <strong>20 min</strong>
            <span>topic vivo</span>
          </div>
          <span className="orbit-chip chip-one">+25 Star regalo</span>
          <span className="orbit-chip chip-two">Premium crea room</span>
          <span className="orbit-chip chip-three">Radar qualita</span>
        </div>
      </section>
      <RoomRail />
      <section className="product-section split-section">
        <div>
          <p className="eyeline">Flusso reale</p>
          <h2>Dalla curiosita alla relazione, senza feed infinito.</h2>
        </div>
        <div className="ritual-list">
          {[
            "Entra con un tema chiaro, non con un feed infinito.",
            "Parla per venti minuti con persone compatibili sul momento.",
            "Salva segnali, match e memorie utili dopo la stanza.",
          ].map((step, index) => (
            <article key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></article>
          ))}
        </div>
      </section>
      <section className="product-section proof-grid">
        <MetricPill icon={Hash} label="Stanze seed" value={String(rooms.length)} />
        <MetricPill icon={Coins} label="Wallet iniziale" value={`${initialProfile.coins} Star`} />
        <MetricPill icon={Users} label="Match post-room" value={String(companionMatches.length)} />
        <MetricPill icon={Megaphone} label="Roadmap" value={`${roadmapUpdates.length} live`} />
      </section>
    </main>
  );
}

export function WalletPage() {
  const premiumThemes = themeOptions.filter((theme) => theme.premiumOnly).length;

  return (
    <PageShell current="wallet" eyebrow="Il tuo wallet" title="Star, regali e Premium senza interrompere la conversazione." text="Qui controlli il saldo, riscatti il regalo gratuito, sblocchi temi e attivi Premium quando vuoi creare stanze tue.">
      <section className="product-section wallet-ledger">
        <div className="wallet-balance"><Coins size={28} /><span>Il tuo saldo</span><strong>{initialProfile.coins} Star</strong><p>Ogni giorno puoi riscattare un regalo gratuito e usare le Star per entrare, personalizzare o passare a Premium.</p></div>
        <div className="ledger-list">
          {initialTransactions.map((transaction) => (
            <article key={transaction.id}><span>{transaction.reason}</span><strong>{transaction.amount > 0 ? "+" : ""}{transaction.amount} Star</strong><small>{transaction.time}</small></article>
          ))}
        </div>
      </section>
      <section className="product-section feature-lanes">
        <article><Crown size={22} /><strong>Crea chatroom</strong><p>Solo utenti Premium aprono nuove stanze con topic, costo, capienza e durata.</p></article>
        <article><Palette size={22} /><strong>{premiumThemes} temi premium</strong><p>Temi acquistabili con Star per rendere riconoscibile il proprio spazio.</p></article>
        <article><Gift size={22} /><strong>Regalo quotidiano</strong><p>Un gesto semplice che invita a tornare e provare una nuova stanza.</p></article>
      </section>
      <section className="product-section mission-grid" aria-label="Missioni giornaliere TopicTime">
        {dailyMissions.map((mission) => (
          <article key={mission.id}>
            <span>{mission.progress}/{mission.target}</span>
            <strong>{mission.title}</strong>
            <p>{mission.action}</p>
            <small>+{mission.reward} Star</small>
          </article>
        ))}
      </section>
      <section className="product-section plan-table" aria-label="Confronto piano free e premium">
        <div className="plan-table-head">
          <span>Funzionalita</span>
          <span>Free</span>
          <span>Premium</span>
        </div>
        {planFeatures.map((feature) => (
          <article key={feature.label}>
            <strong>{feature.label}</strong>
            <span>{feature.free}</span>
            <span>{feature.premium}</span>
          </article>
        ))}
      </section>
    </PageShell>
  );
}

export function CommunityPage() {
  return (
    <PageShell current="community" eyebrow="La tua voce conta" title="Una community che non parla solo: decide cosa costruire dopo." text="Proponi idee, vota quelle degli altri e ricevi Star quando aiuti TopicTime a diventare piu utile e sicuro.">
      <section className="product-section community-board">
        <div className="feedback-stack">
          {communityFeedbacks.map((idea) => (
            <article key={idea.id}><span>{idea.category} - {idea.status}</span><strong>{idea.title}</strong><p>{idea.body}</p><small>{idea.votes} voti - +{idea.reward} Star</small></article>
          ))}
        </div>
        <div className="roadmap-stack">
          {roadmapUpdates.map((update) => (
            <article key={update.id}><span>{update.status}</span><strong>{update.title}</strong><p>{update.body}</p><small>{update.metric}</small></article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export function ProfilePage() {
  return (
    <PageShell current="profile" eyebrow="Il tuo profilo" title="Mostra cosa ti interessa davvero." text="Interessi, bio e match aiutano gli altri a capire con chi stanno parlando e a ritrovarti dopo una stanza riuscita.">
      <section className="product-section profile-layout" id="matches">
        <aside className="profile-passport"><span>{initialProfile.avatarInitials}</span><strong>{initialProfile.displayName}</strong><small>@{initialProfile.username}</small><p>{initialProfile.bio}</p><div>{initialProfile.interests.map((interest) => <em key={interest}>{interest}</em>)}</div></aside>
        <div className="match-list">{companionMatches.map((match) => <article key={match.id}><UserPlus size={20} /><span>{match.topic}</span><strong>{match.name}</strong><p>{match.signal}</p><small>{match.score}% compatibilita</small></article>)}</div>
        <div className="safety-panel"><ShieldAlert size={24} /><strong>Spazio sicuro</strong><p>Puoi silenziare una stanza, segnalare comportamenti scorretti e tenere sotto controllo le notifiche senza interrompere la conversazione.</p><ul>{notifications.slice(0, 3).map((notification) => <li key={notification.id}>{notification.title}</li>)}</ul></div>
      </section>
    </PageShell>
  );
}

export function RadarPage() {
  return (
    <PageShell current="radar" eyebrow="Scelta intelligente" title="Radar capisce quando una stanza e pronta per te." text="Invece di farti scorrere all'infinito, TopicTime ti suggerisce stanze con il ritmo, il tema e le persone piu adatti al momento.">
      <section className="product-section radar-stage">
        <div className="radar-visual" aria-label="Radar conversazionale"><div className="radar-ring ring-one" /><div className="radar-ring ring-two" /><div className="radar-ring ring-three" /><span className="radar-dot dot-one">Cinema</span><span className="radar-dot dot-two">Libri</span><span className="radar-dot dot-three">Viaggi</span><div className="radar-center"><Wand2 size={28} /><strong>92%</strong><small>match conversazione</small></div></div>
        <div className="radar-copy"><p className="eyeline">Non e un feed</p><h2>Il Radar propone la prossima stanza in base al momento, non alla dipendenza.</h2><p>Ti mostra perche una stanza puo funzionare per te e ti offre un prompt di ingresso gia pronto.</p></div>
      </section>
      <section className="product-section signal-grid">{radarSignals.map(([label, metric, text]) => <article key={label}><span>{label}</span><strong>{metric}</strong><p>{text}</p></article>)}</section>
      <section className="product-section route-panel"><div><Clock size={22} /><strong>Percorso consigliato</strong><p>Tre stanze suggerite, massimo un'ora, nessun feed infinito.</p></div>{rooms.slice(0, 3).map((room, index) => <article key={room.id}><span>{index + 1}</span><strong>{room.title}</strong><small>{room.compatibility}% compatibile - {room.mood}</small></article>)}</section>
    </PageShell>
  );
}

export function SupportPage() {
  return (
    <PageShell
      current="support"
      eyebrow="Supporto e fiducia"
      title="Una chatroom funziona solo se le persone si sentono al sicuro."
      text="Se qualcosa non va, puoi segnalarlo in pochi secondi. Il supporto serve a proteggere le conversazioni, non a complicarle."
    >
      <SupportCenter />
    </PageShell>
  );
}
