import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchOrder, fetchOrders, updateOrderStatus } from "../../api/orderApi";
import SectionTitle from "../../components/SectionTitle";
import { useAuth } from "../../context/AuthContext";
import { ORDER_STATUS_LABELS } from "../../utils/labels";
import { formatCurrency, getErrorMessage } from "../../utils/format";

const TEXT = {
  eyebrow: "订单中心",
  buyerTitle: "我的订单",
  sellerTitle: "待处理订单",
  loadOrdersFailed: "订单加载失败",
  loadDetailFailed: "订单详情加载失败",
  updateFailed: "更新订单状态失败",
  actionSuccess: "订单状态已更新",
  noOrders: "暂无订单。",
  selectHint: "请先选择左侧订单查看详情。",
  orderCard: "订单",
  orderDetailTitle: "订单详情",
  orderItem: "商品",
  totalPrice: "总金额",
  status: "状态",
  quantity: "数量",
  price: "单价",
  payNow: "去支付",
  cancelOrder: "取消订单",
  shipNow: "确认发货",
  confirmReceipt: "确认收货"
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
      void loadOrders(searchParams.get("orderId"));
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
        <div className="action-row">
          <button className="primary-button" type="button" onClick={() => handleAction("paid")}>
            {TEXT.payNow}
          </button>
          <button className="ghost-button" type="button" onClick={() => handleAction("cancelled")}>
            {TEXT.cancelOrder}
          </button>
        </div>
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
                <strong>{TEXT.orderCard}</strong>
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
              <h3>{TEXT.orderDetailTitle}</h3>
              <p>{`${TEXT.totalPrice}: ${formatCurrency(selectedOrder.totalPrice)}`}</p>
              <p>{`${TEXT.status}: ${ORDER_STATUS_LABELS[selectedOrder.status] || selectedOrder.status}`}</p>
              {renderActions()}
              <div className="review-list">
                {selectedOrder.items.map((item) => (
                  <div key={item.productId} className="review-item">
                    <strong>{TEXT.orderItem}</strong>
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
