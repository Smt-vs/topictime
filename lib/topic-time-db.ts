import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  topicIcons,
  type ChatMessage,
  type ThemeId,
  type ThemeOption,
  type TopicCategory,
  type TopicRoom,
  type UserProfile,
  type WalletTransaction,
  type NotificationItem,
} from "@/data/topic-time";

export type DbActionResult<T = unknown> = {
  data?: T;
  message: string;
  mode: "demo" | "remote";
  ok: boolean;
};

type TopicTimeSnapshot = {
  authenticated: boolean;
  messagesByRoom: Record<string, ChatMessage[]>;
  notifications: NotificationItem[];
  profile: UserProfile | null;
  rooms: TopicRoom[];
  themes: ThemeOption[];
  transactions: WalletTransaction[];
};

type RoomCardRow = {
  id: string;
  slug: string;
  title: string;
  prompt: string;
  description: string;
  mood: string;
  starts_at: string;
  ends_at: string;
  max_members: number;
  coin_cost: number;
  is_premium: boolean;
  status: "scheduled" | "live" | "closed";
  topic_name: string;
  host_name: string;
  member_count: number;
};

type ProfileRow = {
  bio: string | null;
  coins: number;
  display_name: string;
  interests: string[] | null;
  last_gift_at: string | null;
  last_streak_at: string | null;
  premium_until: string | null;
  selected_theme_id: string;
  streak_count: number;
  username: string;
};

type ThemeRow = {
  description: string;
  id: string;
  label: string;
  premium_only: boolean;
  price: number;
};

type MessageRow = {
  body: string;
  created_at: string;
  id: string;
  profile_id: string;
  room_id: string;
  profiles: { display_name: string } | { display_name: string }[] | null;
};

const themeIds: ThemeId[] = ["zen", "sunset", "pastel", "midnight", "arcade"];

function demoResult(message: string): DbActionResult {
  return {
    message,
    mode: "demo",
    ok: true,
  };
}

function unavailableResult(): DbActionResult {
  return {
    message: "Supabase non e configurato: azione salvata solo nella demo locale.",
    mode: "demo",
    ok: true,
  };
}

function asThemeId(value: string): ThemeId {
  return themeIds.includes(value as ThemeId) ? (value as ThemeId) : "zen";
}

function asTopicCategory(value: string): Exclude<TopicCategory, "Tutti"> {
  const category = value as Exclude<TopicCategory, "Tutti">;
  return category in topicIcons ? category : "Cinema";
}

function formatRelativeTime(value: string) {
  const target = new Date(value);
  const diffMinutes = Math.round((target.getTime() - Date.now()) / 60000);

  if (Math.abs(diffMinutes) <= 1) {
    return "Ora";
  }

  if (diffMinutes > 0) {
    return `Tra ${diffMinutes} min`;
  }

  return target.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function avatarInitials(displayName: string) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function mapRoom(row: RoomCardRow, joinedRoomIds: Set<string>): TopicRoom {
  const category = asTopicCategory(row.topic_name);
  const people = Number(row.member_count ?? 0);
  const fallbackNames = ["Giulia", "Marta", "Nico", "Ari", "Sam", "Dani", "Vale", "Leo"];
  const participants = [row.host_name, ...fallbackNames].slice(0, Math.max(1, people));

  return {
    category,
    compatibility: 76 + ((people + row.title.length) % 20),
    cost: row.coin_cost,
    createdBy: "database",
    description: row.description,
    endsAt: formatRelativeTime(row.ends_at),
    host: row.host_name,
    icon: topicIcons[category],
    id: row.slug,
    isPremium: row.is_premium,
    joined: joinedRoomIds.has(row.id),
    limit: row.max_members,
    muted: false,
    mood: row.mood,
    participants,
    people,
    prompt: row.prompt,
    startsAt: formatRelativeTime(row.starts_at),
    status: row.status,
    title: row.title,
    unreadCount: joinedRoomIds.has(row.id) ? 0 : Math.min(3, Math.max(0, people - 2)),
  };
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    avatarInitials: avatarInitials(row.display_name),
    bio: row.bio ?? "",
    coins: row.coins,
    displayName: row.display_name,
    interests: row.interests ?? [],
    lastGiftAt: row.last_gift_at,
    lastStreakAt: row.last_streak_at,
    premiumUntil: row.premium_until
      ? new Date(row.premium_until).toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null,
    selectedThemeId: asThemeId(row.selected_theme_id),
    streak: row.streak_count,
    username: row.username,
  };
}

