import React, {
  useEffect,
  useState,
  useContext,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

// ======================================================
// FIREBASE
// ======================================================

import {
  auth,
  db,
} from "./firebase";

// ======================================================
// SERVICES
// ======================================================

import {
  getProducts,
} from "./services/productService";

// ======================================================
// CONTEXT
// ======================================================

import {
  CartContext,
} from "./context/CartContext";

import AuthProvider from "./context/AuthContext";

// ======================================================
// COMPONENTS / PAGES
// ======================================================

import Admin from "./components/Admin/Admin.jsx";

import AdminLogin from "./pages/AdminLogin";

import Home from "./pages/Home";

import CategoryPage from "./pages/CategoryPage";

import ProductDetails from "./pages/ProductDetails";

import Cart from "./pages/Cart";

import Checkout from "./pages/Checkout";

import SearchResults from "./pages/SearchResults";

import Orders from "./pages/Orders";

import Login from "./pages/Login";

import Register from "./pages/Register";

import Account from "./pages/Account";

import Wishlist from "./pages/Wishlist";

import UserLogin from "./pages/UserLogin";

import ProtectedRoute from "./components/ProtectedRoute";

// ======================================================
// JUMIA THEME
// ======================================================

const JUMIA_THEME = {
  orange: "#f68b1e",
  orangeDark: "#e87912",
  orangeLight: "#fff3e6",
  white: "#ffffff",
  background: "#f5f5f5",
  text: "#313133",
  muted: "#75757a",
  border: "#e5e5e5",
  success: "#2e7d32",
  danger: "#e53935",
};

// ======================================================
// APP
// ======================================================

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

// ======================================================
// APP CONTENT
// ======================================================

function AppContent() {

  // ======================================================
  // STATES
  // ======================================================

  const [products, setProducts] =
    useState([]);

  const [admin, setAdmin] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState("");

  const navigate =
    useNavigate();

  // ======================================================
  // LOAD PRODUCTS
  // ======================================================

  const loadProducts =
    async () => {

      try {

        setLoading(true);

        const data =
          await getProducts();

        setProducts(
          data || []
        );

      } catch (error) {

        console.error(
          "Products Error:",
          error
        );

        setProducts([]);

      } finally {

        setLoading(false);

      }

    };

  // ======================================================
  // AUTH + ADMIN CHECK
  // ======================================================

  useEffect(() => {

    loadProducts();

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {

          // ==============================================
          // USER NOT LOGGED IN
          // ==============================================

          if (!user) {

            setAdmin(false);

            return;

          }

          // ==============================================
          // CHECK ADMIN
          // ==============================================

          try {

            const adminRef =
              doc(
                db,
                "users",
                user.uid
              );

            const adminSnap =
              await getDoc(
                adminRef
              );

            if (
              adminSnap.exists()
            ) {

              const userData =
                adminSnap.data();

              setAdmin(
                userData.role ===
                "admin"
              );

            } else {

              setAdmin(false);

            }

          } catch (error) {

            console.error(
              "Admin Check Error:",
              error
            );

            setAdmin(false);

          }

        }
      );

    return () => {

      unsubscribe();

    };

  }, []);

  // ======================================================
  // GLOBAL LOADING
  // ======================================================

  if (loading) {

    return (

      <div
        style={{
          minHeight:
            "100vh",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          flexDirection:
            "column",

          gap:
            "14px",

          direction:
            "rtl",

          textAlign:
            "center",

          fontFamily:
            "Tajawal, Cairo, Arial, sans-serif",

          background:
            JUMIA_THEME.background,

          color:
            JUMIA_THEME.text,
        }}
      >

        <div
          style={{
            width:
              "42px",

            height:
              "42px",

            borderRadius:
              "50%",

            border:
              `4px solid ${JUMIA_THEME.orangeLight}`,

            borderTopColor:
              JUMIA_THEME.orange,

            animation:
              "elsAftyAppLoader 0.8s linear infinite",
          }}
        />

        <strong
          style={{
            fontSize:
              "18px",
          }}
        >
          جاري تحميل المتجر...
        </strong>

        <style>
          {`
            @keyframes elsAftyAppLoader {

              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }

            }
          `}
        </style>

      </div>

    );

  }

  // ======================================================
  // NAVIGATION HANDLER
  // ======================================================

  const handleNavigation =
    (view) => {

      switch (view) {

        case "admin":

          navigate("/admin");

          break;

        case "cart":

          navigate("/cart");

          break;

        case "account":

          navigate("/account");

          break;

        case "orders":

          navigate("/orders");

          break;

        case "wishlist":

          navigate("/wishlist");

          break;

        case "checkout":

          navigate("/checkout");

          break;

        case "login":

          navigate("/login");

          break;

        case "register":

          navigate("/register");

          break;

        case "store":

        case "home":

        default:

          navigate("/");

          break;

      }

    };

  // ======================================================
  // COMMON PAGE PROPS
  // ======================================================

  const commonProps = {

    products,

    admin,

    searchTerm,

    setSearchTerm,

    setCurrentView:
      handleNavigation,

  };

  // ======================================================
  // ROUTES
  // ======================================================

  return (

    <Routes>

      {/* ==================================================
          LOGIN
      ================================================== */}

      <Route
        path="/login"
        element={
          <Login />
        }
      />

      {/* ==================================================
          REGISTER
      ================================================== */}

      <Route
        path="/register"
        element={
          <Register />
        }
      />

      {/* ==================================================
          USER LOGIN
      ================================================== */}

      <Route
        path="/user-login"
        element={
          <UserLogin />
        }
      />

      {/* ==================================================
          ACCOUNT
      ================================================== */}

      <Route
        path="/account"
        element={

          <ProtectedRoute>

            <Account />

          </ProtectedRoute>

        }
      />

      {/* ==================================================
          ORDERS
      ================================================== */}

      <Route
        path="/orders"
        element={

          <ProtectedRoute>

            <Orders />

          </ProtectedRoute>

        }
      />

      {/* ==================================================
          HOME
      ================================================== */}

      <Route
        path="/"
        element={

          <Home
            {...commonProps}
          />

        }
      />

      {/* ==================================================
          SEARCH
      ================================================== */}

      <Route
        path="/search"
        element={

          <SearchResults
            {...commonProps}
          />

        }
      />

      {/* ==================================================
          CATEGORY
      ================================================== */}

      <Route
        path="/category/:id"
        element={

          <CategoryPage
            {...commonProps}
          />

        }
      />

      {/* ==================================================
          PRODUCT DETAILS
      ================================================== */}

      <Route
        path="/product/:id"
        element={

          <ProductDetailsWrapper
            products={
              products
            }
          />

        }
      />

      {/* ==================================================
          CART
      ================================================== */}

      <Route
        path="/cart"
        element={
          <CartWrapper />
        }
      />

      {/* ==================================================
          WISHLIST
      ================================================== */}

      <Route
        path="/wishlist"
        element={
          <Wishlist />
        }
      />

      {/* ==================================================
          CHECKOUT
      ================================================== */}

      <Route
        path="/checkout"
        element={

          <ProtectedRoute>

            <CheckoutWrapper />

          </ProtectedRoute>

        }
      />

      {/* ==================================================
          ADMIN LOGIN
      ================================================== */}

      <Route
        path="/admin-login"
        element={

          admin ? (

            <Navigate
              to="/admin"
              replace
            />

          ) : (

            <AdminLogin
              setAdmin={
                setAdmin
              }
            />

          )

        }
      />

      {/* ==================================================
          ADMIN PANEL
      ================================================== */}

      <Route
        path="/admin"
        element={

          admin ? (

            <Admin
              products={
                products
              }

              loadProducts={
                loadProducts
              }
            />

          ) : (

            <Navigate
              to="/admin-login"
              replace
            />

          )

        }
      />

      {/* ==================================================
          404
      ================================================== */}

      <Route
        path="*"
        element={

          <Navigate
            to="/"
            replace
          />

        }
      />

    </Routes>

  );

}

