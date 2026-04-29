import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProduct } from "../../api/productApi";
import { createReview, fetchProductReviews } from "../../api/reviewApi";
import SectionTitle from "../../components/SectionTitle";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { PRODUCT_STATUS_LABELS } from "../../utils/labels";
import { formatCurrency, getErrorMessage } from "../../utils/format";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    loadPage();
  }, [productId]);

  const loadPage = async () => {
    setError("");
    try {
      const [productData, reviewData] = await Promise.all([
        fetchProduct(productId),
        fetchProductReviews(productId)
      ]);
      setProduct(productData);
      setReviews(reviewData);
    } catch (err) {
      setError(getErrorMessage(err, "商品详情加载失败"));
    }
  };

  const handleAddCart = async () => {
    try {
      await addItem(Number(productId), 1);
      setMessage("已加入购物车");
    } catch (err) {
      setError(getErrorMessage(err, "加入购物车失败"));
    }
  };

  const handleReview = async (event) => {
    event.preventDefault();
    if (!user) {
      setError("请先登录后再评论");
      return;
    }
    try {
      await createReview({
        product_id: Number(productId),
        user_id: user.userId,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment
      });
      setReviewForm({ rating: 5, comment: "" });
      setMessage("评论提交成功");
      await loadPage();
    } catch (err) {
      setError(getErrorMessage(err, "评论提交失败"));
    }
  };

  if (error) {
    return <div className="notice error">{error}</div>;
  }

  if (!product) {
    return <div className="notice">商品详情加载中...</div>;
  }

  return (
    <div className="stack-xl">
      <section className="detail-grid product-detail-layout">
        <div className="detail-card warm">
          <img
            className="product-detail-image"
            src={
              product.imageUrl ||
              "https://placehold.co/1200x900/F6EEE5/1F2937?text=Second-Hand+Goods"
            }
            alt={product.name}
          />
        </div>
        <div className="detail-card">
          <span className="eyebrow">商品信息</span>
          <h1>{product.name}</h1>
          <p>{product.description || "暂无详细描述"}</p>
          <div className="detail-row">
            <span>价格</span>
            <strong>{formatCurrency(product.price)}</strong>
          </div>
          <div className="detail-row">
            <span>库存</span>
            <strong>{product.stock}</strong>
          </div>
          <div className="detail-row">
            <span>状态</span>
            <strong>{PRODUCT_STATUS_LABELS[product.status] || product.status}</strong>
          </div>
          <button className="primary-button" onClick={handleAddCart}>
            加入购物车
          </button>
          {message ? <div className="notice success">{message}</div> : null}
        </div>
      </section>

      <section className="grid-two">
        <div className="feature-panel">
          <SectionTitle eyebrow="用户反馈" title="评论列表" />
          <div className="review-list">
            {reviews.length ? (
              reviews.map((review) => (
                <div key={review.reviewId} className="review-item">
                  <strong>用户评价</strong>
                  <span>评分 {review.rating}/5</span>
                  <p>{review.comment || "未填写评论内容"}</p>
                </div>
              ))
            ) : (
              <div className="empty-state">还没有评论。</div>
            )}
          </div>
        </div>

        <div className="feature-panel">
          <SectionTitle eyebrow="添加评论" title="发表你的看法" />
          <form className="stack-md" onSubmit={handleReview}>
            <select
              value={reviewForm.rating}
              onChange={(event) =>
                setReviewForm((prev) => ({ ...prev, rating: event.target.value }))
              }
            >
              {[5, 4, 3, 2, 1].map((score) => (
                <option key={score} value={score}>
                  {score} 分
                </option>
              ))}
            </select>
            <textarea
              rows="5"
              placeholder="评论内容"
              value={reviewForm.comment}
              onChange={(event) =>
                setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
              }
            />
            <button className="primary-button" type="submit">
              提交评论
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
