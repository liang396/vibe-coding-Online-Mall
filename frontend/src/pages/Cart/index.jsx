import { useNavigate } from "react-router-dom";
import { createOrder } from "../../api/orderApi";
import SectionTitle from "../../components/SectionTitle";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency, getErrorMessage } from "../../utils/format";

const TEXT = {
  eyebrow: "\u8d2d\u7269\u8f66",
  title: "\u786e\u8ba4\u4f60\u7684\u8ba2\u5355",
  description:
    "\u63d0\u4ea4\u8ba2\u5355\u540e\u4f1a\u751f\u6210\u5f85\u4ed8\u6b3e\u8ba2\u5355\uff0c\u5e76\u81ea\u52a8\u8df3\u8f6c\u5230\u8ba2\u5355\u8be6\u60c5\u9875\u3002",
  empty: "\u8d2d\u7269\u8f66\u8fd8\u662f\u7a7a\u7684\u3002",
  remove: "\u79fb\u9664",
  total: "\u603b\u4ef7",
  submit: "\u63d0\u4ea4\u8ba2\u5355",
  submitFailed: "\u4e0b\u5355\u5931\u8d25"
};

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalAmount, updateQuantity, removeItem, clearCart } = useCart();

  const handleCheckout = async () => {
    if (!user) {
      navigate("/user");
      return;
    }

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
    } catch (error) {
      alert(getErrorMessage(error, TEXT.submitFailed));
    }
  };

  return (
    <div className="stack-lg">
      <SectionTitle
        eyebrow={TEXT.eyebrow}
        title={TEXT.title}
        description={TEXT.description}
      />

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
            <button className="primary-button" onClick={handleCheckout}>
              {TEXT.submit}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
