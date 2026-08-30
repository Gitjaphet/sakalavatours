// apps/web/src/components/reviews/ReviewVerification.tsx
"use client";

import { useState } from "react";

type Props = {
  token: string | null;
  labels: {
    intro: string;
    action: string;
    pending: string;
    missing: string;
    success: string;
  };
};

export function ReviewVerification({ token, labels }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function confirm() {
    if (!token) return;
    setState("loading");

    try {
      const res = await fetch(
        `/api/reviews/verify?token=${encodeURIComponent(token)}`,
        { method: "POST" },
      );
      const data = await res.json();

      if (res.ok) {
        // Le message de l'API est en français : c'est un texte d'interface,
        // il doit suivre la langue de la page.
        setState("done");
        setMessage(labels.success);
      } else {
        setState("error");
        setMessage(data.detail ?? "");
      }
    } catch {
      setState("error");
      setMessage("");
    }
  }

  if (!token) {
    return <p className="text-stone-600">{labels.missing}</p>;
  }

  if (state === "done" || state === "error") {
    return (
      <p
        className={`rounded-lg p-4 text-sm ${
          state === "done"
            ? "bg-green-50 text-green-800"
            : "bg-red-50 text-red-700"
        }`}
      >
        {message || labels.pending}
      </p>
    );
  }

  return (
    <div className="text-center">
      <p className="mb-6 text-stone-600">{labels.intro}</p>
      <button
        type="button"
        onClick={confirm}
        disabled={state === "loading"}
        className="rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] px-8 py-3 font-medium text-white disabled:opacity-50"
      >
        {state === "loading" ? labels.pending : labels.action}
      </button>
    </div>
  );
}