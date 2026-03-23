"use client";

import { Box, Button, Card, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { cartResponseSchema } from "@/server/schemas/cart";

export default function CartPage() {
  const queryClient = useQueryClient();
  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: async () => cartResponseSchema.parse(await (await apiClient.get("woo/cart")).json()),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, quantity }: { key: string; quantity: number }) =>
      apiClient.patch(`woo/cart/update-item?key=${encodeURIComponent(key)}`, { json: { quantity } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) =>
      apiClient.delete(`woo/cart/remove-item?key=${encodeURIComponent(key)}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  if (cartQuery.isPending) {
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
          {cartQuery.data?.items?.map((item: { key: string; name: string; quantity: number }) => (
            <Box key={item.key} borderWidth="1px" rounded="md" p={3}>
              <Text fontWeight="semibold">{item.name}</Text>
              <HStack mt={2}>
                <Button size="sm" onClick={() => updateMutation.mutate({ key: item.key, quantity: item.quantity + 1 })}>
                  +
                </Button>
                <Text>{item.quantity}</Text>
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate({ key: item.key, quantity: Math.max(0, item.quantity - 1) })}
                >
                  -
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(item.key)}>
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
