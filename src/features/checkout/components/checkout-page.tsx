"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { useCartStore, getCartItemsCount } from "@/features/cart/store/cart-store";
import type { CheckoutPayload } from "@/features/catalog/api";
import { getCheckout, putCheckout } from "@/features/catalog/api";
import { apiClient } from "@/lib/api-client";
import { CartDeliveryLine } from "@/components/cart-delivery-line";
import { formatCartMoney, type CartFeeLine } from "@/lib/cart-format";
import { productHrefFromCartLineItem } from "@/lib/product-url";
import type { CartResponse, CheckoutOrderResult, StoreApiAddress } from "@/server/schemas/cart";
import { Box, Card, Checkbox, Grid, HStack, Input, Link as ChakraLink, Stack, Text, Textarea } from "@chakra-ui/react";
import { wooOrderReceivedUrl } from "@/lib/woo-order-received-url";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

function isValidEmail(value: string): boolean {
  const s = value.trim();
  if (s.length === 0) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function shippingRatesFullySelected(cart: CartResponse | null): boolean {
  if (!cart?.needs_shipping) {
    return true;
  }
  const packages = cart.shipping_rates ?? [];
  if (packages.length === 0) {
    return true;
  }
  for (const pkg of packages) {
    const rates = pkg.shipping_rates ?? [];
    if (rates.length === 0) {
      continue;
    }
    if (!rates.some((r) => r.selected)) {
      return false;
    }
  }
  return true;
}

type CheckoutTranslate = (key: string, values?: Record<string, string>) => string;

function collectCheckoutValidation(args: {
  t: CheckoutTranslate;
  billing: BillingForm;
  shipping: ShippingForm;
  sameShippingAsBilling: boolean;
  cart: CartResponse | null;
  needsPay: boolean;
  paymentMethod: string;
}): { messages: string[]; fieldKeys: string[] } {
  const messages: string[] = [];
  const fieldKeys: string[] = [];
  const addReq = (key: string, label: string) => {
    fieldKeys.push(key);
    messages.push(args.t("requiredField", { field: label }));
  };

  if (!args.billing.first_name.trim()) {
    addReq("billing_first_name", args.t("firstName"));
  }
  if (!args.billing.last_name.trim()) {
    addReq("billing_last_name", args.t("lastName"));
  }
  if (!args.billing.address_1.trim()) {
    addReq("billing_address_1", args.t("address"));
  }
  if (!args.billing.city.trim()) {
    addReq("billing_city", args.t("city"));
  }
  if (!args.billing.postcode.trim()) {
    addReq("billing_postcode", args.t("postcode"));
  }
  if (!args.billing.country.trim()) {
    addReq("billing_country", args.t("country"));
  }
  if (!args.billing.email.trim()) {
    addReq("billing_email", args.t("email"));
  } else if (!isValidEmail(args.billing.email)) {
    fieldKeys.push("billing_email");
    messages.push(args.t("invalidEmail"));
  }
  if (!args.billing.phone.trim()) {
    addReq("billing_phone", args.t("phone"));
  }

  if (!args.sameShippingAsBilling) {
    if (!args.shipping.first_name.trim()) {
      addReq("shipping_first_name", args.t("firstName"));
    }
    if (!args.shipping.last_name.trim()) {
      addReq("shipping_last_name", args.t("lastName"));
    }
    if (!args.shipping.address_1.trim()) {
      addReq("shipping_address_1", args.t("address"));
    }
    if (!args.shipping.city.trim()) {
      addReq("shipping_city", args.t("city"));
    }
    if (!args.shipping.postcode.trim()) {
      addReq("shipping_postcode", args.t("postcode"));
    }
    if (!args.shipping.country.trim()) {
      addReq("shipping_country", args.t("country"));
    }
  }

  if (args.needsPay && !args.paymentMethod.trim()) {
    messages.push(args.t("selectPayment"));
    fieldKeys.push("payment_method");
  }

  if (!shippingRatesFullySelected(args.cart)) {
    messages.push(args.t("selectShipping"));
    fieldKeys.push("shipping_method");
  }

  const uniqMessages = Array.from(new Set(messages));
  const uniqFieldKeys = Array.from(new Set(fieldKeys));
  return { messages: uniqMessages, fieldKeys: uniqFieldKeys };
}

function CheckoutIssuesPanel({ title, lines }: { title: string; lines: string[] }) {
  if (lines.length === 0) {
    return null;
  }
  return (
    <Box
      rounded="md"
      borderWidth="1px"
      borderColor="red.200"
      bg="red.50"
      px={4}
      py={3}
      role="alert"
    >
      <Text fontSize="sm" fontWeight="semibold" color="red.800" mb={2}>
        {title}
      </Text>
      <Box as="ul" pl={5} m={0} style={{ listStyleType: "disc" }}>
        {lines.map((line, i) => (
          <Box key={i} as="li" fontSize="sm" color="red.700">
            {line}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function inputErrorProps(active: boolean) {
  return active
    ? { borderColor: "red.500" as const, borderWidth: "1px" as const }
    : {};
}

/** Prefer Woo’s redirect URL; else standard order-received URL when `NEXT_PUBLIC_WOO_SITE_URL` + `order_key` are set. */
function wooOrderDetailsHref(result: CheckoutOrderResult): string | null {
  const redirect = result.payment_result?.redirect_url?.trim();
  if (redirect) {
    try {
      return new URL(redirect).href;
    } catch {
      return null;
    }
  }
  if (result.order_id == null) {
    return null;
  }
  return wooOrderReceivedUrl(result.order_id, result.order_key);
}

/** Storefront `/o/[id]` with `key` (guest access) and `placed` (thank-you banner). */
function storefrontOrderSummaryHref(result: CheckoutOrderResult): string | null {
  if (result.order_id == null) {
    return null;
  }
  const qs = new URLSearchParams();
  const key = result.order_key?.trim();
  if (key) {
    qs.set("key", key);
  }
  qs.set("placed", "1");
  return `/o/${result.order_id}?${qs.toString()}`;
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
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
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
  const [flowErrorLines, setFlowErrorLines] = useState<string[]>([]);
  const [fieldErrorKeys, setFieldErrorKeys] = useState<string[]>([]);

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

  const clearClientCheckoutHints = useCallback(() => {
    setFlowErrorLines([]);
    setFieldErrorKeys([]);
  }, []);

  const issueLines = useMemo(() => {
    const lines: string[] = [...flowErrorLines];
    if (checkoutError) {
      lines.push(checkoutError);
    }
    if (cartError) {
      lines.push(cartError);
    }
    return Array.from(new Set(lines));
  }, [flowErrorLines, checkoutError, cartError]);

  const paymentInitRef = useRef(false);
  /** Drops stale bootstrap work when React Strict Mode or auth re-runs overlap async steps. */
  const bootstrapGenRef = useRef(0);

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
    const gen = ++bootstrapGenRef.current;
    const stale = () => gen !== bootstrapGenRef.current;

    await ensureCartLoaded();
    if (stale()) {
      return;
    }
    await fetchCart();
    if (stale()) {
      return;
    }
    const cartAfterInitialFetch = useCartStore.getState().cart;
    try {
      const draft = await getCheckout();
      if (stale()) {
        return;
      }
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
    if (stale()) {
      return;
    }
    await fetchCart();
    if (stale()) {
      return;
    }
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
    if (!stale()) {
      setBootstrapDone(true);
    }
  }, [ensureCartLoaded, fetchCart]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  const prevSessionStatus = useRef(sessionStatus);
  useEffect(() => {
    if (prevSessionStatus.current !== "authenticated" && sessionStatus === "authenticated") {
      void loadBootstrap();
    }
    prevSessionStatus.current = sessionStatus;
  }, [sessionStatus, loadBootstrap]);

  /** Attach guest Store API orders to the signed-in Woo customer (order_key proves possession). */
  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      return;
    }
    const oid = orderResult?.order_id;
    const okey = orderResult?.order_key?.trim();
    if (oid == null || !okey) {
      return;
    }
    void apiClient.post("account/link-order", { json: { orderId: oid, orderKey: okey } }).catch(() => {});
  }, [sessionStatus, orderResult?.order_id, orderResult?.order_key]);

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

  const signedInLabel =
    session?.user?.email?.trim() ||
    session?.user?.name?.trim() ||
    null;

  const fieldErr = (key: string) => fieldErrorKeys.includes(key);

  async function onSubmit() {
    useCartStore.setState({ checkoutError: null });
    setFlowErrorLines([]);
    setFieldErrorKeys([]);

    const needsPay = cart?.needs_payment !== false;
    const validation = collectCheckoutValidation({
      t: t as CheckoutTranslate,
      billing,
      shipping,
      sameShippingAsBilling,
      cart,
      needsPay,
      paymentMethod,
    });
    if (validation.messages.length > 0) {
      setFlowErrorLines(validation.messages);
      setFieldErrorKeys(validation.fieldKeys);
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
      const payRedirect = result.payment_result?.redirect_url?.trim();
      if (result.order_id != null && !payRedirect) {
        if (sessionStatus === "authenticated") {
          const okey = result.order_key?.trim();
          if (okey) {
            void apiClient.post("account/link-order", { json: { orderId: result.order_id, orderKey: okey } }).catch(() => {});
          }
        }
        const qs = new URLSearchParams();
        const orderKey = result.order_key?.trim();
        if (orderKey) {
          qs.set("key", orderKey);
        }
        qs.set("placed", "1");
        router.replace(`/o/${result.order_id}?${qs.toString()}`);
        return;
      }
      setOrderResult(result);
      if (result.order_id == null) {
        setFlowErrorLines([t("orderIncomplete")]);
      }
    } catch (e) {
      if (!useCartStore.getState().checkoutError) {
        setFlowErrorLines([e instanceof Error ? e.message : t("submitFailed")]);
      }
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

  if (orderResult?.order_id != null && orderResult.payment_result?.redirect_url?.trim()) {
    const wooHref = wooOrderDetailsHref(orderResult);
    const shopOrderHref = storefrontOrderSummaryHref(orderResult);
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
        {shopOrderHref ? (
          <Link href={shopOrderHref} fontWeight="medium">
            {t("viewOrderInShop")}
          </Link>
        ) : null}
        {wooHref ? (
          <ChakraLink href={wooHref} fontWeight="medium" target="_blank" rel="noopener noreferrer">
            {t("thankYouWooLink")}
          </ChakraLink>
        ) : null}
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
            {signedInLabel ? (
              <Box rounded="md" borderWidth="1px" borderColor="brand.200" bg="brand.50" px={4} py={3}>
                <Text fontSize="sm" color="fg.muted">
                  {t("signedInAs", { email: signedInLabel })}
                </Text>
              </Box>
            ) : null}
            <Text fontWeight="semibold">{t("billing")}</Text>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
              <Input
                placeholder={t("firstName")}
                value={billing.first_name}
                onChange={(e) => {
                  clearClientCheckoutHints();
                  setBilling((prev) => ({ ...prev, first_name: e.target.value }));
                }}
                {...inputErrorProps(fieldErr("billing_first_name"))}
              />
              <Input
                placeholder={t("lastName")}
                value={billing.last_name}
                onChange={(e) => {
                  clearClientCheckoutHints();
                  setBilling((prev) => ({ ...prev, last_name: e.target.value }));
                }}
                {...inputErrorProps(fieldErr("billing_last_name"))}
              />
            </Grid>
            <Input
              placeholder={t("company")}
              value={billing.company}
              onChange={(e) => {
                clearClientCheckoutHints();
                setBilling((prev) => ({ ...prev, company: e.target.value }));
              }}
            />
            <Input
              placeholder={t("address")}
              value={billing.address_1}
              onChange={(e) => {
                clearClientCheckoutHints();
                setBilling((prev) => ({ ...prev, address_1: e.target.value }));
              }}
              {...inputErrorProps(fieldErr("billing_address_1"))}
            />
            <Input
              placeholder={t("address2")}
              value={billing.address_2}
              onChange={(e) => {
                clearClientCheckoutHints();
                setBilling((prev) => ({ ...prev, address_2: e.target.value }));
              }}
            />
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={3}>
              <Input
                placeholder={t("city")}
                value={billing.city}
                onChange={(e) => {
                  clearClientCheckoutHints();
                  setBilling((prev) => ({ ...prev, city: e.target.value }));
                }}
                {...inputErrorProps(fieldErr("billing_city"))}
              />
              <Input
                placeholder={t("postcode")}
                value={billing.postcode}
                onChange={(e) => {
                  clearClientCheckoutHints();
                  setBilling((prev) => ({ ...prev, postcode: e.target.value }));
                }}
                {...inputErrorProps(fieldErr("billing_postcode"))}
              />
              <Input
                placeholder={t("country")}
                value={billing.country}
                onChange={(e) => {
                  clearClientCheckoutHints();
                  setBilling((prev) => ({ ...prev, country: e.target.value }));
                }}
                {...inputErrorProps(fieldErr("billing_country"))}
              />
            </Grid>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
              <Input
                type="email"
                placeholder={t("email")}
                value={billing.email}
                onChange={(e) => {
                  clearClientCheckoutHints();
                  setBilling((prev) => ({ ...prev, email: e.target.value }));
                }}
                {...inputErrorProps(fieldErr("billing_email"))}
              />
              <Input
                placeholder={t("phone")}
                value={billing.phone}
                onChange={(e) => {
                  clearClientCheckoutHints();
                  setBilling((prev) => ({ ...prev, phone: e.target.value }));
                }}
                {...inputErrorProps(fieldErr("billing_phone"))}
              />
            </Grid>

            <Checkbox.Root
              checked={sameShippingAsBilling}
              onCheckedChange={(d) => {
                clearClientCheckoutHints();
                setSameShippingAsBilling(!!d.checked);
              }}
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
                    onChange={(e) => {
                      clearClientCheckoutHints();
                      setShipping((prev) => ({ ...prev, first_name: e.target.value }));
                    }}
                    {...inputErrorProps(fieldErr("shipping_first_name"))}
                  />
                  <Input
                    placeholder={t("lastName")}
                    value={shipping.last_name}
                    onChange={(e) => {
                      clearClientCheckoutHints();
                      setShipping((prev) => ({ ...prev, last_name: e.target.value }));
                    }}
                    {...inputErrorProps(fieldErr("shipping_last_name"))}
                  />
                </Grid>
                <Input
                  placeholder={t("company")}
                  value={shipping.company}
                  onChange={(e) => {
                    clearClientCheckoutHints();
                    setShipping((prev) => ({ ...prev, company: e.target.value }));
                  }}
                />
                <Input
                  placeholder={t("address")}
                  value={shipping.address_1}
                  onChange={(e) => {
                    clearClientCheckoutHints();
                    setShipping((prev) => ({ ...prev, address_1: e.target.value }));
                  }}
                  {...inputErrorProps(fieldErr("shipping_address_1"))}
                />
                <Input
                  placeholder={t("address2")}
                  value={shipping.address_2}
                  onChange={(e) => {
                    clearClientCheckoutHints();
                    setShipping((prev) => ({ ...prev, address_2: e.target.value }));
                  }}
                />
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={3}>
                  <Input
                    placeholder={t("city")}
                    value={shipping.city}
                    onChange={(e) => {
                      clearClientCheckoutHints();
                      setShipping((prev) => ({ ...prev, city: e.target.value }));
                    }}
                    {...inputErrorProps(fieldErr("shipping_city"))}
                  />
                  <Input
                    placeholder={t("postcode")}
                    value={shipping.postcode}
                    onChange={(e) => {
                      clearClientCheckoutHints();
                      setShipping((prev) => ({ ...prev, postcode: e.target.value }));
                    }}
                    {...inputErrorProps(fieldErr("shipping_postcode"))}
                  />
                  <Input
                    placeholder={t("country")}
                    value={shipping.country}
                    onChange={(e) => {
                      clearClientCheckoutHints();
                      setShipping((prev) => ({ ...prev, country: e.target.value }));
                    }}
                    {...inputErrorProps(fieldErr("shipping_country"))}
                  />
                </Grid>
              </Stack>
            ) : null}

            {cart?.needs_shipping && (cart.shipping_rates?.length ?? 0) > 0 ? (
              <Stack
                gap={2}
                rounded="md"
                borderWidth={fieldErr("shipping_method") ? "2px" : "0"}
                borderColor={fieldErr("shipping_method") ? "red.500" : "transparent"}
                p={fieldErr("shipping_method") ? 2 : 0}
              >
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
                              clearClientCheckoutHints();
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
              <Stack
                gap={2}
                rounded="md"
                borderWidth={fieldErr("payment_method") ? "2px" : "0"}
                borderColor={fieldErr("payment_method") ? "red.500" : "transparent"}
                p={fieldErr("payment_method") ? 2 : 0}
              >
                <Text fontWeight="semibold">{t("paymentMethod")}</Text>
                {(cart?.payment_methods ?? []).map((id) => (
                  <label key={id}>
                    <HStack gap={2} py={1}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === id}
                        onChange={() => {
                          clearClientCheckoutHints();
                          setPaymentMethod(id);
                        }}
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
              onChange={(e) => {
                clearClientCheckoutHints();
                setNote(e.target.value);
              }}
            />

            <CheckoutIssuesPanel title={t("issuesTitle")} lines={issueLines} />

            <Button
              disabled={submitting || (cart?.needs_payment !== false && !paymentMethod)}
              loading={submitting}
              loadingText={t("submitting")}
              onClick={() => onSubmit()}
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
          {cart?.items?.map((item) => {
            const href = productHrefFromCartLineItem(item);
            return (
            <Box key={item.key} py={2}>
              {href ? (
                <Link href={href} variant="plain" _hover={{ textDecoration: "underline" }}>
                  {item.name}
                </Link>
              ) : (
                <Text>{item.name}</Text>
              )}
              <Text fontSize="sm" color="fg.muted">
                Qty: {item.quantity}
              </Text>
            </Box>
            );
          })}
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
