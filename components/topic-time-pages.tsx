import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
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

const landingFlowSteps = [
  {
    body: "Crei il profilo, confermi la mail e ritrovi ogni volta Star, stanze e preferenze.",
    icon: Users,
    title: "Account personale",
  },
  {
    body: "Il primo gesto dentro l'app e semplice: prendi il regalo gratuito e prova una stanza senza attrito.",
    icon: Gift,
    title: "Star subito utili",
  },
  {
    body: "La lobby propone topic casuali, utenti presenti, costo, regole e prompt prima dell'ingresso.",
    icon: Hash,
    title: "Scelta guidata",
  },
  {
    body: "Premium serve a creare nuove chatroom con durata, capienza, costo e mood.",
    icon: Crown,
    title: "Creator economy",
  },
];

const landingPrinciples = [
  "Interessi prima dei profili",
  "Chatroom a tempo",
  "Zero swipe infinito",
  "Temi personalizzabili",
  "Community che ascolta",
];

const reportMetrics = [
  ["200k", "giovani in condizioni di isolamento quasi totale secondo i dati citati nel report."],
  ["+10,5", "punti di maggiore probabilita di sentirsi soli per chi usa intensamente i social."],
  ["92,5%", "under 19 che usano strumenti di IA: TopicTime vuole riportare al centro il confronto tra persone."],
];

const marketCards = [
  ["Chat anonime", "Temi presenti, ma spesso poca cura dell'ambiente e della sicurezza."],
  ["Social classici", "Perfetti per mostrarsi, meno adatti a iniziare conversazioni sincere."],
  ["Dating app", "Utili per altri bisogni, ma troppo orientate alla valutazione immediata."],
  ["TopicTime", "Stanze piccole, interessi condivisi e contatti che nascono solo se la conversazione funziona."],
];

const ritualSteps = [
  ["01", "Scegli un topic", "Cinema, viaggi, cucina, libri, fitness o musica: si parte da qualcosa che avete in comune."],
  ["02", "Entri nella stanza", "Il timer toglie pressione: si parla adesso, senza trascinare tutto all'infinito."],
  ["03", "Parli prima del profilo", "Prima ascolti cosa dice una persona. Il profilo arriva dopo, con piu senso."],
  ["04", "Scegli se continuare", "A fine stanza decidi con chi restare in contatto, solo se la sintonia e nata davvero."],
];

const manifestoRules = [
  "Gli interessi sono la porta d'ingresso, non un dettaglio nascosto nel profilo.",
  "Il tempo limitato rende l'incontro piu leggero: sai quando inizia e quando finisce.",
  "La nostalgia delle vecchie chatroom serve a ridare spazio alla conversazione.",
  "La community deve poter dire cosa funziona, cosa manca e cosa va migliorato.",
];

const themeCards = [
  ["Digital Zen", "Chiaro, calmo, perfetto per leggere senza fatica."],
  ["Sunset Nostalgia", "Colori caldi per stanze serali e conversazioni piu lente."],
  ["Pastel Dream", "Morbido, leggero, ideale per chi vuole un ambiente meno rumoroso."],
];

const businessItems = [
  ["Star", "Si ottengono con regali, streak, feedback utili o pacchetti dedicati."],
  ["Free", "Permette di provare l'esperienza senza barriere, con limiti semplici."],
  ["Premium", "Sblocca creazione stanze, temi speciali e piu possibilita di personalizzazione."],
  ["Community", "Feedback, segnalazioni e idee aiutano TopicTime a crescere nel modo giusto."],
];

const growthItems = [
  ["1 anno", "50k utenti", "Prime community attive e conversioni Premium leggere."],
  ["2 anni", "150k utenti", "Piu stanze, piu creator e maggiore ritorno quotidiano."],
  ["3 anni", "400k utenti", "Una rete ampia, ma ancora basata su stanze piccole e conversazioni sane."],
];

const audienceRoutes = [
  "TikTok per raccontare problemi reali",
  "Instagram per identita e aggiornamenti",
  "Community interna per idee e supporto",
  "Utenti come primi ambasciatori del servizio",
];

