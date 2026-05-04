"use client";

import { FormEvent, useState } from "react";
import { LogIn, Mail, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthStatus = "idle" | "sent" | "demo" | "error";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("Accesso non ancora avviato.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage("Inserisci una email valida.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setStatus("demo");
      setMessage("Modalita demo attiva: aggiungi le env Supabase per inviare il link.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Link magico inviato. Controlla la casella email.");
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="panel-title-row">
        <span className="icon-badge">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="eyeline">Accesso</p>
          <h2 id="auth-title">Entra con Supabase</h2>
        </div>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <div className="input-row">
          <Mail size={18} />
          <input
            id="email"
            name="email"
            type="email"
            placeholder="nome@email.it"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <button className="primary-action" type="submit">
          <LogIn size={18} />
          Link magico
        </button>
      </form>

      <p className={`auth-status ${status}`}>{message}</p>
    </section>
  );
}
