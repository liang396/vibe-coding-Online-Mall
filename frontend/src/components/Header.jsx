import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/user");
  };

  return (
    <header className="site-header">
      <Link className="brand" to="/">
        <span className="brand-mark">M</span>
        <span>{"二手商城"}</span>
      </Link>

      <nav className="main-nav">
        <NavLink to="/">{"首页"}</NavLink>
        <NavLink to="/products">{"商品"}</NavLink>
        <NavLink className="nav-pill nav-pill-ai" to="/ai">
          <span>{"AI问答"}</span>
          <span className="nav-badge nav-badge-soft">{"新"}</span>
        </NavLink>
        <NavLink className="nav-pill nav-pill-cart" to="/cart">
          <span>{"购物车"}</span>
          <span className="nav-badge">{totalItems}</span>
        </NavLink>
        <NavLink className="nav-pill nav-pill-order" to="/orders">
          <span>{"订单"}</span>
          <span className="nav-badge nav-badge-soft">{"查看"}</span>
        </NavLink>
        <NavLink className="nav-auth-link" to="/user">
          {user ? "我的账户" : "登录 / 注册"}
        </NavLink>
      </nav>

      {user ? (
        <div className="user-panel">
          <span>{user.username}</span>
          <button className="ghost-button" onClick={handleLogout}>
            {"退出登录"}
          </button>
        </div>
      ) : (
        <Link className="primary-link header-auth-link" to="/user">
          {"进入账户"}
        </Link>
      )}
    </header>
  );
}
