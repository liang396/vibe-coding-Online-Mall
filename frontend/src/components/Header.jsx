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
        <span>{"\u4e8c\u624b\u5546\u57ce"}</span>
      </Link>

      <nav className="main-nav">
        <NavLink to="/">{"\u9996\u9875"}</NavLink>
        <NavLink to="/products">{"\u5546\u54c1"}</NavLink>
        <NavLink className="nav-pill nav-pill-cart" to="/cart">
          <span>{"\u8d2d\u7269\u8f66"}</span>
          <span className="nav-badge">{totalItems}</span>
        </NavLink>
        <NavLink className="nav-pill nav-pill-order" to="/orders">
          <span>{"\u8ba2\u5355"}</span>
          <span className="nav-badge nav-badge-soft">{"\u67e5\u770b"}</span>
        </NavLink>
        <NavLink className="nav-auth-link" to="/user">
          {user ? "\u6211\u7684\u8d26\u6237" : "\u767b\u5f55 / \u6ce8\u518c"}
        </NavLink>
      </nav>

      {user ? (
        <div className="user-panel">
          <span>{user.username}</span>
          <button className="ghost-button" onClick={handleLogout}>
            {"\u9000\u51fa\u767b\u5f55"}
          </button>
        </div>
      ) : (
        <Link className="primary-link header-auth-link" to="/user">
          {"\u8fdb\u5165\u8d26\u6237"}
        </Link>
      )}
    </header>
  );
}
