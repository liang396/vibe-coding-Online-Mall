import { Route, Routes } from "react-router-dom";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import HomePage from "../pages/Home";
import ProductListPage from "../pages/ProductList";
import ProductDetailPage from "../pages/ProductDetail";
import CartPage from "../pages/Cart";
import OrderPage from "../pages/Order";
import UserPage from "../pages/User";

export default function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderPage />
            </ProtectedRoute>
          }
        />
        <Route path="/user" element={<UserPage />} />
      </Routes>
    </Layout>
  );
}
