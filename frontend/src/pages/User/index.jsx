import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createProduct, deleteProduct, updateProduct } from "../../api/productApi";
import SectionTitle from "../../components/SectionTitle";
import { useAuth } from "../../context/AuthContext";
import { CATEGORY_OPTIONS } from "../../utils/constants";
import { ROLE_LABELS } from "../../utils/labels";
import { getErrorMessage } from "../../utils/format";
import { EMAIL_REGEX, PHONE_REGEX, isValidEmail, isValidPhone } from "../../utils/validation";

const registerInitialState = {
  username: "",
  email: "",
  password: "",
  role: "buyer"
};

const profileInitialState = {
  username: "",
  email: "",
  phone: ""
};

const productInitialState = {
  product_id: "",
  name: "",
  description: "",
  image_url: "",
  price: "",
  stock: "",
  category_id: "",
  status: "on_sale"
};

const TEXT = {
  accountCenter: "\u8d26\u6237\u4e2d\u5fc3",
  accountTitleGuest: "\u767b\u5f55\u6216\u6ce8\u518c\u8d26\u53f7",
  accountTitleUser: "\u4e2a\u4eba\u8d44\u6599\u4e0e\u5356\u5bb6\u540e\u53f0",
  accountDesc:
    "\u767b\u5f55\u540e\u53ef\u7ba1\u7406\u4e2a\u4eba\u8d44\u6599\uff0c\u5356\u5bb6\u8d26\u53f7\u53ef\u53d1\u5e03\u548c\u7f16\u8f91\u5546\u54c1\u3002",
  login: "\u767b\u5f55",
  register: "\u6ce8\u518c",
  profile: "\u4e2a\u4eba\u8d44\u6599",
  sellerCenter: "\u5356\u5bb6\u4e2d\u5fc3",
  username: "\u7528\u6237\u540d",
  usernameOrEmail: "\u7528\u6237\u540d\u6216\u90ae\u7bb1",
  password: "\u5bc6\u7801",
  email: "\u90ae\u7bb1\u5730\u5740",
  phone: "\u624b\u673a\u53f7",
  createAccount: "\u521b\u5efa\u8d26\u53f7",
  saveProfile: "\u4fdd\u5b58\u8d44\u6599",
  switchRole: "\u5207\u6362\u8eab\u4efd",
  currentRole: "\u5f53\u524d\u8eab\u4efd",
  switchRoleSuccess: "\u8eab\u4efd\u5207\u6362\u6210\u529f\u3002",
  switchRoleFailed: "\u8eab\u4efd\u5207\u6362\u5931\u8d25",
  sellerRoleRequired: "\u5df2\u81ea\u52a8\u5207\u6362\u4e3a\u5356\u5bb6\u8eab\u4efd",
  sellerRoleUnavailable: "\u5f53\u524d\u8d26\u53f7\u6ca1\u6709\u5356\u5bb6\u6743\u9650",
  createProduct: "\u521b\u5efa\u5546\u54c1",
  updateOrDeleteProduct: "\u66f4\u65b0\u6216\u5220\u9664\u5546\u54c1",
  productId: "\u5546\u54c1 ID",
  productName: "\u5546\u54c1\u540d\u79f0",
  productDesc: "\u5546\u54c1\u63cf\u8ff0",
  productImage: "\u5546\u54c1\u56fe\u7247 URL",
  price: "\u4ef7\u683c",
  stock: "\u5e93\u5b58",
  categoryId: "\u5546\u54c1\u5206\u7c7b",
  selectCategory: "\u8bf7\u9009\u62e9\u5206\u7c7b",
  keepCategory: "\u4e0d\u4fee\u6539\u5206\u7c7b",
  onSale: "\u9500\u552e\u4e2d",
  soldOut: "\u5df2\u552e\u7f44",
  offShelf: "\u5df2\u4e0b\u67b6",
  update: "\u66f4\u65b0",
  delete: "\u5220\u9664",
  enterUsernameOrEmail: "\u8bf7\u8f93\u5165\u7528\u6237\u540d\u6216\u90ae\u7bb1",
  enterUsername: "\u8bf7\u8f93\u5165\u7528\u6237\u540d",
  enterPassword: "\u8bf7\u8f93\u5165\u5bc6\u7801",
  invalidEmail: "\u90ae\u7bb1\u683c\u5f0f\u4e0d\u6b63\u786e\uff0c\u8bf7\u8f93\u5165\u6709\u6548\u7684\u90ae\u7bb1\u5730\u5740",
  invalidPhone: "\u624b\u673a\u53f7\u683c\u5f0f\u4e0d\u6b63\u786e\uff0c\u8bf7\u8f93\u5165 11 \u4f4d\u4e2d\u56fd\u5927\u9646\u624b\u673a\u53f7",
  registerSuccess: (userId) =>
    `\u6ce8\u518c\u6210\u529f\uff0c\u7528\u6237 ID\uff1a${userId}\uff0c\u8bf7\u5148\u767b\u5f55\u3002`,
  loginSuccess: "\u767b\u5f55\u6210\u529f",
  profileSaved: "\u8d44\u6599\u66f4\u65b0\u6210\u529f\u3002",
  productCreated: (productId) => `\u5546\u54c1\u521b\u5efa\u6210\u529f\uff0c\u5546\u54c1 ID\uff1a${productId}`,
  productUpdated: "\u5546\u54c1\u66f4\u65b0\u6210\u529f\u3002",
  productDeleted: "\u5546\u54c1\u5220\u9664\u6210\u529f\u3002",
  enterProductId: "\u8bf7\u8f93\u5165\u5546\u54c1 ID\u3002",
  enterProductName: "\u8bf7\u8f93\u5165\u5546\u54c1\u540d\u79f0",
  enterProductPrice: "\u8bf7\u8f93\u5165\u5408\u6cd5\u7684\u5546\u54c1\u4ef7\u683c",
  enterProductStock: "\u8bf7\u8f93\u5165\u5408\u6cd5\u7684\u5546\u54c1\u5e93\u5b58",
  enterProductCategory: "\u8bf7\u9009\u62e9\u5546\u54c1\u5206\u7c7b",
  registerFailed: "\u6ce8\u518c\u5931\u8d25",
  loginFailed: "\u767b\u5f55\u5931\u8d25",
  profileSaveFailed: "\u8d44\u6599\u66f4\u65b0\u5931\u8d25",
  productCreateFailed: "\u521b\u5efa\u5546\u54c1\u5931\u8d25",
  productUpdateFailed: "\u66f4\u65b0\u5546\u54c1\u5931\u8d25",
  productDeleteFailed: "\u5220\u9664\u5546\u54c1\u5931\u8d25",
  emailTitle:
    "\u8bf7\u8f93\u5165\u6709\u6548\u7684\u90ae\u7bb1\u5730\u5740\uff0c\u4f8b\u5982 name@example.com",
  phoneTitle: "\u8bf7\u8f93\u5165 11 \u4f4d\u4e2d\u56fd\u5927\u9646\u624b\u673a\u53f7"
};

