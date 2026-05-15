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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function SupportCenter() {
  const [draft, setDraft] = useState<TicketDraft>(emptyTicket);
  const [status, setStatus] = useState<TicketStatus>("idle");
  const [message, setMessage] = useState("Scrivici cosa e successo: ti aiutiamo a rientrare in conversazione.");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(draft.email)) {
      setStatus("error");
      setMessage("Scrivi un indirizzo email valido, cosi possiamo risponderti.");
      return;
    }

    if (!draft.subject.trim() || draft.body.trim().length < 12) {
      setStatus("error");
      setMessage("Aggiungi un titolo e qualche dettaglio in piu: ci basta capire cosa e successo.");
      return;
    }

    setStatus("sending");
    setMessage("Sto inviando il ticket...");

    const client = getSupabaseClient();

    if (!client) {
      setStatus("error");
      setMessage("Il supporto online non e raggiungibile ora. Lascia il testo qui e riprova tra poco.");
      return;
    }

    try {
      const { data: authData } = await client.auth.getUser();
      const { error } = await client.from("support_tickets").insert({
        author_id: authData.user?.id ?? null,
        body: draft.body.trim(),
        category: draft.category,
        email: draft.email.trim(),
        subject: draft.subject.trim(),
      });

      if (error) {
        console.warn("Support ticket insert failed", error.message);
        setStatus("error");
        setMessage("Non sono riuscito a inviare il ticket. Riprova tra poco: il messaggio resta nel form.");
        return;
      }

      setStatus("sent");
      setMessage("Ticket inviato. Grazie: lo leggiamo e ti rispondiamo appena possibile.");
      setDraft(emptyTicket);
    } catch (error) {
      console.warn("Support ticket submit failed", error);
      setStatus("error");
      setMessage("Non sono riuscito a inviare il ticket. Controlla la connessione e riprova tra poco.");
    }
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
            <p className="eyeline">Supporto</p>
            <h2>Raccontaci cosa non va</h2>
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
            <option value="Bug">Problema tecnico</option>
            <option value="Sicurezza">Sicurezza o comportamento scorretto</option>
            <option value="FAQ">Domanda sull'app</option>
            <option value="Idea">Idea per migliorare TopicTime</option>
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
