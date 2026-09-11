import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, doc, onSnapshot } from "firebase/firestore";

import { CartContext } from "../context/CartContext";
import { db } from "../firebase";

import "./Header.css";

const DEFAULT_SETTINGS = {
  storeName: "ســـــَــــــــوا",
  logo: "",
  theme: {
    primary: "#071A36",
    secondary: "#0B1F3A",
    accent: "#D4AF37",
    textColor: "#FFFFFF",
    fontFamily: "Cairo",
  },
};

const DEFAULT_MENU = [
  {
    id: "home",
    label: "الرئيسية",
    path: "/",
    icon: "⌂",
    active: true,
    order: 1,
  },
  {
    id: "products",
    label: "المنتجات",
    path: "/products",
    icon: "▦",
    active: true,
    order: 2,
  },
  {
    id: "offers",
    label: "العروض",
    path: "/offers",
    icon: "٪",
    active: true,
    order: 3,
  },
];

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cart = [] } = useContext(CartContext);

  const [storeSettings, setStoreSettings] = useState(DEFAULT_SETTINGS);
  const [menuItems, setMenuItems] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  /* =========================
     LOAD STORE SETTINGS
  ========================= */

  useEffect(() => {
    const storeRef = doc(db, "settings", "store");

    const unsubscribe = onSnapshot(
      storeRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setStoreSettings(DEFAULT_SETTINGS);
          return;
        }

        const data = snapshot.data() || {};

        setStoreSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          theme: {
            ...DEFAULT_SETTINGS.theme,
            ...(data.theme || {}),
          },
        });
      },
      () => {
        setStoreSettings(DEFAULT_SETTINGS);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================
     LOAD ADMIN MENU
  ========================= */

  useEffect(() => {
    const menuRef = collection(db, "storeMenuItems");

    const unsubscribe = onSnapshot(
      menuRef,
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter((item) => item.active !== false)
          .sort(
            (a, b) =>
              Number(a.order ?? a.sortOrder ?? 999) -
              Number(b.order ?? b.sortOrder ?? 999)
          );

        setMenuItems(data);
      },
      () => {
        setMenuItems([]);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================
     CART
  ========================= */

  const cartCount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [cart]);

  /* =========================
     SETTINGS
  ========================= */

  const theme = storeSettings.theme || DEFAULT_SETTINGS.theme;

  const primary = theme.primary || "#071A36";
  const secondary = theme.secondary || "#0B1F3A";
  const accent = theme.accent || "#D4AF37";
  const textColor = theme.textColor || "#FFFFFF";
  const fontFamily = theme.fontFamily || "Cairo";

  const storeName =
    storeSettings.storeName ||
    DEFAULT_SETTINGS.storeName;

  const logo =
    storeSettings.logo ||
    storeSettings.logoUrl ||
    "";

  /*
   * لو الأدمن مش عامل عناصر في storeMenuItems
   * نستخدم القائمة الافتراضية بدون ما الصفحة تفضى.
   */
  const finalMenu = useMemo(() => {
    if (menuItems.length > 0) {
      return menuItems;
    }

    return DEFAULT_MENU;
  }, [menuItems]);

  /* =========================
     NAVIGATION
  ========================= */

  const handleNavigate = (item) => {
    const path =
      item.path ||
      item.link ||
      item.url ||
      "/";

    setMenuOpen(false);

    if (!path) return;

    if (
      path.startsWith("http://") ||
      path.startsWith("https://")
    ) {
      window.location.href = path;
      return;
    }

    navigate(path);
  };

  const isActive = (item) => {
    const path =
      item.path ||
      item.link ||
      item.url ||
      "/";

    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname === path ||
      location.pathname.startsWith(`${path}/`);
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      navigate("/products");
      return;
    }

    navigate(
      `/products?search=${encodeURIComponent(value)}`
    );

    setSearchValue("");
    setSearchOpen(false);
  };

  /* =========================
     CSS VARIABLES
  ========================= */

  const headerStyle = {
    "--header-primary": primary,
    "--header-secondary": secondary,
    "--header-accent": accent,
    "--header-text": textColor,
    "--header-font": fontFamily,
  };

  return (
    <header
      className="main-header"
      style={headerStyle}
      dir="rtl"
    >
      <div className="header-inner">

        {/* =========================
            LOGO
        ========================= */}

        <button
          type="button"
          className="header-brand"
          onClick={() => {
            navigate("/");
            setMenuOpen(false);
          }}
          aria-label={storeName}
        >
          {logo ? (
            <img
              src={logo}
              alt={storeName}
              className="header-logo-image"
            />
          ) : (
            <span className="header-logo-text">
              {storeName}
            </span>
          )}
        </button>

        {/* =========================
            DESKTOP MENU
        ========================= */}

        <nav
          className="header-navigation"
          aria-label="القائمة الرئيسية"
        >
          {finalMenu.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`header-nav-item ${
                isActive(item)
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(item)
              }
            >
              {item.icon && (
                <span className="header-nav-icon">
                  {item.icon}
                </span>
              )}

              <span>
                {item.label ||
                  item.name ||
                  "صفحة"}
              </span>
            </button>
          ))}
        </nav>

        {/* =========================
            SEARCH
        ========================= */}

        <div
          className={`header-search ${
            searchOpen ? "open" : ""
          }`}
        >
          <form onSubmit={handleSearch}>
            <input
              type="search"
              value={searchValue}
              onChange={(event) =>
                setSearchValue(
                  event.target.value
                )
              }
              placeholder="ابحث عن منتج..."
              aria-label="البحث عن منتج"
            />

            <button
              type="submit"
              aria-label="بحث"
              className="search-submit"
            >
              🔍
            </button>
          </form>
        </div>

        <button
          type="button"
          className="header-search-toggle"
          onClick={() =>
            setSearchOpen((value) => !value)
          }
          aria-label="فتح البحث"
        >
          🔍
        </button>

        {/* =========================
            CART
        ========================= */}

        <button
          type="button"
          className="header-cart"
          onClick={() => navigate("/cart")}
          aria-label="السلة"
        >
          <span className="cart-icon">
            🛒
          </span>

          <span className="cart-text">
            السلة
          </span>

          {cartCount > 0 && (
            <span className="cart-count">
              {cartCount}
            </span>
          )}
        </button>

        {/* =========================
            MOBILE MENU BUTTON
        ========================= */}

        <button
          type="button"
          className={`header-menu-toggle ${
            menuOpen ? "active" : ""
          }`}
          onClick={() =>
            setMenuOpen((value) => !value)
          }
          aria-label="القائمة"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* =========================
          MOBILE NAVIGATION
      ========================= */}

      <div
        className={`mobile-navigation ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="mobile-navigation-inner">

          {finalMenu.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-item ${
                isActive(item)
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(item)
              }
            >
              <span className="mobile-nav-icon">
                {item.icon || "•"}
              </span>

              <span>
                {item.label ||
                  item.name ||
                  "صفحة"}
              </span>
            </button>
          ))}

          <button
            type="button"
            className={`mobile-nav-item ${
              location.pathname === "/cart"
                ? "active"
                : ""
            }`}
            onClick={() => {
              navigate("/cart");
              setMenuOpen(false);
            }}
          >
            <span className="mobile-nav-icon">
              🛒
            </span>

            <span>
              السلة
              {cartCount > 0
                ? ` (${cartCount})`
                : ""}
            </span>
          </button>
        </div>
      </div>

      {/* =========================
          SEARCH MOBILE
      ========================= */}

      {searchOpen && (
        <div className="mobile-search">
          <form onSubmit={handleSearch}>
            <input
              type="search"
              value={searchValue}
              onChange={(event) =>
                setSearchValue(
                  event.target.value
                )
              }
              placeholder="ابحث عن منتج..."
              autoFocus
            />

            <button type="submit">
              بحث
            </button>
          </form>
        </div>
      )}
    </header>
  );
}

export default Header;
