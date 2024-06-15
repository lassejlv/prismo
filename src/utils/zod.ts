import { z } from "zod";

const PrismoClientOptions = z.object({
  url: z.string().url(),
  token: z.string(),
  // Disable's the use of the rest api and connects directly to the database
  noRest: z.boolean().optional(),
});

type PrismoOptions = z.infer<typeof PrismoClientOptions>;

export { PrismoClientOptions, type PrismoOptions };
