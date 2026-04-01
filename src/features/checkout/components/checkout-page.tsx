"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { useCartStore, getCartItemsCount } from "@/features/cart/store/cart-store";
import type { CheckoutPayload } from "@/features/catalog/api";
import { getCheckout, putCheckout } from "@/features/catalog/api";
import { CartDeliveryLine } from "@/components/cart-delivery-line";
import { formatCartMoney, type CartFeeLine } from "@/lib/cart-format";
import type { CheckoutOrderResult, StoreApiAddress } from "@/server/schemas/cart";
import { Box, Card, Checkbox, Grid, HStack, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

type BillingForm = {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
};

type ShippingForm = Omit<BillingForm, "email" | "phone">;

const billingDefaults: BillingForm = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  country: "CH",
  email: "",
  phone: "",
};

const shippingDefaults: ShippingForm = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  country: "CH",
};

function mergeStoreAddress(target: BillingForm, src: StoreApiAddress | undefined): BillingForm {
  if (!src) {
    return target;
  }
  return {
    first_name: src.first_name || target.first_name,
    last_name: src.last_name || target.last_name,
    company: src.company ?? target.company,
    address_1: src.address_1 || target.address_1,
    address_2: src.address_2 ?? target.address_2,
    city: src.city || target.city,
    state: src.state ?? target.state,
    postcode: src.postcode || target.postcode,
    country: src.country || target.country,
    email: src.email || target.email,
    phone: src.phone || target.phone,
  };
}

function mergeShippingStore(target: ShippingForm, src: StoreApiAddress | undefined): ShippingForm {
  if (!src) {
    return target;
  }
  return {
    first_name: src.first_name || target.first_name,
    last_name: src.last_name || target.last_name,
    company: src.company ?? target.company,
    address_1: src.address_1 || target.address_1,
    address_2: src.address_2 ?? target.address_2,
    city: src.city || target.city,
    state: src.state ?? target.state,
    postcode: src.postcode || target.postcode,
    country: src.country || target.country,
  };
}

function billingToLoose(b: BillingForm): StoreApiAddress {
  return {
    first_name: b.first_name,
    last_name: b.last_name,
    company: b.company,
    address_1: b.address_1,
    address_2: b.address_2,
    city: b.city,
    state: b.state,
    postcode: b.postcode,
    country: b.country,
    email: b.email,
    phone: b.phone,
  };
}

function shippingToLoose(s: ShippingForm): StoreApiAddress {
  return {
    first_name: s.first_name,
    last_name: s.last_name,
    company: s.company,
    address_1: s.address_1,
    address_2: s.address_2,
    city: s.city,
    state: s.state,
    postcode: s.postcode,
    country: s.country,
    email: "",
    phone: "",
  };
}

function billingToShippingPayload(b: BillingForm): CheckoutPayload["shipping_address"] {
  return {
    first_name: b.first_name,
    last_name: b.last_name,
    company: b.company,
    address_1: b.address_1,
    address_2: b.address_2,
    city: b.city,
    state: b.state,
    postcode: b.postcode,
    country: b.country,
  };
}

function shippingFormToPayload(s: ShippingForm): CheckoutPayload["shipping_address"] {
  return {
    first_name: s.first_name,
    last_name: s.last_name,
    company: s.company,
    address_1: s.address_1,
    address_2: s.address_2,
    city: s.city,
    state: s.state,
    postcode: s.postcode,
    country: s.country,
  };
}

