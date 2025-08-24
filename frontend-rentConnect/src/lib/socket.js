import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token available for socket connection");
      return null;
    }

    // Since we're using Vite proxy, we can use relative path
    // Vite will proxy /socket.io requests to the backend
    socket = io("/", {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // 20 seconds timeout
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      // Don't throw error, just log it - let the app continue with REST fallback
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
    });

    socket.on("reconnect_failed", () => {
      console.warn("Socket reconnection failed - using REST API fallback");
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function isSocketConnected() {
  return socket && socket.connected;
}
