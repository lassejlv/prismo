import fs from "fs/promises";
import transform from "./utils/transform";
import sql from "./utils/sql";
import { PrismoClientOptions, type PrismoOptions } from "./utils/zod";
import version from "./utils/version";
import parseSQL from "./utils/parseSql";

class PrismoClient<Tables extends string> {
  readonly url: string;
  readonly token: string;

  constructor(options: PrismoOptions) {
    this.url = options.url;
    this.token = options.token;

    const parsedOptions = PrismoClientOptions.safeParse(options);
    if (!parsedOptions.success) throw new Error("Invalid options");
  }

  async findMany<T>({ table, where, limit = 1000 }: { table: Tables; where?: T; limit?: number }): Promise<T[]> {
    if (!table) throw new Error("Table name is required");

    let sqlQuery = `SELECT * FROM ${table}`;

    if (where) {
      const columns = Object.keys(where);
      const values = Object.values(where);

      if (columns.length !== values.length) throw new Error("Columns and values must have the same length");

      const columnValuePairs = columns.map((col, index) => `${col} = '${values[index]}'`);

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

    const response = await sql(`SELECT * FROM ${table} WHERE id = '${id}'`, this.url, this.token);

    const data = await response.json();
    const isError = data.results[0].type === "error";
    if (!response.ok || isError) throw new Error(data.results[0].error.message);

    const transformedData = transform(data.results[0].response.result);
    return transformedData[0] as T;
  }

  async findFirst<T>({ table, where }: { table: Tables; where: T }): Promise<T> {
    if (!table) throw new Error("Table name is required");
    if (!where) throw new Error("Where object is required");

    const columns = Object.keys(where);
    const values = Object.values(where);

    if (columns.length !== values.length) throw new Error("Columns and values must have the same length");

    const columnValuePairs = columns.map((col, index) => `${col} = '${values[index]}'`);

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

    if (columns.length !== values.length) throw new Error("Columns and values must have the same length");

    const columnValuePairs = columns.map((col, index) => `${col} = '${values[index]}'`);

    const response = await sql(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ('${values.join("', '")}')`,
      this.url,
      this.token
    );

    const responseData = await response.json();

    const isError = responseData.results[0].type === "error";
    if (!response.ok || isError) throw new Error(responseData.results[0].error.message);

    return data;
  }

  async update<T>({ table, where, data }: { table: Tables; where: T; data: T }): Promise<T> {
    if (!table) throw new Error("Table name is required");
    if (!where) throw new Error("Where object is required");
    if (!data) throw new Error("Data object is required");

    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);

    if (whereColumns.length !== whereValues.length) throw new Error("Columns and values must have the same length");

    const whereColumnValuePairs = whereColumns.map((col, index) => `${col} = '${whereValues[index]}'`);

    const columns = Object.keys(data);
    const values = Object.values(data);

    if (columns.length !== values.length) throw new Error("Columns and values must have the same length");

    const columnValuePairs = columns.map((col, index) => `${col} = '${values[index]}'`);

    const response = await sql(
      `UPDATE ${table} SET ${columnValuePairs.join(", ")} WHERE ${whereColumnValuePairs.join(" AND ")}`,
      this.url,
      this.token
    );

    const responseData = await response.json();

    const isError = responseData.results[0].type === "error";
    if (!response.ok || isError) throw new Error(responseData.results[0].error.message);

    return data;
  }

  async delete<T>({ table, where }: { table: Tables; where: T }): Promise<T> {
    if (!table) throw new Error("Table name is required");
    if (!where) throw new Error("Where object is required");

    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);

    if (whereColumns.length !== whereValues.length) throw new Error("Columns and values must have the same length");

    const whereColumnValuePairs = whereColumns.map((col, index) => `${col} = '${whereValues[index]}'`);

    const response = await sql(`DELETE FROM ${table} WHERE ${whereColumnValuePairs.join(" AND ")}`, this.url, this.token);

    const responseData = await response.json();

    const isError = responseData.results[0].type === "error";
    if (!response.ok || isError) throw new Error(responseData.results[0].error.message);

    return where;
  }

  async listTables(): Promise<string[]> {
    const response = await sql("SELECT name FROM sqlite_master WHERE type='table';", this.url, this.token);
    const data = await response.json();
    const isError = data.results[0].type === "error";
    if (!response.ok || isError) throw new Error(data.results[0].error.message);

    const transformedData = transform(data.results[0].response.result);
    const names = transformedData.map((table: any) => table.name);

    return names;
  }

  async version(): Promise<string> {
    const response = await version(this.url, this.token);
    if (!response.ok) throw new Error(response.status + response.statusText);

    const data = response.text();
    return data;
  }

  async generateTypes({ writeToSQLFile }: { writeToSQLFile?: boolean }) {
    let finalTypes = "";
    const typesPath = ".prismo";
    const response = await sql("SELECT * FROM sqlite_master WHERE type='table'", this.url, this.token);
    const data = await response.json();

    const transformedData = transform(data.results[0].response.result);

    // Generate type for table names
    const names = transformedData.filter((table: any) => table.name !== "sqlite_sequence").map((table: any) => table.name);

    // Create types file
    await fs.mkdir(typesPath, { recursive: true });
    await fs.mkdir(`${typesPath}/sql`, { recursive: true });

    // prettier-ignore
    finalTypes += `export type Tables = ${names.map((name: string) => `"${name}"`).join(" | ")};\n\n`;

    transformedData
      .filter((table: any) => table.name !== "sqlite_sequence")
      .forEach(async (table: any) => {
        const pathTo = `${typesPath}/sql/${table.name}`;

        if (writeToSQLFile) {
          await fs.writeFile(pathTo + ".sql", table.sql);
        }

        const parsedSql = parseSQL(table.sql);

        finalTypes += parsedSql + "\n\n";
      });

    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true);
      }, 0);
    });

    await fs.writeFile(`${typesPath}/types.ts`, finalTypes);
  }
}

export { PrismoClientOptions, PrismoClient, type PrismoOptions, parseSQL, version, sql, transform };
