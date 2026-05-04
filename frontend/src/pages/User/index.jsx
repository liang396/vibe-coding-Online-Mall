import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createProduct, deleteProduct, fetchSellerProducts, updateProduct } from "../../api/productApi";
import SectionTitle from "../../components/SectionTitle";
import { useAuth } from "../../context/AuthContext";
import { CATEGORY_OPTIONS } from "../../utils/constants";
import { ROLE_LABELS, PRODUCT_STATUS_LABELS } from "../../utils/labels";
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
  accountCenter: "账户中心",
  accountTitleGuest: "登录或注册账号",
  accountTitleUser: "个人资料与卖家后台",
  accountDesc: "登录后可管理个人资料，卖家账号可发布和编辑商品。",
  login: "登录",
  register: "注册",
  profile: "个人资料",
  sellerCenter: "卖家中心",
  username: "用户名",
  usernameOrEmail: "用户名或邮箱",
  password: "密码",
  email: "邮箱地址",
  phone: "手机号",
  createAccount: "创建账号",
  saveProfile: "保存资料",
  switchRole: "切换身份",
  currentRole: "当前身份",
  switchRoleSuccess: "身份切换成功。",
  switchRoleFailed: "身份切换失败",
  sellerRoleRequired: "已自动切换为卖家身份",
  sellerRoleUnavailable: "当前账号没有卖家权限",
  createProduct: "创建商品",
  updateOrDeleteProduct: "更新或删除商品",
  sellerInventory: "我的商品",
  inventoryEmpty: "还没有已发布商品，先创建一个吧。",
  inventoryLoadFailed: "商品列表加载失败",
  inventoryLoading: "商品列表加载中...",
  selectProductHint: "点击商品可快速回填到右侧表单进行更新或删除。",
  productId: "商品 ID",
  productName: "商品名称",
  productDesc: "商品描述",
  productImage: "商品图片 URL",
  price: "价格",
  stock: "库存",
  categoryId: "商品分类",
  selectCategory: "请选择分类",
  keepCategory: "不修改分类",
  onSale: "销售中",
  soldOut: "已售罄",
  offShelf: "已下架",
  update: "更新",
  delete: "删除",
  enterUsernameOrEmail: "请输入用户名或邮箱",
  enterUsername: "请输入用户名",
  enterPassword: "请输入密码",
  invalidEmail: "邮箱格式不正确，请输入有效的邮箱地址",
  invalidPhone: "手机号格式不正确，请输入 11 位中国大陆手机号",
  registerSuccess: (userId) => `注册成功，用户 ID：${userId}，请先登录。`,
  loginSuccess: "登录成功",
  profileSaved: "资料更新成功。",
  productCreated: (productId) => `商品创建成功，商品 ID：${productId}`,
  productUpdated: "商品更新成功。",
  productDeleted: "商品删除成功。",
  enterProductId: "请输入商品 ID。",
  enterProductName: "请输入商品名称",
  enterProductPrice: "请输入合法的商品价格",
  enterProductStock: "请输入合法的商品库存",
  enterProductCategory: "请选择商品分类",
  registerFailed: "注册失败",
  loginFailed: "登录失败",
  profileSaveFailed: "资料更新失败",
  productCreateFailed: "创建商品失败",
  productUpdateFailed: "更新商品失败",
  productDeleteFailed: "删除商品失败",
  emailTitle: "请输入有效的邮箱地址，例如 name@example.com",
  phoneTitle: "请输入 11 位中国大陆手机号"
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
  const [sellerProducts, setSellerProducts] = useState([]);
  const [sellerProductsLoading, setSellerProductsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const availableRoles = user?.roles?.length ? user.roles : ["buyer", "seller"];
  const canUseSellerCenter = !!user && (availableRoles.includes("seller") || user.role === "admin");
  const isSeller = !!user && ["seller", "admin"].includes(user.role);

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

  useEffect(() => {
    if (!user || activeTab !== "seller" || !isSeller) {
      return;
    }
    void loadSellerProducts();
  }, [activeTab, isSeller, user]);

  const loadSellerProducts = async () => {
    try {
      setSellerProductsLoading(true);
      const data = await fetchSellerProducts();
      setSellerProducts(data);
    } catch (err) {
      setError(getErrorMessage(err, TEXT.inventoryLoadFailed));
    } finally {
      setSellerProductsLoading(false);
    }
  };

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

  const handleSelectSellerProduct = (product) => {
    setProductForm({
      product_id: String(product.productId),
      name: product.name || "",
      description: product.description || "",
      image_url: product.imageUrl || "",
      price: product.price != null ? String(product.price) : "",
      stock: product.stock != null ? String(product.stock) : "",
      category_id: product.categoryId != null ? String(product.categoryId) : "",
      status: product.status || "on_sale"
    });
    setMessage(TEXT.selectProductHint);
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
      await loadSellerProducts();
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
        stock: productForm.stock === "" ? undefined : Number(productForm.stock),
        category_id: productForm.category_id ? Number(productForm.category_id) : undefined,
        status: productForm.status || undefined
      });
      setMessage(TEXT.productUpdated);
      await loadSellerProducts();
    } catch (err) {
      setError(getErrorMessage(err, TEXT.productUpdateFailed));
    }
  };

  const handleProductDelete = async () => {
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
      await loadSellerProducts();
    } catch (err) {
      setError(getErrorMessage(err, TEXT.productDeleteFailed));
    }
  };

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
          <div className="stack-md">
            <div className="feature-panel stack-md">
              <h3>{TEXT.sellerInventory}</h3>
              {sellerProductsLoading ? <div className="notice">{TEXT.inventoryLoading}</div> : null}
              {!sellerProductsLoading && !sellerProducts.length ? (
                <div className="empty-state">{TEXT.inventoryEmpty}</div>
              ) : (
                <div className="review-list">
                  {sellerProducts.map((product) => (
                    <button
                      key={product.productId}
                      type="button"
                      className="review-item"
                      onClick={() => handleSelectSellerProduct(product)}
                    >
                      <strong>{product.name}</strong>
                      <span>{`ID: ${product.productId}`}</span>
                      <span>{PRODUCT_STATUS_LABELS[product.status] || product.status}</span>
                      <span>{`库存 ${product.stock}`}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

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
          </div>

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
