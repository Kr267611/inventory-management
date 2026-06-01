import {api} from "./api";

export const colorApi = {
  getAllColors: () => api.get("/colors"),
  getColorById: (id) => api.get(`/colors/${id}`),
  createColor: (colorData) => api.post("/colors/add", colorData),
  updateColor: (id, colorData) => api.put(`/colors/update/${id}`, colorData),
  deleteColor: (id) => api.delete(`/colors/delete/${id}`)
};