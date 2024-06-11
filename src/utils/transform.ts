function transform(data: any) {
  const result = data.rows.map((row: any) => {
    return data.cols.reduce((acc: any, col: any, index: any) => {
      acc[col.name] = row[index].value;
      return acc;
    }, {});
  });

  return result;
}

export default transform;
