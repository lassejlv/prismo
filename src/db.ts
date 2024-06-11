import { TursoClient } from ".";

const db = new TursoClient<"Guild" | "User">({
  url: process.env.TURSO_URL!,
  token: process.env.TURSO_TOKEN!,
});

interface Guild {
  id?: string;
  guildId?: string;
  prefix?: string;
  createdAt?: string;
  updatedAt?: string;
}

const guild = await db.findMany<Guild>({
  table: "Guild",
});

console.log(guild);
