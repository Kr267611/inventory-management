import { api } from "./api";

export const userApi = {
  // GET /api/auth/me → current user
  me:         ()         => api.get("/auth/me"),

  // GET /api/auth/users → all users (admin only)
  getAll:     ()         => api.get("/auth/users"),

  // PUT /api/auth/users/:id/role → update role (admin only)
  updateRole: (id, role) => api.put(`/auth/users/${id}/role`, { role }),

  // DELETE /api/auth/users/:id → delete user (admin only)
  remove:     (id)       => api.delete(`/auth/users/${id}`),
};