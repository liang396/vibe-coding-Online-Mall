import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProducts } from "../../api/productApi";
import ProductCard from "../../components/ProductCard";
import SectionTitle from "../../components/SectionTitle";
import { CATEGORY_OPTIONS } from "../../utils/constants";
import { compactParams, getErrorMessage } from "../../utils/format";

const PAGE_SIZE = 10;
const REQUEST_SIZE = PAGE_SIZE + 1;

const TEXT = {
  eyebrow: "商品中心",
  title: "商品列表",
  description: "支持按关键字和分类检索商品。",
  publish: "卖家发布商品",
  keyword: "搜索关键字",
  category: "选择分类",
  allCategories: "全部分类",
  search: "查询",
  loadFailed: "商品列表加载失败",
  loading: "商品加载中...",
  empty: "暂无商品，先去卖家中心发布一个吧。"
};

function buildFilters(searchParams) {
  const page = Number(searchParams.get("page") || "1");
  return {
    category_id: searchParams.get("category_id") || "",
    keyword: searchParams.get("keyword") || "",
    page: Number.isFinite(page) && page > 0 ? page : 1
  };
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = useMemo(() => buildFilters(searchParams), [searchParams]);
  const [formFilters, setFormFilters] = useState(urlFilters);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    setFormFilters(urlFilters);
  }, [urlFilters]);

  useEffect(() => {
    void loadProducts(urlFilters);
  }, [urlFilters]);

  const loadProducts = async (nextFilters) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProducts({
        ...nextFilters,
        size: REQUEST_SIZE
      });
      setProducts(data.slice(0, PAGE_SIZE));
      setHasNextPage(data.length > PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err, TEXT.loadFailed));
    } finally {
      setLoading(false);
    }
  };

  const updateSearch = (nextFilters) => {
    setSearchParams(
      compactParams({
        keyword: nextFilters.keyword.trim(),
        category_id: nextFilters.category_id,
        page: String(nextFilters.page)
      })
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateSearch({
      ...formFilters,
      page: 1
    });
  };

  const handlePageChange = (page) => {
    updateSearch({
      ...urlFilters,
      page
    });
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
          value={formFilters.keyword}
          onChange={(event) =>
            setFormFilters((prev) => ({ ...prev, keyword: event.target.value }))
          }
        />
        <select
          value={formFilters.category_id}
          onChange={(event) =>
            setFormFilters((prev) => ({ ...prev, category_id: event.target.value }))
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
              disabled={urlFilters.page <= 1 || loading}
              onClick={() => handlePageChange(urlFilters.page - 1)}
            >
              上一页
            </button>
            <span className="pagination-info">{`第 ${urlFilters.page} 页`}</span>
            <button
              type="button"
              className="ghost-button"
              disabled={!hasNextPage || loading}
              onClick={() => handlePageChange(urlFilters.page + 1)}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  );
}
