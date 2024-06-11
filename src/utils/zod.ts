import { z } from "zod";

const TursoClientOptions = z.object({
  url: z.string().url(),
  token: z.string(),
});

type TursoOptions = z.infer<typeof TursoClientOptions>;

export { TursoClientOptions, type TursoOptions };
