"use client";

import { Box, Button, Card, Grid, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { cartResponseSchema } from "@/server/schemas/cart";

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

export function CheckoutPage() {
  const t = useTranslations("checkout");
  const [form, setForm] = useState<FormState>(defaults);

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: async () => cartResponseSchema.parse(await (await apiClient.get("woo/cart")).json()),
  });

  const checkoutMutation = useMutation({
    mutationFn: async () =>
      apiClient.post("woo/checkout", {
        json: {
          billing_address: {
            first_name: form.first_name,
            last_name: form.last_name,
            address_1: form.address_1,
            city: form.city,
            postcode: form.postcode,
            country: form.country,
            email: form.email,
            phone: form.phone,
          },
          customer_note: form.note,
        },
      }),
  });

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
            <Button loading={checkoutMutation.isPending} onClick={() => checkoutMutation.mutate()}>
              {t("submit")}
            </Button>
          </Stack>
        </Card.Body>
      </Card.Root>
      <Card.Root>
        <Card.Header>
          <Text fontWeight="semibold">Cart</Text>
        </Card.Header>
        <Card.Body>
          {cartQuery.data?.items?.map((item: { key: string; name: string; quantity: number }) => (
            <Box key={item.key} py={2}>
              <Text>{item.name}</Text>
              <Text fontSize="sm" color="fg.muted">
                Qty: {item.quantity}
              </Text>
            </Box>
          ))}
        </Card.Body>
      </Card.Root>
    </Grid>
  );
}
