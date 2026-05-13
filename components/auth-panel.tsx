"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut, Mail, ShieldCheck } from "lucide-react";
import {
  getAuthRedirectError,
  getAuthState,
  onAuthStateChange,
  sendMagicLink,
  signOut,
} from "@/lib/topic-time-db";

const initialMessage = "Inserisci l'email: ti mandiamo un link sicuro e ti riportiamo direttamente nelle stanze.";

type AuthStatus = "idle" | "sent" | "demo" | "error" | "online";

type AuthPanelProps = {
  onAuthChange?: (user: User | null) => void;
  onDemoAccess?: () => void;
  variant?: "panel" | "gate";
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AuthPanel({ onAuthChange, onDemoAccess, variant = "panel" }: AuthPanelProps) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;
    const redirectError = getAuthRedirectError();

    if (redirectError) {
      setStatus("error");
      setMessage("Accesso non completato: " + redirectError);
    }

    const unsubscribe = onAuthStateChange((nextUser) => {
      if (!mounted) {
        return;
      }

      setUser(nextUser);
      onAuthChange?.(nextUser);

      if (nextUser) {
        setStatus("online");
        setMessage("Sessione attiva: sei dentro come " + (nextUser.email ?? "utente TopicTime") + ".");
      }
    });

    getAuthState().then((authState) => {
      if (!mounted) {
        return;
      }

      setUser(authState.user);
      onAuthChange?.(authState.user);

      if (!authState.configured) {
        setStatus("demo");
        setMessage(
          "Login email non collegato in questo build. Aggiungi le variabili Supabase su Vercel, fai redeploy oppure entra in prova.",
        );
        return;
      }

      if (authState.user) {
        setStatus("online");
        setMessage("Sessione attiva: sei dentro come " + (authState.user.email ?? "utente TopicTime") + ".");
        return;
      }

      if (!redirectError) {
        setStatus("idle");
        setMessage(initialMessage);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Inserisci una email valida, ad esempio nome@email.it.");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setMessage("Invio del link di accesso in corso...");

    const result = await sendMagicLink(email);

    setIsSubmitting(false);
    setStatus(result.ok ? "sent" : "error");
    setMessage(result.message);

    if (result.ok) {
      setEmail("");
    }
  }

  async function handleSignOut() {
    const result = await signOut();

    setUser(null);
    onAuthChange?.(null);
    setStatus(result.ok ? "idle" : "error");
    setMessage(result.message);
  }

  function handleDemoAccess() {
    setStatus("demo");
    setMessage("Modalita prova attiva: puoi esplorare le stanze senza creare un account.");
    onDemoAccess?.();
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
          <label htmlFor={emailId}>Email di accesso</label>
          <div className="input-row">
            <Mail size={18} />
            <input
              id={emailId}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@email.it"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <button className="primary-action" type="submit" disabled={isSubmitting}>
            <LogIn size={18} />
            {isSubmitting ? "Invio in corso..." : "Ricevi link sicuro"}
          </button>
        </form>
      )}

      {onDemoAccess && !user ? (
        <button className="secondary-action" type="button" onClick={handleDemoAccess}>
          <ShieldCheck size={18} />
          Entra e prova ora
        </button>
      ) : null}

      {!user ? (
        <div className="auth-helper" aria-label="Come funziona il login TopicTime">
          <span>Il link email rientra su /rooms.</span>
          <span>La prova non salva profilo e Star online.</span>
        </div>
      ) : null}

      <p className={"auth-status " + status} aria-live="polite">
        {message}
      </p>
    </section>
  );
}
