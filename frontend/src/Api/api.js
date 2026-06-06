// src/api/api.js
// Generic fetch wrapper — sab API calls yahaan se hoti hain

const BASE_URL =
  process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : "http://localhost:5000/api";

/**
 * Token nikalne ka helper — localStorage se
 */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Internal request function — saare GET/POST/PUT/DELETE iske through chalte hain
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),               // ← token auto-attach
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

    // 401 Unauthorized — token expired/invalid, clear kar do
    if (res.status === 401) {
     const hasToken = localStorage.getItem("token");
      // localStorage.removeItem("token");
     if (hasToken) {
       throw new Error("Session expired. Please login again.");
      }else{
        throw new Error("Unauthorized. Please login.");
      }
      // Agar tu chahe toh login pe redirect kar de:
      // window.location.href = "/login";
      // throw new Error("Session expired. Please login again.");
    }

    // Content-type check — HTML/text response pe res.json() crash karta hai
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    // Agar status 2xx nahi hai toh error throw kar
    if (!res.ok) {
      const message = isJson
        ? (data.error || data.message || `Request failed with status ${res.status}`)
        : `HTTP ${res.status} - ${res.statusText}`;
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
 * Public API — components ye 5 methods use karenge
 */
export const api = {
  get:    (endpoint)         => request(endpoint),
  post:   (endpoint, body)   => request(endpoint, { method: "POST",   body }),
  put:    (endpoint, body)   => request(endpoint, { method: "PUT",    body }),
  patch:  (endpoint, body)   => request(endpoint, { method: "PATCH",  body }),
  delete: (endpoint)         => request(endpoint, { method: "DELETE" }),
};