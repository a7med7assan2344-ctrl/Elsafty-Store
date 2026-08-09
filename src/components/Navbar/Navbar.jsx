import React, {
  useEffect,
  useRef,
  useState,
  useContext,
} from "react";

import { useNavigate } from "react-router-dom";

import offerText from "../../config/offerConfig";

import { WishlistContext } from "../../context/WishlistContext";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../../firebase";

import { getCategories } from "../../services/categoryService";

import "./Navbar.css";

function Navbar({
  setCurrentView,
  cartCount,
  searchTerm,
  setSearchTerm,
  admin,
  products = [],
  setSelectedCategory,
}) {
  const navigate = useNavigate();

  const { wishlist = [] } = useContext(WishlistContext);

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoZoom, setLogoZoom] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const menuRef = useRef(null);
  const searchRef = useRef(null);

  // =========================
  // Firebase User
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================
  // تحميل الأقسام
  // =========================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();

        setCategories(
          (data || []).filter(
            (cat) => cat.active === true
          )
        );
      } catch (error) {
        console.log(
          "Categories Error:",
          error
        );
      }
    };

    fetchCategories();
  }, []);

  // =========================
  // إغلاق البحث عند الضغط خارجه
  // =========================

  useEffect(() => {
    const closeSearch = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener(
      "click",
      closeSearch
    );

    return () => {
      document.removeEventListener(
        "click",
        closeSearch
      );
    };
  }, []);

  // =========================
  // إغلاق قائمة الحساب
  // =========================

  useEffect(() => {
    const closeMenu = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "click",
      closeMenu
    );

    return () => {
      document.removeEventListener(
        "click",
        closeMenu
      );
    };
  }, []);

  // =========================
  // تسجيل الخروج
  // =========================

  const logout = async () => {
    try {
      await signOut(auth);

      setMenuOpen(false);

      navigate("/");
    } catch (error) {
      console.log(
        "Logout Error:",
        error
      );
    }
  };

  // =========================
  // Scroll
  // =========================

  const scrollToSection = (selector) => {
    document
      .querySelector(selector)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  // =========================
  // تحريك شريط الأقسام
  // =========================

  const moveCategories = (direction) => {
    const bar = document.querySelector(
      ".navbar-bottom"
    );

    if (bar) {
      bar.scrollBy({
        left: direction,
        behavior: "smooth",
      });
    }
  };

  // =========================
  // البحث
  // =========================

  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearchTerm(value);

    if (value.trim()) {
      const searchValue =
        value.toLowerCase().trim();

      const results = products
        .filter((item) => {
          const name =
            item.title ||
            item.name ||
            item.productName ||
            "";

          return String(name)
            .toLowerCase()
            .includes(searchValue);
        })
        .slice(0, 5);

      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  // =========================
  // تنفيذ البحث
  // =========================

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(
        `/search?q=${encodeURIComponent(
          searchTerm.trim()
        )}`
      );

      setSuggestions([]);
    }
  };

  // =========================
  // اختيار منتج من الاقتراحات
  // =========================

  const handleSuggestionClick = (product) => {
    const id =
      product.id ||
      product._id;

    setSearchTerm("");
    setSuggestions([]);

    if (id) {
      navigate(`/product/${id}`);
    }
  };

  return (
    <>
      {/* =========================
          TOP OFFER BAR
      ========================= */}

      <div className="top-offer-bar">
        <div className="offer-track">
          {[
            ...offerText,
            ...offerText,
            ...offerText,
            ...offerText,
          ].map((text, index) => (
            <span key={index}>
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* =========================
          MAIN NAVBAR
      ========================= */}

      <header className="store-header">

        {/* =========================
            LOGO
        ========================= */}

        <div className="nav-logo">
          <img
            src="/logo/logo.png"
            alt="Elsafty Store"
            onClick={(e) => {
              e.stopPropagation();
              setLogoZoom(true);
            }}
          />
        </div>

        {/* =========================
            SEARCH
        ========================= */}

        <div
          className="search-box"
          ref={searchRef}
        >
          <input
            type="text"
            placeholder="ابحث عن أي منتج..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <button
            type="button"
            className="search-button"
            onClick={handleSearch}
          >
            🔍
          </button>

          {/* =========================
              SEARCH SUGGESTIONS
          ========================= */}

          {suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((item) => {
                const id =
                  item.id ||
                  item._id;

                const title =
                  item.title ||
                  item.name ||
                  item.productName ||
                  "منتج";

                const image =
                  item.image ||
                  item.images?.[0];

                return (
                  <div
                    key={id}
                    className="suggestion-item"
                    onClick={() =>
                      handleSuggestionClick(
                        item
                      )
                    }
                  >
                    {image && (
                      <img
                        src={image}
                        alt={title}
                        className="suggestion-image"
                      />
                    )}

                    <span>
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================
              NO SEARCH RESULTS
          ========================= */}

          {searchTerm.trim() &&
            suggestions.length === 0 && (
              <div className="search-suggestions">
                <div className="search-no-result">
                  لا توجد منتجات
                </div>
              </div>
            )}
        </div>

        {/* =========================
            NAV ACTIONS
        ========================= */}

        <div className="nav-actions">

          {/* =========================
              WISHLIST
          ========================= */}

          <button
            type="button"
            className="nav-icon wishlist-icon"
            onClick={() =>
              navigate("/wishlist")
            }
          >
            <span>
              ❤️
            </span>

            {wishlist.length > 0 && (
              <span className="wishlist-badge">
                {wishlist.length}
              </span>
            )}

            <small>
              المفضلة
            </small>
          </button>

          {/* =========================
              ACCOUNT
          ========================= */}

          <div
            className="account-menu"
            ref={menuRef}
          >
            <button
              type="button"
              className="nav-icon"
              onClick={() =>
                setMenuOpen(
                  !menuOpen
                )
              }
            >
              <span>
                👤
              </span>

              <small>
                {user
                  ? user.displayName ||
                    "حسابي"
                  : "حسابي"}
              </small>
            </button>

            {menuOpen && (
              <div className="account-dropdown">

                {!user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(
                          "/login"
                        );
                      }}
                    >
                      🔑 تسجيل الدخول
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(
                          "/register"
                        );
                      }}
                    >
                      ➕ إنشاء حساب
                    </button>
                  </>
                ) : (
                  <>
                    <div className="account-user-info">
                      <strong>
                        {user.displayName ||
                          "المستخدم"}
                      </strong>

                      <span>
                        {user.email}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(
                          "/account"
                        );
                      }}
                    >
                      👤 حسابي
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(
                          "/orders"
                        );
                      }}
                    >
                      📦 طلباتي
                    </button>

                    <button
                      type="button"
                      onClick={logout}
                    >
                      🚪 تسجيل الخروج
                    </button>
                  </>
                )}

              </div>
            )}
          </div>

          {/* =========================
              ADMIN
          ========================= */}

          {admin && (
            <button
              type="button"
              className="admin-btn"
              onClick={() =>
                navigate("/admin")
              }
            >
              <span>
                ⚙️
              </span>

              <small>
                الإدارة
              </small>
            </button>
          )}

          {/* =========================
              CART
          ========================= */}

          <button
            type="button"
            className="cart-icon"
            onClick={() =>
              navigate("/cart")
            }
          >
            <span className="cart-symbol">
              🛒
            </span>

            {cartCount > 0 && (
              <span className="cart-badge">
                {cartCount}
              </span>
            )}

            <small>
              السلة
            </small>
          </button>

        </div>
      </header>

      {/* =========================
          CATEGORY BAR
      ========================= */}

      <div className="navbar-bottom-wrapper">

        {/* LEFT ARROW */}

        <button
          type="button"
          className="category-arrow"
          onClick={() =>
            moveCategories(-300)
          }
        >
          ❮
        </button>

        {/* CATEGORIES */}

        <nav className="navbar-bottom">

          {/* HOME */}

          <button
            type="button"
            className="nav-category-item home-item"
            onClick={() =>
              navigate("/")
            }
          >
            <span>
              🏠
            </span>

            <strong>
              الرئيسية
            </strong>
          </button>

          {/* ALL CATEGORIES */}

          <button
            type="button"
            className="nav-category-item"
            onClick={() =>
              scrollToSection(
                ".categories"
              )
            }
          >
            <span>
              📱
            </span>

            <strong>
              الأقسام
            </strong>
          </button>

          {/* FIREBASE CATEGORIES */}

          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              className="nav-category-item"
              onClick={() => {

                if (
                  setSelectedCategory
                ) {
                  setSelectedCategory(
                    cat.name
                  );
                }

                window.dispatchEvent(
                  new CustomEvent(
                    "filterCategory",
                    {
                      detail:
                        cat.name,
                    }
                  )
                );

                scrollToSection(
                  ".products-section"
                );
              }}
            >

              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                />
              ) : (
                <span>
                  {cat.icon ||
                    "📦"}
                </span>
              )}

              <strong>
                {cat.name}
              </strong>

            </button>
          ))}

          {/* OFFERS */}

          <button
            type="button"
            className="nav-category-item offer-item"
            onClick={() =>
              scrollToSection(
                ".offer-banner"
              )
            }
          >
            <span>
              🔥
            </span>

            <strong>
              العروض
            </strong>
          </button>

          {/* BEST SELLERS */}

          <button
            type="button"
            className="nav-category-item"
            onClick={() =>
              scrollToSection(
                ".best-selling-section"
              )
            }
          >
            <span>
              ⭐
            </span>

            <strong>
              الأكثر مبيعًا
            </strong>
          </button>

          {/* NEW ARRIVALS */}

          <button
            type="button"
            className="nav-category-item"
            onClick={() =>
              scrollToSection(
                ".new-arrivals-section"
              )
            }
          >
            <span>
              🆕
            </span>

            <strong>
              وصل حديثًا
            </strong>
          </button>

        </nav>

        {/* RIGHT ARROW */}

        <button
          type="button"
          className="category-arrow"
          onClick={() =>
            moveCategories(300)
          }
        >
          ❯
        </button>

      </div>

      {/* =========================
          LOGO ZOOM MODAL
      ========================= */}

      {logoZoom && (
        <div
          className="logo-modal"
          onClick={() =>
            setLogoZoom(false)
          }
        >
          <button
            type="button"
            className="close-logo"
            onClick={() =>
              setLogoZoom(false)
            }
          >
            ✕
          </button>

          <img
            src="/logo/logo.png"
            alt="Elsafty Store"
            onClick={(e) =>
              e.stopPropagation()
            }
          />
        </div>
      )}
    </>
  );
}

export default Navbar;