const peopleCards = [
  ["Giulia", "Vuole parlare con persone nuove senza trasformare tutto in dating."],
  ["Luca", "Ha poco tempo e cerca conversazioni brevi, chiare, senza restare incastrato nel feed."],
  ["Laura", "Ricorda quando bastavano una stanza e un argomento per iniziare davvero."],
];

const roadmapCards = [
  ["01", "Racconto", "Una landing chiara per capire perche TopicTime esiste."],
  ["02", "Accesso", "Account, profilo, interessi e preferenze personali."],
  ["03", "Stanze", "Chatroom a tempo con topic, Star, utenti e messaggi."],
  ["04", "Fiducia", "Supporto, segnalazioni e roadmap aperta alla community."],
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

      <Link className="nav-cta" href="/rooms?auth=login">
        Accedi
      </Link>
    </header>
  );
}

function PageShell({
  actions,
  children,
  current,
  eyebrow,
  text,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  current: PageKey;
  eyebrow: string;
  text: string;
  title: string;
}) {
  return (
    <main className="product-page">
      <ProductNav current={current} />
      <section className="page-hero compact-hero">
        <p className="eyeline">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
        {actions ? <div className="hero-actions">{actions}</div> : null}
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
          <p className="eyeline">Chat old-school, connessioni nuove</p>
          <h1>Non scorrere persone. Entra in una stanza.</h1>
          <p>
            Niente feed infiniti o gare di follower. Entri per un tema che ti interessa,
            parli con poche persone e solo dopo decidi con chi continuare.
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href="/rooms?auth=register"><MessageCircle size={18} />Crea account gratis</Link>
            <Link className="secondary-action" href="#manifesto"><Wand2 size={18} />Leggi il manifesto</Link>
          </div>
        </div>
        <div className="hero-orbit" aria-label="Anteprima TopicTime">
          <div className="orbit-core">
            <Image src="/brand/logo-mark.png" alt="" width={86} height={86} priority />
            <strong>20 min</strong>
            <span>topic vivo</span>
          </div>
          <span className="orbit-chip chip-one">+25 Star regalo</span>
          <span className="orbit-chip chip-two">Premium crea stanze</span>
          <span className="orbit-chip chip-three">Radar conversazioni</span>
        </div>
      </section>
      <nav className="landing-section-nav" aria-label="Sezioni TopicTime">
        <a href="#manifesto">Manifesto</a>
        <a href="#rituale">Rituale</a>
        <a href="#temi">Temi</a>
        <a href="#persone">Persone</a>
        <a href="#roadmap">Roadmap</a>
        <a href="#contatti">Contatti</a>
      </nav>
      <section className="ticker" aria-label="Principi TopicTime">
        <div>
          {[...landingPrinciples, ...landingPrinciples].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>
      <RoomRail />
      <section className="product-section split-section" id="manifesto">
        <div>
          <p className="eyeline">Manifesto anti-feed</p>
          <h2>Prima di giudicare un profilo, ascolta una persona.</h2>
        </div>
        <div className="ritual-list">
          <article><span>01</span><p>I social sono perfetti per farsi vedere. Molto meno per sentirsi capiti.</p></article>
          <article><span>02</span><p>TopicTime ribalta l'ordine: prima arriva la conversazione, poi il profilo.</p></article>
          <article><span>03</span><p>Non devi conquistare attenzione: devi solo entrare in una stanza e avere qualcosa da dire.</p></article>
        </div>
      </section>
      <section className="product-section comparison-grid">
        <article>
          <span>Social-vetrina</span>
          <strong>Copertina prima, persona dopo.</strong>
          <p>Foto, bio e reazioni decidono troppo presto. Spesso non resta spazio per scoprirsi davvero.</p>
        </article>
        <article className="is-focus">
          <span>TopicTime</span>
          <strong>Stanza prima, profilo dopo.</strong>
          <p>Entri per un tema, parli per qualche minuto e solo dopo scegli se continuare il contatto.</p>
        </article>
      </section>
      <section className="product-section rule-stack" aria-label="Regole TopicTime">
        {manifestoRules.map((rule, index) => (
          <article key={rule}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{rule}</p>
          </article>
        ))}
      </section>
      <section className="product-section report-section">
        <div>
          <p className="eyeline">Annual Report 2025/26</p>
          <h2>La Gen Z e iperconnessa, ma sempre piu isolata.</h2>
          <p>
            Dietro ai numeri c'e una sensazione concreta: essere sempre connessi non
            significa sentirsi meno soli. TopicTime prova a riportare online uno spazio
            semplice, guidato da temi e conversazioni.
          </p>
        </div>
        <div className="metric-stack">
          {reportMetrics.map(([value, text]) => (
            <article key={value}><strong>{value}</strong><p>{text}</p></article>
          ))}
        </div>
      </section>
      <section className="product-section market-grid">
        <div>
          <p className="eyeline">Spazio di mercato</p>
          <h2>Tra chat anonime, social passivi e dating app manca un posto tranquillo.</h2>
        </div>
        <div className="market-card-grid">
          {marketCards.map(([title, text]) => (
            <article className={title === "TopicTime" ? "is-focus" : ""} key={title}>
              <span>{title}</span>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="product-section split-section" id="flusso">
        <div>
          <p className="eyeline">Il prodotto</p>
          <h2>Un buon incontro ha bisogno di un piccolo rituale.</h2>
        </div>
        <div className="ritual-list">
          {ritualSteps.map(([number, title, text]) => (
            <article key={title}><span>{number}</span><strong>{title}</strong><p>{text}</p></article>
          ))}
        </div>
      </section>
      <section className="product-section event-preview" id="rituale">
        <div className="event-console">
          <span>Stanza in partenza</span>
          <h2>I migliori libri del 2000</h2>
          <p>6 posti aperti, 20 minuti, profili visibili alla fine.</p>
          <div className="console-meter"><span /></div>
          <div className="hero-actions">
            <Link className="primary-action" href="/rooms?auth=register">Entra</Link>
            <Link className="secondary-action" href="/rooms?auth=login">Ho gia un account</Link>
          </div>
        </div>
        <div>
          <p className="eyeline">15-20 minuti</p>
          <h2>Una stanza breve, abbastanza piccola da far parlare davvero.</h2>
          <p>Non devi preparare un profilo perfetto. Scegli un tema, entri nella stanza, parli per pochi minuti e poi decidi se continuare.</p>
        </div>
      </section>
      <section className="product-section landing-flow-preview" aria-label="Demo funzionale TopicTime">
        {landingFlowSteps.map((step) => {
          const Icon = step.icon;
          return (
            <article key={step.title}>
              <span><Icon size={18} /></span>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
              <small><Check size={14} /> pronto da provare</small>
            </article>
          );
        })}
      </section>
      <section className="product-section experience-section" id="temi">
        <div>
          <p className="eyeline">Identita</p>
          <h2>Retro, ma non rumoroso.</h2>
          <p>
            Il design riprende il calore delle vecchie chatroom, ma lo porta in un ambiente
            piu calmo: meno rumore, piu respiro, piu attenzione alle persone.
          </p>
        </div>
        <div className="theme-story-grid">
          {themeCards.map(([title, text]) => (
            <article key={title}><Palette size={20} /><strong>{title}</strong><p>{text}</p></article>
          ))}
        </div>
      </section>
      <section className="product-section business-section">
        <div>
          <p className="eyeline">Modello sostenibile</p>
          <h2>Entrare deve restare facile. Crescere deve restare possibile.</h2>
        </div>
        <div className="business-list">
          {businessItems.map(([title, text]) => (
            <p key={title}><strong>{title}</strong> {text}</p>
          ))}
        </div>
      </section>
      <section className="product-section growth-section">
        <div>
          <p className="eyeline">Crescita</p>
          <h2>Una crescita che parte dalle persone che tornano.</h2>
          <p>Prima una community attiva, poi piu stanze, creator, Premium e Star usate dentro esperienze reali.</p>
        </div>
        <div className="growth-rail">
          {growthItems.map(([period, value, text]) => (
            <article key={period}><span>{period}</span><strong>{value}</strong><p>{text}</p></article>
          ))}
        </div>
      </section>
      <section className="product-section audience-section" id="persone">
        <div>
          <p className="eyeline">Persone</p>
          <h2>Non utenti da trattenere. Persone da far sentire accolte.</h2>
          <p>TopicTime parla a chi vorrebbe incontrare persone nuove senza trasformare ogni interazione in una vetrina o in una gara.</p>
        </div>
        <div className="persona-grid">
          {peopleCards.map(([name, text]) => (
            <article key={name}><span>{name}</span><p>{text}</p></article>
          ))}
        </div>
      </section>
      <section className="product-section route-list" aria-label="Canali community TopicTime">
        {audienceRoutes.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>
      <section className="product-section roadmap-landing" id="roadmap">
        <div>
          <p className="eyeline">Roadmap</p>
          <h2>Dall'idea raccontata alla stanza da provare.</h2>
          <p>La landing spiega perche TopicTime esiste. L'app fa sentire cosa succede quando quel racconto diventa una conversazione vera.</p>
        </div>
        <div className="roadmap-lane">
          {roadmapCards.map(([number, title, text]) => (
            <article key={title}><span>{number}</span><strong>{title}</strong><p>{text}</p></article>
          ))}
        </div>
      </section>
      <section className="product-section proof-grid">
        <MetricPill icon={Hash} label="Stanze pronte" value={String(rooms.length)} />
        <MetricPill icon={Coins} label="Regalo iniziale" value={`${initialProfile.coins} Star`} />
        <MetricPill icon={Users} label="Persone compatibili" value={String(companionMatches.length)} />
        <MetricPill icon={Megaphone} label="Idee in roadmap" value={String(roadmapUpdates.length)} />
      </section>
      <section className="product-section final-landing-cta" id="contatti">
        <Image src="/brand/logo-mark.png" alt="" width={82} height={82} />
        <div>
          <p className="eyeline">Prossima fase</p>
          <h2>Dai numeri alla stanza.</h2>
          <p>Apri TopicTime e guarda come l'idea comincia a diventare un'esperienza da provare.</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-action" href="/rooms?auth=register">Crea account</Link>
          <a className="secondary-action" href="https://linktr.ee/topic_time" target="_blank" rel="noreferrer">Segui TopicTime</a>
        </div>
      </section>
    </main>
  );
}

export function WalletPage() {
  const premiumThemes = themeOptions.filter((theme) => theme.premiumOnly).length;

  return (
    <PageShell
      current="wallet"
      eyebrow="Il tuo wallet"
      title="Star, regali e Premium senza interrompere la conversazione."
      text="Qui controlli il saldo, riscatti il regalo gratuito, sblocchi temi e attivi Premium quando vuoi creare stanze tue."
      actions={
        <>
          <Link className="primary-action" href="/rooms?auth=register">Prendi il regalo gratis</Link>
          <Link className="secondary-action" href="/rooms?auth=login">Ho gia un account</Link>
        </>
      }
    >
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
    <PageShell
      current="community"
      eyebrow="La tua voce conta"
      title="Una community che non parla solo: decide cosa costruire dopo."
      text="Proponi idee, vota quelle degli altri e ricevi Star quando aiuti TopicTime a diventare piu utile e sicuro."
      actions={
        <>
          <Link className="primary-action" href="/rooms?auth=register">Entra nella community</Link>
          <Link className="secondary-action" href="/support">Hai bisogno di aiuto?</Link>
        </>
      }
    >
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
    <PageShell
      current="profile"
      eyebrow="Il tuo profilo"
      title="Mostra cosa ti interessa davvero."
      text="Interessi, bio e match aiutano gli altri a capire con chi stanno parlando e a ritrovarti dopo una stanza riuscita."
      actions={
        <>
          <Link className="primary-action" href="/rooms?auth=register">Crea il tuo profilo</Link>
          <Link className="secondary-action" href="/radar">Scopri il Radar</Link>
        </>
      }
    >
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
    <PageShell
      current="radar"
      eyebrow="Scelta intelligente"
      title="Radar capisce quando una stanza e pronta per te."
      text="Invece di farti scorrere all'infinito, TopicTime ti suggerisce stanze con il ritmo, il tema e le persone piu adatti al momento."
      actions={
        <>
          <Link className="primary-action" href="/rooms?auth=register">Trova una stanza</Link>
          <Link className="secondary-action" href="/profile">Come funziona il profilo</Link>
        </>
      }
    >
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
      actions={
        <>
          <Link className="primary-action" href="/rooms?auth=login">Torna alle stanze</Link>
          <a className="secondary-action" href="#support-form">Scrivi al supporto</a>
        </>
      }
    >
      <SupportCenter />
    </PageShell>
  );
}
