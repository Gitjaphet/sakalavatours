/**
 * Formulaire de contact.
 *
 * Passe par le proxy Next et non par l'API directement : le backend doit
 * voir l'IP du visiteur pour appliquer son quota.
 */

export type ContactPayload = {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  locale: string;
  /** Honeypot : rempli uniquement par les robots. */
  website?: string;
};

export class ContactError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContactError";
  }
}

export async function submitContact(payload: ContactPayload): Promise<void> {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) return;

  const data = await res.json().catch(() => ({}));
  const detail = data?.detail;

  if (typeof detail === "string") throw new ContactError(detail);
  if (Array.isArray(detail)) {
    throw new ContactError(
      detail.map((e: { msg?: string }) => e?.msg).filter(Boolean).join(" · "),
    );
  }
  throw new ContactError("");
}