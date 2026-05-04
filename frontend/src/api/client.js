import axios from "axios";
import { getToken, clearAuthStorage } from "../utils/storage";
import { toCamelCaseObject } from "../utils/format";

const client = axios.create({
  baseURL: "/api",
  timeout: 10000
});

function normalizeApiPath(url = "") {
  if (!url) {
    return "";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      return parsed.pathname.replace(/^\/api/, "") || "/";
    } catch {
      return url;
    }
  }
  return url.replace(/^\/api/, "") || "/";
}

function isPublicProductRequest(config = {}) {
  const method = String(config.method || "get").toLowerCase();
  const path = normalizeApiPath(config.url);
  return method === "get" && (path === "/products" || path.startsWith("/products/"));
}

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !isPublicProductRequest(config)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    response.data = toCamelCaseObject(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !isPublicProductRequest(error.config)) {
      clearAuthStorage();
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export default client;
