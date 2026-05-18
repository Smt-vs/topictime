"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, ShieldAlert } from "lucide-react";
import { exchangeAuthCodeForSession, getAuthState, verifyAuthTokenHash } from "@/lib/topic-time-db";

type ConfirmationState = "loading" | "success" | "error";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/applicativo";
  }

  return value;
}

export function AuthConfirmation() {
  const router = useRouter();
  const [state, setState] = useState<ConfirmationState>("loading");
  const [message, setMessage] = useState("Sto verificando la tua email...");

  useEffect(() => {
    let mounted = true;

    async function confirmAuthLink() {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const nextPath = safeNextPath(searchParams.get("next"));
      const error = searchParams.get("error_description") ?? hashParams.get("error_description");

      if (error) {
        setState("error");
        setMessage("Il link non e valido o e scaduto. Torna al login e richiedi una nuova email.");
        return;
      }

      const tokenHash = searchParams.get("token_hash");
      const code = searchParams.get("code");
      const type = searchParams.get("type");
      const result = tokenHash
        ? await verifyAuthTokenHash(tokenHash, type)
        : code
          ? await exchangeAuthCodeForSession(code)
          : await getAuthState().then((authState) => ({
              message: authState.user ? "Email verificata. Sto aprendo TopicTime." : "Link non riconosciuto. Richiedi una nuova email dal login.",
              mode: "remote" as const,
              ok: Boolean(authState.user),
            }));

      if (!mounted) {
        return;
      }

      if (!result.ok) {
        setState("error");
        setMessage(result.message);
        return;
      }

      setState("success");
      setMessage(result.message);
      window.setTimeout(() => router.replace(type === "recovery" ? "/applicativo?type=recovery" : nextPath), 650);
    }

    void confirmAuthLink();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main className="login-shell">
      <section className="auth-confirm-card" aria-live="polite">
        <span className={`auth-confirm-icon ${state}`}>
          {state === "loading" ? <LoaderCircle size={28} /> : state === "success" ? <Check size={28} /> : <ShieldAlert size={28} />}
        </span>
        <p className="eyeline">Account TopicTime</p>
        <h1>{state === "error" ? "Link da controllare" : "Verifica email"}</h1>
        <p>{message}</p>
        {state === "error" ? (
          <Link className="primary-action" href="/applicativo">
            Torna al login
          </Link>
        ) : null}
      </section>
    </main>
  );
}
