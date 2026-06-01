import {api} from "./api";

export const supplierApi = {
  // GET /api/supplier → saare suppliers
  getAll:  ()         => api.get("/suppliers"),      
  getById: (id)       => api.get(`/suppliers/${id}`),
  create:  (data)     => api.post("/suppliers/add", data),
  update:  (id, data) => api.put(`/suppliers/update/${id}`, data),
  remove:  (id)       => api.delete(`/suppliers/delete/${id}`),
};