// apps/web/src/app/admin/messages/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "../RequireAuth";
import { useAuth } from "../AuthContext";
import { AdminApiError } from "@/lib/api/admin-products";
import { listAdminMessages } from "@/lib/api/admin-messages";
import type { ContactAdminRead } from "@/types/api";

type TabKey = "inbox" | "unread" | "archived";

const TABS: { key: TabKey; label: string }[] = [
  { key: "inbox", label: "Boîte de réception" },
  { key: "unread", label: "Non lus" },
  { key: "archived", label: "Archivés" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessagesContent() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ContactAdminRead[]>([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("inbox");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params =
      activeTab === "unread"
        ? { is_read: false, is_archived: false }
        : activeTab === "archived"
          ? { is_archived: true }
          : { is_archived: false };

    listAdminMessages(accessToken, params)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setUnread(data.unread_count);
        setTotal(data.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof AdminApiError ? err.message : "Erreur inattendue");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, activeTab]);

  return (
    <div className="max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">Messages</h1>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-stone-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[#1a6b2f] font-medium text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {tab.label}
            {tab.key === "unread" && unread > 0 && (
              <span className="ml-1.5 rounded-full bg-[#1a6b2f] px-1.5 py-0.5 text-xs text-white">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-stone-500">Chargement…</p>}
      {error && <p className="text-red-600">Erreur : {error}</p>}

      {!isLoading && !error && items.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
          Aucun message dans cette catégorie.
        </p>
      )}

      {items.length > 0 && (
        <>
          <p className="mb-2 text-sm text-stone-500">{total} message(s)</p>
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            {items.map((m) => (
              <Link
                key={m.id}
                href={`/admin/messages/${m.id}`}
                className={`flex items-start gap-3 border-b border-stone-100 px-4 py-3 last:border-0 hover:bg-stone-50 ${
                  m.is_read ? "" : "bg-[#1a6b2f]/[0.03]"
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    m.is_read ? "bg-transparent" : "bg-[#1a6b2f]"
                  }`}
                  title={m.is_read ? "Lu" : "Non lu"}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-stone-900">
                    <span className={m.is_read ? "" : "font-semibold"}>{m.name}</span>
                    <span className="text-stone-400"> · {m.email}</span>
                    {m.replied_at && (
                      <span className="ml-1.5 text-xs text-green-700">✓ répondu</span>
                    )}
                  </p>
                  <p className="truncate text-sm text-stone-500">
                    {m.subject ? `${m.subject} — ` : ""}
                    {m.message}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-stone-400">
                  {formatDate(m.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <RequireAuth>
      <MessagesContent />
    </RequireAuth>
  );
}