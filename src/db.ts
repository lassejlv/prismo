import type { Guild, Tables } from "../.prismo/types";
import { PrismoClient } from ".";

const db = new PrismoClient<Tables>({
  url: process.env.TURSO_URL!,
  token: process.env.TURSO_TOKEN!,
});

await db.generateTypes();
