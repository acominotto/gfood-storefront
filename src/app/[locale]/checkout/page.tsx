import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckoutPage } from "@/features/checkout/components/checkout-page";
import { authOptions } from "@/server/auth-options";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CheckoutRoute({ params }: PageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/checkout`);
  }
  return <CheckoutPage />;
}