function readProfileName(value: MessageRow["profiles"]) {
  if (!value) {
    return "Ospite";
  }

  return Array.isArray(value) ? value[0]?.display_name ?? "Ospite" : value.display_name;
}

export async function loadTopicTimeSnapshot(): Promise<DbActionResult<TopicTimeSnapshot>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      message: "Demo locale attiva: dati caricati dai seed dell'app.",
      mode: "demo",
      ok: true,
    };
  }

  const { data: authData } = await client.auth.getUser();
  const userId = authData.user?.id ?? null;

  await client.rpc("ensure_random_rooms", { target_count: 6 });

  const [
    roomsResponse,
    themesResponse,
    membershipsResponse,
    profileResponse,
    ownedThemesResponse,
    transactionsResponse,
    notificationsResponse,
  ] = await Promise.all([
    client.from("room_cards").select("*").order("starts_at", { ascending: true }).limit(24),
    client.from("themes").select("id,label,description,price,premium_only").order("price"),
    userId
      ? client.from("room_members").select("room_id").eq("profile_id", userId).is("left_at", null)
      : Promise.resolve({ data: [], error: null }),
    userId
      ? client
          .from("profiles")
          .select("username,display_name,bio,interests,coins,premium_until,selected_theme_id,streak_count,last_streak_at,last_gift_at")
          .eq("id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    userId
      ? client.from("profile_themes").select("theme_id").eq("profile_id", userId)
      : Promise.resolve({ data: [], error: null }),
    userId
      ? client
          .from("wallet_transactions")
          .select("id,amount,reason,created_at")
          .eq("profile_id", userId)
          .order("created_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
    userId
      ? client
          .from("notifications")
          .select("id,title,body,read_at,created_at")
          .eq("profile_id", userId)
          .order("created_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const firstError =
    roomsResponse.error ??
    themesResponse.error ??
    membershipsResponse.error ??
    profileResponse.error ??
    ownedThemesResponse.error ??
    transactionsResponse.error ??
    notificationsResponse.error;

  if (firstError) {
    return {
      message: firstError.message,
      mode: "remote",
      ok: false,
    };
  }

  const roomRows = (roomsResponse.data ?? []) as RoomCardRow[];
  const joinedRoomIds = new Set((membershipsResponse.data ?? []).map((row) => row.room_id as string));
  const rooms = roomRows.map((row) => mapRoom(row, joinedRoomIds));
  const roomIdToSlug = new Map(roomRows.map((row) => [row.id, row.slug]));
  const ownedThemeIds = new Set((ownedThemesResponse.data ?? []).map((row) => row.theme_id as string));
  ownedThemeIds.add("zen");

  const messagesResponse =
    userId && joinedRoomIds.size > 0
      ? await client
          .from("messages")
          .select("id,room_id,profile_id,body,created_at,profiles(display_name)")
          .in("room_id", [...joinedRoomIds])
          .order("created_at", { ascending: true })
          .limit(80)
      : { data: [], error: null };

  if (messagesResponse.error) {
    return {
      message: messagesResponse.error.message,
      mode: "remote",
      ok: false,
    };
  }

  const messagesByRoom = ((messagesResponse.data ?? []) as MessageRow[]).reduce<Record<string, ChatMessage[]>>(
    (accumulator, row) => {
      const roomSlug = roomIdToSlug.get(row.room_id);

      if (!roomSlug) {
        return accumulator;
      }

      accumulator[roomSlug] ??= [];
      accumulator[roomSlug].push({
        author: row.profile_id === userId ? "Tu" : readProfileName(row.profiles),
        createdAt: new Date(row.created_at).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        id: row.id,
        text: row.body,
        tone: row.profile_id === userId ? "you" : "member",
      });

      return accumulator;
    },
    {},
  );

  return {
    data: {
      authenticated: Boolean(userId),
      messagesByRoom,
      notifications: (notificationsResponse.data ?? []).map((row) => ({
        id: row.id as string,
        message: row.body as string,
        status: row.read_at ? "read" : "new",
        title: row.title as string,
      })),
      profile: profileResponse.data ? mapProfile(profileResponse.data as ProfileRow) : null,
      rooms,
      themes: ((themesResponse.data ?? []) as ThemeRow[]).map((theme) => ({
        description: theme.description,
        id: asThemeId(theme.id),
        label: theme.label,
        owned: ownedThemeIds.has(theme.id),
        premiumOnly: theme.premium_only,
        price: theme.price,
      })),
      transactions: (transactionsResponse.data ?? []).map((row) => ({
        amount: row.amount as number,
        id: row.id as string,
        reason: row.reason as string,
        time: new Date(row.created_at as string).toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "short",
        }),
      })),
    },
    message: userId
      ? "Dati reali caricati da Supabase."
      : "Stanze e temi caricati da Supabase. Accedi per profilo e wallet.",
    mode: "remote",
    ok: true,
  };
}

async function requireUser(): Promise<{ client: NonNullable<ReturnType<typeof getSupabaseClient>>; user: User } | DbActionResult> {
  const client = getSupabaseClient();

  if (!isSupabaseConfigured() || !client) {
    return unavailableResult();
  }

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return {
      message: "Accedi con il link magico per salvare questa azione nel database.",
      mode: "remote",
      ok: false,
    };
  }

  return { client, user: data.user };
}

export async function getAuthState() {
  const client = getSupabaseClient();

  if (!client) {
    return {
      configured: false,
      user: null,
    };
  }

  const { data } = await client.auth.getUser();

  return {
    configured: true,
    user: data.user ?? null,
  };
}

export async function sendMagicLink(email: string): Promise<DbActionResult> {
  const client = getSupabaseClient();

  if (!client) {
    return demoResult("Modalita demo: configura Supabase per inviare davvero il link.");
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    message: "Link magico inviato. Controlla la casella email.",
    mode: "remote",
    ok: true,
  };
}

export async function signOut(): Promise<DbActionResult> {
  const client = getSupabaseClient();

  if (!client) {
    return demoResult("Sei gia in modalita demo.");
  }

  const { error } = await client.auth.signOut();

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    message: "Sessione chiusa.",
    mode: "remote",
    ok: true,
  };
}

