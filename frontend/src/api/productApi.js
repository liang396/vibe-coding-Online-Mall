import client from "./client";
import { compactParams } from "../utils/format";

export async function fetchProducts(params = {}) {
  const { data } = await client.get("/products", { params: compactParams(params) });
  return data;
}

export async function fetchProduct(productId) {
  const { data } = await client.get(`/products/${productId}`);
  return data;
}

export async function createProduct(payload) {
  const { data } = await client.post("/products", payload);
  return data;
}

export async function updateProduct(productId, payload) {
  const { data } = await client.put(`/products/${productId}`, payload);
  return data;
}

export async function deleteProduct(productId) {
  const { data } = await client.delete(`/products/${productId}`);
  return data;
}
