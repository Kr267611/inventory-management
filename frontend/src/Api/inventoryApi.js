import {api} from "./api";

export const inventoryApi = {
  // List with filters — filters object pass karo
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== "All Fabrics" && v !== "All Quality" && v !== "All Color"
          && v !== "All Locations" && v !== "All Stock") {
        params.append(k, v);
      }
    });
    const qs = params.toString();
    return api.get(`/inventory${qs ? `?${qs}` : ""}`);
  },

  getStats: () => api.get("/inventory/stats"),

  // For Sales form — stock check before adding item
  checkStock: ({ fabric, fabricQuality, color, location }) => {
    const params = new URLSearchParams({ fabric });
    if (fabricQuality) params.append("fabricQuality", fabricQuality);
    if (color) params.append("color", color);
    if (location) params.append("location", location);
    return api.get(`/inventory/check?${params.toString()}`);
  },

  getById: (id) => api.get(`/inventory/${id}`),

  // Sirf minStockPcs update karne ke liye
  updateMinStock: (id, minStockPcs) =>
    api.put(`/inventory/${id}`, { minStockPcs }),
};