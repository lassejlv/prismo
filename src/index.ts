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

  async findMany<T>({
    table,
    where,
    limit = 1000,
  }: {
    table: Tables;
    where?: T;
    limit?: number;
  }): Promise<T[]> {
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

  async findOne<T>({ table, id }: { table: Tables; id: string }): Promise<T> {
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

  async findFirst<T>({
    table,
    where,
  }: {
    table: Tables;
    where: T;
  }): Promise<T> {
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

  async create<T>({ table, data }: { table: Tables; data: T }): Promise<T> {
    if (!table) throw new Error("Table name is required");
    if (!data) throw new Error("Data object is required");

    const columns = Object.keys(data);
    const values = Object.values(data);

    if (columns.length !== values.length)
      throw new Error("Columns and values must have the same length");

    const columnValuePairs = columns.map(
      (col, index) => `${col} = '${values[index]}'`
    );

    const response = await sql(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ('${values.join(
        "', '"
      )}')`,
      this.url,
      this.token
    );

    const responseData = await response.json();

    const isError = responseData.results[0].type === "error";
    if (!response.ok || isError)
      throw new Error(responseData.results[0].error.message);

    return data;
  }

  async update<T>({
    table,
    where,
    data,
  }: {
    table: Tables;
    where: T;
    data: T;
  }): Promise<T> {
    if (!table) throw new Error("Table name is required");
    if (!where) throw new Error("Where object is required");
    if (!data) throw new Error("Data object is required");

    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);

    if (whereColumns.length !== whereValues.length)
      throw new Error("Columns and values must have the same length");

    const whereColumnValuePairs = whereColumns.map(
      (col, index) => `${col} = '${whereValues[index]}'`
    );

    const columns = Object.keys(data);
    const values = Object.values(data);

    if (columns.length !== values.length)
      throw new Error("Columns and values must have the same length");

    const columnValuePairs = columns.map(
      (col, index) => `${col} = '${values[index]}'`
    );

    const response = await sql(
      `UPDATE ${table} SET ${columnValuePairs.join(
        ", "
      )} WHERE ${whereColumnValuePairs.join(" AND ")}`,
      this.url,
      this.token
    );

    const responseData = await response.json();

    const isError = responseData.results[0].type === "error";
    if (!response.ok || isError)
      throw new Error(responseData.results[0].error.message);

    return data;
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
