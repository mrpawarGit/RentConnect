// frontend-rentConnect/src/lib/socket.js
import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("token");
    socket = io("/", {
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token: token ? `Bearer ${token}` : "" },
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}
