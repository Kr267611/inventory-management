import { api } from "./api";

export const paymentApi = {
  getAll:    (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return api.get(`/payment${qs ? `?${qs}` : ""}`);
  },
  getStats:  ()         => api.get("/payment/stats"),
  getById:   (id)       => api.get(`/payment/${id}`),
  create:    (data)     => api.post("/payment/add", data),
  update:    (id, data) => api.put(`/payment/${id}`, data),
  remove:    (id)       => api.delete(`/payment/${id}`),
};