// ======================================================
// PRODUCT DETAILS WRAPPER
// ======================================================

function ProductDetailsWrapper({
  products,
}) {

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const product =
    (products || []).find(
      (item) =>
        String(item.id) ===
          String(id) ||

        String(item._id) ===
          String(id)
    );

  // ======================================================
  // PRODUCT NOT FOUND
  // ======================================================

  if (!product) {

    return (

      <div
        style={{
          minHeight:
            "100vh",

          display:
            "flex",

          flexDirection:
            "column",

          alignItems:
            "center",

          justifyContent:
            "center",

          direction:
            "rtl",

          textAlign:
            "center",

          fontFamily:
            "Tajawal, Cairo, Arial, sans-serif",

          background:
            JUMIA_THEME.background,

          color:
            JUMIA_THEME.text,

          padding:
            "30px",
        }}
      >

        <div
          style={{
            width:
              "90px",

            height:
              "90px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            marginBottom:
              "20px",

            borderRadius:
              "50%",

            background:
              JUMIA_THEME.orangeLight,

            fontSize:
              "42px",
          }}
        >
          🛍️
        </div>

        <h2
          style={{
            marginBottom:
              "10px",

            fontSize:
              "25px",
          }}
        >
          المنتج غير موجود
        </h2>

        <p
          style={{
            color:
              JUMIA_THEME.muted,

            marginBottom:
              "20px",
          }}
        >
          عذرًا، المنتج الذي تبحث عنه
          غير متوفر حاليًا.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/")
          }
          style={{
            border:
              "none",

            borderRadius:
              "4px",

            padding:
              "12px 28px",

            cursor:
              "pointer",

            background:
              JUMIA_THEME.orange,

            color:
              "#fff",

            fontFamily:
              "Tajawal, Cairo, Arial, sans-serif",

            fontWeight:
              "800",

            fontSize:
              "15px",
          }}
        >
          العودة للتسوق
        </button>

      </div>

    );

  }

  return (

    <ProductDetails
      product={
        product
      }
    />

  );

}

