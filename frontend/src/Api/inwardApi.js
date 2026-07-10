import {api} from "./api";

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });


 export const inwardApi={
    getAll:()=> api.get("/inward"),
    getById: (id) => api.get(`/inward/${id}`),
    create: (data) => api.post("/inward/add", data),
    update: (id, data) => api.put(`/inward/update/${id}`, data),
    delete: (id) => api.delete(`/inward/delete/${id}`),
    bulkImport: (rows) => api.post("/inward/bulk", { rows })
}