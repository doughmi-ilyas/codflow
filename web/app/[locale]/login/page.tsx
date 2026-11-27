import { notFound } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { isLocale, t } from "@/lib/i18n";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main className="mx-auto mt-24 max-w-sm rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold">{t(locale).appName} · {t(locale).login.title}</h1>
      <LoginForm locale={locale} />
    </main>
  );
}
