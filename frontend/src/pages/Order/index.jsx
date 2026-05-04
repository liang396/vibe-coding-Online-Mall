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
  loadingOrders: "订单列表加载中...",
  loadingDetail: "订单详情加载中...",
  noOrders: "暂无订单。",
  selectHint: "请先选择左侧订单查看详情。",
  orderNo: "订单号",
  orderDetailTitle: "订单详情",
  orderItem: "商品",
  totalPrice: "总金额",
  status: "状态",
  quantity: "数量",
  price: "单价",
  subtotal: "小计",
  orderTime: "下单时间",
  logisticsInfo: "物流信息",
  payNow: "去支付",
  cancelOrder: "取消订单",
  shipNow: "确认发货",
  confirmReceipt: "确认收货"
};

function formatOrderNo(orderId, createdAt) {
  const date = createdAt ? new Date(createdAt) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return `ORD-${String(orderId).padStart(6, "0")}`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}-${String(orderId).padStart(6, "0")}`;
}

function formatDateTime(value) {
  if (!value) {
    return "暂无";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "暂无";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getLogisticsInfo(status) {
  switch (status) {
    case "pending":
      return "待支付，订单已创建，暂未进入发货流程";
    case "paid":
      return "商家待发货，物流单号生成后会展示在这里";
    case "shipped":
      return "商品已发货，正在运输中";
    case "completed":
      return "订单已完成，物流流程已结束";
    case "cancelled":
      return "订单已取消，无物流信息";
    default:
      return "暂无物流信息";
  }
}

export default function OrderPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const sellerMode = !!user && ["seller", "admin"].includes(user.role);

  useEffect(() => {
    if (user) {
      void loadOrders(searchParams.get("orderId"));
    }
  }, [user, searchParams]);

  const loadOrders = async (preferredOrderId) => {
    try {
      setOrdersError("");
      setOrdersLoading(true);
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
      setOrdersError(getErrorMessage(err, TEXT.loadOrdersFailed));
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSelect = async (orderId) => {
    try {
      setDetailError("");
      setDetailLoading(true);
      const data = await fetchOrder(orderId);
      setSelectedOrder(data);
    } catch (err) {
      setDetailError(getErrorMessage(err, TEXT.loadDetailFailed));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (status) => {
    if (!selectedOrder) {
      return;
    }
    try {
      setDetailError("");
      setMessage("");
      await updateOrderStatus(selectedOrder.orderId, { status });
      setMessage(TEXT.actionSuccess);
      await handleSelect(selectedOrder.orderId);
      await loadOrders(selectedOrder.orderId);
    } catch (err) {
      setDetailError(getErrorMessage(err, TEXT.updateFailed));
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

  const getItemSubtotal = (item) => item.price * item.quantity;

  return (
    <div className="stack-lg">
      <SectionTitle
        eyebrow={TEXT.eyebrow}
        title={sellerMode ? TEXT.sellerTitle : TEXT.buyerTitle}
      />
      {message ? <div className="notice success">{message}</div> : null}

      <div className="grid-two">
        <div className="feature-panel stack-md">
          {ordersLoading ? <div className="notice">{TEXT.loadingOrders}</div> : null}
          {ordersError ? <div className="notice error">{ordersError}</div> : null}
          {orders.length ? (
            orders.map((order) => (
              <button
                key={order.orderId}
                className={`order-summary${selectedOrder?.orderId === order.orderId ? " active" : ""}`}
                onClick={() => handleSelect(order.orderId)}
              >
                <strong>{formatOrderNo(order.orderId, order.createdAt)}</strong>
                <span>{ORDER_STATUS_LABELS[order.status] || order.status}</span>
                <span>{formatCurrency(order.totalPrice)}</span>
              </button>
            ))
          ) : ordersLoading ? null : (
            <div className="empty-state">{TEXT.noOrders}</div>
          )}
        </div>

        <div className="feature-panel stack-md">
          {detailLoading ? <div className="notice">{TEXT.loadingDetail}</div> : null}
          {detailError ? <div className="notice error">{detailError}</div> : null}
          {!detailLoading && selectedOrder ? (
            <>
              <h3>{TEXT.orderDetailTitle}</h3>
              <p>{`${TEXT.orderNo}: ${formatOrderNo(selectedOrder.orderId, selectedOrder.createdAt)}`}</p>
              <p>{`${TEXT.orderTime}: ${formatDateTime(selectedOrder.createdAt)}`}</p>
              <p>{`${TEXT.logisticsInfo}: ${getLogisticsInfo(selectedOrder.status)}`}</p>
              {renderActions()}
              <div className="review-list">
                {selectedOrder.items.map((item) => (
                  <div key={`${selectedOrder.orderId}-${item.productId}`} className="review-item">
                    <strong>{item.productName || `${TEXT.orderItem} #${item.productId}`}</strong>
                    <span>{`${TEXT.orderItem} ID: ${item.productId}`}</span>
                    <span>{`${TEXT.quantity}: ${item.quantity}`}</span>
                    <span>{`${TEXT.price}: ${formatCurrency(item.price)}`}</span>
                    <span>{`${TEXT.subtotal}: ${formatCurrency(getItemSubtotal(item))}`}</span>
                  </div>
                ))}
              </div>
              <p>{`${TEXT.totalPrice}: ${formatCurrency(selectedOrder.totalPrice)}`}</p>
            </>
          ) : null}
          {!detailLoading && !selectedOrder && !detailError ? (
            <div className="empty-state">{TEXT.selectHint}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
