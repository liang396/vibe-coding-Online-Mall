import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { streamChatWithAi } from "../../api/aiApi";
import SectionTitle from "../../components/SectionTitle";
import { getErrorMessage } from "../../utils/format";

export default function AIChatPage() {
  const location = useLocation();
  const state = location.state || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(state.initialQuestion || "");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const autoSentRef = useRef(false);
  const messagesRef = useRef(null);

  const productId = state.productId || null;
  const productName = state.productName || "";
  const pageDescription = useMemo(() => {
    if (!productName) {
      return "可以直接咨询购买建议、成色判断、价格是否合适以及二手交易注意事项。";
    }
    return `当前正在咨询商品：${productName}。AI 会结合该商品的公开信息和评价给出建议。`;
  }, [productName]);

  useEffect(() => {
    if (!state.autoSend || autoSentRef.current || !state.initialQuestion) {
      return;
    }
    autoSentRef.current = true;
    void handleSend(state.initialQuestion);
  }, [state.autoSend, state.initialQuestion]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const updateAssistantMessage = (updater) => {
    setMessages((current) => {
      if (!current.length) {
        return current;
      }
      const next = [...current];
      const lastIndex = next.length - 1;
      const lastMessage = next[lastIndex];
      if (lastMessage.role !== "assistant") {
        return current;
      }
      next[lastIndex] = {
        ...lastMessage,
        content: updater(lastMessage.content || "")
      };
      return next;
    });
  };

  const handleSend = async (presetQuestion) => {
    const question = (presetQuestion ?? input).trim();
    if (!question || sending) {
      return;
    }

    const assistantPlaceholder = { role: "assistant", content: "", pending: true };
    const nextMessages = [...messages, { role: "user", content: question }, assistantPlaceholder];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      await streamChatWithAi(
        {
          product_id: productId,
          messages: nextMessages
            .filter((message) => message.role === "user" || message.role === "assistant")
            .filter((message) => !message.pending)
            .map((message) => ({
              role: message.role,
              content: message.content
            }))
        },
        {
          onDelta: (content) => {
            updateAssistantMessage((current) => current + content);
          },
          onDone: () => {
            updateAssistantMessage((current) => current.trim());
          }
        }
      );

      setMessages((current) =>
        current.map((message, index) =>
          index === current.length - 1 && message.role === "assistant"
            ? { role: "assistant", content: message.content || "暂时没有生成内容" }
            : message
        )
      );
    } catch (err) {
      setError(getErrorMessage(err, "AI 回复失败，请稍后再试"));
      setMessages((current) => {
        const next = [...current];
        const lastMessage = next[next.length - 1];
        if (lastMessage?.role === "assistant") {
          if (lastMessage.content) {
            next[next.length - 1] = { role: "assistant", content: lastMessage.content };
          } else {
            next.pop();
          }
        }
        return next;
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="stack-lg">
      <SectionTitle eyebrow="AI 问答" title="智能购买顾问" description={pageDescription} />

      {error ? <div className="notice error">{error}</div> : null}

      <section className="grid-two ai-chat-layout">
        <div className="feature-panel ai-chat-panel stack-md">
          <div className="ai-chat-meta">
            <strong>{productName || "通用咨询"}</strong>
            <span>{productId ? `商品 ID：${productId}` : "未绑定具体商品"}</span>
          </div>
          <div className="ai-chat-messages" ref={messagesRef}>
            {messages.length ? (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`ai-chat-bubble ${message.role === "assistant" ? "assistant" : "user"}`}
                >
                  <strong>{message.role === "assistant" ? "AI 顾问" : "你"}</strong>
                  <p className={message.pending ? "ai-chat-bubble-content pending" : "ai-chat-bubble-content"}>
                    {message.content || (message.role === "assistant" ? "正在生成回复..." : "")}
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                先输入你的问题，例如“这件商品值不值得买？”、“这个价格合适吗？”
              </div>
            )}
          </div>
        </div>

        <div className="feature-panel stack-md">
          <div className="review-list ai-chat-suggestions">
            <div className="review-item">
              <strong>你可以这样问</strong>
              <p>这件商品的价格是否合理？</p>
            </div>
            <div className="review-item">
              <strong>风险提醒</strong>
              <p>结合评价，帮我判断是否存在需要注意的问题。</p>
            </div>
            <div className="review-item">
              <strong>适用建议</strong>
              <p>如果我预算有限，这件商品适合入手吗？</p>
            </div>
          </div>

          <form
            className="panel-form ai-chat-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <textarea
              rows="8"
              placeholder="输入你的问题"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={sending}
            />
            <button className="primary-button" type="submit" disabled={sending || !input.trim()}>
              {sending ? "AI 正在生成回复..." : "发送问题"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
