"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton({ label, locale }: { label: string; locale: string }) {
  const router = useRouter();
  return (
    <button
      className="rounded border px-2 py-1 hover:bg-slate-100"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push(`/${locale}/login`);
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
