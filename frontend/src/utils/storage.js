const TOKEN_KEY = "mall_token";
const USER_KEY = "mall_user";
const CART_KEY = "mall_cart";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveAuthStorage(token, user) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    rememberUserId(user.userId);
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveStoredCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function rememberUserId(userId) {
  if (userId == null) {
    return;
  }
  const ids = JSON.parse(localStorage.getItem("knownUserIds") || "[]");
  const nextIds = Array.from(new Set([...ids, userId]));
  localStorage.setItem("knownUserIds", JSON.stringify(nextIds));
}
