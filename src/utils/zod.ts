import { z } from "zod";

const PrismoClientOptions = z.object({
  url: z.string().url(),
  token: z.string(),
});

type PrismoOptions = z.infer<typeof PrismoClientOptions>;

export { PrismoClientOptions, type PrismoOptions };
