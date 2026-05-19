export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("minimart_token");
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = "API Request Failed";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch(e) {}
    throw new Error(errorMsg);
  }

  return response.json();
};
