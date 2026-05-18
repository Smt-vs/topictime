"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { KeyRound, LogIn, LogOut, Mail, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import {
  getAuthRedirectError,
  getAuthRedirectType,
  getAuthState,
  onAuthStateChange,
  requestPasswordReset,
  resendVerificationEmail,
  exchangeAuthCodeForSession,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updateCurrentPassword,
  verifyAuthTokenHash,
} from "@/lib/topic-time-db";

const initialMessage =
  "Accedi o crea il tuo account: dopo la verifica email ritrovi profilo, Star e stanze su ogni dispositivo.";

const modeCopy = {
  "sign-in": {
    helper: "Bentornato. Inserisci email e password; se ti sei appena registrato, conferma prima la mail.",
    loading: "Controllo le credenziali...",
    message: "Accedi con email e password.",
    submit: "Entra",
  },
  "sign-up": {
    helper: "Crea il profilo, poi apri la mail di verifica: serve per proteggere account, Star e chat.",
    loading: "Creo il tuo account...",
    message: "Crea l'account e conferma la mail che ricevi.",
    submit: "Crea account",
  },
} satisfies Record<AuthMode, { helper: string; loading: string; message: string; submit: string }>;

type AuthMode = "sign-in" | "sign-up";
type AuthStatus = "idle" | "sent" | "error" | "online";

