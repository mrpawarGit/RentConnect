export function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id,
      role: payload.role,
      name: payload.name,
      email: payload.email,
    };
  } catch (error) {
    console.error("Error parsing token:", error);
    return null;
  }
}

export function isAuthenticated() {
  return !!getCurrentUser();
}

export function logout() {
  localStorage.removeItem("token");
  try {
    window.dispatchEvent(new Event("rentconnect-auth"));
  } catch (e) {}
}

export function setToken(token) {
  localStorage.setItem("token", token);
  try {
    window.dispatchEvent(new Event("rentconnect-auth"));
  } catch (e) {}
}

export function getToken() {
  return localStorage.getItem("token");
}
