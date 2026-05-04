"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import {
  Bell,
  Check,
  Clock,
  Coins,
  Crown,
  Flame,
  Hash,
  LockKeyhole,
  MessageCircle,
  Palette,
  Plus,
  Search,
  Send,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import {
  categories,
  companionMatches,
  rooms,
  starterMessages,
  themeOptions,
  type ChatMessage,
  type TopicCategory,
} from "@/data/topic-time";

type ThemeId = (typeof themeOptions)[number]["id"];

export function TopicTimeApp() {
  const [activeCategory, setActiveCategory] = useState<TopicCategory>("Tutti");
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0].id);
  const [joinedRoomIds, setJoinedRoomIds] = useState<string[]>([]);
  const [coinBalance, setCoinBalance] = useState(126);
  const [streakChecked, setStreakChecked] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("zen");
  const [draftMessage, setDraftMessage] = useState("");
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>(
    () =>
      rooms.reduce<Record<string, ChatMessage[]>>((accumulator, room) => {
        accumulator[room.id] = starterMessages[room.id] ?? [];
        return accumulator;
      }, {}),
  );

  const filteredRooms =
    activeCategory === "Tutti"
      ? rooms
      : rooms.filter((room) => room.category === activeCategory);

  const selectedRoom =
    rooms.find((room) => room.id === selectedRoomId) ?? filteredRooms[0] ?? rooms[0];

  const selectedMessages = messagesByRoom[selectedRoom.id] ?? [];
  const joinedSelectedRoom = joinedRoomIds.includes(selectedRoom.id);

  function chooseCategory(category: TopicCategory) {
    setActiveCategory(category);
    const firstRoom =
      category === "Tutti" ? rooms[0] : rooms.find((room) => room.category === category);

    if (firstRoom) {
      setSelectedRoomId(firstRoom.id);
    }
  }

  function joinSelectedRoom() {
    if (joinedSelectedRoom) {
      return;
    }

    if (selectedRoom.cost > coinBalance) {
      setCoinBalance((current) => current + 20);
      return;
    }

    setCoinBalance((current) => current - selectedRoom.cost);
    setJoinedRoomIds((current) => [...current, selectedRoom.id]);
  }

  function claimStreak() {
    if (streakChecked) {
      return;
    }

    setStreakChecked(true);
    setCoinBalance((current) => current + 12);
  }

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    setMessagesByRoom((current) => ({
      ...current,
      [selectedRoom.id]: [
        ...(current[selectedRoom.id] ?? []),
        {
          author: "Tu",
          text: trimmedMessage,
          tone: "you",
        },
      ],
    }));
    setDraftMessage("");

    if (!joinedSelectedRoom) {
      setJoinedRoomIds((current) => [...current, selectedRoom.id]);
    }
  }

  return (
    <main className="topic-app" data-theme={theme}>
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

        <div className="streak-box">
          <div>
            <Flame size={20} />
            <span>{streakChecked ? "8 giorni" : "7 giorni"}</span>
          </div>
          <button type="button" onClick={claimStreak} disabled={streakChecked}>
            {streakChecked ? <Check size={18} /> : <Plus size={18} />}
            {streakChecked ? "Preso" : "+12"}
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyeline">Chatroom a tempo</p>
            <h1>Conosci persone partendo dagli interessi.</h1>
          </div>

          <div className="topbar-actions">
            <label className="search-box" htmlFor="room-search">
              <Search size={18} />
              <input id="room-search" type="search" placeholder="Cerca topic" />
            </label>
            <button className="icon-button" type="button" aria-label="Notifiche">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <section className="main-grid">
          <div className="primary-column">
            <section className="panel rooms-panel" id="rooms" aria-labelledby="rooms-title">
              <div className="panel-heading">
                <div>
                  <p className="eyeline">In partenza</p>
                  <h2 id="rooms-title">Scegli una stanza</h2>
                </div>
                <div className="coin-chip" aria-label={`${coinBalance} monete disponibili`}>
                  <Image src="/brand/coin-icon.png" alt="" width={22} height={18} />
                  {coinBalance}
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
                  const joined = joinedRoomIds.includes(room.id);

                  return (
                    <button
                      className={`room-card ${selected ? "is-selected" : ""}`}
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoomId(room.id)}
                      aria-pressed={selected}
                    >
                      <span className="room-icon">
                        <RoomIcon size={20} />
                      </span>
                      <span className="room-body">
                        <span className="room-title-row">
                          <strong>{room.title}</strong>
                          {joined ? <Check size={17} /> : null}
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
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="panel live-panel" aria-labelledby="live-title">
              <div className="live-header">
                <div>
                  <p className="eyeline">room://{selectedRoom.id}</p>
                  <h2 id="live-title">{selectedRoom.title}</h2>
                </div>
                <strong className="timer">{selectedRoom.timer}</strong>
              </div>

              <div className="prompt-strip">
                <MessageCircle size={20} />
                <p>{selectedRoom.prompt}</p>
              </div>

              <div className="live-stats" aria-label="Dettagli stanza">
                <span>{selectedRoom.mood}</span>
                <span>{selectedRoom.people} persone</span>
                <span>{selectedRoom.compatibility}% compatibile</span>
              </div>

              <div className="chat-log">
                {selectedMessages.map((message, index) => (
                  <article className={`chat-message ${message.tone ?? "member"}`} key={index}>
                    <strong>{message.author}</strong>
                    <p>{message.text}</p>
                  </article>
                ))}
              </div>

              <form className="composer" onSubmit={handleSendMessage}>
                <input
                  aria-label="Messaggio"
                  placeholder="Scrivi nella stanza"
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                />
                <button className="icon-button solid" type="submit" aria-label="Invia messaggio">
                  <Send size={18} />
                </button>
              </form>

              <button className="primary-action wide" type="button" onClick={joinSelectedRoom}>
                {joinedSelectedRoom ? <Check size={18} /> : <UserPlus size={18} />}
                {joinedSelectedRoom
                  ? "Sei dentro"
                  : selectedRoom.cost > coinBalance
                    ? "Ricarica per entrare"
                    : "Entra nella stanza"}
              </button>
            </section>
          </div>

          <aside className="secondary-column">
            <AuthPanel />

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
                {companionMatches.map((match) => (
                  <article className="match-row" key={match.name}>
                    <div>
                      <strong>{match.name}</strong>
                      <span>{match.signal}</span>
                    </div>
                    <b>{match.score}%</b>
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
                  <p className="eyeline">Premium</p>
                  <h2 id="wallet-title">Temi e monete</h2>
                </div>
              </div>

              <div className="theme-switcher" role="group" aria-label="Tema chat">
                {themeOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    className={theme === option.id ? "is-selected" : ""}
                    onClick={() => setTheme(option.id)}
                  >
                    <Palette size={16} />
                    <span>{option.label}</span>
                    <small>{option.price === 0 ? "free" : `${option.price}`}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel profile-panel" id="profile" aria-labelledby="profile-title">
              <div>
                <p className="eyeline">Profilo</p>
                <h2 id="profile-title">Interessi prima della copertina</h2>
              </div>
              <div className="interest-cloud" aria-label="Interessi profilo">
                <span>Cinema</span>
                <span>Libri</span>
                <span>Viaggi lenti</span>
                <span>Playlist</span>
              </div>
              <div className="profile-meter" aria-label="Completezza profilo 68 percento">
                <span style={{ width: "68%" }} />
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
