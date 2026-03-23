import { z } from "zod";

export const wpUserSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  username: z.string().optional(),
  roles: z.array(z.string()).optional(),
});
