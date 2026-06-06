import { api } from "./api";

export const salesPersonApi = {

  // Get All Sales Persons
  getAll: (activeOnly = false) =>
    api.get(`/salesperson${activeOnly ? "?activeOnly=true" : ""}`),

  // Get Single Sales Person
  getById: (id) =>
    api.get(`/salesperson/${id}`),

  // Create Sales Person
  create: (data) =>
    api.post("/salesperson/add", data),

  // Update Sales Person
  update: (id, data) =>
    api.put(`/salesperson/${id}`, data),

  // Soft Delete
  remove: (id) =>
    api.delete(`/salesperson/${id}`),

  // Reactivate
  reactivate: (id) =>
    api.put(`/salesperson/${id}`, { isActive: true })
};