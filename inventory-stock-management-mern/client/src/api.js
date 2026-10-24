const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = sessionStorage.getItem("inventoryToken");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  summary: () => request("/products/summary"),
  products: (params = {}) => request(`/products?${new URLSearchParams(params)}`),
  create: (body) => request("/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
  stock: (id, body) => request(`/products/${id}/stock`, { method: "PATCH", body: JSON.stringify(body) })
};
