"use client";
import { useRouter } from "next/navigation";
import { IconLogout } from "./icons";

export default function LogoutButton({ label, locale }: { label: string; locale: string }) {
  const router = useRouter();
  return (
    <button
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:text-slate-300 md:hover:bg-white/10 md:hover:text-white"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push(`/${locale}/login`);
        router.refresh();
      }}
    >
      <IconLogout />
      {label}
    </button>
  );
}
