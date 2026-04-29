import axios from "axios";
import { getToken, clearAuthStorage } from "../utils/storage";
import { toCamelCaseObject } from "../utils/format";

const client = axios.create({
  baseURL: "/api",
  timeout: 10000
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
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
    if (error.response?.status === 401) {
      clearAuthStorage();
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export default client;
