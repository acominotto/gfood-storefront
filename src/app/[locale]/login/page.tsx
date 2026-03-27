import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth-options";
import { getWpAccountUrls } from "@/server/wp-auth";
import { LoginView } from "./login-view";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
};

function sanitizeCallbackUrl(raw: string | undefined, locale: string) {
  const fallback = `/${locale}`;
  if (!raw || typeof raw !== "string") return fallback;
  const u = raw.trim();
  if (!u.startsWith("/") || u.startsWith("//") || !u.startsWith(`/${locale}/`)) return fallback;
  return u;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const q = await searchParams;
  const returnTo = sanitizeCallbackUrl(q.callbackUrl, locale);

  const session = await getServerSession(authOptions);
  if (session) {
    redirect(returnTo);
  }

  const { lostPassword, register } = getWpAccountUrls();

  return <LoginView returnTo={returnTo} lostPasswordUrl={lostPassword} registerUrl={register} />;
}
