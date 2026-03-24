"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/features/cart/store/cart-store";
import { Box, Card, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import { useEffect } from "react";

export default function CartPage() {
  const cart = useCartStore((s) => s.cart);
  const status = useCartStore((s) => s.status);
  const ensureCartLoaded = useCartStore((s) => s.ensureCartLoaded);
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const mutatingProductId = useCartStore((s) => s.mutatingProductId);

  useEffect(() => {
    void ensureCartLoaded();
  }, [ensureCartLoaded]);

  const pending = status === "loading" && !cart;
  const busy = mutatingProductId !== null;

  if (pending) {
    return <Spinner />;
  }

  return (
    <Card.Root>
      <Card.Header>
        <Text fontSize="2xl" fontWeight="bold">
          Cart
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack gap={4}>
          {cart?.items?.map((item) => (
            <Box key={item.key} borderWidth="1px" rounded="md" p={3}>
              <Text fontWeight="semibold">{item.name}</Text>
              <HStack mt={2}>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => updateItemQuantity(item.key, item.quantity + 1, item.id)}
                >
                  +
                </Button>
                <Text>{item.quantity}</Text>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    if (item.quantity <= 1) {
                      return removeItem(item.key, item.id);
                    }
                    return updateItemQuantity(item.key, item.quantity - 1, item.id);
                  }}
                >
                  -
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => removeItem(item.key, item.id)}>
                  Remove
                </Button>
              </HStack>
            </Box>
          ))}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
