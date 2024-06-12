import { type Guild } from "./../.prismo/types/Guild";
import { PrismoClient } from ".";
import { type Tables } from "../.prismo/tables";

const db = new PrismoClient<Tables>({
  url: process.env.TURSO_URL!,
  token: process.env.TURSO_TOKEN!,
});

const guilds = await db.findMany<Guild>({ table: "Guild" });
console.log(guilds);

await db.generateTypes();
