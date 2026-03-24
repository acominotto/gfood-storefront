"use client";

import { Box, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type GateProps = {
  authPath: string;
};

export function TaxonomyPreviewGate({ authPath }: GateProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const res = await fetch(authPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError(res.status === 401 ? "Wrong password." : "Could not sign in. Try again.");
      return;
    }
    router.refresh();
  }

  return (
    <Stack gap={4} maxW="sm">
      <Heading size="lg">Taxonomy preview</Heading>
      <Text color="fg.muted">Enter the preview password to load WooCommerce categories and tags.</Text>
      <Box
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Stack gap={3}>
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
          />
          {error ? (
            <Text color="red.600" fontSize="sm">
              {error}
            </Text>
          ) : null}
          <Button type="submit">Continue</Button>
        </Stack>
      </Box>
    </Stack>
  );
}

type ToolbarProps = {
  authPath: string;
};

export function TaxonomyPreviewToolbar({ authPath }: ToolbarProps) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await fetch(authPath, { method: "DELETE" });
        router.refresh();
      }}
    >
      Clear session
    </Button>
  );
}
