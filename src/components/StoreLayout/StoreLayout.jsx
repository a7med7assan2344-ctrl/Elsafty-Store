import React from "react";

import Navbar from "../Navbar/Navbar";
import HeroSlider from "../HeroSlider";
import Footer from "../Footer/Footer";

import "../../styles/store.css";


function StoreLayout({
  children,

  products = [],

  admin = null,

  cartCount = 0,

  searchTerm = "",

  setSearchTerm = () => {},

  setCurrentView = () => {},

  currentView = "store",

  banners = [],

  bannerSettings = {},

  storeSettings = {},
}) {
  return (
    <div
      className="store-container"
      dir="rtl"
    >

      {/* =====================================================
          NAVBAR
          ===================================================== */}

      <Navbar
        products={products}
        setCurrentView={setCurrentView}
        cartCount={cartCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        admin={admin}
        storeSettings={storeSettings}
      />


      {/* =====================================================
          HERO
          جميع البيانات والإعدادات من الأدمن
          ===================================================== */}

      <HeroSlider
        banners={banners}
        bannerSettings={bannerSettings}
        settings={storeSettings}
      />


      {/* =====================================================
          PAGE CONTENT
          ===================================================== */}

      <main className="store-main">

        {children}

      </main>


      {/* =====================================================
          FOOTER
          جميع البيانات والإعدادات من الأدمن
          ===================================================== */}

      <Footer
        storeSettings={storeSettings}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

    </div>
  );
}


export default StoreLayout;