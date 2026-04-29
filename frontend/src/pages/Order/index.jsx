import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchOrder, fetchOrders, updateOrderStatus } from "../../api/orderApi";
import SectionTitle from "../../components/SectionTitle";
import { useAuth } from "../../context/AuthContext";
import { ORDER_STATUS_LABELS } from "../../utils/labels";
import { formatCurrency, getErrorMessage } from "../../utils/format";

const TEXT = {
  eyebrow: "\u8ba2\u5355\u4e2d\u5fc3",
  buyerTitle: "\u6211\u7684\u8ba2\u5355",
  sellerTitle: "\u5f85\u5904\u7406\u8ba2\u5355",
  loadOrdersFailed: "\u8ba2\u5355\u52a0\u8f7d\u5931\u8d25",
  loadDetailFailed: "\u8ba2\u5355\u8be6\u60c5\u52a0\u8f7d\u5931\u8d25",
  updateFailed: "\u66f4\u65b0\u8ba2\u5355\u72b6\u6001\u5931\u8d25",
  actionSuccess: "\u8ba2\u5355\u72b6\u6001\u5df2\u66f4\u65b0",
  noOrders: "\u6682\u65e0\u8ba2\u5355\u3002",
  selectHint: "\u8bf7\u5148\u9009\u62e9\u5de6\u4fa7\u8ba2\u5355\u67e5\u770b\u8be6\u60c5\u3002",
  buyerId: "\u4e70\u5bb6 ID",
  totalPrice: "\u603b\u91d1\u989d",
  status: "\u72b6\u6001",
  quantity: "\u6570\u91cf",
  price: "\u5355\u4ef7",
  payNow: "\u53bb\u652f\u4ed8",
  shipNow: "\u786e\u8ba4\u53d1\u8d27",
  confirmReceipt: "\u786e\u8ba4\u6536\u8d27"
};

export default function OrderPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sellerMode = !!user && ["seller", "admin"].includes(user.role);

  useEffect(() => {
    if (user) {
      loadOrders(searchParams.get("orderId"));
    }
  }, [user, searchParams]);

  const loadOrders = async (preferredOrderId) => {
    try {
      setError("");
      const data = await fetchOrders({
        scope: sellerMode ? "seller" : "buyer",
        user_id: sellerMode ? undefined : user.userId
      });
      setOrders(data);

      const targetOrderId = preferredOrderId ? Number(preferredOrderId) : data[0]?.orderId;
      if (targetOrderId) {
        await handleSelect(targetOrderId);
      } else {
        setSelectedOrder(null);
      }
    } catch (err) {
      setError(getErrorMessage(err, TEXT.loadOrdersFailed));
    }
  };

  const handleSelect = async (orderId) => {
    try {
      setError("");
      const data = await fetchOrder(orderId);
      setSelectedOrder(data);
    } catch (err) {
      setError(getErrorMessage(err, TEXT.loadDetailFailed));
    }
  };

  const handleAction = async (status) => {
    if (!selectedOrder) {
      return;
    }
    try {
      setError("");
      setMessage("");
      await updateOrderStatus(selectedOrder.orderId, { status });
      setMessage(TEXT.actionSuccess);
      await handleSelect(selectedOrder.orderId);
      await loadOrders(selectedOrder.orderId);
    } catch (err) {
      setError(getErrorMessage(err, TEXT.updateFailed));
    }
  };

  const renderActions = () => {
    if (!selectedOrder) {
      return null;
    }

    if (sellerMode && selectedOrder.status === "paid") {
      return (
        <button className="primary-button" type="button" onClick={() => handleAction("shipped")}>
          {TEXT.shipNow}
        </button>
      );
    }

    if (!sellerMode && selectedOrder.status === "pending") {
      return (
        <button className="primary-button" type="button" onClick={() => handleAction("paid")}>
          {TEXT.payNow}
        </button>
      );
    }

    if (!sellerMode && selectedOrder.status === "shipped") {
      return (
        <button className="primary-button" type="button" onClick={() => handleAction("completed")}>
          {TEXT.confirmReceipt}
        </button>
      );
    }

    return null;
  };

  return (
    <div className="stack-lg">
      <SectionTitle
        eyebrow={TEXT.eyebrow}
        title={sellerMode ? TEXT.sellerTitle : TEXT.buyerTitle}
      />
      {error ? <div className="notice error">{error}</div> : null}
      {message ? <div className="notice success">{message}</div> : null}

      <div className="grid-two">
        <div className="feature-panel">
          {orders.length ? (
            orders.map((order) => (
              <button
                key={order.orderId}
                className="order-summary"
                onClick={() => handleSelect(order.orderId)}
              >
                <strong>{`\u8ba2\u5355 #${order.orderId}`}</strong>
                <span>{ORDER_STATUS_LABELS[order.status] || order.status}</span>
                <span>{formatCurrency(order.totalPrice)}</span>
              </button>
            ))
          ) : (
            <div className="empty-state">{TEXT.noOrders}</div>
          )}
        </div>

        <div className="feature-panel">
          {selectedOrder ? (
            <div className="stack-md">
              <h3>{`\u8ba2\u5355 #${selectedOrder.orderId}`}</h3>
              <p>{`${TEXT.buyerId}: ${selectedOrder.buyerId}`}</p>
              <p>{`${TEXT.totalPrice}: ${formatCurrency(selectedOrder.totalPrice)}`}</p>
              <p>{`${TEXT.status}: ${ORDER_STATUS_LABELS[selectedOrder.status] || selectedOrder.status}`}</p>
              {renderActions()}
              <div className="review-list">
                {selectedOrder.items.map((item) => (
                  <div key={item.productId} className="review-item">
                    <strong>{`\u5546\u54c1 #${item.productId}`}</strong>
                    <span>{`${TEXT.quantity} ${item.quantity}`}</span>
                    <span>{`${TEXT.price} ${formatCurrency(item.price)}`}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">{TEXT.selectHint}</div>
          )}
        </div>
      </div>
    </div>
  );
}
