import {
  BookOpen,
  Camera,
  Dumbbell,
  Gamepad2,
  Headphones,
  Plane,
  Utensils,
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

export type TopicRoom = {
  id: string;
  category: Exclude<TopicCategory, "Tutti">;
  title: string;
  prompt: string;
  host: string;
  timer: string;
  startsAt: string;
  people: number;
  limit: number;
  cost: number;
  mood: string;
  compatibility: number;
  icon: typeof Camera;
};

export type ChatMessage = {
  author: string;
  text: string;
  tone?: "host" | "member" | "you";
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

export const rooms: TopicRoom[] = [
  {
    id: "analogica",
    category: "Cinema",
    title: "Fotografia analogica nei film",
    prompt: "Quale scena vi ha fatto fermare per guardare davvero la luce?",
    host: "Laura",
    timer: "18:42",
    startsAt: "Ora",
    people: 4,
    limit: 6,
    cost: 0,
    mood: "calma",
    compatibility: 92,
    icon: Camera,
  },
  {
    id: "viaggio-lento",
    category: "Viaggi",
    title: "Viaggio lento",
    prompt: "Meglio perdersi in una citta o pianificare ogni tappa?",
    host: "Nico",
    timer: "12:09",
    startsAt: "Tra 6 min",
    people: 5,
    limit: 6,
    cost: 8,
    mood: "curiosa",
    compatibility: 86,
    icon: Plane,
  },
  {
    id: "letture-notte",
    category: "Libri",
    title: "Letture da notte fonda",
    prompt: "Un libro che vi ha cambiato idea su qualcuno?",
    host: "Marta",
    timer: "20:00",
    startsAt: "Tra 14 min",
    people: 3,
    limit: 6,
    cost: 0,
    mood: "intima",
    compatibility: 89,
    icon: BookOpen,
  },
  {
    id: "routine",
    category: "Fitness",
    title: "Routine sostenibili",
    prompt: "Quale abitudine piccola vi ha dato risultati grandi?",
    host: "Sam",
    timer: "09:31",
    startsAt: "Tra 21 min",
    people: 6,
    limit: 6,
    cost: 5,
    mood: "energia",
    compatibility: 78,
    icon: Dumbbell,
  },
  {
    id: "playlist",
    category: "Musica",
    title: "Playlist senza skip",
    prompt: "Quale canzone vi riporta in un posto preciso?",
    host: "Ari",
    timer: "15:16",
    startsAt: "Tra 27 min",
    people: 2,
    limit: 6,
    cost: 0,
    mood: "nostalgia",
    compatibility: 84,
    icon: Headphones,
  },
  {
    id: "cucina-casa",
    category: "Cucina",
    title: "Ricette di casa",
    prompt: "Quale piatto racconta meglio da dove venite?",
    host: "Dani",
    timer: "20:00",
    startsAt: "Tra 32 min",
    people: 4,
    limit: 6,
    cost: 6,
    mood: "accogliente",
    compatibility: 81,
    icon: Utensils,
  },
  {
    id: "coop",
    category: "Gaming",
    title: "Co-op memorabili",
    prompt: "Il gioco che vi ha fatto litigare e ridere nello stesso party?",
    host: "Vale",
    timer: "20:00",
    startsAt: "Tra 41 min",
    people: 5,
    limit: 6,
    cost: 10,
    mood: "vivace",
    compatibility: 75,
    icon: Gamepad2,
  },
];

export const starterMessages: Record<string, ChatMessage[]> = {
  analogica: [
    {
      author: "Laura",
      text: "Mi manca quando online si entrava per discutere, non per performare.",
      tone: "host",
    },
    {
      author: "Giulia",
      text: "Qui almeno il primo filtro e quello che dici, non la copertina.",
      tone: "member",
    },
  ],
  "viaggio-lento": [
    {
      author: "Nico",
      text: "Io partirei dalla stazione piu piccola, senza mappe per mezz'ora.",
      tone: "host",
    },
    {
      author: "Teo",
      text: "La parte migliore e quando trovi un bar che non avevi cercato.",
      tone: "member",
    },
  ],
  "letture-notte": [
    {
      author: "Marta",
      text: "Le stanze sui libri funzionano perche nessuno riesce a fingere troppo.",
      tone: "host",
    },
  ],
  routine: [
    {
      author: "Sam",
      text: "Per me il punto e togliere frizione, non aggiungere sensi di colpa.",
      tone: "host",
    },
  ],
  playlist: [
    {
      author: "Ari",
      text: "Una playlist dice molto, ma solo se racconti perche hai scelto quei brani.",
      tone: "host",
    },
  ],
  "cucina-casa": [
    {
      author: "Dani",
      text: "La cucina e memoria pratica: mani, odori, tempi.",
      tone: "host",
    },
  ],
  coop: [
    {
      author: "Vale",
      text: "I giochi co-op sono una prova di amicizia travestita da lobby.",
      tone: "host",
    },
  ],
};

export const companionMatches = [
  {
    name: "Giulia",
    topic: "Fotografia",
    signal: "ha salvato 3 risposte simili",
    score: 94,
  },
  {
    name: "Marta",
    topic: "Libri",
    signal: "preferisce stanze calme",
    score: 88,
  },
  {
    name: "Nico",
    topic: "Viaggi",
    signal: "torna spesso nei topic lenti",
    score: 82,
  },
];

export const themeOptions = [
  {
    id: "zen",
    label: "Digital Zen",
    price: 0,
  },
  {
    id: "sunset",
    label: "Sunset Nostalgia",
    price: 45,
  },
  {
    id: "pastel",
    label: "Pastel Dream",
    price: 30,
  },
] as const;
