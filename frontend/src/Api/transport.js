import { api } from "./api";

export const transportApi = {

  // Get All Transports
  getAll: (activeOnly = false) =>
    api.get(`/transport${activeOnly ? "?activeOnly=true" : ""}`),

  // Get Single Transport
  getById: (id) =>
    api.get(`/transport/${id}`),

  // Create Transport
  create: (data) =>
    api.post("/transport/add", data),

  // Update Transport
  update: (id, data) =>
    api.put(`/transport/${id}`, data),

  // Soft Delete
  remove: (id) =>
    api.delete(`/transport/${id}`),

  // Reactivate
  reactivate: (id) =>
    api.put(`/transport/${id}`, { isActive: true })
};