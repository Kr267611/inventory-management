import { api } from "./api";

export const paymentModeApi = {
  getAll:     (activeOnly = false) => api.get(`/paymentmode${activeOnly ? "?activeOnly=true" : ""}`),
  getById:    (id)       => api.get(`/paymentmode/${id}`),
  create:     (data)     => api.post("/paymentmode/add", data),
  update:     (id, data) => api.put(`/paymentmode/${id}`, data),
  remove:     (id)       => api.delete(`/paymentmode/${id}`),
  reactivate: (id)       => api.put(`/paymentmode/${id}`, { isActive: true }),
};