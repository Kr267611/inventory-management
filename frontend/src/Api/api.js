// src/api/api.js
// Generic fetch wrapper — sab API calls yahaan se hoti hain

const BASE_URL = "http://localhost:5000/api";  // backend URL — change as per server

/**
 * Internal request function — saare GET/POST/PUT/DELETE iske through chalte hain
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      // Future me JWT chahiye toh: Authorization: `Bearer ${token}`
      ...(options.headers || {}),
    },
  };

  // Agar body object hai toh JSON stringify kar do automatically
  if (options.body) {
    config.body = typeof options.body === "string"
      ? options.body
      : JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);

    // 204 No Content (DELETE me aksar aata hai) — body khaali hoti hai
    if (res.status === 204) return null;

    // Response ko JSON me parse kar
    const data = await res.json();

    // Agar status 2xx nahi hai toh error throw kar
    if (!res.ok) {
      const message = data.error || data.message || `Request failed with status ${res.status}`;
      throw new Error(message);
    }

    return data;
  } catch (err) {
    // Network error ya parsing error
    console.error(`[API ${config.method} ${endpoint}]`, err.message);
    throw err;
  }
}

/**
 * Public API — components ye 4 methods use karenge
 */
export const api = {
  get:    (endpoint)         => request(endpoint),
  post:   (endpoint, body)   => request(endpoint, { method: "POST",   body }),
  put:    (endpoint, body)   => request(endpoint, { method: "PUT",    body }),
  patch:  (endpoint, body)   => request(endpoint, { method: "PATCH",  body }),
  delete: (endpoint)         => request(endpoint, { method: "DELETE" }),
};