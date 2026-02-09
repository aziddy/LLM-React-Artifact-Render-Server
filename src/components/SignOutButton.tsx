"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  function handleSignOut() {
    if (!confirm("Are you sure you want to sign out?")) return;
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
    >
      Sign Out
    </button>
  );
}
