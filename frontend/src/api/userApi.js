import client from "./client";

export async function registerUser(payload) {
  const { data } = await client.post("/users/register", payload);
  return data;
}

export async function loginUser(payload) {
  const identifier = String(payload?.identifier || payload?.email || payload?.username || "").trim();
  const { data } = await client.post("/users/login", {
    identifier,
    email: identifier,
    username: identifier,
    password: payload?.password || ""
  });
  return data;
}

export async function getUser(userId) {
  const { data } = await client.get(`/users/${userId}`);
  return data;
}

export async function updateUser(userId, payload) {
  const { data } = await client.put(`/users/${userId}`, payload);
  return data;
}

export async function switchUserRole(userId, role) {
  const { data } = await client.put(`/users/${userId}/role`, { role });
  return data;
}