export async function joinRoomInDatabase(roomSlug: string): Promise<DbActionResult> {
  const auth = await requireUser();

  if ("ok" in auth) {
    return auth;
  }

  const { error } = await auth.client.rpc("join_room", {
    room_slug: roomSlug,
  });

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    message: "Ingresso salvato nel database.",
    mode: "remote",
    ok: true,
  };
}

export async function postMessageInDatabase(
  roomSlug: string,
  body: string,
): Promise<DbActionResult<{ message_id: string }>> {
  const auth = await requireUser();

  if ("ok" in auth) {
    return auth as DbActionResult<{ message_id: string }>;
  }

  const { data, error } = await auth.client.rpc("post_message", {
    message_body: body,
    room_slug: roomSlug,
  });

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    data: { message_id: data as string },
    message: "Messaggio salvato nel database.",
    mode: "remote",
    ok: true,
  };
}

export async function leaveRoomInDatabase(roomSlug: string): Promise<DbActionResult> {
  const auth = await requireUser();

  if ("ok" in auth) {
    return auth;
  }

  const { error } = await auth.client.rpc("leave_room", {
    room_slug: roomSlug,
  });

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    message: "Uscita dalla stanza salvata nel database.",
    mode: "remote",
    ok: true,
  };
}

export async function reactToMessageInDatabase(messageId: string, reaction: string): Promise<DbActionResult> {
  const auth = await requireUser();

  if ("ok" in auth) {
    return auth;
  }

  const { error } = await auth.client.rpc("toggle_message_reaction", {
    reaction_emoji: reaction,
    target_message_id: messageId,
  });

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    message: "Reazione aggiornata.",
    mode: "remote",
    ok: true,
  };
}

