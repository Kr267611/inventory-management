import {api} from "./api";

export const qualityApi = {
    // GET /api/quality → saari qualities
    getAll:  ()         => api.get("/quality"),

    // GET /api/quality/:id → ek quality
    getById: (id)    => api.get(`/quality/${id}`),

    // POST /api/quality/add → naya add
    create:  (data)    => api.post("/quality/add", data),

    // PUT /api/quality/update/:id → update
    update:  (id, data)  => api.put(`/quality/update/${id}`, data),


    // DELETE /api/quality/delete/:id → remove
    remove:  (id)    => api.delete(`/quality/delete/${id}`),
};