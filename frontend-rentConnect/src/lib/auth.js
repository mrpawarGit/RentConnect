export function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
}
