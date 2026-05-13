"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { KeyRound, LogIn, LogOut, Mail, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import {
  getAuthRedirectError,
  getAuthState,
  onAuthStateChange,
  resendVerificationEmail,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from "@/lib/topic-time-db";

const initialMessage = "Accedi con email e password. Se sei nuovo, crea l'account e conferma l'email prima di entrare.";

type AuthMode = "sign-in" | "sign-up";
type AuthStatus = "idle" | "sent" | "demo" | "error" | "online";

type AuthPanelProps = {
  onAuthChange?: (user: User | null) => void;
  onDemoAccess?: () => void;
  variant?: "panel" | "gate";
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPassword(value: string) {
  return value.length >= 8;
}

export function AuthPanel({ onAuthChange, onDemoAccess, variant = "panel" }: AuthPanelProps) {
  const emailId = useId();
  const passwordId = useId();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [user, setUser] = useState<User | null>(null);
  const [canResendVerification, setCanResendVerification] = useState(false);

  useEffect(() => {
    let mounted = true;
    const redirectError = getAuthRedirectError();

    if (redirectError) {
      setStatus("error");
      setMessage("Accesso non completato: " + redirectError);
      setCanResendVerification(true);
    }

    const unsubscribe = onAuthStateChange((nextUser) => {
      if (!mounted) {
        return;
      }

      setUser(nextUser);
      onAuthChange?.(nextUser);

      if (nextUser) {
        setStatus("online");
        setCanResendVerification(false);
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
          "Login non collegato in questo build. Aggiungi le variabili Supabase su Vercel, fai redeploy oppure entra in prova.",
        );
        return;
      }

      if (authState.user) {
        setStatus("online");
        setCanResendVerification(false);
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

  function validateForm() {
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Inserisci una email valida, ad esempio nome@email.it.");
      return false;
    }

    if (!isValidPassword(password)) {
      setStatus("error");
      setMessage("La password deve avere almeno 8 caratteri.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setCanResendVerification(false);
    setMessage(mode === "sign-in" ? "Controllo credenziali in corso..." : "Creazione account in corso...");

    const result =
      mode === "sign-in" ? await signInWithPassword(email, password) : await signUpWithPassword(email, password);

    setIsSubmitting(false);
    setStatus(result.ok ? "sent" : "error");
    setMessage(result.message);
    setCanResendVerification(result.code === "email_not_confirmed" || (result.ok && mode === "sign-up"));

    if (result.ok && mode === "sign-in") {
      setPassword("");
    }
  }

  async function handleResendVerification() {
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Scrivi l'email dell'account per reinviare la verifica.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Reinvio email di verifica...");

    const result = await resendVerificationEmail(email);

    setIsSubmitting(false);
    setStatus(result.ok ? "sent" : "error");
    setMessage(result.message);
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

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setStatus("idle");
    setCanResendVerification(false);
    setMessage(
      nextMode === "sign-in"
        ? "Accedi con email e password dopo aver verificato l'account."
        : "Crea l'account: ti inviamo una email di verifica prima del primo accesso.",
    );
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="panel-title-row">
        <span className="icon-badge">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="eyeline">Accesso verificato</p>
          <h2 id="auth-title">{variant === "gate" ? "Entra in TopicTime" : "Account"}</h2>
        </div>
      </div>

      {user ? (
        <button className="secondary-action" type="button" onClick={handleSignOut}>
          <LogOut size={18} />
          Esci dall'account
        </button>
      ) : (
        <>
          <div className="auth-mode-switch" role="tablist" aria-label="Modalita accesso">
            <button
              type="button"
              className={mode === "sign-in" ? "is-selected" : undefined}
              onClick={() => switchMode("sign-in")}
            >
              Accedi
            </button>
            <button
              type="button"
              className={mode === "sign-up" ? "is-selected" : undefined}
              onClick={() => switchMode("sign-up")}
            >
              Crea account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor={emailId}>Email</label>
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

            <label htmlFor={passwordId}>Password</label>
            <div className="input-row">
              <KeyRound size={18} />
              <input
                id={passwordId}
                name="password"
                type="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                placeholder="Almeno 8 caratteri"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <button className="primary-action" type="submit" disabled={isSubmitting}>
              {mode === "sign-in" ? <LogIn size={18} /> : <UserPlus size={18} />}
              {isSubmitting ? "Attendi..." : mode === "sign-in" ? "Accedi" : "Crea e verifica"}
            </button>
          </form>

          {canResendVerification ? (
            <button className="secondary-action" type="button" onClick={handleResendVerification} disabled={isSubmitting}>
              <RefreshCw size={18} />
              Reinvia verifica email
            </button>
          ) : null}
        </>
      )}

      {onDemoAccess && !user ? (
        <button className="secondary-action" type="button" onClick={handleDemoAccess}>
          <ShieldCheck size={18} />
          Entra e prova ora
        </button>
      ) : null}

      {!user ? (
        <div className="auth-helper" aria-label="Come funziona il login TopicTime">
          <span>Prima crei account con password.</span>
          <span>Confermi l'email da Supabase.</span>
          <span>Poi accedi e salvi Star, profilo e stanze.</span>
        </div>
      ) : null}

      <p className={"auth-status " + status} aria-live="polite">
        {message}
      </p>
    </section>
  );
}
