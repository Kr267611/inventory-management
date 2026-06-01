import {api} from "./api";

export const designApi = {
    // GET /api/design → saari designs
    getAll:  ()         => api.get("/designs"),

    // GET /api/design/:id → ek design
    getById: (id)    => api.get(`/designs/${id}`),

    // POST /api/design/add → naya add
    create:  (data)    => api.post("/designs/add", data),

    // PUT /api/design/update/:id → update
    update:  (id, data)  => api.put(`/designs/update/${id}`, data),


    // DELETE /api/design/delete/:id → remove
    remove:  (id)    => api.delete(`/designs/delete/${id}`),
};