"use client";

import { FormEvent, startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Check,
  Clock,
  Coins,
  Copy,
  Crown,
  Eye,
  Flag,
  Flame,
  Gift,
  Hash,
  LockKeyhole,
  LogOut,
  Megaphone,
  MessageCircle,
  Palette,
  Plus,
  Search,
  Send,
  ShieldAlert,
  SmilePlus,
  Sparkles,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import {
  categories,
  companionMatches,
  communityFeedbacks,
  createRandomRooms,
  createStarterMessagesForRooms,
  emptyFeedbackDraft,
  emptyRoomDraft,
  initialProfile,
  initialTransactions,
  moderationReports,
  notifications,
  roadmapUpdates,
  rooms,
  starterMessages,
  themeOptions,
  topicIcons,
  type ChatMessage,
  type CommunityFeedback,
  type CompanionMatch,
  type FeedbackDraft,
  type ModerationReport,
  type NotificationItem,
  type RoomDraft,
  type ThemeId,
  type ThemeOption,
  type TopicCategory,
  type TopicRoom,
  type UserProfile,
  type WalletTransaction,
} from "@/data/topic-time";
import {
  activatePremiumInDatabase,
  claimStreakInDatabase,
  claimFreeGiftInDatabase,
  createRoomInDatabase,
  joinRoomInDatabase,
  leaveRoomInDatabase,
  loadTopicTimeSnapshot,
  markNotificationsReadInDatabase,
  postMessageInDatabase,
  purchaseThemeInDatabase,
  reportRoomInDatabase,
  reactToMessageInDatabase,
  saveProfileInDatabase,
  submitCommunityFeedbackInDatabase,
} from "@/lib/topic-time-db";

const coinPacks = [
  { amount: 30, label: "Primi passi", price: "1,99" },
  { amount: 80, label: "Serata chat", price: "4,99" },
  { amount: 180, label: "Crea stanze", price: "9,99" },
];

const quickReplies = [
  "Sono d'accordo perche...",
  "Secondo me invece...",
  "Mi aggancio a questo punto:",
  "Una domanda:",
];

const messageReactions = ["+1", "<3", "!!"];

type AccessState = "loading" | "guest" | "authenticated";
type SnapshotData = NonNullable<Awaited<ReturnType<typeof loadTopicTimeSnapshot>>["data"]>;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 42);
}

function makeMessage(text: string, id = `m-${Date.now()}`): ChatMessage {
  return {
    author: "Tu",
    createdAt: new Date().toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    id,
    reactions: {},
    status: "inviato",
    text,
    tone: "you",
  };
}

function getRequestedRoomId() {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get("room");
}

function isDatabaseId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function roomStatusLabel(status: TopicRoom["status"]) {
  if (status === "live") {
    return "Aperta ora";
  }

  if (status === "scheduled") {
    return "In partenza";
  }

  return "Conclusa";
}

function reportStatusLabel(status: ModerationReport["status"]) {
  if (status === "open") {
    return "Da vedere";
  }

  if (status === "reviewing") {
    return "In verifica";
  }

  return "Chiusa";
}

function feedbackStatusLabel(status: CommunityFeedback["status"]) {
  if (status === "nuovo") {
    return "Nuova idea";
  }

  if (status === "in revisione") {
    return "In revisione";
  }

  if (status === "pianificato") {
    return "In roadmap";
  }

  return "Rilasciata";
}