// ======================================================
// CART WRAPPER
// ======================================================

function CartWrapper() {

  const {
    cart,
    updateQuantity,
    removeFromCart,
  } = useContext(
    CartContext
  );

  const navigate =
    useNavigate();

  return (

    <Cart

      cart={
        cart
      }

      updateQuantity={
        updateQuantity
      }

      removeFromCart={
        removeFromCart
      }

      setCurrentView={
        (page) => {

          switch (page) {

            case "store":

            case "home":

              navigate("/");

              break;

            case "checkout":

              navigate(
                "/checkout"
              );

              break;

            case "account":

              navigate(
                "/account"
              );

              break;

            case "orders":

              navigate(
                "/orders"
              );

              break;

            case "wishlist":

              navigate(
                "/wishlist"
              );

              break;

            default:

              navigate("/");

              break;

          }

        }
      }

    />

  );

}

// ======================================================
// CHECKOUT WRAPPER
// ======================================================

function CheckoutWrapper() {

  const {
    cart,
    setCart,
  } = useContext(
    CartContext
  );

  const navigate =
    useNavigate();

  const location =
    useLocation();

  // ======================================================
  // LOAD EDIT ORDER FROM NAVIGATION STATE
  // ======================================================

  useEffect(() => {

    const editOrder =
      location.state?.editOrder;

    // ----------------------------------------------------
    // No edit order
    // ----------------------------------------------------

    if (!editOrder) {
      return;
    }

    // ----------------------------------------------------
    // Get products from order
    // Supports common order field names
    // ----------------------------------------------------

    const orderItems =
      editOrder.items ||
      editOrder.products ||
      editOrder.orderItems ||
      [];

    if (
      !Array.isArray(orderItems) ||
      orderItems.length === 0
    ) {

      console.warn(
        "Edit Order: no products found",
        editOrder
      );

      return;

    }

    // ----------------------------------------------------
    // Normalize products for CartContext
    // ----------------------------------------------------

    const restoredCart =
      orderItems.map(
        (item) => {

          const product =
            item.product ||
            item;

          const productId =
            product.id ??
            product._id ??
            item.productId ??
            item.id ??
            item._id;

          const quantity =
            Number(
              item.quantity ??
              item.qty ??
              product.quantity ??
              1
            );

          return {

            ...product,

            id:
              productId,

            _id:
              product._id ??
              productId,

            quantity:
              quantity > 0
                ? quantity
                : 1,

          };

        }
      ).filter(
        (item) =>
          item.id !==
            undefined &&
          item.id !==
            null
      );

    // ----------------------------------------------------
    // Put edited order products into cart
    // ----------------------------------------------------

    if (
      restoredCart.length > 0
    ) {

      setCart(
        restoredCart
      );

    }

  }, [
    location.state,
    setCart,
  ]);

  // ======================================================
  // CLEAR EDIT STATE AFTER LOADING
  // ======================================================

  useEffect(() => {

    if (
      location.state?.editOrder
    ) {

      navigate(
        location.pathname,
        {
          replace: true,
          state: {},
        }
      );

    }

  }, [
    location.pathname,
    location.state,
    navigate,
  ]);

  // ======================================================
  // NAVIGATION
  // ======================================================

  const handleCheckoutNavigation =
    (page) => {

      switch (page) {

        case "store":

        case "home":

          navigate("/");

          break;

        case "cart":

          navigate(
            "/cart"
          );

          break;

        case "account":

          navigate(
            "/account"
          );

          break;

        case "orders":

          navigate(
            "/orders"
          );

          break;

        case "wishlist":

          navigate(
            "/wishlist"
          );

          break;

        default:

          navigate("/");

          break;

      }

    };

  // ======================================================
  // CHECKOUT
  // ======================================================

  return (

    <Checkout

      cart={
        cart
      }

      setCart={
        setCart
      }

      setCurrentView={
        handleCheckoutNavigation
      }

      editOrder={
        location.state?.editOrder
      }

    />

  );

}

// ======================================================
// EXPORT
// ======================================================

export default App;
