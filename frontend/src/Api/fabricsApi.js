import {api} from "./api";

export const fabricsApi = {
  // GET /api/fabrics → saari fabrics
  getAll:  ()         => api.get("/fabrics"),
  getById: (id)       => api.get(`/fabrics/${id}`),
  create:  (data)     => api.post("/fabrics/add", data),
  update:  (id, data) => api.put(`/fabrics/update/${id}`, data),
  remove:  (id)       => api.delete(`/fabrics/delete/${id}`),
};