export async function claimStreakInDatabase(): Promise<DbActionResult<{ reward: number; streak: number }>> {
  const auth = await requireUser();

  if ("ok" in auth) {
    return auth as DbActionResult<{ reward: number; streak: number }>;
  }

  const { data, error } = await auth.client.rpc("claim_daily_streak");

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    data: data as { reward: number; streak: number },
    message: "Bonus streak salvato nel database.",
    mode: "remote",
    ok: true,
  };
}

export async function claimFreeGiftInDatabase(): Promise<DbActionResult<{ reward: number }>> {
  const auth = await requireUser();

  if ("ok" in auth) {
    return auth as DbActionResult<{ reward: number }>;
  }

  const { data, error } = await auth.client.rpc("claim_free_gift");

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    data: data as { reward: number },
    message: "Regalo gratuito riscattato nel wallet.",
    mode: "remote",
    ok: true,
  };
}

export async function purchaseThemeInDatabase(themeId: string): Promise<DbActionResult> {
  const auth = await requireUser();

  if ("ok" in auth) {
    return auth;
  }

  const { error } = await auth.client.rpc("purchase_theme", {
    target_theme_id: themeId,
  });

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    message: "Tema acquistato nel database.",
    mode: "remote",
    ok: true,
  };
}

export async function activatePremiumInDatabase(): Promise<
  DbActionResult<{ coins: number; cost: number; premium_until: string }>
> {
  const auth = await requireUser();

  if ("ok" in auth) {
    return auth as DbActionResult<{ coins: number; cost: number; premium_until: string }>;
  }

  const { data, error } = await auth.client.rpc("activate_premium_plan");

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    data: data as { coins: number; cost: number; premium_until: string },
    message: "Premium attivato nel database.",
    mode: "remote",
    ok: true,
  };
}

export async function saveProfileInDatabase(profile: UserProfile): Promise<DbActionResult> {
  const auth = await requireUser();

  if ("ok" in auth) {
    return auth;
  }

  const { error } = await auth.client.rpc("save_profile", {
    profile_bio: profile.bio,
    profile_display_name: profile.displayName,
    profile_interests: profile.interests,
    profile_theme_id: profile.selectedThemeId,
    profile_username: profile.username,
  });

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    message: "Profilo salvato nel database.",
    mode: "remote",
    ok: true,
  };
}

export async function createRoomInDatabase(input: {
  coinCost: number;
  durationMinutes: number;
  maxMembers: number;
  mood: string;
  prompt: string;
  startsAtIso: string;
  title: string;
  topicSlug: string;
}): Promise<DbActionResult<{ room_slug: string }>> {
  const auth = await requireUser();

  if ("ok" in auth) {
    return auth as DbActionResult<{ room_slug: string }>;
  }

  const { data, error } = await auth.client.rpc("create_room", {
    coin_cost: input.coinCost,
    duration_minutes: input.durationMinutes,
    max_members: input.maxMembers,
    room_mood: input.mood,
    room_prompt: input.prompt,
    room_title: input.title,
    starts_at: input.startsAtIso,
    topic_slug: input.topicSlug,
  });

  if (error) {
    return {
      message: error.message,
      mode: "remote",
      ok: false,
    };
  }

  return {
    data: data as { room_slug: string },
    message: "Stanza creata nel database.",
    mode: "remote",
    ok: true,
  };
}
