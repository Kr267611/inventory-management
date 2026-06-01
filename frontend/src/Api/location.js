import {api} from "./api";

export const LocationApi = {
  getAllLocations: () => api.get("/locations"),
  getLocationById: (id) => api.get(`/locations/${id}`),
  createLocation: (locationData) => api.post("/locations/add", locationData),
  updateLocation: (id, locationData) => api.put(`/locations/update/${id}`, locationData),
  deleteLocation: (id) => api.delete(`/locations/delete/${id}`)
};