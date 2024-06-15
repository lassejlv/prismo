function transform(data: any) {
  const result = data.rows.map((row: any) => {
    return data.cols.reduce((acc: any, col: any, index: any) => {
      acc[col.name] = row[index].value;
      return acc;
    }, {});
  });

  return result;
}

const transformResponse = (response: any) => {
  return response.rows.map((row: any) => {
    const transformedRow: any = {};
    response.columns.forEach((col: any, index: any) => {
      transformedRow[col] = row[col] || row[index.toString()];
    });
    return transformedRow;
  });
};

export { transform, transformResponse };
