import React, {
  useEffect,
  useState,
  useContext,
} from "react";
import UserLogin from "./pages/UserLogin";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

// =======================
// FIREBASE
// =======================

import {
  auth,
  db,
} from "./firebase";

// =======================
// SERVICES
// =======================

import {
  getProducts,
} from "./services/productService";

// =======================
// CONTEXT
// =======================

import {
  CartContext,
} from "./context/CartContext";

// =======================
// COMPONENTS / PAGES
// =======================

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

import ProtectedRoute from "./components/ProtectedRoute";

// ======================================================
// APP
// ======================================================

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
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

  const loadProducts = async () => {
    try {
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
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily:
            "Cairo, Tahoma, sans-serif",
          fontSize: "20px",
          fontWeight: "700",
          direction: "rtl",
          background: "#f0f4f8",
          color: "#071a36",
        }}
      >
        جاري تحميل المتجر... ⏳
      </div>
    );
  }

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
            products={
              products
            }

            admin={
              admin
            }

            searchTerm={
              searchTerm
            }

            setSearchTerm={
              setSearchTerm
            }

            setCurrentView={
              (view) => {

                switch (view) {

                  case "admin":
                    navigate(
                      "/admin"
                    );
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

                  case "store":
                  default:
                    navigate(
                      "/"
                    );
                    break;
                }
              }
            }
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
            products={
              products
            }

            admin={
              admin
            }

            searchTerm={
              searchTerm
            }

            setSearchTerm={
              setSearchTerm
            }

            setCurrentView={
              (view) => {

                switch (view) {

                  case "admin":
                    navigate(
                      "/admin"
                    );
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

                  case "store":
                    navigate(
                      "/"
                    );
                    break;

                  default:

                    window.dispatchEvent(
                      new CustomEvent(
                        "filterCategory",
                        {
                          detail:
                            view,
                        }
                      )
                    );

                    navigate(
                      "/"
                    );

                    break;
                }
              }
            }
          />
        }
      />

      {/* ==================================================
          CATEGORY PAGE
      ================================================== */}

      <Route
        path="/category/:categoryName"
        element={
          <CategoryPage
            products={
              products
            }

            admin={
              admin
            }

            searchTerm={
              searchTerm
            }

            setSearchTerm={
              setSearchTerm
            }

            setCurrentView={
              (view) => {

                switch (view) {

                  case "admin":
                    navigate(
                      "/admin"
                    );
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

                  case "store":
                  default:
                    navigate(
                      "/"
                    );
                    break;
                }
              }
            }
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
<Route
  path="/user-login"
  element={<UserLogin />}
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
  const {
    id,
  } = useParams();

  const product =
    (products || []).find(
      (item) =>
        String(
          item.id
        ) ===
          String(id) ||
        String(
          item._id
        ) ===
          String(id)
    );

  // ======================================================
  // PRODUCT NOT FOUND
  // ======================================================

  if (!product) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          direction: "rtl",
          textAlign: "center",
          fontFamily:
            "Cairo, Tahoma, sans-serif",
          background: "#f0f4f8",
        }}
      >

        <h2>
          المنتج غير موجود
        </h2>

        <button
          type="button"
          onClick={() =>
            window.history.back()
          }
          style={{
            marginTop: "20px",
            padding:
              "10px 20px",
            border: "none",
            borderRadius:
              "8px",
            cursor: "pointer",
            background:
              "#071a36",
            color: "#fff",
            fontFamily:
              "Cairo, Tahoma, sans-serif",
            fontWeight: "700",
          }}
        >
          ← رجوع
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
              navigate(
                "/"
              );
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

            default:
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


  return (
    <Checkout
      cart={
        cart
      }

      setCart={
        setCart
      }

      setCurrentView={
        (page) => {

          switch (page) {

            case "store":
              navigate(
                "/"
              );
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

            default:
              navigate(
                "/"
              );
              break;
          }

        }
      }
    />
  );
}
// ======================================================
// EXPORT
// ======================================================

export default App;