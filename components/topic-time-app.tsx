"use client";

import { FormEvent, startTransition, useDeferredValue, useEffect, useState } from "react";
import Image from "next/image";
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
  createRandomRooms,
  createStarterMessagesForRooms,
  emptyRoomDraft,
  initialProfile,
  initialTransactions,
  moderationReports,
  notifications,
  rooms,
  starterMessages,
  themeOptions,
  topicIcons,
  type ChatMessage,
  type CompanionMatch,
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
  postMessageInDatabase,
  purchaseThemeInDatabase,
  reactToMessageInDatabase,
  saveProfileInDatabase,
} from "@/lib/topic-time-db";

const coinPacks = [
  { amount: 30, label: "Starter", price: "1,99" },
  { amount: 80, label: "Room pass", price: "4,99" },
  { amount: 180, label: "Creator", price: "9,99" },
];

const quickReplies = [
  "Sono d'accordo perche",
  "Io la vedo diversamente:",
  "Mi aggancio a questo punto",
  "Domanda secca:",
];

const messageReactions = ["+1", "<3", "!!"];

type AccessState = "loading" | "guest" | "demo" | "authenticated";

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
    status: "sent",
    text,
    tone: "you",
  };
}

export function TopicTimeApp() {
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const [activeCategory, setActiveCategory] = useState<TopicCategory>("Tutti");
  const [roomsState, setRoomsState] = useState<TopicRoom[]>(rooms);
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0].id);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [themes, setThemes] = useState<ThemeOption[]>(themeOptions);
  const [matches, setMatches] = useState<CompanionMatch[]>(companionMatches);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(initialTransactions);
  const [noticeList, setNoticeList] = useState<NotificationItem[]>(notifications);
  const [reports, setReports] = useState<ModerationReport[]>(moderationReports);
  const [roomDraft, setRoomDraft] = useState<RoomDraft>(emptyRoomDraft);
  const [newInterest, setNewInterest] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [syncMessage, setSyncMessage] = useState("Demo pronta. Collega Supabase per persistenza reale.");
  const [databaseOnline, setDatabaseOnline] = useState(false);
  const [adViews, setAdViews] = useState(0);
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
    setSelectedRoomId(randomRooms[0]?.id ?? selectedRoomId);
    setMessagesByRoom(createStarterMessagesForRooms(randomRooms));

    if (announce) {
      setSync({ message: "Nuove chatroom con topic casuali generate per la lobby." });
    }
  }

  useEffect(() => {
    let mounted = true;

    loadTopicTimeSnapshot().then((snapshot) => {
      if (!mounted) {
        return;
      }

      setDatabaseOnline(snapshot.mode === "remote");
      setSync(snapshot);

      if (!snapshot.ok || !snapshot.data) {
        setAccessState("guest");
        seedRandomLobby();
        return;
      }

      const snapshotData = snapshot.data;
      setAccessState(snapshotData.authenticated ? "authenticated" : "guest");

      if (snapshotData.rooms.length > 0) {
        setRoomsState(snapshotData.rooms);
        setSelectedRoomId((current) =>
          snapshotData.rooms.some((room) => room.id === current)
            ? current
            : snapshotData.rooms[0]?.id ?? current,
        );
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

      if (Object.keys(snapshotData.messagesByRoom).length > 0) {
        setMessagesByRoom((current) => ({
          ...current,
          ...snapshotData.messagesByRoom,
        }));
      }
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
  const isAppUnlocked = accessState === "authenticated" || accessState === "demo";
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

  function setSync(result: { message: string; mode?: "demo" | "remote"; ok?: boolean }) {
    const prefix = result.mode === "remote" ? "DB" : "Demo";
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
      setSync({ message: "Prima accedi: solo gli utenti loggati possono entrare nelle chat." });
      return;
    }

    if (selectedRoom.joined) {
      setSync({ message: "Sei gia dentro questa stanza." });
      return;
    }

    if (selectedRoom.people >= selectedRoom.limit) {
      setSync({ message: "La stanza e piena: resta in coda o scegli un altro topic." });
      return;
    }

    if (selectedRoom.isPremium && !premiumActive) {
      setSync({ message: "Questa stanza richiede Premium. Attivalo dal wallet." });
      return;
    }

    if (selectedRoom.cost > profile.coins) {
      setSync({ message: "Monete insufficienti: guarda un annuncio o ricarica il wallet." });
      return;
    }

    const result = await joinRoomInDatabase(selectedRoom.id);

    if (!result.ok) {
      setSync(result);
      return;
    }

    setRoomsState((current) =>
      current.map((room) =>
        room.id === selectedRoom.id
          ? {
              ...room,
              joined: true,
              participants: room.participants.includes(profile.displayName)
                ? room.participants
                : [...room.participants, profile.displayName].slice(0, room.limit),
              people: Math.min(room.limit, room.people + 1),
              status: room.status === "scheduled" ? "live" : room.status,
            }
          : room,
      ),
    );

    if (selectedRoom.cost > 0) {
      setProfile((current) => ({ ...current, coins: current.coins - selectedRoom.cost }));
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
          text: "Hai varcato la soglia: il profilo resta sullo sfondo, conta la risposta.",
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
      setSync({ message: "Accedi prima di scrivere in una chatroom." });
      return;
    }

    if (!selectedRoom.joined) {
      setSync({ message: "Entra nella stanza prima di scrivere." });
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
      setSync({ message: "Non sei ancora dentro questa stanza." });
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
          text: "Hai lasciato la stanza. Puoi rientrare finche resta aperta.",
          tone: "system",
        },
      ],
    }));
    setSync(result);
  }

  async function reactToMessage(messageId: string, reaction: string) {
    const result = await reactToMessageInDatabase(messageId, reaction);

    if (!result.ok) {
      setSync(result);
      return;
    }

    setMessagesByRoom((current) => ({
      ...current,
      [selectedRoom.id]: (current[selectedRoom.id] ?? []).map((message) =>
        message.id === messageId
          ? {
              ...message,
              reactions: {
                ...(message.reactions ?? {}),
                [reaction]: (message.reactions?.[reaction] ?? 0) + 1,
              },
            }
          : message,
      ),
    }));
  }

  function addQuickReply(reply: string) {
    if (!selectedRoom.joined) {
      setSync({ message: "Entra nella stanza per usare le risposte rapide." });
      return;
    }

    setDraftMessage((current) => (current ? `${current} ${reply}` : reply));
  }

  function quoteMessage(message: ChatMessage) {
    if (!selectedRoom.joined) {
      setSync({ message: "Entra nella stanza per rispondere a un messaggio." });
      return;
    }

    setDraftMessage((current) => `${current ? `${current} ` : ""}@${message.author} `);
  }

  async function copyRoomInvite() {
    const inviteUrl = `${window.location.origin}/?room=${selectedRoom.id}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setSync({ message: "Link invito copiato negli appunti." });
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
    setSync({ message: selectedRoom.muted ? "Notifiche stanza riattivate." : "Stanza silenziata." });
  }

  async function claimStreak() {
    if (profile.lastStreakAt === todayKey()) {
      setSync({ message: "Bonus streak gia riscattato oggi." });
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
      setSync({ message: "Bonus streak gia riscattato oggi.", mode: result.mode });
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
      setSync({ message: "Regalo gratuito gia riscattato oggi." });
      return;
    }

    const result = await claimFreeGiftInDatabase();
    const reward = result.data?.reward ?? 25;

    if (!result.ok) {
      setSync(result);
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
    if (adViews >= 3) {
      setSync({ message: "Hai raggiunto il limite demo di 3 annunci giornalieri." });
      return;
    }

    setAdViews((current) => current + 1);
    setProfile((current) => ({ ...current, coins: current.coins + 20 }));
    addTransaction(20, "Ricompensa annuncio");
    setSync({ message: "Ricompensa annuncio aggiunta al wallet." });
  }

  function buyCoinPack(amount: number, label: string) {
    setProfile((current) => ({ ...current, coins: current.coins + amount }));
    addTransaction(amount, `Pacchetto ${label}`);
    setSync({ message: `Pacchetto ${label} simulato. Integra Stripe nella fase pagamenti.` });
  }

  async function selectOrBuyTheme(theme: ThemeOption) {
    if (theme.owned) {
      setProfile((current) => ({ ...current, selectedThemeId: theme.id }));
      setSync({ message: `Tema ${theme.label} attivato.` });
      return;
    }

    if (theme.premiumOnly && !premiumActive) {
      setSync({ message: "Tema premium bloccato: attiva Premium prima dell'acquisto." });
      return;
    }

    if (profile.coins < theme.price) {
      setSync({ message: "Monete insufficienti per questo tema." });
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
      setSync({ message: "Servono 99 monete per simulare Premium." });
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
      : "Demo attiva 30 giorni";
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
      setSync({ message: "Solo gli utenti Premium possono creare chatroom." });
      return;
    }

    if (!roomDraft.title.trim() || !roomDraft.prompt.trim()) {
      setSync({ message: "Titolo e domanda iniziale sono obbligatori." });
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
      description: "Stanza creata dal pannello host.",
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
          text: "Stanza creata. La domanda iniziale e pronta per accogliere i partecipanti.",
          tone: "system",
        },
      ],
    }));
    setSelectedRoomId(id);
    setRoomDraft(emptyRoomDraft);
    setSync(result);
  }

  function requestMatch(matchId: string) {
    setMatches((current) =>
      current.map((match) => (match.id === matchId ? { ...match, status: "requested" } : match)),
    );
    setSync({ message: "Richiesta contatto inviata. Nel database sara una friendship pending." });
  }

  function acceptMatch(matchId: string) {
    setMatches((current) =>
      current.map((match) => (match.id === matchId ? { ...match, status: "friend" } : match)),
    );
    setSync({ message: "Contatto aggiunto agli amici." });
  }

  function markNotificationsRead() {
    setNoticeList((current) => current.map((notice) => ({ ...notice, status: "read" })));
  }

  function closeReport(reportId: string) {
    setReports((current) =>
      current.map((report) => (report.id === reportId ? { ...report, status: "closed" } : report)),
    );
  }

  if (!isAppUnlocked) {
    return (
      <main className="login-shell" data-theme={profile.selectedThemeId}>
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-copy">
            <Image src="/brand/logo-mark.png" alt="" width={68} height={68} priority />
            <p className="eyeline">TopicTime flow</p>
            <h1 id="login-title">Accedi, ricevi monete, scegli una chatroom casuale.</h1>
            <p>
              L'app parte da un login reale. Dopo l'accesso trovi stanze con topic casuali,
              utenti gia presenti, wallet monete e creazione chatroom riservata ai Premium.
            </p>
          </div>

          <div className="login-side">
            <div className="flow-steps" aria-label="Flusso applicativo">
              <span>1. Login</span>
              <span>2. Regalo monete</span>
              <span>3. Scelta chat</span>
              <span>4. Premium crea stanze</span>
            </div>

            {accessState === "loading" ? (
              <p className="auth-status">Sto preparando la sessione...</p>
            ) : null}

            <AuthPanel
              variant="gate"
              onDemoAccess={() => {
                setAccessState("demo");
                seedRandomLobby(true);
              }}
              onAuthChange={(user) => {
                setAccessState(user ? "authenticated" : "guest");
              }}
            />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="topic-app" data-theme={profile.selectedThemeId}>
      <aside className="sidebar" aria-label="Navigazione TopicTime">
        <a className="brand-lockup" href="#rooms" aria-label="TopicTime applicativo">
          <Image src="/brand/logo-mark.png" alt="" width={52} height={52} priority />
          <span>
            <strong>TopicTime</strong>
            <small>anti-feed social</small>
          </span>
        </a>

        <nav className="side-nav">
          <a href="#rooms" className="is-active">
            <Hash size={18} />
            Stanze
          </a>
          <a href="#community">
            <Users size={18} />
            Persone
          </a>
          <a href="#wallet">
            <Coins size={18} />
            Monete
          </a>
          <a href="#profile">
            <Sparkles size={18} />
            Profilo
          </a>
        </nav>

        <div className="sidebar-profile">
          <span>{profile.avatarInitials}</span>
          <div>
            <strong>{profile.displayName}</strong>
            <small>{accessState === "demo" ? "demo user" : "utente attivo"}</small>
          </div>
        </div>

        <div className="sidebar-stat-grid" aria-label="Statistiche rapide">
          <span>
            <strong>{liveCount}</strong>
            live
          </span>
          <span>
            <strong>{joinedCount}</strong>
            join
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
            <p className="eyeline">{databaseOnline ? "Supabase collegato" : "Demo interattiva"}</p>
            <h1>Topic, chatroom, wallet e amicizie in un solo flusso.</h1>
          </div>

          <div className="topbar-actions">
            <label className="search-box" htmlFor="room-search">
              <Search size={18} />
              <input
                id="room-search"
                type="search"
                placeholder="Cerca topic, host, domanda"
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
          <b>{profile.coins} monete</b>
        </section>

        <section className="main-grid">
          <div className="primary-column">
            <section className="panel rooms-panel" id="rooms" aria-labelledby="rooms-title">
              <div className="panel-heading">
                <div>
                  <p className="eyeline">In partenza</p>
                  <h2 id="rooms-title">Scegli una stanza</h2>
                </div>
                <div className="room-heading-actions">
                  <button className="mini-action" type="button" onClick={() => seedRandomLobby(true)}>
                    <Sparkles size={15} />
                    Random
                  </button>
                  <div className="coin-chip" aria-label={`${profile.coins} monete disponibili`}>
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
                            {room.cost === 0 ? "free" : room.cost}
                          </span>
                          {room.isPremium ? <span>premium</span> : null}
                          {room.muted ? <span>mute</span> : null}
                        </span>
                        {room.unreadCount > 0 ? (
                          <span className="unread-pill">{room.unreadCount} nuovi</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
                {filteredRooms.length === 0 ? (
                  <div className="empty-state">
                    <strong>Nessuna stanza trovata</strong>
                    <span>Cambia ricerca o genera una nuova lobby casuale.</span>
                    <button className="mini-action" type="button" onClick={() => seedRandomLobby(true)}>
                      Genera stanze
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="panel live-panel" aria-labelledby="live-title">
              <div className="live-header">
                <div>
                  <p className="eyeline">room://{selectedRoom.id}</p>
                  <h2 id="live-title">{selectedRoom.title}</h2>
                </div>
                <strong className="timer">{selectedRoom.endsAt}</strong>
              </div>

              <div className="room-toolbar" aria-label="Azioni stanza">
                <button className="mini-action" type="button" onClick={copyRoomInvite}>
                  <Copy size={15} />
                  Invita
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
                <span>{selectedRoom.status}</span>
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
                <span>Rispondi al topic</span>
                <span>Niente spam</span>
                <span>Profilo visibile dopo l'ingresso</span>
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
                          Rispondi
                        </button>
                        {messageReactions.map((reaction) => (
                          <button key={reaction} type="button" onClick={() => reactToMessage(message.id, reaction)}>
                            {reaction} {message.reactions?.[reaction] ?? 0}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    <strong>La stanza e silenziosa</strong>
                    <span>Entra e manda il primo messaggio sul topic.</span>
                  </div>
                )}
                {draftMessage.trim() && selectedRoom.joined ? (
                  <p className="typing-indicator">
                    <SmilePlus size={15} />
                    Stai scrivendo...
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
                  placeholder={selectedRoom.joined ? "Scrivi nella stanza" : "Entra per scrivere"}
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
                  {selectedRoom.joined
                    ? "Sei dentro"
                    : selectedRoom.people >= selectedRoom.limit
                      ? "Stanza piena"
                      : "Entra nella stanza"}
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() =>
                    setReports((current) => [
                      {
                        id: `rep-${Date.now()}`,
                        reason: "Segnalazione demo inviata dall'utente",
                        room: selectedRoom.title,
                        status: "open",
                      },
                      ...current,
                    ])
                  }
                >
                  <Flag size={18} />
                  Segnala
                </button>
              </div>
            </section>

            <section className={`panel creator-panel ${premiumActive ? "" : "is-locked"}`} aria-labelledby="creator-title">
              <div className="panel-heading">
                <div>
                  <p className="eyeline">{premiumActive ? "Host lab" : "Premium richiesto"}</p>
                  <h2 id="creator-title">Crea una chatroom</h2>
                </div>
                {premiumActive ? <Wand2 size={24} /> : <LockKeyhole size={24} />}
              </div>

              {!premiumActive ? (
                <p className="creator-lock">
                  Solo gli utenti Premium possono aprire nuove chatroom. Gli utenti free possono
                  entrare nelle stanze casuali generate dall'app.
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
                    placeholder="Es. Cinema visto troppo tardi"
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
                    placeholder="La domanda che fa partire una conversazione vera"
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
                  Costo monete
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
                  {premiumActive ? "Crea stanza" : "Premium richiesto"}
                </button>
              </form>
            </section>
          </div>

          <aside className="secondary-column">
            <AuthPanel
              onAuthChange={(user) => {
                if (!user) {
                  setAccessState("guest");
                }
              }}
            />

            <section className="panel compact-panel" aria-labelledby="notifications-title">
              <div className="panel-title-row">
                <span className="icon-badge">
                  <Megaphone size={18} />
                </span>
                <div>
                  <p className="eyeline">Centro eventi</p>
                  <h2 id="notifications-title">Notifiche</h2>
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
                  <h2 id="match-title">Contatti sbloccabili</h2>
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
                  <h2 id="wallet-title">Monete e Premium</h2>
                </div>
              </div>

              <div className="wallet-balance">
                <Image src="/brand/coin-icon.png" alt="" width={38} height={32} />
                <strong>{profile.coins}</strong>
                <span>{premiumActive ? "Premium attivo" : "Free plan"}</span>
              </div>

              <div className="wallet-actions">
                <button type="button" onClick={claimFreeGift} disabled={giftClaimedToday}>
                  <Gift size={16} />
                  {giftClaimedToday ? "Regalo preso" : "Regalo +25"}
                </button>
                <button type="button" onClick={watchAdReward}>
                  <Eye size={16} />
                  Annuncio +20
                </button>
                <button type="button" onClick={activatePremium}>
                  <Crown size={16} />
                  Premium 99
                </button>
              </div>

              <div className="coin-pack-list">
                {coinPacks.map((pack) => (
                  <button key={pack.label} type="button" onClick={() => buyCoinPack(pack.amount, pack.label)}>
                    <span>{pack.label}</span>
                    <b>+{pack.amount}</b>
                    <small>{pack.price} euro</small>
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
                      {option.owned ? "owned" : option.premiumOnly ? "premium" : option.price}
                    </small>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel compact-panel" aria-labelledby="transactions-title">
              <div>
                <p className="eyeline">Ledger</p>
                <h2 id="transactions-title">Movimenti</h2>
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
                <h2 id="profile-title">Interessi prima della copertina</h2>
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
                    placeholder="Aggiungi interesse"
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
                  <h2 id="moderation-title">Moderazione</h2>
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
                      {report.status}
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
