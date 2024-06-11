import { TursoClient } from ".";

const db = new TursoClient<"Guild" | "User">({
  url: process.env.TURSO_URL!,
  token: process.env.TURSO_TOKEN!,
});

db.listTables().then(console.log).catch(console.error);
