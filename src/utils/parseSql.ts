function parseSQL(sql: string): string {
  const typeStart = sql.indexOf('CREATE TABLE "') + 'CREATE TABLE "'.length;
  const typeEnd = sql.indexOf('"', typeStart);
  const typeName = sql.substring(typeStart, typeEnd);

  const fieldsStart = sql.indexOf("(", typeEnd) + 1;
  const fieldsEnd = sql.lastIndexOf(")");
  const fieldsText = sql.substring(fieldsStart, fieldsEnd);

  const fields = fieldsText.split(",").map((field) => {
    const parts = field.trim().split(" ");
    const fieldName = parts[0].replace(/"/g, "");
    let fieldType: string;

    const type = parts[1].replace(/"/g, "");

    switch (type) {
      case "TEXT":
        fieldType = "string";
        break;
      case "INTEGER":
        fieldType = "number";
        break;
      case "BOOLEAN":
        fieldType = "boolean";
        break;
      case "FLOAT":
        fieldType = "number";
        break;
      case "DOUBLE":
        fieldType = "number";
        break;
      case "REAL":
        fieldType = "number";
        break;
      case "DATETIME":
        fieldType = "string";
        break;
      default:
        fieldType = "any";
        break;
    }

    return `${fieldName}?: ${fieldType};`;
  });

  return `export type ${typeName} = {\n  ${fields.join("\n  ")}\n};`;
}

export default parseSQL;
