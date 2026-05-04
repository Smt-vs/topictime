import {
  BookOpen,
  Camera,
  Dumbbell,
  Gamepad2,
  Headphones,
  Plane,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export type TopicCategory =
  | "Tutti"
  | "Cinema"
  | "Viaggi"
  | "Libri"
  | "Fitness"
  | "Musica"
  | "Cucina"
  | "Gaming";

export type RoomStatus = "scheduled" | "live" | "closed";

export type TopicRoom = {
  category: Exclude<TopicCategory, "Tutti">;
  compatibility: number;
  cost: number;
  createdBy: string;
  description: string;
  endsAt: string;
  host: string;
  icon: LucideIcon;
  id: string;
  isPremium: boolean;
  joined: boolean;
  limit: number;
  mood: string;
  people: number;
  prompt: string;
  startsAt: string;
  status: RoomStatus;
  title: string;
};

export type ChatMessage = {
  author: string;
  createdAt: string;
  id: string;
  text: string;
  tone?: "host" | "member" | "you" | "system";
};

export type UserProfile = {
  avatarInitials: string;
  bio: string;
  coins: number;
  displayName: string;
  interests: string[];
  lastStreakAt: string | null;
  premiumUntil: string | null;
  selectedThemeId: ThemeId;
  streak: number;
  username: string;
};

export type CompanionMatch = {
  id: string;
  name: string;
  score: number;
  signal: string;
  status: "locked" | "requested" | "friend";
  topic: string;
};

export type ThemeId = "zen" | "sunset" | "pastel" | "midnight" | "arcade";

export type ThemeOption = {
  description: string;
  id: ThemeId;
  label: string;
  owned: boolean;
  premiumOnly: boolean;
  price: number;
};

export type WalletTransaction = {
  amount: number;
  id: string;
  reason: string;
  time: string;
};

export type NotificationItem = {
  id: string;
  message: string;
  status: "new" | "read";
  title: string;
};

export type ModerationReport = {
  id: string;
  reason: string;
  room: string;
  status: "open" | "reviewing" | "closed";
};

export type RoomDraft = {
  coinCost: number;
  durationMinutes: number;
  maxMembers: number;
  mood: string;
  prompt: string;
  title: string;
  topic: Exclude<TopicCategory, "Tutti">;
};

export const categories: TopicCategory[] = [
  "Tutti",
  "Cinema",
  "Viaggi",
  "Libri",
  "Fitness",
  "Musica",
  "Cucina",
  "Gaming",
];

export const topicIcons: Record<Exclude<TopicCategory, "Tutti">, LucideIcon> = {
  Cinema: Camera,
  Cucina: Utensils,
  Fitness: Dumbbell,
  Gaming: Gamepad2,
  Libri: BookOpen,
  Musica: Headphones,
  Viaggi: Plane,
};

export const initialProfile: UserProfile = {
  avatarInitials: "TM",
  bio: "Preferisco stanze lente, domande concrete e conversazioni che continuano anche dopo il timer.",
  coins: 126,
  displayName: "Teo Demo",
  interests: ["Cinema", "Libri", "Viaggi lenti", "Playlist"],
  lastStreakAt: null,
  premiumUntil: null,
  selectedThemeId: "zen",
  streak: 7,
  username: "teo_topic",
};

export const rooms: TopicRoom[] = [
  {
    category: "Cinema",
    compatibility: 92,
    cost: 0,
    createdBy: "system",
    description: "Una stanza calma per parlare di inquadrature, memoria visiva e scene che restano addosso.",
    endsAt: "19:02",
    host: "Laura",
    icon: Camera,
    id: "analogica",
    isPremium: false,
    joined: false,
    limit: 6,
    mood: "calma",
    people: 4,
    prompt: "Quale scena vi ha fatto fermare per guardare davvero la luce?",
    startsAt: "Ora",
    status: "live",
    title: "Fotografia analogica nei film",
  },
  {
    category: "Viaggi",
    compatibility: 86,
    cost: 8,
    createdBy: "system",
    description: "Percorsi brevi, posti non salvati e il piacere di non ottimizzare tutto.",
    endsAt: "Tra 26 min",
    host: "Nico",
    icon: Plane,
    id: "viaggio-lento",
    isPremium: false,
    joined: false,
    limit: 6,
    mood: "curiosa",
    people: 5,
    prompt: "Meglio perdersi in una citta o pianificare ogni tappa?",
    startsAt: "Tra 6 min",
    status: "scheduled",
    title: "Viaggio lento",
  },
  {
    category: "Libri",
    compatibility: 89,
    cost: 0,
    createdBy: "system",
    description: "Libri che spostano opinioni, amicizie, giudizi e piccole certezze.",
    endsAt: "Tra 34 min",
    host: "Marta",
    icon: BookOpen,
    id: "letture-notte",
    isPremium: false,
    joined: false,
    limit: 6,
    mood: "intima",
    people: 3,
    prompt: "Un libro che vi ha cambiato idea su qualcuno?",
    startsAt: "Tra 14 min",
    status: "scheduled",
    title: "Letture da notte fonda",
  },
  {
    category: "Fitness",
    compatibility: 78,
    cost: 5,
    createdBy: "system",
    description: "Routine piccole, sostenibili, senza ansia da performance.",
    endsAt: "Tra 41 min",
    host: "Sam",
    icon: Dumbbell,
    id: "routine",
    isPremium: false,
    joined: false,
    limit: 6,
    mood: "energia",
    people: 6,
    prompt: "Quale abitudine piccola vi ha dato risultati grandi?",
    startsAt: "Tra 21 min",
    status: "scheduled",
    title: "Routine sostenibili",
  },
  {
    category: "Musica",
    compatibility: 84,
    cost: 0,
    createdBy: "system",
    description: "Canzoni come coordinate emotive: dove eri quando l'hai ascoltata la prima volta?",
    endsAt: "Tra 47 min",
    host: "Ari",
    icon: Headphones,
    id: "playlist",
    isPremium: false,
    joined: false,
    limit: 6,
    mood: "nostalgia",
    people: 2,
    prompt: "Quale canzone vi riporta in un posto preciso?",
    startsAt: "Tra 27 min",
    status: "scheduled",
    title: "Playlist senza skip",
  },
  {
    category: "Cucina",
    compatibility: 81,
    cost: 6,
    createdBy: "system",
    description: "Piatti, origini e gesti ereditati senza tutorial.",
    endsAt: "Tra 52 min",
    host: "Dani",
    icon: Utensils,
    id: "cucina-casa",
    isPremium: false,
    joined: false,
    limit: 6,
    mood: "accogliente",
    people: 4,
    prompt: "Quale piatto racconta meglio da dove venite?",
    startsAt: "Tra 32 min",
    status: "scheduled",
    title: "Ricette di casa",
  },
  {
    category: "Gaming",
    compatibility: 75,
    cost: 10,
    createdBy: "system",
    description: "Co-op, party chat e giochi che diventano test di pazienza.",
    endsAt: "Tra 61 min",
    host: "Vale",
    icon: Gamepad2,
    id: "coop",
    isPremium: true,
    joined: false,
    limit: 6,
    mood: "vivace",
    people: 5,
    prompt: "Il gioco che vi ha fatto litigare e ridere nello stesso party?",
    startsAt: "Tra 41 min",
    status: "scheduled",
    title: "Co-op memorabili",
  },
];

export const starterMessages: Record<string, ChatMessage[]> = {
  analogica: [
    {
      author: "Laura",
      createdAt: "18:44",
      id: "m-analogica-1",
      text: "Mi manca quando online si entrava per discutere, non per performare.",
      tone: "host",
    },
    {
      author: "Giulia",
      createdAt: "18:46",
      id: "m-analogica-2",
      text: "Qui almeno il primo filtro e quello che dici, non la copertina.",
      tone: "member",
    },
  ],
  "viaggio-lento": [
    {
      author: "Nico",
      createdAt: "18:50",
      id: "m-viaggio-1",
      text: "Io partirei dalla stazione piu piccola, senza mappe per mezz'ora.",
      tone: "host",
    },
    {
      author: "Teo",
      createdAt: "18:52",
      id: "m-viaggio-2",
      text: "La parte migliore e quando trovi un bar che non avevi cercato.",
      tone: "member",
    },
  ],
  "letture-notte": [
    {
      author: "Marta",
      createdAt: "19:03",
      id: "m-libri-1",
      text: "Le stanze sui libri funzionano perche nessuno riesce a fingere troppo.",
      tone: "host",
    },
  ],
  routine: [
    {
      author: "Sam",
      createdAt: "19:08",
      id: "m-routine-1",
      text: "Per me il punto e togliere frizione, non aggiungere sensi di colpa.",
      tone: "host",
    },
  ],
  playlist: [
    {
      author: "Ari",
      createdAt: "19:12",
      id: "m-playlist-1",
      text: "Una playlist dice molto, ma solo se racconti perche hai scelto quei brani.",
      tone: "host",
    },
  ],
  "cucina-casa": [
    {
      author: "Dani",
      createdAt: "19:18",
      id: "m-cucina-1",
      text: "La cucina e memoria pratica: mani, odori, tempi.",
      tone: "host",
    },
  ],
  coop: [
    {
      author: "Vale",
      createdAt: "19:21",
      id: "m-coop-1",
      text: "I giochi co-op sono una prova di amicizia travestita da lobby.",
      tone: "host",
    },
  ],
};

export const companionMatches: CompanionMatch[] = [
  {
    id: "giulia",
    name: "Giulia",
    score: 94,
    signal: "ha salvato 3 risposte simili",
    status: "locked",
    topic: "Fotografia",
  },
  {
    id: "marta",
    name: "Marta",
    score: 88,
    signal: "preferisce stanze calme",
    status: "locked",
    topic: "Libri",
  },
  {
    id: "nico",
    name: "Nico",
    score: 82,
    signal: "torna spesso nei topic lenti",
    status: "locked",
    topic: "Viaggi",
  },
];

export const themeOptions: ThemeOption[] = [
  {
    description: "Tema base chiaro, calmo e leggibile.",
    id: "zen",
    label: "Digital Zen",
    owned: true,
    premiumOnly: false,
    price: 0,
  },
  {
    description: "Toni caldi e retro per chat serali.",
    id: "sunset",
    label: "Sunset Nostalgia",
    owned: false,
    premiumOnly: false,
    price: 45,
  },
  {
    description: "Palette soft con accenti verdi.",
    id: "pastel",
    label: "Pastel Dream",
    owned: false,
    premiumOnly: false,
    price: 30,
  },
  {
    description: "Contrasto alto per stanze notturne premium.",
    id: "midnight",
    label: "Midnight Focus",
    owned: false,
    premiumOnly: true,
    price: 80,
  },
  {
    description: "Look chatroom arcade, riservato ai membri premium.",
    id: "arcade",
    label: "Arcade Lobby",
    owned: false,
    premiumOnly: true,
    price: 90,
  },
];

export const initialTransactions: WalletTransaction[] = [
  {
    amount: 12,
    id: "tx-streak",
    reason: "Bonus streak giornaliero",
    time: "Oggi",
  },
  {
    amount: -8,
    id: "tx-room",
    reason: "Ingresso stanza Viaggio lento",
    time: "Ieri",
  },
  {
    amount: 20,
    id: "tx-ad",
    reason: "Ricompensa annuncio",
    time: "2 giorni fa",
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "n-room",
    message: "La stanza Fotografia analogica e live.",
    status: "new",
    title: "Stanza iniziata",
  },
  {
    id: "n-match",
    message: "Giulia e sbloccabile dopo il rituale.",
    status: "new",
    title: "Nuova affinita",
  },
  {
    id: "n-premium",
    message: "Tema Midnight Focus disponibile nel wallet.",
    status: "read",
    title: "Tema premium",
  },
];

export const moderationReports: ModerationReport[] = [
  {
    id: "rep-1",
    reason: "Messaggio fuori topic",
    room: "Routine sostenibili",
    status: "reviewing",
  },
  {
    id: "rep-2",
    reason: "Profilo incompleto in stanza premium",
    room: "Co-op memorabili",
    status: "open",
  },
];

export const emptyRoomDraft: RoomDraft = {
  coinCost: 0,
  durationMinutes: 20,
  maxMembers: 6,
  mood: "calma",
  prompt: "",
  title: "",
  topic: "Cinema",
};
