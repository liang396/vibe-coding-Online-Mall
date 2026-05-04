import client from "./client";
import { compactParams } from "../utils/format";

export async function createOrder(payload, options = {}) {
  const { data } = await client.post("/orders", payload, {
    headers: options.idempotencyKey
      ? {
          "X-Idempotency-Key": options.idempotencyKey
        }
      : undefined
  });
  return data;
}

export async function fetchOrders(params = {}) {
  const { data } = await client.get("/orders", { params: compactParams(params) });
  return data;
}

export async function fetchOrder(orderId) {
  const { data } = await client.get(`/orders/${orderId}`);
  return data;
}

export async function updateOrderStatus(orderId, payload) {
  const { data } = await client.put(`/orders/${orderId}/status`, payload);
  return data;
}
