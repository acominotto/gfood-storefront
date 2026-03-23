"use client";

import { ky } from "zod-ky";

export const apiClient = ky.create({
  prefixUrl: "/api",
  timeout: 8000,
  retry: 1,
});
