function version(url: string, token: string): Promise<Response> {
  return fetch(`${url}/version`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export default version;
