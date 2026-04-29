import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../../api/productApi";
import ProductCard from "../../components/ProductCard";
import SectionTitle from "../../components/SectionTitle";
import { CATEGORY_OPTIONS } from "../../utils/constants";
import { getErrorMessage } from "../../utils/format";

const TEXT = {
  eyebrow: "\u5546\u54c1\u4e2d\u5fc3",
  title: "\u5546\u54c1\u5217\u8868",
  description: "\u652f\u6301\u6309\u5173\u952e\u5b57\u548c\u5206\u7c7b\u68c0\u7d22\u5546\u54c1\u3002",
  publish: "\u5356\u5bb6\u53d1\u5e03\u5546\u54c1",
  keyword: "\u641c\u7d22\u5173\u952e\u5b57",
  category: "\u9009\u62e9\u5206\u7c7b",
  allCategories: "\u5168\u90e8\u5206\u7c7b",
  search: "\u67e5\u8be2",
  loadFailed: "\u5546\u54c1\u5217\u8868\u52a0\u8f7d\u5931\u8d25",
  loading: "\u5546\u54c1\u52a0\u8f7d\u4e2d...",
  empty: "\u6682\u65e0\u5546\u54c1\uff0c\u5148\u53bb\u5356\u5bb6\u4e2d\u5fc3\u53d1\u5e03\u4e00\u4e2a\u5427\u3002"
};

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category_id: "",
    keyword: "",
    page: 1,
    size: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProducts(nextFilters);
      setProducts(data);
      setHasNextPage(data.length === nextFilters.size);
    } catch (err) {
      setError(getErrorMessage(err, TEXT.loadFailed));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, page: 1, size: 10 };
    setFilters(nextFilters);
    await loadProducts(nextFilters);
  };

  const handlePageChange = async (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    await loadProducts(nextFilters);
  };

  return (
    <div className="stack-lg">
      <div className="page-header">
        <SectionTitle
          eyebrow={TEXT.eyebrow}
          title={TEXT.title}
          description={TEXT.description}
        />
        <Link className="ghost-link" to="/user">
          {TEXT.publish}
        </Link>
      </div>

      <form className="filter-bar" onSubmit={handleSubmit}>
        <input
          placeholder={TEXT.keyword}
          value={filters.keyword}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, keyword: event.target.value }))
          }
        />
        <select
          value={filters.category_id}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, category_id: event.target.value }))
          }
        >
          <option value="">{TEXT.allCategories}</option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.label}
            </option>
          ))}
        </select>
        <button type="submit" className="primary-button">
          {TEXT.search}
        </button>
      </form>

      {error ? <div className="notice error">{error}</div> : null}
      {loading ? <div className="notice">{TEXT.loading}</div> : null}

      {!loading && !products.length ? (
        <div className="empty-state">{TEXT.empty}</div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
          <div className="pagination-bar">
            <button
              type="button"
              className="ghost-button"
              disabled={filters.page <= 1 || loading}
              onClick={() => handlePageChange(filters.page - 1)}
            >
              上一页
            </button>
            <span className="pagination-info">{`第 ${filters.page} 页`}</span>
            <button
              type="button"
              className="ghost-button"
              disabled={!hasNextPage || loading}
              onClick={() => handlePageChange(filters.page + 1)}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  );
}
