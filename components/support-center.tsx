"use client";

import { FormEvent, useState } from "react";
import { Bug, LifeBuoy, Send, ShieldAlert } from "lucide-react";
import { supportTopics, type SupportTopic } from "@/data/topic-time";
import { getSupabaseClient } from "@/lib/supabase";

type TicketStatus = "idle" | "sending" | "sent" | "error";

type TicketDraft = {
  body: string;
  category: SupportTopic["category"];
  email: string;
  subject: string;
};

const emptyTicket: TicketDraft = {
  body: "",
  category: "Bug",
  email: "",
  subject: "",
};

export function SupportCenter() {
  const [draft, setDraft] = useState<TicketDraft>(emptyTicket);
  const [status, setStatus] = useState<TicketStatus>("idle");
  const [message, setMessage] = useState("Descrivi il problema o la proposta: useremo il ticket per migliorare la roadmap.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.email.trim() || !draft.subject.trim() || draft.body.trim().length < 12) {
      setStatus("error");
      setMessage("Inserisci email, titolo e una descrizione di almeno 12 caratteri.");
      return;
    }

    setStatus("sending");
    setMessage("Invio ticket in corso...");

    const client = getSupabaseClient();

    if (!client) {
      setStatus("sent");
      setMessage("Ticket registrato in modalita demo. Collega Supabase per salvarlo nel database.");
      setDraft(emptyTicket);
      return;
    }

    const { data: authData } = await client.auth.getUser();
    const { error } = await client.from("support_tickets").insert({
      author_id: authData.user?.id ?? null,
      body: draft.body.trim(),
      category: draft.category,
      email: draft.email.trim(),
      subject: draft.subject.trim(),
    });

    if (error) {
      setStatus("error");
      setMessage(`Ticket non salvato: ${error.message}`);
      return;
    }

    setStatus("sent");
    setMessage("Ticket inviato. Grazie: lo useremo per priorita, moderazione e roadmap.");
    setDraft(emptyTicket);
  }

  return (
    <section className="product-section support-layout">
      <div className="support-topics" aria-label="Aree supporto TopicTime">
        {supportTopics.map((topic) => (
          <article key={topic.id}>
            {topic.category === "Bug" ? <Bug size={20} /> : <ShieldAlert size={20} />}
            <span>{topic.category}</span>
            <strong>{topic.title}</strong>
            <p>{topic.body}</p>
            <small>{topic.responseTime}</small>
          </article>
        ))}
      </div>

      <form className="support-form" onSubmit={handleSubmit}>
        <div className="panel-title-row">
          <span className="icon-badge">
            <LifeBuoy size={18} />
          </span>
          <div>
            <p className="eyeline">Supporto community-driven</p>
            <h2>Apri un ticket</h2>
          </div>
        </div>

        <label>
          Email
          <input
            type="email"
            value={draft.email}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            placeholder="tu@email.it"
          />
        </label>

        <label>
          Categoria
          <select
            value={draft.category}
            onChange={(event) =>
              setDraft((current) => ({ ...current, category: event.target.value as SupportTopic["category"] }))
            }
          >
            <option value="Bug">Bug</option>
            <option value="Sicurezza">Sicurezza</option>
            <option value="FAQ">FAQ</option>
            <option value="Idea">Idea</option>
          </select>
        </label>

        <label>
          Titolo
          <input
            value={draft.subject}
            onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
            placeholder="Es. non ricevo l'email di verifica"
          />
        </label>

        <label>
          Dettagli
          <textarea
            value={draft.body}
            onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
            placeholder="Spiega cosa e successo, quale pagina stavi usando e cosa ti aspettavi."
          />
        </label>

        <button className="primary-action" type="submit" disabled={status === "sending"}>
          <Send size={18} />
          {status === "sending" ? "Invio..." : "Invia ticket"}
        </button>

        <p className={`auth-status ${status === "error" ? "error" : status === "sent" ? "sent" : "idle"}`}>
          {message}
        </p>
      </form>
    </section>
  );
}
