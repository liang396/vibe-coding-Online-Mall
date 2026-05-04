import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../../api/orderApi";
import SectionTitle from "../../components/SectionTitle";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency, getErrorMessage } from "../../utils/format";

const TEXT = {
  eyebrow: "购物车",
  title: "确认你的订单",
  description:
    "提交订单后会生成待付款订单，并自动跳转到订单详情页。",
  empty: "购物车还是空的。",
  remove: "移除",
  total: "总价",
  submit: "提交订单",
  submitFailed: "下单失败"
};

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalAmount, updateQuantity, removeItem, clearCart } = useCart();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/user", { state: { from: "/cart" } });
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const data = await createOrder({
        buyer_id: user.userId,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity
        }))
      });
      clearCart();
      navigate(`/orders?orderId=${data.orderId}`);
    } catch (checkoutError) {
      setError(getErrorMessage(checkoutError, TEXT.submitFailed));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack-lg">
      <SectionTitle
        eyebrow={TEXT.eyebrow}
        title={TEXT.title}
        description={TEXT.description}
      />

      {error ? <div className="notice error">{error}</div> : null}

      {!items.length ? (
        <div className="empty-state">{TEXT.empty}</div>
      ) : (
        <div className="stack-md">
          {items.map((item) => (
            <div className="cart-item" key={item.productId}>
              <div>
                <strong>{item.name}</strong>
                <p>{formatCurrency(item.price)}</p>
              </div>
              <div className="quantity-box">
                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
              </div>
              <button className="ghost-button" onClick={() => removeItem(item.productId)}>
                {TEXT.remove}
              </button>
            </div>
          ))}
          <div className="checkout-panel">
            <strong>{`${TEXT.total} ${formatCurrency(totalAmount)}`}</strong>
            <button className="primary-button" onClick={handleCheckout} disabled={submitting}>
              {submitting ? "提交中..." : TEXT.submit}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