type AuthPanelProps = {
  onAuthChange?: (user: User | null) => void;
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

export function AuthPanel({ onAuthChange, variant = "panel" }: AuthPanelProps) {
  const displayNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [user, setUser] = useState<User | null>(null);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [showEmailHelp, setShowEmailHelp] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    const redirectError = getAuthRedirectError();
    const redirectType = getAuthRedirectType();
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const requestedAuthMode = searchParams?.get("auth") ?? null;
    const authCode = searchParams?.get("code") ?? null;
    const tokenHash = searchParams?.get("token_hash") ?? null;
    const tokenType = searchParams?.get("type") ?? redirectType;

    if (requestedAuthMode === "register" || requestedAuthMode === "signup") {
      setMode("sign-up");
      setMessage(modeCopy["sign-up"].message);
    }

    if (requestedAuthMode === "login" || requestedAuthMode === "signin") {
      setMode("sign-in");
      setMessage(modeCopy["sign-in"].message);
    }

    if (redirectError) {
      setStatus("error");
      setMessage("Il link non e valido o e scaduto. Richiedi una nuova email e usa l'ultimo link ricevuto.");
      setCanResendVerification(true);
      setShowEmailHelp(true);
    }

    if (redirectType === "recovery") {
      setIsRecoveryMode(true);
      setStatus("idle");
      setShowEmailHelp(false);
      setMessage("Scegli una nuova password per rientrare nel tuo account.");
    }

    if (authCode || tokenHash) {
      setStatus("idle");
      setMessage("Sto verificando la tua email...");

      const verifyRedirect = async () => {
        const result = tokenHash
          ? await verifyAuthTokenHash(tokenHash, tokenType)
          : await exchangeAuthCodeForSession(authCode as string);

        if (!mounted) {
          return;
        }

        if (!result.ok) {
          setStatus("error");
          setMessage(result.message);
          setCanResendVerification(true);
          setShowEmailHelp(true);
          return;
        }

        window.history.replaceState(null, "", window.location.pathname);

        if (tokenType === "recovery") {
          setIsRecoveryMode(true);
          setStatus("idle");
          setCanResendVerification(false);
          setShowEmailHelp(false);
          setMessage("Scegli una nuova password per rientrare nel tuo account.");
          return;
        }

        await syncCurrentSession("Email verificata. Sto preparando la tua lobby.");
      };

      void verifyRedirect();
    }

    const unsubscribe = onAuthStateChange((nextUser, event) => {
      if (!mounted) {
        return;
      }

      setUser(nextUser);
      onAuthChange?.(nextUser);

      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setStatus("idle");
        setCanResendVerification(false);
        setShowEmailHelp(false);
        setMessage("Scegli una nuova password per rientrare nel tuo account.");
        return;
      }

      if (nextUser && redirectType !== "recovery") {
        setStatus("online");
        setCanResendVerification(false);
        setShowEmailHelp(false);
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
        setStatus("error");
        setMessage("L'accesso non e disponibile in questo momento. Riprova tra poco.");
        return;
      }

      if (authCode || tokenHash) {
        return;
      }

      if (authState.user && redirectType !== "recovery") {
        setStatus("online");
        setCanResendVerification(false);
        setShowEmailHelp(false);
        setMessage("Sei dentro come " + userLabel(authState.user) + ". Sto preparando le tue stanze.");
        return;
      }

      if (!redirectError && redirectType !== "recovery") {
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
    setShowEmailHelp(false);
    setMessage(successMessage);
    return true;
  }

  function validateAuthForm() {
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

    if (mode === "sign-up" && displayName.trim().length < 2) {
      setStatus("error");
      setMessage("Aggiungi il nome che vuoi mostrare nelle stanze. Bastano due caratteri.");
      return false;
    }

    return true;
  }

  function validateRecoveryForm() {
    if (!isValidPassword(newPassword)) {
      setStatus("error");
      setMessage("Scegli una nuova password di almeno 8 caratteri.");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Le due password non coincidono. Riproviamoci con calma.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !validateAuthForm()) {
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setCanResendVerification(false);
    setMessage(modeCopy[mode].loading);

    try {
      const result =
        mode === "sign-in"
          ? await signInWithPassword(email, password)
          : await signUpWithPassword(email, password, displayName);

      if (!result.ok) {
        setStatus("error");
        setMessage(result.message);
        setCanResendVerification(
          result.code === "email_not_confirmed" ||
            result.code === "email_delivery_blocked" ||
            result.code === "rate_limited",
        );
        setShowEmailHelp(
          result.code === "email_not_confirmed" ||
            result.code === "email_delivery_blocked" ||
            result.code === "already_registered" ||
            result.code === "rate_limited",
        );

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
          setMessage("Accesso quasi completato. Ricarica la pagina e riprova.");
        }

        return;
      }

      const hasSession = await syncCurrentSession("Account creato. Sto aprendo la tua lobby TopicTime.");
      setPassword("");

      if (!hasSession) {
        setStatus("sent");
        setCanResendVerification(true);
        setShowEmailHelp(true);
        setMessage(result.message);
      }
    } catch (error) {
      setStatus("error");
      console.warn("Auth submit failed", error);
      setMessage("Non sono riuscito a completare l'operazione. Riprova tra poco.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordResetRequest() {
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Scrivi la tua email: se hai un account, ti mandiamo il link per cambiare password.");
      return;
    }

    setIsSubmitting(true);
    setShowEmailHelp(false);
    setMessage("Sto preparando il link per cambiare password...");

    try {
      const result = await requestPasswordReset(email);

      setStatus(result.ok ? "sent" : "error");
      setShowEmailHelp(true);
      setMessage(result.message);
    } catch (error) {
      setStatus("error");
      console.warn("Password reset request failed", error);
      setMessage("Non sono riuscito a inviare il recupero password. Riprova tra poco.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !validateRecoveryForm()) {
      return;
    }

    setIsSubmitting(true);
    setMessage("Sto aggiornando la password...");

    try {
      const result = await updateCurrentPassword(newPassword);

      setStatus(result.ok ? "online" : "error");
      setMessage(result.message);

      if (result.ok) {
        setIsRecoveryMode(false);
        setNewPassword("");
        setConfirmPassword("");
        setPassword("");
      }
    } catch (error) {
      setStatus("error");
      console.warn("Password update failed", error);
      setMessage("Non sono riuscito ad aggiornare la password. Riprova tra poco.");
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
      setShowEmailHelp(true);
      setMessage(result.message);
    } catch (error) {
      setStatus("error");
      console.warn("Verification resend failed", error);
      setMessage("Non sono riuscito a reinviare la verifica. Riprova tra poco.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    const result = await signOut();

    setUser(null);
    onAuthChange?.(null);
    setStatus(result.ok ? "idle" : "error");
    setShowEmailHelp(false);
    setMessage(result.ok ? "Sei uscito. Quando vuoi, ti aspettiamo di nuovo qui." : result.message);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setStatus("idle");
    setCanResendVerification(false);
    setShowEmailHelp(false);
    setMessage(modeCopy[nextMode].message);
  }

  function cancelRecoveryMode() {
    setIsRecoveryMode(false);
    setNewPassword("");
    setConfirmPassword("");
    setStatus("idle");
    setMessage(initialMessage);
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
          <h2 id="auth-title">{isRecoveryMode ? "Cambia password" : variant === "gate" ? "Accedi a TopicTime" : "Il tuo account"}</h2>
        </div>
      </div>

      {isRecoveryMode ? (
        <>
          <form className="auth-form" onSubmit={handlePasswordUpdate}>
            <p className="auth-form-note">Scegli una nuova password. Dopo il salvataggio potrai rientrare subito.</p>

            <label htmlFor={newPasswordId}>Nuova password</label>
            <div className="input-row">
              <KeyRound size={18} />
              <input
                id={newPasswordId}
                name="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Almeno 8 caratteri"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>

            <label htmlFor={confirmPasswordId}>Ripeti password</label>
            <div className="input-row">
              <KeyRound size={18} />
              <input
                id={confirmPasswordId}
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Riscrivila qui"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            <button className="primary-action" type="submit" disabled={isSubmitting}>
              <KeyRound size={18} />
              {isSubmitting ? "Salvataggio..." : "Salva nuova password"}
            </button>
          </form>

          <button className="secondary-action" type="button" onClick={cancelRecoveryMode}>
            Torna all'accesso
          </button>
        </>
      ) : user ? (
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

            {mode === "sign-up" ? (
              <>
                <label htmlFor={displayNameId}>Nome visibile</label>
                <div className="input-row">
                  <UserPlus size={18} />
                  <input
                    id={displayNameId}
                    name="display-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Come vuoi apparire in chat"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </div>
              </>
            ) : null}

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

          {status === "sent" ? (
            <button className="secondary-action" type="button" onClick={() => switchMode("sign-in")}>
              <LogIn size={18} />
              Ho verificato la mail, accedi
            </button>
          ) : null}

          {mode === "sign-in" ? (
            <button className="auth-text-action" type="button" onClick={handlePasswordResetRequest} disabled={isSubmitting}>
              Password dimenticata? Ricevi un link per cambiarla
            </button>
          ) : null}

          {canResendVerification ? (
            <button className="secondary-action" type="button" onClick={handleResendVerification} disabled={isSubmitting}>
              <RefreshCw size={18} />
              Reinvia email di verifica
            </button>
          ) : null}

          {showEmailHelp ? (
            <div className="auth-delivery-note" aria-label="Aiuto email di verifica">
              <strong>Non trovi la mail?</strong>
              <span>Controlla spam, promozioni e l'indirizzo scritto nel form.</span>
              <span>Se hai gia usato questa email, prova direttamente Accedi.</span>
              <span>Se sei in beta privata, usa la mail con cui sei stato invitato o contatta il supporto.</span>
            </div>
          ) : null}
        </>
      )}

      <p className={"auth-status " + status} aria-live="polite">
        {message}
      </p>

      {!user && !isRecoveryMode ? (
        <div className="auth-helper" aria-label="Come funziona il login TopicTime">
          <span>La password resta privata e non viene mai mostrata.</span>
          <span>Conferma la mail per proteggere l'account.</span>
          <span>Quando accedi ritrovi profilo, Star e stanze.</span>
        </div>
      ) : null}
    </section>
  );
}
