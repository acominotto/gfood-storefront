import { redirect } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleIndexPage({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/commander-en-ligne", locale });
}
