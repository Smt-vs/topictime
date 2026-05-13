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

const initialMessage =
  "Entra nel tuo spazio TopicTime. Se e la prima volta, crea l'account: ti mandiamo una conferma via email.";

const modeCopy = {
  "sign-in": {
    helper: "Usa l'email verificata e la password scelta in registrazione.",
    loading: "Sto controllando email e password...",
    message: "Accedi con la tua email verificata e la password.",
    submit: "Entra",
  },
  "sign-up": {
    helper: "Crea l'account in pochi secondi. Prima di entrare dovrai confermare la mail.",
    loading: "Sto creando il tuo account...",
    message: "Crea l'account: subito dopo ti inviamo la mail di conferma.",
    submit: "Crea account",
  },
} satisfies Record<AuthMode, { helper: string; loading: string; message: string; submit: string }>;

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

function userLabel(nextUser: User) {
  return nextUser.email ?? "il tuo account";
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
      setMessage("Non sono riuscito a chiudere la verifica email: " + redirectError);
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
        setMessage("Sei dentro come " + userLabel(nextUser) + ". Sto preparando le tue stanze.");
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
          "Non vedo ancora Supabase collegato in questo deploy. Puoi entrare in prova, oppure controlla le variabili su Vercel e fai redeploy.",
        );
        return;
      }

      if (authState.user) {
        setStatus("online");
        setCanResendVerification(false);
        setMessage("Sei dentro come " + userLabel(authState.user) + ". Sto preparando le tue stanze.");
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

  async function syncCurrentSession(successMessage: string) {
    const authState = await getAuthState();

    setUser(authState.user);
    onAuthChange?.(authState.user);

    if (!authState.user) {
      return false;
    }

    setStatus("online");
    setCanResendVerification(false);
    setMessage(successMessage);
    return true;
  }

  function validateForm() {
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Mi serve una email valida, ad esempio nome@email.it.");
      return false;
    }

    if (!isValidPassword(password)) {
      setStatus("error");
      setMessage("La password deve avere almeno 8 caratteri. Meglio se non e troppo semplice.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setCanResendVerification(false);
    setMessage(modeCopy[mode].loading);

    try {
      const result =
        mode === "sign-in" ? await signInWithPassword(email, password) : await signUpWithPassword(email, password);

      if (!result.ok) {
        setStatus("error");
        setMessage(result.message);
        setCanResendVerification(result.code === "email_not_confirmed");

        if (result.code === "already_registered") {
          setMode("sign-in");
        }

        return;
      }

      if (mode === "sign-in") {
        const hasSession = await syncCurrentSession("Bentornato. Sto caricando profilo, Star e stanze.");
        setPassword("");

        if (!hasSession) {
          setStatus("error");
          setMessage("Supabase ha accettato l'accesso, ma il browser non ha salvato la sessione. Ricarica la pagina e riprova.");
        }

        return;
      }

      const hasSession = await syncCurrentSession("Account creato. Sto aprendo la tua lobby TopicTime.");
      setPassword("");

      if (!hasSession) {
        setStatus("sent");
        setCanResendVerification(true);
        setMessage(result.message);
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? "Non sono riuscito a completare l'operazione: " + error.message
          : "Non sono riuscito a completare l'operazione. Riprova tra poco.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Scrivi l'email dell'account e te la rimando subito.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Sto reinviando la mail di verifica...");

    try {
      const result = await resendVerificationEmail(email);

      setStatus(result.ok ? "sent" : "error");
      setMessage(result.message);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? "Non sono riuscito a reinviare la verifica: " + error.message
          : "Non sono riuscito a reinviare la verifica. Riprova tra poco.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    const result = await signOut();

    setUser(null);
    onAuthChange?.(null);
    setStatus(result.ok ? "idle" : "error");
    setMessage(result.ok ? "Sei uscito. Quando vuoi, ti aspettiamo di nuovo qui." : result.message);
  }

  function handleDemoAccess() {
    setStatus("demo");
    setMessage("Modalita prova attiva: puoi esplorare TopicTime, ma profilo e Star restano solo su questo dispositivo.");
    onDemoAccess?.();
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setStatus("idle");
    setCanResendVerification(false);
    setMessage(modeCopy[nextMode].message);
  }

  const currentCopy = modeCopy[mode];

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="panel-title-row">
        <span className="icon-badge">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="eyeline">Account TopicTime</p>
          <h2 id="auth-title">{variant === "gate" ? "Entra nelle stanze" : "Il tuo accesso"}</h2>
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
              aria-selected={mode === "sign-in"}
              className={mode === "sign-in" ? "is-selected" : undefined}
              onClick={() => switchMode("sign-in")}
            >
              Accedi
            </button>
            <button
              type="button"
              aria-selected={mode === "sign-up"}
              className={mode === "sign-up" ? "is-selected" : undefined}
              onClick={() => switchMode("sign-up")}
            >
              Registrati
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <p className="auth-form-note">{currentCopy.helper}</p>

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
              {isSubmitting ? "Un attimo..." : currentCopy.submit}
            </button>
          </form>

          {canResendVerification ? (
            <button className="secondary-action" type="button" onClick={handleResendVerification} disabled={isSubmitting}>
              <RefreshCw size={18} />
              Reinvia email di verifica
            </button>
          ) : null}
        </>
      )}

      <p className={"auth-status " + status} aria-live="polite">
        {message}
      </p>

      {onDemoAccess && !user ? (
        <button className="secondary-action" type="button" onClick={handleDemoAccess}>
          <ShieldCheck size={18} />
          Prova senza account
        </button>
      ) : null}

      {!user ? (
        <div className="auth-helper" aria-label="Come funziona il login TopicTime">
          <span>Registrati con email e password.</span>
          <span>Conferma la mail che ricevi.</span>
          <span>Accedi e ritrovi profilo, Star e stanze.</span>
        </div>
      ) : null}
    </section>
  );
}
