import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/format";

function getStatusText(status) {
  if (status === "sold_out") {
    return "已售罄";
  }

  if (status === "off_shelf") {
    return "已下架";
  }

  return "在售中";
}

export default function ProductCard({ product }) {
  const imageUrl =
    product.imageUrl ||
    "https://placehold.co/900x700/F6EEE5/1F2937?text=Second-Hand+Goods";
  const stockText = product.stock ?? "--";

  return (
    <article className="product-card">
      <img className="product-card-image" src={imageUrl} alt={product.name} loading="lazy" />
      <div className="product-card-head">
        <span className="product-badge">{getStatusText(product.status)}</span>
        <span className="product-stock">库存 {stockText}</span>
      </div>
      <h3>{product.name}</h3>
      <p className="product-desc">{product.description || "卖家暂未填写商品描述。"}</p>
      <p className="price">{formatCurrency(product.price)}</p>
      <Link className="primary-link" to={`/products/${product.productId}`}>
        查看详情
      </Link>
    </article>
  );
}
