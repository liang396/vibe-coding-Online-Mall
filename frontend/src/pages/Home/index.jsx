import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../../api/productApi";
import ProductCard from "../../components/ProductCard";
import SectionTitle from "../../components/SectionTitle";
import { getErrorMessage } from "../../utils/format";

const valuePoints = [
  {
    icon: "买",
    title: "热门好物更好找",
    description: "优先浏览大家都在看的二手商品，买家可以更快找到高性价比选择。",
  },
  {
    icon: "卖",
    title: "卖家发布更直接",
    description: "从账户中心进入发布流程，几步即可上架闲置，让商品更快被看到。",
  },
  {
    icon: "省",
    title: "购物流程更省心",
    description: "支持加入购物车、下单和订单管理，买卖双方都能快速跟进进度。",
  },
];

function createBannerImage(title, subtitle, accent) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 420">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff2e7" />
          <stop offset="100%" stop-color="#eef5ff" />
        </linearGradient>
      </defs>
      <rect width="820" height="420" rx="36" fill="url(#bg)" />
      <circle cx="120" cy="120" r="90" fill="${accent}" opacity="0.12" />
      <circle cx="690" cy="320" r="110" fill="${accent}" opacity="0.16" />
      <rect x="470" y="88" width="220" height="152" rx="28" fill="#ffffff" />
      <rect x="500" y="126" width="120" height="18" rx="9" fill="${accent}" opacity="0.75" />
      <rect x="500" y="160" width="150" height="18" rx="9" fill="${accent}" opacity="0.32" />
      <rect x="500" y="198" width="92" height="18" rx="9" fill="${accent}" opacity="0.22" />
      <rect x="470" y="270" width="180" height="64" rx="24" fill="${accent}" opacity="0.9" />
      <text x="72" y="132" fill="${accent}" font-size="28" font-family="Arial, PingFang SC, sans-serif" font-weight="700">${subtitle}</text>
      <text x="72" y="208" fill="#182028" font-size="54" font-family="Arial, PingFang SC, sans-serif" font-weight="700">${title}</text>
      <text x="72" y="260" fill="#52606d" font-size="24" font-family="Arial, PingFang SC, sans-serif">买家更快找到心仪商品，卖家也能更快完成成交。</text>
      <rect x="72" y="294" width="188" height="56" rx="28" fill="${accent}" />
      <text x="122" y="330" fill="#ffffff" font-size="24" font-family="Arial, PingFang SC, sans-serif" font-weight="700">立即查看</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((value) => (value + 1) % 3);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProducts({ page: 1, size: 8 });
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, "首页商品加载失败"));
    } finally {
      setLoading(false);
    }
  };

  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const newestProducts = useMemo(() => products.slice(4, 8), [products]);

  const banners = useMemo(
    () => [
      {
        eyebrow: "热门推荐",
        title: featuredProducts[0]?.name || "近期热门商品",
        description:
          featuredProducts[0]?.description ||
          "优先看看大家都在关注的二手好物，快速发现高性价比选择。",
        cta: "浏览热门商品",
        alt: "首页热门商品推荐横幅",
        accent: "#ed6a3a",
      },
      {
        eyebrow: "新品上架",
        title: newestProducts[0]?.name || "刚刚上新的闲置",
        description:
          newestProducts[0]?.description ||
          "新发布商品优先展示，买家能更快下单，卖家也能更快获得曝光。",
        cta: "查看新品上架",
        alt: "首页新品上架推荐横幅",
        accent: "#2374ab",
      },
      {
        eyebrow: "卖家入口",
        title: "发布闲置更简单",
        description: "整理描述、价格和库存后即可上架，让你的闲置更快找到买家。",
        cta: "立即发布商品",
        alt: "首页卖家发布商品引导横幅",
        accent: "#178f60",
      },
    ],
    [featuredProducts, newestProducts],
  );

  const activeBanner = banners[currentSlide];

  return (
    <div className="stack-xl">
      <section className="hero-panel hero-panel-enhanced">
        <div className="hero-copy stack-md">
          <span className="eyebrow">买家和卖家都能快速上手</span>
          <h1>{"\u4e8c\u624b\u5546\u57ce"}</h1>
          <p className="hero-description">
            轻松买卖二手商品，快速浏览、发布、下单和管理订单，让每一件闲置都更快流转起来。
          </p>
          <div className="hero-actions">
            <Link className="primary-link large cta-primary" to="/products">
              立即浏览商品
            </Link>
            <Link className="ghost-link large cta-secondary" to="/user">
              立即发布商品
            </Link>
          </div>
          <div className="hero-value-grid">
            {valuePoints.map((item) => (
              <article className="value-card" key={item.title}>
                <span className="value-icon" aria-label={item.title}>
                  {item.icon}
                </span>
                <div className="stack-xs">
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="hero-spotlight stack-md">
          <div className="hero-banner-card">
            <div className="banner-copy stack-xs">
              <span className="banner-chip">{activeBanner.eyebrow}</span>
              <h3>{activeBanner.title}</h3>
              <p>{activeBanner.description}</p>
              <Link className="primary-link" to={currentSlide === 2 ? "/user" : "/products"}>
                {activeBanner.cta}
              </Link>
            </div>
            <img
              className="banner-image"
              src={createBannerImage(activeBanner.title, activeBanner.eyebrow, activeBanner.accent)}
              alt={activeBanner.alt}
              loading="lazy"
            />
          </div>
          <div className="banner-dots" aria-label="首页推荐轮播">
            {banners.map((item, index) => (
              <button
                key={item.eyebrow}
                type="button"
                className={index === currentSlide ? "active" : ""}
                aria-label={`切换到${item.eyebrow}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid-three">
        <article className="feature-panel category-card sunset">
          <span className="category-tag">热门商品</span>
          <h3>大家都在看</h3>
          <p>优先发现点击更多、成交更快的商品，买家第一眼就能看到重点内容。</p>
          <Link className="text-link" to="/products">
            去逛热门
          </Link>
        </article>
        <article className="feature-panel category-card ocean">
          <span className="category-tag">新品上架</span>
          <h3>新发布优先展示</h3>
          <p>刚上架的闲置集中展示，适合第一时间捡漏，也有利于卖家拿到首批流量。</p>
          <Link className="text-link" to="/products">
            查看新品
          </Link>
        </article>
        <article className="feature-panel category-card forest">
          <span className="category-tag">精选推荐</span>
          <h3>高性价比更醒目</h3>
          <p>围绕学生和通勤场景整理精选商品，让用户更快找到真正想买的东西。</p>
          <Link className="text-link" to="/products">
            查看精选
          </Link>
        </article>
      </section>

      <section className="stack-lg">
        <div className="page-header">
          <SectionTitle
            eyebrow="热门推荐"
            title="首页先看这些商品"
            description="首屏直接展示推荐商品，避免首页只停留在介绍层，买家进入后能立即开始浏览。"
          />
          <Link className="ghost-link" to="/products">
            查看全部商品
          </Link>
        </div>

        {error ? <div className="notice error">{error}</div> : null}
        {loading ? <div className="notice">商品加载中...</div> : null}

        {!loading && featuredProducts.length ? (
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        ) : null}

        {!loading && !featuredProducts.length && !error ? (
          <div className="empty-state">暂时还没有推荐商品，先去发布第一件闲置吧。</div>
        ) : null}
      </section>

      <section className="grid-two">
        <div className="feature-panel">
          <SectionTitle
            eyebrow="新品上架"
            title="刚刚发布的商品"
            description="给用户一个继续往下看的理由，首页第二屏继续承接新增商品内容。"
          />
          {newestProducts.length ? (
            <div className="product-grid compact-grid">
              {newestProducts.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">暂无新品上架，稍后再来看看。</div>
          )}
        </div>

        <div className="feature-panel accent-panel quick-entry-panel">
          <SectionTitle
            eyebrow="快捷入口"
            title="买家下单，卖家发布，都从这里开始"
            description="首页保留最常用操作入口，让用户不用先理解系统结构就能直接行动。"
          />
          <div className="quick-entry-actions">
            <Link className="primary-link large cta-primary" to="/products">
              立即浏览商品
            </Link>
            <Link className="ghost-link large cta-secondary" to="/user">
              立即发布商品
            </Link>
            <Link className="text-link" to="/orders">
              查看我的订单
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
