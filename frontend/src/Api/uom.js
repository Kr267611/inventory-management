import {api} from "./api";

export const UomApi = {
    getAllUoms: () => api.get("/uoms"),
    getUomById: (id) => api.get(`/uoms/${id}`),
    createUom: (uomData) => api.post("/uoms/add", uomData),
    updateUom: (id, uomData) => api.put(`/uoms/update/${id}`, uomData),
    deleteUom: (id) => api.delete(`/uoms/delete/${id}`)
};