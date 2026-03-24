"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/features/cart/store/cart-store";
import type { CheckoutPayload } from "@/features/catalog/api";
import { CartDeliveryLine } from "@/components/cart-delivery-line";
import { formatCartMoney, type CartFeeLine } from "@/lib/cart-format";
import { Box, Card, Grid, HStack, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type FormState = {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
  note: string;
};

const defaults: FormState = {
  first_name: "",
  last_name: "",
  address_1: "",
  city: "",
  postcode: "",
  country: "CH",
  email: "",
  phone: "",
  note: "",
};

function CheckoutFeeRow({ fee, cartCurrency }: { fee: CartFeeLine; cartCurrency: string | null | undefined }) {
  const locale = useLocale();
  const currency = fee.totals?.currency_code ?? cartCurrency;
  const lineText = formatCartMoney(fee.totals?.total ?? null, currency, locale);
  return (
    <Box py={2} borderBottomWidth="1px" borderColor="gray.100">
      <HStack justify="space-between" gap={3}>
        <Text fontSize="sm" color="fg.muted">
          {fee.name}
        </Text>
        <Text fontSize="sm" fontWeight="medium">
          {lineText}
        </Text>
      </HStack>
    </Box>
  );
}

export function CheckoutPage() {
  const t = useTranslations("checkout");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const [form, setForm] = useState<FormState>(defaults);
  const cart = useCartStore((s) => s.cart);
  const ensureCartLoaded = useCartStore((s) => s.ensureCartLoaded);
  const submitCheckout = useCartStore((s) => s.submitCheckout);
  const checkoutError = useCartStore((s) => s.checkoutError);

  useEffect(() => {
    void ensureCartLoaded();
  }, [ensureCartLoaded]);

  async function onSubmit() {
    const payload: CheckoutPayload = {
      billing_address: {
        first_name: form.first_name,
        last_name: form.last_name,
        company: "",
        address_1: form.address_1,
        address_2: "",
        city: form.city,
        state: "",
        postcode: form.postcode,
        country: form.country,
        email: form.email,
        phone: form.phone,
      },
      customer_note: form.note,
    };
    try {
      await submitCheckout(payload);
    } catch {
      /* checkoutError set in store */
    }
  }

  return (
    <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
      <Card.Root>
        <Card.Header>
          <Text fontSize="2xl" fontWeight="bold">
            {t("title")}
          </Text>
        </Card.Header>
        <Card.Body>
          <Stack gap={3}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
              <Input
                placeholder="First name"
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
              />
              <Input
                placeholder="Last name"
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
              />
            </Grid>
            <Input
              placeholder="Address"
              value={form.address_1}
              onChange={(e) => setForm((prev) => ({ ...prev, address_1: e.target.value }))}
            />
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={3}>
              <Input
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              />
              <Input
                placeholder="Postal code"
                value={form.postcode}
                onChange={(e) => setForm((prev) => ({ ...prev, postcode: e.target.value }))}
              />
              <Input
                placeholder="Country code"
                value={form.country}
                onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              />
            </Grid>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Textarea
              placeholder="Order note"
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            />
            {checkoutError ? (
              <Text fontSize="sm" color="red.600">
                {checkoutError}
              </Text>
            ) : null}
            <Button onClick={() => onSubmit()}>{t("submit")}</Button>
          </Stack>
        </Card.Body>
      </Card.Root>
      <Card.Root>
        <Card.Header>
          <Text fontWeight="semibold">Cart</Text>
        </Card.Header>
        <Card.Body>
          {cart?.items?.map((item) => (
            <Box key={item.key} py={2}>
              <Text>{item.name}</Text>
              <Text fontSize="sm" color="fg.muted">
                Qty: {item.quantity}
              </Text>
            </Box>
          ))}
          {cart?.fees?.map((fee) => (
            <CheckoutFeeRow key={fee.key} fee={fee} cartCurrency={cart?.totals?.currency_code} />
          ))}
          {(cart?.items?.length ?? 0) > 0 ? (
            <>
              <CartDeliveryLine
                label={tNav("delivery")}
                amountMinor={cart?.totals?.total_shipping}
                currency={cart?.totals?.currency_code}
                variant="checkout"
              />
              <Box py={2} borderTopWidth="1px" borderColor="gray.200">
                <HStack justify="space-between" gap={3}>
                  <Text fontSize="sm" fontWeight="semibold">
                    {tNav("total")}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {formatCartMoney(cart?.totals?.total_price, cart?.totals?.currency_code, locale)}
                  </Text>
                </HStack>
              </Box>
            </>
          ) : null}
        </Card.Body>
      </Card.Root>
    </Grid>
  );
}
