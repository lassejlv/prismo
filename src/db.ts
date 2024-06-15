import { PrismoClient } from ".";
import { Tables, Guild } from "../.prismo/types";

const db = new PrismoClient<Tables>({
  url: process.env.TURSO_URL!,
  token: process.env.TURSO_TOKEN!,
  noRest: true,
});

const tables = await db.findMany<Guild>({ table: "Guild", where: { id: "788a2b62-6b6b-497f-94cc-db1649eafebb" } });

console.log(tables);
