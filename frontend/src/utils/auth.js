// JWT decode — token se user info nikalo
function decodeToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Token expiry check
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;                               // expired
    }
    return payload;                              // { id, role, company }
  } catch {
    return null;
  }
}

/* ──────── ROLE HELPERS ──────── */
export function getCurrentUser()  { return decodeToken(); }
export function getRole()         { return decodeToken()?.role || null; }
export function isAdmin()         { return decodeToken()?.role === "admin"; }
export function isManager()       { return decodeToken()?.role === "manager"; }
export function isStaff()         { return decodeToken()?.role === "staff"; }

// Multiple role check
export function hasRole(...roles) {
  const r = decodeToken()?.role;
  return roles.includes(r);
}