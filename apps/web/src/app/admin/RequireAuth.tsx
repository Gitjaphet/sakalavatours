"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { accessToken, user, restoreSession } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (accessToken && user) {
      setChecked(true);
      return;
    }

    restoreSession()
      .then((ok) => {
        if (!ok) {
          router.replace("/admin/login");
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        router.replace("/admin/login");
      });
  }, [accessToken, user, restoreSession, router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-stone-500">
        Chargement...
      </div>
    );
  }

  return <>{children}</>;
}