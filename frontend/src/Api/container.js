// Api/containerApi.js (corrected)
import { api } from "./api";

export const containerApi = {
  getAll:  ()         => api.get("/containers"),
  getById: (id)       => api.get(`/containers/${id}`),
  create:  (data)     => api.post("/containers/add", data),
  update:  (id, data) => api.put(`/containers/${id}`, data),       // ✅ fixed
  remove:  (id)       => api.delete(`/containers/${id}`),          // ✅ fixed (also renamed to 'remove' for consistency)
};