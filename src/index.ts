import transform from "./utils/transform";
import sql from "./utils/sql";
import { TursoClientOptions, type TursoOptions } from "./utils/zod";

class TursoClient<Tables extends string> {
  readonly url: string;
  readonly token: string;

  constructor(options: TursoOptions) {
    this.url = options.url;
    this.token = options.token;

    const parsedOptions = TursoClientOptions.safeParse(options);
    if (!parsedOptions.success) throw new Error("Invalid options");
  }

  async findMany<T>(
    table: Tables,
    where?: T,
    limit: number = 1000
  ): Promise<T[]> {
    if (!table) throw new Error("Table name is required");

    let sqlQuery = `SELECT * FROM ${table}`;

    if (where) {
      const columns = Object.keys(where);
      const values = Object.values(where);

      if (columns.length !== values.length)
        throw new Error("Columns and values must have the same length");

      const columnValuePairs = columns.map(
        (col, index) => `${col} = '${values[index]}'`
      );

      sqlQuery += ` WHERE ${columnValuePairs.join(" AND ")}`;
    }

    sqlQuery += ` LIMIT ${limit}`;
    const response = await sql(sqlQuery, this.url, this.token);

    const data = await response.json();
    const isError = data.results[0].type === "error";

    if (!response.ok || isError) throw new Error(data.results[0].error.message);

    const transformedData = transform(data.results[0].response.result);

    if (transformedData.length > 0) return transformedData as T[];
    return [];
  }

  async findOne<T>(table: Tables, id: string): Promise<T> {
    if (!table || !id) throw new Error("Table name and id are required");

    const response = await sql(
      `SELECT * FROM ${table} WHERE id = '${id}'`,
      this.url,
      this.token
    );

    const data = await response.json();
    const isError = data.results[0].type === "error";
    if (!response.ok || isError) throw new Error(data.results[0].error.message);

    const transformedData = transform(data.results[0].response.result);
    return transformedData[0] as T;
  }

  async findFirst<T>(table: Tables, where: T): Promise<T> {
    if (!table) throw new Error("Table name is required");
    if (!where) throw new Error("Where object is required");

    const columns = Object.keys(where);
    const values = Object.values(where);

    if (columns.length !== values.length)
      throw new Error("Columns and values must have the same length");

    const columnValuePairs = columns.map(
      (col, index) => `${col} = '${values[index]}'`
    );

    const response = await sql(
      `SELECT * FROM ${table} WHERE ${columnValuePairs.join(" AND ")} LIMIT 1`,
      this.url,
      this.token
    );

    const data = await response.json();

    const isError = data.results[0].type === "error";
    if (!response.ok || isError) throw new Error(data.results[0].error.message);

    const transformedData = transform(data.results[0].response.result);
    return transformedData[0] as T;
  }

  async listTables(): Promise<string[]> {
    const response = await sql(
      "SELECT name FROM sqlite_master WHERE type='table';",
      this.url,
      this.token
    );
    const data = await response.json();
    const isError = data.results[0].type === "error";
    if (!response.ok || isError) throw new Error(data.results[0].error.message);

    const transformedData = transform(data.results[0].response.result);
    const names = transformedData.map((table: any) => table.name);

    return names;
  }
}

export { TursoClient, TursoClientOptions };
