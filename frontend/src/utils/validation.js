export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const PHONE_REGEX = /^1[3-9]\d{9}$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || "").trim());
}

export function isValidPhone(value) {
  return PHONE_REGEX.test(String(value || "").trim());
}
