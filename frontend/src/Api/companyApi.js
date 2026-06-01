// src/api/companyApi.js
import { api } from "./api";

export const companyApi = {
  // GET /api/company → saari companies
  getAll:  ()         => api.get("/company"),

  // GET /api/company/:id → ek company
  getById: (id)       => api.get(`/company/${id}`),

  // POST /api/company/add → naya add
  create:  (data)     => api.post("/company/add", data),

  // PUT /api/company/update/:id → update
  update:  (id, data) => api.put(`/company/update/${id}`, data),

  // DELETE /api/company/delete/:id → remove
  remove:  (id)       => api.delete(`/company/delete/${id}`),
};