function formatPaymentMethodId(id: string): string {
  return id
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

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
  const [billing, setBilling] = useState<BillingForm>(billingDefaults);
  const [shipping, setShipping] = useState<ShippingForm>(shippingDefaults);
  const [sameShippingAsBilling, setSameShippingAsBilling] = useState(true);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bootstrapDone, setBootstrapDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<CheckoutOrderResult | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);

  const cart = useCartStore((s) => s.cart);
  const status = useCartStore((s) => s.status);
  const cartError = useCartStore((s) => s.error);
  const ensureCartLoaded = useCartStore((s) => s.ensureCartLoaded);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const selectShippingRate = useCartStore((s) => s.selectShippingRate);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const submitCheckout = useCartStore((s) => s.submitCheckout);
  const checkoutError = useCartStore((s) => s.checkoutError);

  const paymentInitRef = useRef(false);

  const applyPromo = useCallback(async () => {
    const code = promoCode.trim();
    if (!code) {
      return;
    }
    setPromoError(null);
    try {
      await applyCoupon(code);
      setPromoCode("");
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : t("promoUnknown"));
    }
  }, [applyCoupon, promoCode, t]);

  const loadBootstrap = useCallback(async () => {
    await ensureCartLoaded();
    await fetchCart();
    const cartAfterInitialFetch = useCartStore.getState().cart;
    try {
      const draft = await getCheckout();
      setBilling((b) => mergeStoreAddress(b, draft.billing_address));
      setShipping((s) => mergeShippingStore(s, draft.shipping_address));
      if (draft.customer_note) {
        setNote(draft.customer_note);
      }
      if (draft.payment_method) {
        setPaymentMethod(draft.payment_method);
        paymentInitRef.current = true;
      }
    } catch {
      /* no draft / guest — rely on cart addresses below */
    }
    await fetchCart();
    const hadItems = getCartItemsCount(cartAfterInitialFetch) > 0;
    let latest = useCartStore.getState().cart;
    if (hadItems && getCartItemsCount(latest) === 0 && cartAfterInitialFetch) {
      /* Woo/Store API can briefly report an empty cart after draft checkout sync; line items are still on the session (see add-to-cart restoring them). */
      useCartStore.setState({ cart: cartAfterInitialFetch, status: "ready", error: null });
      latest = cartAfterInitialFetch;
    }
    if (latest?.billing_address) {
      setBilling((b) => mergeStoreAddress(b, latest.billing_address));
    }
    if (latest?.shipping_address) {
      setShipping((s) => mergeShippingStore(s, latest.shipping_address));
    }
    setBootstrapDone(true);
  }, [ensureCartLoaded, fetchCart]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    if (!cart?.payment_methods?.length) {
      return;
    }
    if (!paymentInitRef.current) {
      setPaymentMethod(cart.payment_methods[0]);
      paymentInitRef.current = true;
      return;
    }
    if (paymentMethod && !cart.payment_methods.includes(paymentMethod)) {
      setPaymentMethod(cart.payment_methods[0]);
    }
  }, [cart?.payment_methods, paymentMethod]);

  const itemCount = getCartItemsCount(cart);
  const cartReady = bootstrapDone && status !== "loading";
  const emptyCart = cartReady && itemCount === 0;

  async function onSubmit() {
    const needsPay = cart?.needs_payment !== false;
    if (needsPay && !paymentMethod) {
      return;
    }
    const shippingPayload = sameShippingAsBilling ? billingToShippingPayload(billing) : shippingFormToPayload(shipping);
    const methodForWoo = needsPay ? paymentMethod : "";

    const payload: CheckoutPayload = {
      billing_address: {
        first_name: billing.first_name,
        last_name: billing.last_name,
        company: billing.company,
        address_1: billing.address_1,
        address_2: billing.address_2,
        city: billing.city,
        state: billing.state,
        postcode: billing.postcode,
        country: billing.country,
        email: billing.email,
        phone: billing.phone,
      },
      shipping_address: shippingPayload,
      customer_note: note || undefined,
      payment_method: methodForWoo,
    };

    setSubmitting(true);
    setOrderResult(null);
    try {
      await putCheckout({
        billing_address: billingToLoose(billing),
        shipping_address: sameShippingAsBilling ? billingToLoose(billing) : shippingToLoose(shipping),
        ...(methodForWoo ? { payment_method: methodForWoo } : {}),
        order_notes: note,
      });
      const result = await submitCheckout(payload);
      if (!result.payment_result?.redirect_url) {
        setOrderResult(result);
      }
    } catch {
      /* checkoutError / store error */
    } finally {
      setSubmitting(false);
    }
  }

  if (!bootstrapDone && status === "loading" && !cart) {
    return (
      <Text color="fg.muted" py={8}>
        {t("loading")}
      </Text>
    );
  }

  if (emptyCart) {
    return (
      <Stack gap={4} py={8}>
        <Text fontSize="xl" fontWeight="semibold">
          {t("emptyCart")}
        </Text>
        <Text color="fg.muted">{t("emptyCartHint")}</Text>
        <Link href="/cart" fontWeight="medium">
          {tNav("cart")}
        </Link>
      </Stack>
    );
  }

  if (orderResult?.order_id != null && !orderResult.payment_result?.redirect_url) {
    return (
      <Stack gap={4} py={8} maxW="lg">
        <Text fontSize="2xl" fontWeight="bold">
          {t("thankYou")}
        </Text>
        <Text color="fg.muted">
          {t("orderReceived", {
            id: String(orderResult.order_number ?? orderResult.order_id),
          })}
        </Text>
        <Link href="/" fontWeight="medium">
          {tNav("catalog")}
        </Link>
      </Stack>
    );
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
          <Stack gap={4}>
            <Text fontWeight="semibold">{t("billing")}</Text>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
              <Input
                placeholder={t("firstName")}
                value={billing.first_name}
                onChange={(e) => setBilling((prev) => ({ ...prev, first_name: e.target.value }))}
              />
              <Input
                placeholder={t("lastName")}
                value={billing.last_name}
                onChange={(e) => setBilling((prev) => ({ ...prev, last_name: e.target.value }))}
              />
            </Grid>
            <Input
              placeholder={t("company")}
              value={billing.company}
              onChange={(e) => setBilling((prev) => ({ ...prev, company: e.target.value }))}
            />
            <Input
              placeholder={t("address")}
              value={billing.address_1}
              onChange={(e) => setBilling((prev) => ({ ...prev, address_1: e.target.value }))}
            />
            <Input
              placeholder={t("address2")}
              value={billing.address_2}
              onChange={(e) => setBilling((prev) => ({ ...prev, address_2: e.target.value }))}
            />
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={3}>
              <Input
                placeholder={t("city")}
                value={billing.city}
                onChange={(e) => setBilling((prev) => ({ ...prev, city: e.target.value }))}
              />
              <Input
                placeholder={t("postcode")}
                value={billing.postcode}
                onChange={(e) => setBilling((prev) => ({ ...prev, postcode: e.target.value }))}
              />
              <Input
                placeholder={t("country")}
                value={billing.country}
                onChange={(e) => setBilling((prev) => ({ ...prev, country: e.target.value }))}
              />
            </Grid>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
              <Input
                type="email"
                placeholder={t("email")}
                value={billing.email}
                onChange={(e) => setBilling((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder={t("phone")}
                value={billing.phone}
                onChange={(e) => setBilling((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>

            <Checkbox.Root
              checked={sameShippingAsBilling}
              onCheckedChange={(d) => setSameShippingAsBilling(!!d.checked)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>{t("sameShipping")}</Checkbox.Label>
            </Checkbox.Root>

            {!sameShippingAsBilling ? (
              <Stack gap={3}>
                <Text fontWeight="semibold">{t("shipping")}</Text>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                  <Input
                    placeholder={t("firstName")}
                    value={shipping.first_name}
                    onChange={(e) => setShipping((prev) => ({ ...prev, first_name: e.target.value }))}
                  />
                  <Input
                    placeholder={t("lastName")}
                    value={shipping.last_name}
                    onChange={(e) => setShipping((prev) => ({ ...prev, last_name: e.target.value }))}
                  />
                </Grid>
                <Input
                  placeholder={t("company")}
                  value={shipping.company}
                  onChange={(e) => setShipping((prev) => ({ ...prev, company: e.target.value }))}
                />
                <Input
                  placeholder={t("address")}
                  value={shipping.address_1}
                  onChange={(e) => setShipping((prev) => ({ ...prev, address_1: e.target.value }))}
                />
                <Input
                  placeholder={t("address2")}
                  value={shipping.address_2}
                  onChange={(e) => setShipping((prev) => ({ ...prev, address_2: e.target.value }))}
                />
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={3}>
                  <Input
                    placeholder={t("city")}
                    value={shipping.city}
                    onChange={(e) => setShipping((prev) => ({ ...prev, city: e.target.value }))}
                  />
                  <Input
                    placeholder={t("postcode")}
                    value={shipping.postcode}
                    onChange={(e) => setShipping((prev) => ({ ...prev, postcode: e.target.value }))}
                  />
                  <Input
                    placeholder={t("country")}
                    value={shipping.country}
                    onChange={(e) => setShipping((prev) => ({ ...prev, country: e.target.value }))}
                  />
                </Grid>
              </Stack>
            ) : null}

            {cart?.needs_shipping && (cart.shipping_rates?.length ?? 0) > 0 ? (
              <Stack gap={2}>
                <Text fontWeight="semibold">{t("shippingMethod")}</Text>
                {cart.shipping_rates.map((pkg) => (
                  <Stack key={pkg.package_id} gap={2} borderWidth="1px" rounded="md" p={3}>
                    <Text fontSize="sm" color="fg.muted">
                      {pkg.name ?? t("shipment")}
                    </Text>
                    {pkg.shipping_rates.map((rate) => (
                      <label key={rate.rate_id}>
                        <HStack gap={2} py={1}>
                          <input
                            type="radio"
                            name={`ship-${pkg.package_id}`}
                            checked={!!rate.selected}
                            onChange={() => {
                              void selectShippingRate(pkg.package_id, rate.rate_id);
                            }}
                          />
                          <Text fontSize="sm">
                            {rate.name}
                            {rate.price != null
                              ? ` — ${formatCartMoney(rate.price, cart.totals?.currency_code, locale)}`
                              : null}
                          </Text>
                        </HStack>
                      </label>
                    ))}
                  </Stack>
                ))}
              </Stack>
            ) : null}

            {(cart?.payment_methods?.length ?? 0) > 0 ? (
              <Stack gap={2}>
                <Text fontWeight="semibold">{t("paymentMethod")}</Text>
                {(cart?.payment_methods ?? []).map((id) => (
                  <label key={id}>
                    <HStack gap={2} py={1}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === id}
                        onChange={() => setPaymentMethod(id)}
                      />
                      <Text fontSize="sm">{formatPaymentMethodId(id)}</Text>
                    </HStack>
                  </label>
                ))}
              </Stack>
            ) : cart?.needs_payment ? (
              <Text fontSize="sm" color="amber.700">
                {t("noPaymentMethods")}
              </Text>
            ) : null}

            <Textarea
              placeholder={t("orderNote")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {cartError ? (
              <Text fontSize="sm" color="red.600">
                {cartError}
              </Text>
            ) : null}
            {checkoutError ? (
              <Text fontSize="sm" color="red.600">
                {checkoutError}
              </Text>
            ) : null}

            <Button
              disabled={submitting || (cart?.needs_payment !== false && !paymentMethod)}
              onClick={() => void onSubmit()}
            >
              {t("submit")}
            </Button>
          </Stack>
        </Card.Body>
      </Card.Root>
      <Card.Root>
        <Card.Header>
          <Text fontWeight="semibold">{tNav("cart")}</Text>
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
              <Stack gap={3} py={3} borderBottomWidth="1px" borderColor="gray.100">
                <Text fontSize="sm" fontWeight="semibold">
                  {t("promoCode")}
                </Text>
                {(cart?.coupons ?? []).map((c) => (
                  <HStack key={c.code} justify="space-between" gap={2} align="center">
                    <Text fontSize="sm">{c.code}</Text>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        setPromoError(null);
                        try {
                          await removeCoupon(c.code);
                        } catch (e) {
                          setPromoError(e instanceof Error ? e.message : t("promoUnknown"));
                        }
                      }}
                    >
                      {t("promoRemove")}
                    </Button>
                  </HStack>
                ))}
                <HStack gap={2} align="flex-end">
                  <Input
                    flex={1}
                    placeholder={t("promoPlaceholder")}
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyPromo();
                      }
                    }}
                  />
                  <Button loadingText={t("promoApplying")} onClick={() => void applyPromo()}>
                    {t("promoApply")}
                  </Button>
                </HStack>
                {promoError ? (
                  <Text fontSize="sm" color="red.600">
                    {promoError}
                  </Text>
                ) : null}
              </Stack>
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
