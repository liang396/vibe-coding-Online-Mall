import client from "./client";

export async function createReview(payload) {
  const { data } = await client.post("/reviews", payload);
  return data;
}

export async function fetchProductReviews(productId) {
  const { data } = await client.get(`/products/${productId}/reviews`);
  return data;
}
