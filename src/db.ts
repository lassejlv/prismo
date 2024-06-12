import { PrismoClient } from ".";
import { Tables } from "../.prismo/types";

const db = new PrismoClient<Tables>({
  url: process.env.TURSO_URL!,
  token: process.env.TURSO_TOKEN!,
});

await db.generateTypes({
  writeToSQLFile: false,
});