export function TopicTimeApp() {
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const userChoseAccessRef = useRef(false);
  const [activeCategory, setActiveCategory] = useState<TopicCategory>("Tutti");
  const [roomsState, setRoomsState] = useState<TopicRoom[]>(rooms);
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0].id);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [themes, setThemes] = useState<ThemeOption[]>(themeOptions);
  const [matches, setMatches] = useState<CompanionMatch[]>(companionMatches);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(initialTransactions);
  const [noticeList, setNoticeList] = useState<NotificationItem[]>(notifications);
  const [reports, setReports] = useState<ModerationReport[]>(moderationReports);
  const [communityIdeas, setCommunityIdeas] = useState<CommunityFeedback[]>(communityFeedbacks);
  const [roomDraft, setRoomDraft] = useState<RoomDraft>(emptyRoomDraft);
  const [feedbackDraft, setFeedbackDraft] = useState<FeedbackDraft>(emptyFeedbackDraft);
  const [newInterest, setNewInterest] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [syncMessage, setSyncMessage] = useState("TopicTime pronto: scegli una stanza o riscatta Star nel wallet.");
  const [databaseOnline, setDatabaseOnline] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>(
    () =>
      rooms.reduce<Record<string, ChatMessage[]>>((accumulator, room) => {
        accumulator[room.id] = starterMessages[room.id] ?? [];
        return accumulator;
      }, {}),
  );

  function seedRandomLobby(announce = false) {
    const randomRooms = createRandomRooms();

    setRoomsState(randomRooms);
    setSelectedRoomId((current) => {
      const requestedRoomId = getRequestedRoomId();
      return randomRooms.find((room) => room.id === requestedRoomId)?.id ?? randomRooms[0]?.id ?? current;
    });
    setMessagesByRoom(createStarterMessagesForRooms(randomRooms));

    if (announce) {
      setSync({ message: "Nuova lobby pronta: scegli una stanza e guarda costo, utenti e topic." });
    }
  }

  function applySnapshotData(snapshotData: SnapshotData) {
    if (snapshotData.rooms.length > 0) {
      setRoomsState(snapshotData.rooms);
      setSelectedRoomId((current) => {
        const requestedRoomId = getRequestedRoomId();
        return (
          snapshotData.rooms.find((room) => room.id === requestedRoomId)?.id ??
          (snapshotData.rooms.some((room) => room.id === current) ? current : snapshotData.rooms[0]?.id ?? current)
        );
      });
    } else {
      seedRandomLobby();
    }

    if (snapshotData.profile) {
      setProfile(snapshotData.profile);
    }

    if (snapshotData.themes.length > 0) {
      setThemes(snapshotData.themes);
    }

    if (snapshotData.transactions.length > 0) {
      setTransactions(snapshotData.transactions);
    }

    if (snapshotData.notifications.length > 0) {
      setNoticeList(snapshotData.notifications);
    }

    if (snapshotData.communityFeedbacks.length > 0) {
      setCommunityIdeas(snapshotData.communityFeedbacks);
    }

    if (Object.keys(snapshotData.messagesByRoom).length > 0) {
      setMessagesByRoom((current) => ({
        ...current,
        ...snapshotData.messagesByRoom,
      }));
    }
  }

  async function refreshRemoteSession() {
    const snapshot = await loadTopicTimeSnapshot();

    setDatabaseOnline(snapshot.mode === "remote");
    setSync(snapshot);

    if (!snapshot.ok || !snapshot.data) {
      return;
    }

    applySnapshotData(snapshot.data);
    setAccessState(snapshot.data.authenticated ? "authenticated" : "guest");
  }

  useEffect(() => {
    let mounted = true;

    loadTopicTimeSnapshot().then((snapshot) => {
      if (!mounted || userChoseAccessRef.current) {
        return;
      }

      setDatabaseOnline(snapshot.mode === "remote");
      setSync(snapshot);

      if (!snapshot.ok || !snapshot.data) {
        setAccessState("guest");
        seedRandomLobby();
        return;
      }

      applySnapshotData(snapshot.data);
      setAccessState(snapshot.data.authenticated ? "authenticated" : "guest");
    });

    return () => {
      mounted = false;
    };
  }, []);

  const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
  const filteredRooms = roomsState.filter((room) => {
    const matchesCategory = activeCategory === "Tutti" || room.category === activeCategory;
    const matchesSearch =
      !normalizedSearch ||
      `${room.title} ${room.prompt} ${room.host} ${room.category}`
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });

  const selectedRoom =
    roomsState.find((room) => room.id === selectedRoomId) ?? filteredRooms[0] ?? roomsState[0];
  const selectedMessages = messagesByRoom[selectedRoom.id] ?? [];
  const unreadCount = noticeList.filter((notice) => notice.status === "new").length;
  const isAppUnlocked = accessState === "authenticated";
  const premiumActive = Boolean(profile.premiumUntil);
  const giftClaimedToday = profile.lastGiftAt === todayKey();
  const profileProgress = Math.min(
    100,
    28 +
      (profile.displayName ? 18 : 0) +
      (profile.bio ? 18 : 0) +
      Math.min(profile.interests.length, 4) * 9,
  );
  const joinedCount = roomsState.filter((room) => room.joined).length;
  const liveCount = roomsState.filter((room) => room.status === "live").length;
  const feedbackVotes = communityIdeas.reduce((total, idea) => total + idea.votes, 0);
  const dailyRoomLimit = premiumActive ? "Illimitate" : "5 stanze";
  const starMultiplier = premiumActive ? "2x" : "1x";
  const hasSentMessage = Object.values(messagesByRoom).some((messages) =>
    messages.some((message) => message.tone === "you"),
  );
  const hasProfileBasics =
    Boolean(profile.displayName.trim()) && profile.bio.trim().length >= 12 && profile.interests.length >= 2;
  const selectedRoomEntryLabel = selectedRoom.joined
    ? "Sei dentro"
    : selectedRoom.people >= selectedRoom.limit
      ? "Stanza piena"
      : selectedRoom.cost === 0
        ? "Entra gratis"
        : `Entra con ${selectedRoom.cost} Star`;
  const onboardingItems = [
    {
      done: accessState === "authenticated",
      hint: "Profilo, Star e stanze sono sincronizzati.",
      id: "account",
      title: "Account verificato",
    },
    {
      done: giftClaimedToday,
      hint: "Ti da Star reali per entrare nelle stanze senza attrito.",
      id: "gift",
      title: "Prendi il regalo di oggi",
    },
    {
      done: joinedCount > 0,
      hint: "Scegli un topic chiaro e guarda chi c'e dentro.",
      id: "room",
      title: "Entra in una stanza",
    },
    {
      done: hasSentMessage,
      hint: "Una risposta breve basta per far partire la conversazione.",
      id: "message",
      title: "Scrivi il primo messaggio",
    },
    {
      done: hasProfileBasics,
      hint: "Bio e interessi aiutano il radar a trovarti persone compatibili.",
      id: "profile",
      title: "Completa il profilo",
    },
    {
      done: premiumActive,
      hint: "Premium sblocca la creazione di chatroom e temi esclusivi.",
      id: "premium",
      title: "Crea stanze tue",
    },
  ];
  const onboardingDoneCount = onboardingItems.filter((item) => item.done).length;
  const onboardingProgress = Math.round((onboardingDoneCount / onboardingItems.length) * 100);
  const nextOnboardingItem = onboardingItems.find((item) => !item.done);
  const guideTitle = nextOnboardingItem ? nextOnboardingItem.title : "La demo e pronta";
  const guideText = nextOnboardingItem
    ? nextOnboardingItem.hint
    : "Hai completato il flusso principale: ora puoi provare una nuova stanza o creare una room se hai Premium.";
  const guideActionLabel =
    nextOnboardingItem?.id === "gift"
      ? "Prendi +25 Star"
      : nextOnboardingItem?.id === "room"
        ? "Scegli una stanza"
        : nextOnboardingItem?.id === "message"
          ? selectedRoom.joined
            ? "Scrivi ora"
            : "Entra nella stanza"
          : nextOnboardingItem?.id === "profile"
            ? "Completa profilo"
            : nextOnboardingItem?.id === "premium"
              ? "Vai al wallet"
              : "Apri una nuova lobby";

  function setSync(result: { message: string; mode?: "remote"; ok?: boolean }) {
    const prefix = result.ok === false ? "Attenzione" : result.mode === "remote" ? "Fatto" : "Nota";
    setSyncMessage(`${prefix}: ${result.message}`);
  }

  function addTransaction(amount: number, reason: string) {
    setTransactions((current) => [
      {
        amount,
        id: `tx-${Date.now()}`,
        reason,
        time: "Adesso",
      },
      ...current.slice(0, 7),
    ]);
  }

  function chooseCategory(category: TopicCategory) {
    startTransition(() => {
      setActiveCategory(category);
      const firstRoom =
        category === "Tutti" ? roomsState[0] : roomsState.find((room) => room.category === category);

      if (firstRoom) {
        setSelectedRoomId(firstRoom.id);
      }
    });
  }

  function selectRoom(roomId: string) {
    setSelectedRoomId(roomId);
    setRoomsState((current) =>
      current.map((room) => (room.id === roomId ? { ...room, unreadCount: 0 } : room)),
    );
  }

  async function joinSelectedRoom() {
    if (!isAppUnlocked) {
      setSync({ message: "Accedi prima di entrare: cosi salvi Star, chat e progressi." });
      return;
    }

    if (selectedRoom.joined) {
      setSync({ message: "Sei gia dentro. Scrivi un messaggio o invita qualcuno." });
      return;
    }

    if (selectedRoom.people >= selectedRoom.limit) {
      setSync({ message: "Questa stanza e piena. Scegli un'altra stanza o genera una nuova lobby." });
      return;
    }

    if (selectedRoom.isPremium && !premiumActive) {
      setSync({ message: "Stanza Premium: attiva Premium dal wallet per entrare." });
      return;
    }

    if (selectedRoom.cost > profile.coins) {
      setSync({ message: "Star insufficienti. Riscatta il regalo gratuito o torna domani per la streak." });
      return;
    }

    const result = await joinRoomInDatabase(selectedRoom.id);

    if (!result.ok) {
      setSync(result);
      return;
    }

    const alreadyJoinedInDatabase = Boolean(result.data?.already_joined);
    const walletAfterJoin = result.data?.coins;
    const chargedForEntry = selectedRoom.cost > 0 && !alreadyJoinedInDatabase;

    setRoomsState((current) =>
      current.map((room) =>
        room.id === selectedRoom.id
          ? {
              ...room,
              joined: true,
              participants: room.participants.includes(profile.displayName)
                ? room.participants
                : [...room.participants, profile.displayName].slice(0, room.limit),
              people: alreadyJoinedInDatabase ? room.people : Math.min(room.limit, room.people + 1),
              status: room.status === "scheduled" ? "live" : room.status,
            }
          : room,
      ),
    );

    if (walletAfterJoin !== undefined) {
      setProfile((current) => ({ ...current, coins: walletAfterJoin }));
    } else if (chargedForEntry) {
      setProfile((current) => ({ ...current, coins: current.coins - selectedRoom.cost }));
    }

    if (chargedForEntry) {
      addTransaction(-selectedRoom.cost, `Ingresso stanza ${selectedRoom.title}`);
    }

    setMessagesByRoom((current) => ({
      ...current,
      [selectedRoom.id]: [
        ...(current[selectedRoom.id] ?? []),
        {
          author: "TopicTime",
          createdAt: "Ora",
          id: `system-${Date.now()}`,
          text: "Sei dentro. Leggi il topic e rompi il ghiaccio con una risposta breve.",
          tone: "system",
        },
      ],
    }));
    setSync(result);
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    if (!isAppUnlocked) {
      setSync({ message: "Accedi per scrivere e salvare la conversazione." });
      return;
    }

    if (!selectedRoom.joined) {
      setSync({ message: "Prima entra nella stanza, poi potrai scrivere." });
      return;
    }

    const result = await postMessageInDatabase(selectedRoom.id, trimmedMessage);

    if (!result.ok) {
      setSync(result);
      return;
    }

    setMessagesByRoom((current) => ({
      ...current,
      [selectedRoom.id]: [
        ...(current[selectedRoom.id] ?? []),
        makeMessage(trimmedMessage, result.data?.message_id ?? `m-${Date.now()}`),
      ],
    }));
    setDraftMessage("");
    setSync(result);
  }

  async function leaveSelectedRoom() {
    if (!selectedRoom.joined) {
      setSync({ message: "Non sei ancora in questa stanza." });
      return;
    }

    const result = await leaveRoomInDatabase(selectedRoom.id);

    if (!result.ok) {
      setSync(result);
      return;
    }

    setRoomsState((current) =>
      current.map((room) =>
        room.id === selectedRoom.id
          ? {
              ...room,
              joined: false,
              participants: room.participants.filter((participant) => participant !== profile.displayName),
              people: Math.max(0, room.people - 1),
            }
          : room,
      ),
    );
    setMessagesByRoom((current) => ({
      ...current,
      [selectedRoom.id]: [
        ...(current[selectedRoom.id] ?? []),
        {
          author: "TopicTime",
          createdAt: "Ora",
          id: `system-leave-${Date.now()}`,
          text: "Hai lasciato la stanza. Puoi rientrare finche il timer e attivo.",
          tone: "system",
        },
      ],
    }));
    setSync(result);
  }

  async function reactToMessage(message: ChatMessage, reaction: string) {
    if (!isAppUnlocked) {
      setSync({ message: "Accedi per reagire e salvare il segnale nella stanza." });
      return;
    }

    if (!selectedRoom.joined) {
      setSync({ message: "Prima entra nella stanza, poi puoi reagire ai messaggi." });
      return;
    }

    if (!isDatabaseId(message.id)) {
      setSync({
        message: "Puoi reagire ai messaggi salvati della stanza. Scrivi o attendi nuovi messaggi reali.",
      });
      return;
    }

    const result = await reactToMessageInDatabase(message.id, reaction);

    if (!result.ok) {
      setSync(result);
      return;
    }

    const delta = result.data?.selected === false ? -1 : 1;

    setMessagesByRoom((current) => ({
      ...current,
      [selectedRoom.id]: (current[selectedRoom.id] ?? []).map((item) =>
        item.id === message.id
          ? {
              ...item,
              reactions: {
                ...(item.reactions ?? {}),
                [reaction]: Math.max(0, (item.reactions?.[reaction] ?? 0) + delta),
              },
            }
          : item,
      ),
    }));
  }

  function addQuickReply(reply: string) {
    if (!selectedRoom.joined) {
      setSync({ message: "Prima entra nella stanza, poi usa le risposte rapide." });
      return;
    }

    setDraftMessage((current) => (current ? `${current} ${reply}` : reply));
  }

  function quoteMessage(message: ChatMessage) {
    if (!selectedRoom.joined) {
      setSync({ message: "Prima entra nella stanza, poi puoi rispondere ai messaggi." });
      return;
    }

    setDraftMessage((current) => `${current ? `${current} ` : ""}@${message.author} `);
  }

  async function copyRoomInvite() {
    const inviteUrl = `${window.location.origin}/rooms?room=${selectedRoom.id}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setSync({ message: "Invito copiato. Puoi condividerlo con un amico." });
    } catch {
      setSync({ message: `Invito stanza: ${inviteUrl}` });
    }
  }

  function toggleMuteSelectedRoom() {
    setRoomsState((current) =>
      current.map((room) =>
        room.id === selectedRoom.id
          ? {
              ...room,
              muted: !room.muted,
            }
          : room,
      ),
    );
    setSync({ message: selectedRoom.muted ? "Notifiche stanza riattivate." : "Notifiche stanza silenziate." });
  }

  async function claimStreak() {
    if (profile.lastStreakAt === todayKey()) {
      setSync({ message: "Streak gia riscattata oggi. Torna domani per continuare la serie." });
      return;
    }

    const result = await claimStreakInDatabase();
    const reward = result.data?.reward ?? 12;
    const streak = result.data?.streak ?? profile.streak + 1;

    if (!result.ok) {
      setSync(result);
      return;
    }

    if (reward <= 0) {
      setProfile((current) => ({ ...current, lastStreakAt: todayKey() }));
      setSync({ message: "Streak gia riscattata oggi.", mode: result.mode });
      return;
    }

    setProfile((current) => ({
      ...current,
      coins: current.coins + reward,
      lastStreakAt: todayKey(),
      streak,
    }));
    addTransaction(reward, `Bonus streak ${streak} giorni`);
    setSync(result);
  }

  async function claimFreeGift() {
    if (giftClaimedToday) {
      setSync({ message: "Regalo gia preso oggi. Domani trovi nuove Star gratis." });
      return;
    }

    const result = await claimFreeGiftInDatabase();
    const reward = result.data?.reward ?? 25;

    if (!result.ok) {
      setSync(result);
      return;
    }

    if (reward <= 0) {
      setProfile((current) => ({ ...current, lastGiftAt: todayKey() }));
      setSync({ message: "Regalo gia preso oggi. Domani trovi nuove Star gratis.", mode: result.mode });
      return;
    }

    setProfile((current) => ({
      ...current,
      coins: current.coins + reward,
      lastGiftAt: todayKey(),
    }));
    addTransaction(reward, "Regalo gratuito giornaliero");
    setSync(result);
  }

  function watchAdReward() {
    setSync({
      message: "I bonus extra arriveranno con ricompense verificate. Per ora puoi usare regalo gratuito, streak e feedback.",
    });
  }

  function buyCoinPack(amount: number, label: string) {
    setSync({
      message: `Le ricariche ${label} saranno disponibili appena apriamo gli acquisti. Per ora puoi guadagnare Star con regalo, streak e feedback.`,
    });
  }

  async function selectOrBuyTheme(theme: ThemeOption) {
    if (theme.owned) {
      setProfile((current) => ({ ...current, selectedThemeId: theme.id }));
      setSync({ message: `Tema ${theme.label} attivato.` });
      return;
    }

    if (theme.premiumOnly && !premiumActive) {
      setSync({ message: "Tema Premium: attiva Premium prima di acquistarlo." });
      return;
    }

    if (profile.coins < theme.price) {
      setSync({ message: "Star insufficienti per questo tema." });
      return;
    }

    const result = await purchaseThemeInDatabase(theme.id);

    if (!result.ok) {
      setSync(result);
      return;
    }

    setThemes((current) =>
      current.map((item) => (item.id === theme.id ? { ...item, owned: true } : item)),
    );
    setProfile((current) => ({
      ...current,
      coins: current.coins - theme.price,
      selectedThemeId: theme.id,
    }));
    addTransaction(-theme.price, `Tema ${theme.label}`);
    setSync(result);
  }

  async function activatePremium() {
    if (profile.coins < 99) {
      setSync({ message: "Servono 99 Star per attivare Premium." });
      return;
    }

    const result = await activatePremiumInDatabase();

    if (!result.ok) {
      setSync(result);
      return;
    }

    const premiumUntil = result.data?.premium_until
      ? new Date(result.data.premium_until).toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Premium attivo per 30 giorni";
    const cost = result.data?.cost ?? 99;

    setProfile((current) => ({
      ...current,
      coins: result.data?.coins ?? current.coins - cost,
      premiumUntil,
    }));
    addTransaction(-cost, "Abbonamento Premium");
    setSync(result);
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await saveProfileInDatabase(profile);
    setSync(result);
  }

  function addInterest() {
    const value = newInterest.trim();

    if (!value || profile.interests.includes(value)) {
      return;
    }

    setProfile((current) => ({
      ...current,
      interests: [...current.interests, value].slice(0, 8),
    }));
    setNewInterest("");
  }

  function removeInterest(interest: string) {
    setProfile((current) => ({
      ...current,
      interests: current.interests.filter((item) => item !== interest),
    }));
  }

  async function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!premiumActive) {
      setSync({ message: "La creazione stanze e riservata agli utenti Premium." });
      return;
    }

    if (!roomDraft.title.trim() || !roomDraft.prompt.trim()) {
      setSync({ message: "Aggiungi titolo e domanda: aiutano gli utenti a capire dove entrare." });
      return;
    }

    const startsAtIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const result = await createRoomInDatabase({
      coinCost: roomDraft.coinCost,
      durationMinutes: roomDraft.durationMinutes,
      maxMembers: roomDraft.maxMembers,
      mood: roomDraft.mood,
      prompt: roomDraft.prompt,
      startsAtIso,
      title: roomDraft.title,
      topicSlug: roomDraft.topic.toLowerCase(),
    });

    if (!result.ok) {
      setSync(result);
      return;
    }

    const fallbackSlug = makeSlug(roomDraft.title) || `stanza-${Date.now()}`;
    const id = result.data?.room_slug ?? fallbackSlug;
    const Icon = topicIcons[roomDraft.topic];
    const newRoom: TopicRoom = {
      category: roomDraft.topic,
      compatibility: 80,
      cost: roomDraft.coinCost,
      createdBy: profile.username,
      description: "Stanza appena pubblicata: entra, invita qualcuno e fai partire la conversazione.",
      endsAt: `Tra ${roomDraft.durationMinutes + 10} min`,
      host: profile.displayName,
      icon: Icon,
      id,
      isPremium: false,
      joined: true,
      limit: roomDraft.maxMembers,
      muted: false,
      mood: roomDraft.mood,
      participants: [profile.displayName],
      people: 1,
      prompt: roomDraft.prompt,
      startsAt: "Tra 10 min",
      status: "scheduled",
      title: roomDraft.title,
      unreadCount: 0,
    };

    setRoomsState((current) => [newRoom, ...current]);
    setMessagesByRoom((current) => ({
      ...current,
      [id]: [
        {
          author: "TopicTime",
          createdAt: "Ora",
          id: `system-${Date.now()}`,
          text: "Stanza creata. Condividi l'invito o aspetta i primi utenti dalla lobby.",
          tone: "system",
        },
      ],
    }));
    setSelectedRoomId(id);
    setRoomDraft(emptyRoomDraft);
    setSync(result);
  }

  function voteCommunityIdea(ideaId: string) {
    setCommunityIdeas((current) =>
      current.map((idea) => (idea.id === ideaId ? { ...idea, votes: idea.votes + 1 } : idea)),
    );
    setSync({ message: "Voto aggiunto. Le idee piu votate entrano nella roadmap del prodotto." });
  }

  async function handleSubmitCommunityFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAppUnlocked) {
      setSync({ message: "Accedi con il tuo account per inviare feedback alla community." });
      return;
    }

    const title = feedbackDraft.title.trim();
    const body = feedbackDraft.body.trim();

    if (!title || !body) {
      setSync({ message: "Scrivi un titolo e una proposta concreta prima di pubblicare." });
      return;
    }

    const result = await submitCommunityFeedbackInDatabase({
      body,
      category: feedbackDraft.category,
      title,
    });

    if (!result.ok) {
      setSync(result);
      return;
    }

    const reward = result.data?.reward ?? 5;
    const newIdea: CommunityFeedback = {
      author: profile.displayName,
      body,
      category: feedbackDraft.category,
      createdAt: "Adesso",
      id: result.data?.id ?? `cf-${Date.now()}`,
      reward,
      status: "nuovo",
      title,
      votes: 1,
    };

    setCommunityIdeas((current) => [newIdea, ...current]);
    setFeedbackDraft(emptyFeedbackDraft);
    setProfile((current) => ({ ...current, coins: current.coins + reward }));
    addTransaction(reward, "Feedback community");
    setNoticeList((current) => [
      {
        id: `notice-community-${Date.now()}`,
        message: "La tua proposta e entrata nel Community Hub.",
        status: "new",
        title: `+${reward} Star feedback`,
      },
      ...current,
    ]);
    setSync(result);
  }

  function requestMatch(matchId: string) {
    setMatches((current) =>
      current.map((match) => (match.id === matchId ? { ...match, status: "requested" } : match)),
    );
    setSync({ message: "Richiesta inviata. Se accetta, lo trovi tra i contatti." });
  }

  function acceptMatch(matchId: string) {
    setMatches((current) =>
      current.map((match) => (match.id === matchId ? { ...match, status: "friend" } : match)),
    );
    setSync({ message: "Contatto aggiunto. Puoi ritrovarlo dopo la stanza." });
  }

  async function markNotificationsRead() {
    if (unreadCount === 0) {
      setSync({ message: "Non ci sono nuove notifiche da leggere." });
      return;
    }

    setNoticeList((current) => current.map((notice) => ({ ...notice, status: "read" })));
    const result = await markNotificationsReadInDatabase();

    if (!result.ok) {
      setSync(result);
      return;
    }

    setSync(result);
  }

  function closeReport(reportId: string) {
    setReports((current) =>
      current.map((report) => (report.id === reportId ? { ...report, status: "closed" } : report)),
    );
  }

  async function reportSelectedRoom() {
    const alreadyOpen = reports.some(
      (report) => report.room === selectedRoom.title && report.status !== "closed",
    );

    if (alreadyOpen) {
      setSync({ message: "C'e gia una segnalazione aperta per questa stanza. La stiamo tenendo d'occhio." });
      return;
    }

    const reason = "Controllo richiesto dalla community";
    const result = await reportRoomInDatabase(selectedRoom.id, reason);

    if (!result.ok) {
      setSync(result);
      return;
    }

    setReports((current) => [
      {
        id: result.data?.report_id ?? `rep-${Date.now()}`,
        reason,
        room: selectedRoom.title,
        status: "open",
      },
      ...current,
    ]);
    setNoticeList((current) => [
      {
        id: `notice-report-${Date.now()}`,
        message: "Grazie: il team controllera la stanza e le regole resteranno visibili agli utenti.",
        status: "new",
        title: "Segnalazione ricevuta",
      },
      ...current,
    ]);
    setSync(result);
  }

  function scrollToAppSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleGuideAction() {
    if (!nextOnboardingItem) {
      seedRandomLobby(true);
      scrollToAppSection("rooms");
      return;
    }

    if (nextOnboardingItem.id === "gift") {
      void claimFreeGift();
      return;
    }

    if (nextOnboardingItem.id === "room") {
      scrollToAppSection("rooms");
      return;
    }

    if (nextOnboardingItem.id === "message") {
      if (!selectedRoom.joined) {
        void joinSelectedRoom();
        return;
      }

      scrollToAppSection("live-room");
      return;
    }

    if (nextOnboardingItem.id === "profile") {
      scrollToAppSection("profile");
      return;
    }

    if (nextOnboardingItem.id === "premium") {
      scrollToAppSection("wallet");
      return;
    }
  }

  if (!isAppUnlocked) {
    return (
      <main className="login-shell" data-theme={profile.selectedThemeId}>
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-copy">
            <Image src="/brand/logo-mark.png" alt="" width={68} height={68} priority />
            <p className="eyeline">Chatroom a tempo</p>
            <h1 id="login-title">Entra con il tuo account. Poi si parla.</h1>
            <p>
              TopicTime salva profilo, Star e chatroom sul tuo account verificato. Crea l'accesso,
              conferma la mail e ritrovi tutto quando torni.
            </p>
          </div>

          <div className="login-side">
            <div className="flow-steps" aria-label="Flusso applicativo">
              <span>1. Crea account con email e password</span>
              <span>2. Conferma la mail ricevuta</span>
              <span>3. Accedi e apri la lobby</span>
              <span>4. Riscatta Star, entra nelle stanze e crea chatroom Premium</span>
            </div>

            {accessState === "loading" ? (
              <p className="auth-status">Prepariamo lobby, wallet e sessione...</p>
            ) : null}

            <AuthPanel
              variant="gate"
              onAuthChange={(user) => {
                if (user) {
                  userChoseAccessRef.current = true;
                  setAccessState("authenticated");
                  void refreshRemoteSession();
                }
              }}
            />

            <p className="login-helper">
              Per sicurezza la password non compare nel database pubblico: Supabase Auth la conserva come hash
              nella tabella interna `auth.users`.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="topic-app" data-theme={profile.selectedThemeId}>
      <aside className="sidebar" aria-label="Navigazione TopicTime">
        <Link className="brand-lockup" href="/" aria-label="TopicTime home">
          <Image src="/brand/logo-mark.png" alt="" width={52} height={52} priority />
          <span>
            <strong>TopicTime</strong>
            <small>stanze che partono davvero</small>
          </span>
        </Link>

        <nav className="side-nav">
          <Link href="#rooms" className="is-active">
            <Hash size={18} />
            Stanze
          </Link>
          <Link href="#community">
            <Users size={18} />
            Persone
          </Link>
          <Link href="#wallet">
            <Coins size={18} />
            Star
          </Link>
          <Link href="#community-hub">
            <MessageCircle size={18} />
            Community
          </Link>
          <Link href="/radar">
            <Wand2 size={18} />
            Radar
          </Link>
          <Link href="/support">
            <ShieldAlert size={18} />
            Supporto
          </Link>
        </nav>

        <div className="sidebar-profile">
          <span>{profile.avatarInitials}</span>
          <div>
            <strong>{profile.displayName}</strong>
            <small>utente attivo</small>
          </div>
        </div>

        <div className="sidebar-stat-grid" aria-label="Statistiche rapide">
          <span>
            <strong>{liveCount}</strong>
            aperte
          </span>
          <span>
            <strong>{joinedCount}</strong>
            dentro
          </span>
        </div>

        <div className="streak-box">
          <div>
            <Flame size={20} />
            <span>{profile.streak} giorni</span>
          </div>
          <button type="button" onClick={claimStreak} disabled={profile.lastStreakAt === todayKey()}>
            {profile.lastStreakAt === todayKey() ? <Check size={18} /> : <Plus size={18} />}
            {profile.lastStreakAt === todayKey() ? "Preso" : "+12"}
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyeline">{databaseOnline ? "Dati sincronizzati" : "Connessione account"}</p>
            <h1>Trova la stanza giusta per quello che vuoi dire.</h1>
          </div>

          <div className="topbar-actions">
            <label className="search-box" htmlFor="room-search">
              <Search size={18} />
              <input
                id="room-search"
                type="search"
                placeholder="Cerca topic, host o domanda"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <button className="icon-button" type="button" aria-label="Notifiche" onClick={markNotificationsRead}>
              <Bell size={18} />
              {unreadCount ? <span className="notification-dot">{unreadCount}</span> : null}
            </button>
          </div>
        </header>

        <section className="status-strip" aria-live="polite">
          <span>{syncMessage}</span>
          <b>{profile.coins} Star nel wallet</b>
        </section>

        <section className="flow-guide-panel" aria-labelledby="flow-guide-title">
          <div className="flow-guide-copy">
            <p className="eyeline">Percorso demo</p>
            <h2 id="flow-guide-title">{guideTitle}</h2>
            <p>{guideText}</p>
          </div>
          <div className="flow-guide-actions">
            <button className="primary-action" type="button" onClick={handleGuideAction}>
              <Sparkles size={18} />
              {guideActionLabel}
            </button>
            <div className="flow-guide-steps" aria-label="Stato del flusso utente">
              {onboardingItems.slice(1, 5).map((item) => (
                <span className={item.done ? "is-done" : ""} key={item.id}>
                  {item.done ? <Check size={14} /> : null}
                  {item.title}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="main-grid">
          <div className="primary-column">
            <section className="panel rooms-panel" id="rooms" aria-labelledby="rooms-title">
              <div className="panel-heading">
                <div>
                  <p className="eyeline">Lobby</p>
                  <h2 id="rooms-title">Entra in una stanza</h2>
                </div>
                <div className="room-heading-actions">
                  <button className="mini-action" type="button" onClick={() => seedRandomLobby(true)}>
                    <Sparkles size={15} />
                    Nuova lobby
                  </button>
                  <div className="coin-chip" aria-label={`${profile.coins} Star disponibili`}>
                    <Image src="/brand/coin-icon.png" alt="" width={22} height={18} />
                    {profile.coins}
                  </div>
                </div>
              </div>

              <div className="topic-tabs" role="tablist" aria-label="Categorie topic">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={activeCategory === category ? "is-selected" : ""}
                    onClick={() => chooseCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="room-list">
                {filteredRooms.map((room) => {
                  const RoomIcon = room.icon;
                  const selected = room.id === selectedRoom.id;

                  return (
                    <button
                      className={`room-card ${selected ? "is-selected" : ""}`}
                      key={room.id}
                      type="button"
                      onClick={() => selectRoom(room.id)}
                      aria-pressed={selected}
                    >
                      <span className="room-icon">
                        <RoomIcon size={20} />
                      </span>
                      <span className="room-body">
                        <span className="room-title-row">
                          <strong>{room.title}</strong>
                          {room.joined ? <Check size={17} /> : null}
                        </span>
                        <span>{room.prompt}</span>
                        <span className="room-meta">
                          <span>
                            <Clock size={15} />
                            {room.startsAt}
                          </span>
                          <span>
                            <Users size={15} />
                            {room.people}/{room.limit}
                          </span>
                          <span>
                            <Coins size={15} />
                            {room.cost === 0 ? "gratis" : `${room.cost} Star`}
                          </span>
                          {room.isPremium ? <span>Premium</span> : null}
                          {room.muted ? <span>Silenziata</span> : null}
                        </span>
                        {room.unreadCount > 0 ? (
                          <span className="unread-pill">{room.unreadCount} nuovi messaggi</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
                {filteredRooms.length === 0 ? (
                  <div className="empty-state">
                    <strong>Nessuna stanza trovata</strong>
                    <span>Prova un altro topic o genera una lobby nuova.</span>
                    <button className="mini-action" type="button" onClick={() => seedRandomLobby(true)}>
                      Genera lobby
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="panel live-panel" id="live-room" aria-labelledby="live-title">
              <div className="live-header">
                <div>
                  <p className="eyeline">Stanza selezionata</p>
                  <h2 id="live-title">{selectedRoom.title}</h2>
                </div>
                <strong className="timer">{selectedRoom.endsAt}</strong>
              </div>

              <div className="room-toolbar" aria-label="Azioni stanza">
                <button className="mini-action" type="button" onClick={copyRoomInvite}>
                  <Copy size={15} />
                  Copia invito
                </button>
                <button className="mini-action" type="button" onClick={toggleMuteSelectedRoom}>
                  {selectedRoom.muted ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  {selectedRoom.muted ? "Riattiva" : "Silenzia"}
                </button>
                <button className="mini-action" type="button" onClick={leaveSelectedRoom} disabled={!selectedRoom.joined}>
                  <LogOut size={15} />
                  Esci
                </button>
              </div>

              <div className="prompt-strip">
                <MessageCircle size={20} />
                <p>{selectedRoom.prompt}</p>
              </div>

              <p className="room-description">{selectedRoom.description}</p>

              <div className="live-stats" aria-label="Dettagli stanza">
                <span>{roomStatusLabel(selectedRoom.status)}</span>
                <span>{selectedRoom.mood}</span>
                <span>{selectedRoom.people} persone</span>
                <span>{selectedRoom.compatibility}% compatibile</span>
              </div>

              <div className="participant-strip" aria-label="Utenti nella stanza">
                <strong>Utenti</strong>
                {selectedRoom.participants.map((participant) => (
                  <span key={participant}>{participant}</span>
                ))}
              </div>

              <div className="room-rules" aria-label="Regole della chatroom">
                <span>Parla del topic</span>
                <span>Risposte brevi e chiare</span>
                <span>Profili visibili dopo l'ingresso</span>
              </div>

              <div className="chat-log">
                {selectedMessages.length > 0 ? (
                  selectedMessages.map((message) => (
                    <article className={`chat-message ${message.tone ?? "member"}`} key={message.id}>
                      <span>
                        <strong>{message.author}</strong>
                        <small>{message.createdAt}</small>
                      </span>
                      <p>{message.text}</p>
                      {message.status ? <small className="message-status">{message.status}</small> : null}
                      <div className="message-actions" aria-label="Azioni messaggio">
                        <button type="button" onClick={() => quoteMessage(message)}>
                          Cita
                        </button>
                        {messageReactions.map((reaction) => (
                          <button key={reaction} type="button" onClick={() => reactToMessage(message, reaction)}>
                            {reaction} {message.reactions?.[reaction] ?? 0}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    <strong>La conversazione non e ancora partita</strong>
                    <span>Entra e lancia il primo messaggio sul topic.</span>
                  </div>
                )}
                {draftMessage.trim() && selectedRoom.joined ? (
                  <p className="typing-indicator">
                    <SmilePlus size={15} />
                    Bozza pronta
                  </p>
                ) : null}
              </div>

              <div className="quick-replies" aria-label="Risposte rapide">
                {quickReplies.map((reply) => (
                  <button key={reply} type="button" onClick={() => addQuickReply(reply)}>
                    {reply}
                  </button>
                ))}
              </div>

              <form className="composer" onSubmit={handleSendMessage}>
                <input
                  aria-label="Messaggio"
                  placeholder={selectedRoom.joined ? "Scrivi sul topic, chiaro e breve" : "Entra per scrivere"}
                  disabled={!selectedRoom.joined}
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                />
                <button className="icon-button solid" type="submit" aria-label="Invia messaggio" disabled={!selectedRoom.joined}>
                  <Send size={18} />
                </button>
              </form>

              <div className="action-row">
                <button className="primary-action wide" type="button" onClick={joinSelectedRoom}>
                  {selectedRoom.joined ? <Check size={18} /> : <UserPlus size={18} />}
                  {selectedRoomEntryLabel}
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={reportSelectedRoom}
                >
                  <Flag size={18} />
                  Segnala
                </button>
              </div>
            </section>

            <section className={`panel creator-panel ${premiumActive ? "" : "is-locked"}`} aria-labelledby="creator-title">
              <div className="panel-heading">
                <div>
                  <p className="eyeline">{premiumActive ? "Area creator" : "Premium richiesto"}</p>
                  <h2 id="creator-title">Crea una stanza che inviti a parlare</h2>
                </div>
                {premiumActive ? <Wand2 size={24} /> : <LockKeyhole size={24} />}
              </div>

              {!premiumActive ? (
                <p className="creator-lock">
                  Vuoi aprire nuove chatroom? Attiva Premium. Nel frattempo puoi entrare nelle
                  stanze aperte, conoscere persone e usare le Star.
                </p>
              ) : null}

              <form className="creator-form" onSubmit={handleCreateRoom}>
                <label>
                  Topic
                  <select
                    disabled={!premiumActive}
                    value={roomDraft.topic}
                    onChange={(event) =>
                      setRoomDraft((current) => ({
                        ...current,
                        topic: event.target.value as RoomDraft["topic"],
                      }))
                    }
                  >
                    {categories
                      .filter((category) => category !== "Tutti")
                      .map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Titolo
                  <input
                    disabled={!premiumActive}
                    value={roomDraft.title}
                    onChange={(event) =>
                      setRoomDraft((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Es. Film rivalutati tardi"
                  />
                </label>
                <label className="wide-field">
                  Domanda iniziale
                  <textarea
                    disabled={!premiumActive}
                    value={roomDraft.prompt}
                    onChange={(event) =>
                      setRoomDraft((current) => ({ ...current, prompt: event.target.value }))
                    }
                    placeholder="Scrivi una domanda concreta: deve far venire voglia di rispondere"
                  />
                </label>
                <label>
                  Durata
                  <input
                    disabled={!premiumActive}
                    min={10}
                    max={45}
                    type="number"
                    value={roomDraft.durationMinutes}
                    onChange={(event) =>
                      setRoomDraft((current) => ({
                        ...current,
                        durationMinutes: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  Max persone
                  <input
                    disabled={!premiumActive}
                    min={2}
                    max={12}
                    type="number"
                    value={roomDraft.maxMembers}
                    onChange={(event) =>
                      setRoomDraft((current) => ({
                        ...current,
                        maxMembers: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  Costo Star
                  <input
                    disabled={!premiumActive}
                    min={0}
                    max={50}
                    type="number"
                    value={roomDraft.coinCost}
                    onChange={(event) =>
                      setRoomDraft((current) => ({
                        ...current,
                        coinCost: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  Mood
                  <input
                    disabled={!premiumActive}
                    value={roomDraft.mood}
                    onChange={(event) =>
                      setRoomDraft((current) => ({ ...current, mood: event.target.value }))
                    }
                  />
                </label>
                <button className="primary-action wide-field" type="submit" disabled={!premiumActive}>
                  <Plus size={18} />
                  {premiumActive ? "Pubblica stanza" : "Sblocca con Premium"}
                </button>
              </form>
            </section>

            <section className="panel community-panel" id="community-hub" aria-labelledby="community-title">
              <div className="panel-heading">
                <div>
                  <p className="eyeline">La community decide</p>
                  <h2 id="community-title">Community Hub</h2>
                </div>
                <Megaphone size={24} />
              </div>

              <p className="community-lede">
                Idee, feedback e aggiornamenti vivono nello stesso posto: proponi un miglioramento, vota le priorita e ricevi Star quando contribuisci.
              </p>

              <div className="impact-grid" aria-label="Flusso TopicTime">
                <span>
                  <strong>{dailyRoomLimit}</strong>
                  chat evento al giorno
                </span>
                <span>
                  <strong>{starMultiplier}</strong>
                  streak Star
                </span>
                <span>
                  <strong>{feedbackVotes}</strong>
                  voti community
                </span>
              </div>

              <div className="roadmap-list" aria-label="Aggiornamenti trasparenti">
                {roadmapUpdates.map((update) => (
                  <article className="roadmap-row" key={update.id}>
                    <span>{update.status}</span>
                    <div>
                      <strong>{update.title}</strong>
                      <p>{update.body}</p>
                      <small>{update.metric}</small>
                    </div>
                  </article>
                ))}
              </div>

              <form className="community-form" onSubmit={handleSubmitCommunityFeedback}>
                <label>
                  Area
                  <select
                    value={feedbackDraft.category}
                    onChange={(event) =>
                      setFeedbackDraft((current) => ({
                        ...current,
                        category: event.target.value as CommunityFeedback["category"],
                      }))
                    }
                  >
                    <option value="Esperienza">Esperienza</option>
                    <option value="Sicurezza">Sicurezza</option>
                    <option value="Star">Star</option>
                    <option value="Topic">Topic</option>
                  </select>
                </label>
                <label>
                  Titolo proposta
                  <input
                    value={feedbackDraft.title}
                    onChange={(event) =>
                      setFeedbackDraft((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Es. stanza anti-solitudine del venerdi"
                  />
                </label>
                <label className="wide-field">
                  Perche aiuterebbe la community?
                  <textarea
                    value={feedbackDraft.body}
                    onChange={(event) =>
                      setFeedbackDraft((current) => ({ ...current, body: event.target.value }))
                    }
                    placeholder="Spiega cosa migliorerebbe, per chi e perche lo useresti"
                  />
                </label>
                <button className="primary-action wide-field" type="submit">
                  <Plus size={18} />
                  Pubblica feedback +5 Star
                </button>
              </form>

              <div className="idea-board" aria-label="Feedback della community">
                {communityIdeas.map((idea) => (
                  <article className="idea-row" key={idea.id}>
                    <div>
                      <span>{idea.category}</span>
                      <strong>{idea.title}</strong>
                      <p>{idea.body}</p>
                      <small>
                        {idea.author} - {idea.createdAt} - {feedbackStatusLabel(idea.status)}
                      </small>
                    </div>
                    <button className="mini-action" type="button" onClick={() => voteCommunityIdea(idea.id)}>
                      <Sparkles size={14} />
                      {idea.votes}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="secondary-column">
            <AuthPanel
              onAuthChange={(user) => {
                if (!user) {
                  userChoseAccessRef.current = false;
                  setAccessState("guest");
                }
              }}
            />

            <section className="panel compact-panel onboarding-panel" aria-labelledby="onboarding-title">
              <div className="panel-title-row">
                <span className="icon-badge">
                  <Sparkles size={18} />
                </span>
                <div>
                  <p className="eyeline">Primi passi</p>
                  <h2 id="onboarding-title">Completa il tuo spazio</h2>
                </div>
              </div>

              <div className="onboarding-summary">
                <strong>{onboardingDoneCount}/{onboardingItems.length} completati</strong>
                <span>{nextOnboardingItem ? nextOnboardingItem.title : "TopicTime e pronto per l'uso quotidiano."}</span>
              </div>

              <div className="onboarding-meter" aria-label={`Percorso iniziale ${onboardingProgress} percento completato`}>
                <span style={{ width: `${onboardingProgress}%` }} />
              </div>

              <div className="onboarding-steps">
                {onboardingItems.map((item, index) => (
                  <article className={`onboarding-step ${item.done ? "is-complete" : ""}`} key={item.id}>
                    <span className="onboarding-check">{item.done ? <Check size={14} /> : index + 1}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.hint}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel compact-panel" aria-labelledby="notifications-title">
              <div className="panel-title-row">
                <span className="icon-badge">
                  <Megaphone size={18} />
                </span>
                <div>
                  <p className="eyeline">Per te</p>
                  <h2 id="notifications-title">Cose da non perdere</h2>
                </div>
              </div>

              <div className="notice-list">
                {noticeList.map((notice) => (
                  <article className={`notice-row ${notice.status}`} key={notice.id}>
                    <strong>{notice.title}</strong>
                    <span>{notice.message}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel compact-panel" id="community" aria-labelledby="match-title">
              <div className="panel-title-row">
                <span className="icon-badge">
                  <LockKeyhole size={18} />
                </span>
                <div>
                  <p className="eyeline">Dopo la stanza</p>
                  <h2 id="match-title">Persone compatibili</h2>
                </div>
              </div>

              <div className="match-list">
                {matches.map((match) => (
                  <article className="match-row" key={match.id}>
                    <div>
                      <strong>{match.name}</strong>
                      <span>{match.signal}</span>
                    </div>
                    <b>{match.score}%</b>
                    {match.status === "friend" ? (
                      <button className="mini-action" type="button">
                        <Check size={15} />
                      </button>
                    ) : match.status === "requested" ? (
                      <button className="mini-action" type="button" onClick={() => acceptMatch(match.id)}>
                        Accetta
                      </button>
                    ) : (
                      <button className="mini-action" type="button" onClick={() => requestMatch(match.id)}>
                        <UserPlus size={15} />
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="panel compact-panel" id="wallet" aria-labelledby="wallet-title">
              <div className="panel-title-row">
                <span className="icon-badge">
                  <Crown size={18} />
                </span>
                <div>
                  <p className="eyeline">Wallet</p>
                  <h2 id="wallet-title">Star e vantaggi</h2>
                </div>
              </div>

              <div className="wallet-balance">
                <Image src="/brand/coin-icon.png" alt="" width={38} height={32} />
                <strong>{profile.coins}</strong>
                <span>{premiumActive ? "Premium attivo" : "Piano base"}</span>
              </div>

              <div className="wallet-actions">
                <button type="button" onClick={claimFreeGift} disabled={giftClaimedToday}>
                  <Gift size={16} />
                  {giftClaimedToday ? "Regalo preso" : "Prendi +25 gratis"}
                </button>
                <button type="button" onClick={watchAdReward}>
                  <Eye size={16} />
                  Bonus extra
                </button>
                <button type="button" onClick={activatePremium}>
                  <Crown size={16} />
                  Premium 99 Star
                </button>
              </div>

              <div className="coin-pack-list">
                {coinPacks.map((pack) => (
                  <button key={pack.label} type="button" onClick={() => buyCoinPack(pack.amount, pack.label)}>
                    <span>{pack.label}</span>
                    <b>+{pack.amount} Star</b>
                    <small>in arrivo</small>
                  </button>
                ))}
              </div>

              <div className="theme-switcher" role="group" aria-label="Tema chat">
                {themes.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    className={profile.selectedThemeId === option.id ? "is-selected" : ""}
                    onClick={() => selectOrBuyTheme(option)}
                  >
                    <Palette size={16} />
                    <span>{option.label}</span>
                    <small>
                      {option.owned ? "acquistato" : option.premiumOnly ? "Premium" : `${option.price} Star`}
                    </small>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel compact-panel" aria-labelledby="transactions-title">
              <div>
                <p className="eyeline">Wallet</p>
                <h2 id="transactions-title">Movimenti recenti</h2>
              </div>
              <div className="transaction-list">
                {transactions.map((transaction) => (
                  <article className="transaction-row" key={transaction.id}>
                    <span>{transaction.reason}</span>
                    <b className={transaction.amount > 0 ? "positive" : "negative"}>
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount}
                    </b>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel profile-panel" id="profile" aria-labelledby="profile-title">
              <div>
                <p className="eyeline">Profilo</p>
                <h2 id="profile-title">Come ti presenti</h2>
              </div>

              <form className="profile-form" onSubmit={handleSaveProfile}>
                <label>
                  Nome
                  <input
                    value={profile.displayName}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, displayName: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Username
                  <input
                    value={profile.username}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, username: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Bio
                  <textarea
                    value={profile.bio}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, bio: event.target.value }))
                    }
                  />
                </label>
                <div className="interest-cloud" aria-label="Interessi profilo">
                  {profile.interests.map((interest) => (
                    <button key={interest} type="button" onClick={() => removeInterest(interest)}>
                      {interest}
                      <X size={13} />
                    </button>
                  ))}
                </div>
                <div className="input-row">
                  <Sparkles size={16} />
                  <input
                    aria-label="Nuovo interesse"
                    placeholder="Aggiungi un interesse"
                    value={newInterest}
                    onChange={(event) => setNewInterest(event.target.value)}
                  />
                  <button className="mini-action" type="button" onClick={addInterest}>
                    <Plus size={15} />
                  </button>
                </div>
                <div className="profile-meter" aria-label={`Completezza profilo ${profileProgress} percento`}>
                  <span style={{ width: `${profileProgress}%` }} />
                </div>
                <button className="primary-action" type="submit">
                  Salva profilo
                </button>
              </form>
            </section>

            <section className="panel compact-panel" aria-labelledby="moderation-title">
              <div className="panel-title-row">
                <span className="icon-badge">
                  <ShieldAlert size={18} />
                </span>
                <div>
                  <p className="eyeline">Trust & safety</p>
                  <h2 id="moderation-title">Segnalazioni</h2>
                </div>
              </div>
              <div className="report-list">
                {reports.map((report) => (
                  <article className={`report-row ${report.status}`} key={report.id}>
                    <div>
                      <strong>{report.room}</strong>
                      <span>{report.reason}</span>
                    </div>
                    <button className="mini-action" type="button" onClick={() => closeReport(report.id)}>
                      {reportStatusLabel(report.status)}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
