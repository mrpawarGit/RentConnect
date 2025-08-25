// src/lib/config.js
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  socketUrl: import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
  nodeEnv: import.meta.env.VITE_NODE_ENV || "production",
  appName: import.meta.env.VITE_APP_NAME || "RentConnect",
  version: import.meta.env.VITE_VERSION || "1.0.0",
  debug: import.meta.env.VITE_DEBUG === "true",
  isProduction: import.meta.env.MODE === "production",
  isDevelopment: import.meta.env.MODE === "development",
};

// Export commonly used values
export const API_BASE_URL = config.apiUrl;
export const SOCKET_URL = config.socketUrl;
