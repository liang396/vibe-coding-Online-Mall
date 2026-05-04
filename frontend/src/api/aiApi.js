import client from "./client";
import { getToken } from "../utils/storage";

export async function chatWithAi(payload) {
  const { data } = await client.post("/ai/chat", payload);
  return data;
}

export async function streamChatWithAi(payload, handlers = {}) {
  const token = getToken();
  const response = await fetch("/api/ai/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await createHttpError(response);
  }

  if (!response.body) {
    throw new Error("AI 服务暂时不可用，请稍后再试");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() || "";

    for (const part of parts) {
      consumeSseChunk(part, handlers);
    }
  }

  if (buffer.trim()) {
    consumeSseChunk(buffer, handlers);
  }
}

function consumeSseChunk(chunk, handlers) {
  const lines = chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return;
  }

  const eventLine = lines.find((line) => line.startsWith("event:"));
  const dataLines = lines.filter((line) => line.startsWith("data:"));
  const eventName = eventLine ? eventLine.slice(6).trim() : "message";
  const rawData = dataLines.map((line) => line.slice(5).trim()).join("\n");
  const eventPayload = rawData ? JSON.parse(rawData) : {};

  if (eventName === "delta") {
    handlers.onDelta?.(eventPayload.content || "");
    return;
  }
  if (eventName === "error") {
    throw new Error(eventPayload.message || "AI 回复失败，请稍后再试");
  }
  if (eventName === "done") {
    handlers.onDone?.();
  }
}

async function createHttpError(response) {
  try {
    const data = await response.json();
    const message = data?.message || "AI 回复失败，请稍后再试";
    const error = new Error(message);
    error.response = {
      status: response.status,
      data
    };
    return error;
  } catch {
    const error = new Error("AI 回复失败，请稍后再试");
    error.response = {
      status: response.status,
      data: null
    };
    return error;
  }
}
