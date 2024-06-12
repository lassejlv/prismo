function sql(sql: string, url: string, token: string): Promise<Response> {
  return fetch(`${url}/v2/pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql,
          },
        },
        { type: "close" },
      ],
    }),
  });
}

export default sql;
