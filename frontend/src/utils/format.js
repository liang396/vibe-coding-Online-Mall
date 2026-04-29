export function formatCurrency(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY"
  }).format(Number(value || 0));
}

export function getErrorMessage(error, fallback = "\u8bf7\u6c42\u5931\u8d25") {
  const responseMessage = error?.response?.data?.message;
  if (responseMessage) {
    return responseMessage;
  }

  const status = error?.response?.status;
  if (status === 401) {
    return "\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55";
  }
  if (status === 403) {
    return "\u5f53\u524d\u65e0\u6743\u9650\u6267\u884c\u6b64\u64cd\u4f5c";
  }
  if (status >= 500) {
    return "\u670d\u52a1\u5668\u5f00\u5c0f\u5dee\u4e86\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5";
  }

  return error?.message || fallback;
}

export function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined
    )
  );
}

export function toCamelCaseObject(value) {
  if (Array.isArray(value)) {
    return value.map(toCamelCaseObject);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, innerValue]) => [
        key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
        toCamelCaseObject(innerValue)
      ])
    );
  }

  return value;
}
