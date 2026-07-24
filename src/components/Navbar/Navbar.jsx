import React from "react";
import "./Navbar.css";

function Navbar({
  setCurrentView,
  cartCount,
  searchTerm,
  setSearchTerm,
}) {
  return (
    <header className="navbar">

      <div className="navbar-top">

        <div
          className="logo"
          onClick={() => setCurrentView("store")}
        >
          <img src="/logo/logo.png" alt="Elsafty Store" />
          <div>
            <h2>Elsafty Store</h2>
            <span>Everything You Need</span>
          </div>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="ابحث عن أي منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button>
            🔍
          </button>
        </div>

        <div className="actions">

          <button
            onClick={() => setCurrentView("admin")}
          >
            لوحة الإدارة
          </button>

          <button
            onClick={() => setCurrentView("cart")}
          >
            🛒 السلة ({cartCount})
          </button>

        </div>

      </div>

      <div className="navbar-bottom">

        <button>الرئيسية</button>

        <button>الإلكترونيات</button>

        <button>الموبايلات</button>

        <button>اللابتوبات</button>

        <button>الملابس</button>

        <button>الأحذية</button>

        <button>السوبر ماركت</button>

        <button>العروض</button>

      </div>

    </header>
  );
}

export default Navbar;