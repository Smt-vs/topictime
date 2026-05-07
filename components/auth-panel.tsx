"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut, Mail, ShieldCheck } from "lucide-react";
import { getAuthState, sendMagicLink, signOut } from "@/lib/topic-time-db";

type AuthStatus = "idle" | "sent" | "demo" | "error" | "online";

type AuthPanelProps = {
  onAuthChange?: (user: User | null) => void;
  onDemoAccess?: () => void;
  variant?: "panel" | "gate";
};

export function AuthPanel({ onAuthChange, onDemoAccess, variant = "panel" }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("Ti mandiamo un link sicuro: niente password da ricordare.");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    getAuthState().then((authState) => {
      if (!mounted) {
        return;
      }

      setUser(authState.user);
      onAuthChange?.(authState.user);

      if (!authState.configured) {
        setStatus("demo");
        setMessage("Puoi provare subito TopicTime: stanze, monete e profilo restano su questo dispositivo.");
        return;
      }

      if (authState.user) {
        setStatus("online");
        setMessage(`Sei dentro come ${authState.user.email ?? "utente TopicTime"}.`);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage("Inserisci una email valida per ricevere il link di accesso.");
      return;
    }

    const result = await sendMagicLink(email);

    setStatus(result.ok ? (result.mode === "demo" ? "demo" : "sent") : "error");
    setMessage(result.message);
  }

  async function handleSignOut() {
    const result = await signOut();

    setUser(null);
    onAuthChange?.(null);
    setStatus(result.ok ? "idle" : "error");
    setMessage(result.message);
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="panel-title-row">
        <span className="icon-badge">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="eyeline">Accesso</p>
          <h2 id="auth-title">{variant === "gate" ? "Entra in TopicTime" : "Account"}</h2>
        </div>
      </div>

      {user ? (
        <button className="secondary-action" type="button" onClick={handleSignOut}>
          <LogOut size={18} />
          Esci dall'account
        </button>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email di accesso</label>
          <div className="input-row">
            <Mail size={18} />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.it"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <button className="primary-action" type="submit">
            <LogIn size={18} />
            Ricevi link sicuro
          </button>
        </form>
      )}

      {onDemoAccess && !user ? (
        <button className="secondary-action" type="button" onClick={onDemoAccess}>
          <ShieldCheck size={18} />
          Entra e prova ora
        </button>
      ) : null}

      <p className={`auth-status ${status}`}>{message}</p>
    </section>
  );
}
