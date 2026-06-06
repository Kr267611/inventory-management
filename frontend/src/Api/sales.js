import { api } from "./api";

export const salesApi = {
  // List with filters
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    const qs = params.toString();
    return api.get(`/sales${qs ? `?${qs}` : ""}`);
  },

  getStats: ()         => api.get("/sales/stats"),
  getById:  (id)       => api.get(`/sales/${id}`),
  create:   (data)     => api.post("/sales/add", data),
  update:   (id, data) => api.put(`/sales/${id}`, data),
  remove:   (id)       => api.delete(`/sales/${id}`),
};