export default function UserPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, register, login, saveProfile, changeRole } = useAuth();
  const [activeTab, setActiveTab] = useState(user ? "profile" : "login");
  const [registerForm, setRegisterForm] = useState(registerInitialState);
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [profileForm, setProfileForm] = useState(
    user
      ? {
          username: user.username || "",
          email: user.email || "",
          phone: user.phone || ""
        }
      : profileInitialState
  );
  const [selectedRole, setSelectedRole] = useState(user?.role || "buyer");
  const [productForm, setProductForm] = useState(productInitialState);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || ""
      });
      setSelectedRole(user.role || "buyer");
      setActiveTab("profile");
    }
  }, [user]);

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...registerForm,
      role: "buyer",
      username: registerForm.username.trim(),
      email: registerForm.email.trim()
    };

    if (!payload.username) {
      setError(TEXT.enterUsername);
      return;
    }

    if (!isValidEmail(payload.email)) {
      setError(TEXT.invalidEmail);
      return;
    }

    if (!payload.password.trim()) {
      setError(TEXT.enterPassword);
      return;
    }

    try {
      const data = await register(payload);
      setMessage(TEXT.registerSuccess(data.userId));
      setRegisterForm(registerInitialState);
      setActiveTab("login");
    } catch (err) {
      setError(getErrorMessage(err, TEXT.registerFailed));
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      identifier: loginForm.identifier.trim(),
      password: loginForm.password
    };

    if (!payload.identifier) {
      setError(TEXT.enterUsernameOrEmail);
      return;
    }

    if (!payload.password.trim()) {
      setError(TEXT.enterPassword);
      return;
    }

    try {
      await login(payload);
      setMessage(TEXT.loginSuccess);
      const from = location.state?.from;
      navigate(from || "/orders", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, TEXT.loginFailed));
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...profileForm,
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim()
    };

    if (!payload.username) {
      setError(TEXT.enterUsername);
      return;
    }

    if (!isValidEmail(payload.email)) {
      setError(TEXT.invalidEmail);
      return;
    }

    if (payload.phone && !isValidPhone(payload.phone)) {
      setError(TEXT.invalidPhone);
      return;
    }

    try {
      await saveProfile(user.userId, payload);
      setMessage(TEXT.profileSaved);
    } catch (err) {
      setError(getErrorMessage(err, TEXT.profileSaveFailed));
    }
  };

  const handleRoleSwitch = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const nextUser = await changeRole(user.userId, selectedRole);
      setMessage(TEXT.switchRoleSuccess);
      setActiveTab(["seller", "admin"].includes(nextUser.role) ? "seller" : "profile");
    } catch (err) {
      setError(getErrorMessage(err, TEXT.switchRoleFailed));
    }
  };

  const ensureSellerRole = async () => {
    if (!user) {
      return null;
    }
    if (user.role === "seller" || user.role === "admin") {
      return user;
    }
    if (!availableRoles.includes("seller")) {
      throw new Error(TEXT.sellerRoleUnavailable);
    }

    const nextUser = await changeRole(user.userId, "seller");
    setSelectedRole(nextUser.role);
    setMessage(TEXT.sellerRoleRequired);
    return nextUser;
  };

  const handleSellerTabOpen = async () => {
    setError("");
    try {
      await ensureSellerRole();
      setActiveTab("seller");
    } catch (err) {
      setError(getErrorMessage(err, TEXT.switchRoleFailed));
    }
  };

  const handleProductCreate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!productForm.name.trim()) {
      setError(TEXT.enterProductName);
      return;
    }
    if (!productForm.price || Number(productForm.price) <= 0) {
      setError(TEXT.enterProductPrice);
      return;
    }
    if (productForm.stock === "" || Number(productForm.stock) < 0) {
      setError(TEXT.enterProductStock);
      return;
    }
    if (!productForm.category_id) {
      setError(TEXT.enterProductCategory);
      return;
    }

    try {
      await ensureSellerRole();
      const data = await createProduct({
        name: productForm.name,
        description: productForm.description,
        image_url: productForm.image_url.trim() || undefined,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        category_id: Number(productForm.category_id)
      });
      setMessage(TEXT.productCreated(data.productId));
      setProductForm(productInitialState);
    } catch (err) {
      setError(getErrorMessage(err, TEXT.productCreateFailed));
    }
  };

  const handleProductUpdate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await ensureSellerRole();
      await updateProduct(Number(productForm.product_id), {
        name: productForm.name || undefined,
        description: productForm.description || undefined,
        image_url: productForm.image_url.trim() || undefined,
        price: productForm.price ? Number(productForm.price) : undefined,
        stock: productForm.stock ? Number(productForm.stock) : undefined,
        category_id: productForm.category_id ? Number(productForm.category_id) : undefined,
        status: productForm.status || undefined
      });
      setMessage(TEXT.productUpdated);
    } catch (err) {
      setError(getErrorMessage(err, TEXT.productUpdateFailed));
    }
  };

  const handleProductDelete = async (event) => {
    event.preventDefault();
    if (!productForm.product_id) {
      setError(TEXT.enterProductId);
      return;
    }

    setError("");
    setMessage("");

    try {
      await ensureSellerRole();
      await deleteProduct(Number(productForm.product_id));
      setMessage(TEXT.productDeleted);
      setProductForm(productInitialState);
    } catch (err) {
      setError(getErrorMessage(err, TEXT.productDeleteFailed));
    }
  };

  const availableRoles = user?.roles?.length ? user.roles : ["buyer", "seller"];
  const canUseSellerCenter = !!user && (availableRoles.includes("seller") || user.role === "admin");
  const isSeller = !!user && ["seller", "admin"].includes(user.role);

  return (
    <div className="stack-lg">
      <SectionTitle
        eyebrow={TEXT.accountCenter}
        title={user ? TEXT.accountTitleUser : TEXT.accountTitleGuest}
        description={TEXT.accountDesc}
      />

      <div className="tab-bar">
        {!user ? (
          <>
            <button
              onClick={() => setActiveTab("login")}
              className={activeTab === "login" ? "active" : ""}
            >
              {TEXT.login}
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={activeTab === "register" ? "active" : ""}
            >
              {TEXT.register}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab("profile")}
              className={activeTab === "profile" ? "active" : ""}
            >
              {TEXT.profile}
            </button>
            {canUseSellerCenter ? (
              <button
                onClick={handleSellerTabOpen}
                className={activeTab === "seller" ? "active" : ""}
              >
                {TEXT.sellerCenter}
              </button>
            ) : null}
          </>
        )}
      </div>

      {error ? <div className="notice error">{error}</div> : null}
      {message ? <div className="notice success">{message}</div> : null}

      {!user && activeTab === "login" ? (
        <form className="panel-form" onSubmit={handleLogin}>
          <input
            placeholder={TEXT.usernameOrEmail}
            value={loginForm.identifier}
            onChange={(event) =>
              setLoginForm((prev) => ({ ...prev, identifier: event.target.value }))
            }
          />
          <input
            type="password"
            placeholder={TEXT.password}
            value={loginForm.password}
            onChange={(event) =>
              setLoginForm((prev) => ({ ...prev, password: event.target.value }))
            }
          />
          <button className="primary-button" type="submit">
            {TEXT.login}
          </button>
        </form>
      ) : null}

      {!user && activeTab === "register" ? (
        <form className="panel-form" onSubmit={handleRegister}>
          <input
            placeholder={TEXT.username}
            value={registerForm.username}
            onChange={(event) =>
              setRegisterForm((prev) => ({ ...prev, username: event.target.value }))
            }
          />
          <input
            type="email"
            placeholder={TEXT.email}
            pattern={EMAIL_REGEX.source}
            title={TEXT.emailTitle}
            value={registerForm.email}
            onChange={(event) =>
              setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />
          <input
            type="password"
            placeholder={TEXT.password}
            value={registerForm.password}
            onChange={(event) =>
              setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
            }
          />
          <button className="primary-button" type="submit">
            {TEXT.createAccount}
          </button>
        </form>
      ) : null}

      {user && activeTab === "profile" ? (
        <div className="grid-two">
          <form className="panel-form" onSubmit={handleProfileSave}>
            <input
              placeholder={TEXT.username}
              value={profileForm.username}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, username: event.target.value }))
              }
            />
            <input
              type="email"
              placeholder={TEXT.email}
              pattern={EMAIL_REGEX.source}
              title={TEXT.emailTitle}
              value={profileForm.email}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />
            <input
              type="tel"
              placeholder={TEXT.phone}
              pattern={PHONE_REGEX.source}
              title={TEXT.phoneTitle}
              value={profileForm.phone}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
            <button className="primary-button" type="submit">
              {TEXT.saveProfile}
            </button>
          </form>

          <form className="panel-form" onSubmit={handleRoleSwitch}>
            <h3>{TEXT.switchRole}</h3>
            <p>{`${TEXT.currentRole}: ${ROLE_LABELS[user.role] || user.role}`}</p>
            <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] || role}
                </option>
              ))}
            </select>
            <button className="primary-button" type="submit">
              {TEXT.switchRole}
            </button>
          </form>
        </div>
      ) : null}

      {user && activeTab === "seller" && isSeller ? (
        <div className="grid-two">
          <form className="panel-form" onSubmit={handleProductCreate}>
            <h3>{TEXT.createProduct}</h3>
            <input
              placeholder={TEXT.productName}
              value={productForm.name}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <textarea
              rows="4"
              placeholder={TEXT.productDesc}
              value={productForm.description}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <input
              placeholder={TEXT.productImage}
              value={productForm.image_url}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, image_url: event.target.value }))
              }
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder={TEXT.price}
              value={productForm.price}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, price: event.target.value }))
              }
            />
            <input
              type="number"
              min="0"
              placeholder={TEXT.stock}
              value={productForm.stock}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, stock: event.target.value }))
              }
            />
            <select
              value={productForm.category_id}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, category_id: event.target.value }))
              }
            >
              <option value="">{TEXT.selectCategory}</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.label}
                </option>
              ))}
            </select>
            <button className="primary-button" type="submit">
              {TEXT.createProduct}
            </button>
          </form>

          <form className="panel-form" onSubmit={handleProductUpdate}>
            <h3>{TEXT.updateOrDeleteProduct}</h3>
            <input
              placeholder={TEXT.productId}
              value={productForm.product_id}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, product_id: event.target.value }))
              }
            />
            <input
              placeholder={TEXT.productName}
              value={productForm.name}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <textarea
              rows="4"
              placeholder={TEXT.productDesc}
              value={productForm.description}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <input
              placeholder={TEXT.productImage}
              value={productForm.image_url}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, image_url: event.target.value }))
              }
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder={TEXT.price}
              value={productForm.price}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, price: event.target.value }))
              }
            />
            <input
              type="number"
              min="0"
              placeholder={TEXT.stock}
              value={productForm.stock}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, stock: event.target.value }))
              }
            />
            <select
              value={productForm.category_id}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, category_id: event.target.value }))
              }
            >
              <option value="">{TEXT.keepCategory}</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.label}
                </option>
              ))}
            </select>
            <select
              value={productForm.status}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, status: event.target.value }))
              }
            >
              <option value="on_sale">{TEXT.onSale}</option>
              <option value="sold_out">{TEXT.soldOut}</option>
              <option value="off_shelf">{TEXT.offShelf}</option>
            </select>
            <div className="action-row">
              <button className="primary-button" type="submit">
                {TEXT.update}
              </button>
              <button className="danger-button" type="button" onClick={handleProductDelete}>
                {TEXT.delete}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
