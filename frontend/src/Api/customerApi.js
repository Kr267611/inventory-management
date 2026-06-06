// Api/customerApi.js
import { api } from "./api";

export const customerApi = {
  getAll:  (activeOnly = false) => api.get(`/customer${activeOnly ? "?activeOnly=true" : ""}`),
  getById: (id)       => api.get(`/customer/${id}`),
  create:  (data)     => api.post("/customer/add", data),
  update:  (id, data) => api.put(`/customer/${id}`, data),
  remove:  (id)       => api.delete(`/customer/${id}`),    // 👈 'delete' → 'remove'

  // Bonus — reactivate ek inactive customer ko
  reactivate: (id) => api.put(`/customer/${id}`, { isActive: true }),
};