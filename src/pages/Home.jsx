import React, {
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
} from "../firebase";

import "./Home.css";
import "../styles/store.css";

import Navbar from "../components/Navbar/Navbar";
import HeroSlider from "../components/HeroSlider";
import ProductsSlider from "../components/ProductsSlider";

import {
  CartContext,
} from "../context/CartContext";

import {
  getCategories,
} from "../services/categoryService";


// =====================================================
// DEFAULT STORE SETTINGS
// =====================================================

const defaultStoreSettings = {
  storeName:
    "Elsafty Store",

  phone:
    "",

  whatsapp:
    "",

  email:
    "",

  address:
    "",

  facebook:
    "",

  instagram:
    "",

  telegram:
    "",

  announcement:
    "",

  theme: {

    primary:
      "#071A36",

    secondary:
      "#0B1F3A",

    accent:
      "#D4AF37",

    pageBackground:
      "#F5F6F8",

    cardBackground:
      "#FFFFFF",

    textPrimary:
      "#071A36",

    textSecondary:
      "#64748B",

    border:
      "#EEEEEE",

    buttonBackground:
      "#D4AF37",

    buttonText:
      "#071A36",

    navbarBackground:
      "#071A36",

    navbarText:
      "#FFFFFF",

    categoryBarBackground:
      "#FFFFFF",

    categoryBarText:
      "#071A36",

    topStripBackground:
      "#071A36",

    topStripText:
      "#FFFFFF",

    footerBackground:
      "#071A36",

    footerText:
      "#FFFFFF",

  },

  bannerSettings: {

    heightDesktop:
      420,

    heightTablet:
      350,

    heightMobile:
      240,

    borderRadius:
      0,

    overlayOpacity:
      0.35,

  },

  topStrip: {

    enabled:
      true,

    direction:
      "rtl",

    speed:
      40,

    height:
      42,

    fontSize:
      15,

    items:
      [],

  },

  featuresBar: {

    enabled:
      true,

    background:
      "#FFFFFF",

    color:
      "#071A36",

    accentColor:
      "#D4AF37",

    height:
      80,

    fontSize:
      16,

    items:
      [],

  },
};


// =====================================================
// HOME
// =====================================================

function Home({
  products = [],
  admin,
  searchTerm = "",
  setSearchTerm,
  setCurrentView,
}) {

  const navigate =
    useNavigate();


  const productsRef =
    useRef(null);


  const {
    cart = [],
    addToCart,
  } =
    useContext(
      CartContext
    );


  // =====================================================
  // STATES
  // =====================================================

  const [
    categories,
    setCategories,
  ] = useState([]);


  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("الكل");


  const [
    sortBy,
    setSortBy,
  ] = useState("default");


  const [
    showOffersOnly,
    setShowOffersOnly,
  ] = useState(false);


  const [
    minPrice,
    setMinPrice,
  ] = useState("");


  const [
    maxPrice,
    setMaxPrice,
  ] = useState("");


  // =====================================================
  // STORE SETTINGS
  // =====================================================

  const [
    storeSettings,
    setStoreSettings,
  ] = useState(
    defaultStoreSettings
  );


  // =====================================================
  // LOAD STORE SETTINGS
  // =====================================================

  useEffect(() => {

    const settingsRef =
      doc(
        db,
        "settings",
        "store"
      );


    const unsubscribe =
      onSnapshot(

        settingsRef,

        (snapshot) => {

          if (
            !snapshot.exists()
          ) {

            return;

          }


          const data =
            snapshot.data();


          setStoreSettings(
            (previous) => ({

              ...previous,

              ...data,

              theme: {
                ...previous.theme,
                ...(data.theme || {}),
              },

              bannerSettings: {
                ...previous.bannerSettings,
                ...(data.bannerSettings || {}),
              },

              topStrip: {
                ...previous.topStrip,
                ...(data.topStrip || {}),
              },

              featuresBar: {
                ...previous.featuresBar,
                ...(data.featuresBar || {}),
              },

            })
          );

        },

        (error) => {

          console.error(
            "Store Settings Error:",
            error
          );

        }

      );


    return () => {

      unsubscribe();

    };

  }, []);


  // =====================================================
  // THEME
  // =====================================================

  const theme =
    storeSettings.theme ||
    defaultStoreSettings.theme;


  // =====================================================
  // CART COUNT
  // =====================================================

  const cartCount =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item?.quantity || 0
        ),
      0
    );


  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  useEffect(() => {

    let mounted =
      true;


    const loadCategories =
      async () => {

        try {

          const data =
            await getCategories();


          if (!mounted) {

            return;

          }


          const activeCategories =
            (data || []).filter(
              (category) =>
                category?.active === true
            );


          setCategories(
            activeCategories
          );

        } catch (error) {

          console.error(
            "خطأ في تحميل الأقسام:",
            error
          );


          if (mounted) {

            setCategories([]);

          }

        }

      };


    loadCategories();


    return () => {

      mounted = false;

    };

  }, []);


  // =====================================================
  // CATEGORY EVENT FROM NAVBAR
  // =====================================================

  useEffect(() => {

    const filterListener =
      (event) => {

        const category =
          event?.detail ||
          "الكل";


        if (
          category ===
          "الكل"
        ) {

          setSelectedCategory(
            "الكل"
          );


          setTimeout(
            () => {

              productsRef
                .current
                ?.scrollIntoView({
                  behavior:
                    "smooth",

                  block:
                    "start",
                });

            },
            100
          );


          return;

        }


        navigate(
          `/category/${encodeURIComponent(
            category
          )}`
        );

      };


    window.addEventListener(
      "filterCategory",
      filterListener
    );


    return () => {

      window.removeEventListener(
        "filterCategory",
        filterListener
      );

    };

  }, [
    navigate,
  ]);


  // =====================================================
  // SCROLL TO SECTION
  // =====================================================

  const scrollToSection =
    (selector) => {

      const element =
        document.querySelector(
          selector
        );


      if (!element) {

        return;

      }


      element.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start",
      });

    };


  // =====================================================
  // CATEGORY CLICK
  // =====================================================

  const handleCategoryClick =
    (category) => {

      if (
        category ===
        "الكل"
      ) {

        setSelectedCategory(
          "الكل"
        );


        setTimeout(
          () => {

            productsRef
              .current
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start",
              });

          },
          100
        );


        return;

      }


      navigate(
        `/category/${encodeURIComponent(
          category
        )}`
      );

    };


  // =====================================================
  // OPEN CATEGORY
  // =====================================================

  const openCategory =
    (categoryName) => {

      if (!categoryName) {

        return;

      }


      navigate(
        `/category/${encodeURIComponent(
          categoryName
        )}`
      );

    };


  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = [
    ...(products || []),
  ]

    .filter(
      (product) => {

        const title =
          String(
            product?.title ||
            product?.name ||
            product?.productName ||
            ""
          ).toLowerCase();


        const description =
          String(
            product?.description ||
            ""
          ).toLowerCase();


        const category =
          String(
            product?.category ||
            ""
          ).toLowerCase();


        const searchText =
          String(
            searchTerm || ""
          )
            .toLowerCase()
            .trim();


        // SEARCH

        const matchSearch =
          searchText ===
            "" ||
          title.includes(
            searchText
          ) ||
          description.includes(
            searchText
          ) ||
          category.includes(
            searchText
          );


        // CATEGORY

        const matchCategory =
          selectedCategory ===
            "الكل" ||
          String(
            product?.category ||
            ""
          ).trim() ===
            String(
              selectedCategory ||
              ""
            ).trim();


        if (
          !matchSearch ||
          !matchCategory
        ) {

          return false;

        }


        // OFFERS

        if (
          showOffersOnly &&
          product?.offer !== true
        ) {

          return false;

        }


        // MIN PRICE

        if (
          minPrice !== "" &&
          Number(
            product?.price || 0
          ) <
            Number(
              minPrice
            )
        ) {

          return false;

        }


        // MAX PRICE

        if (
          maxPrice !== "" &&
          Number(
            product?.price || 0
          ) >
            Number(
              maxPrice
            )
        ) {

          return false;

        }


        return true;

      }
    )

    .sort(
      (a, b) => {

        switch (sortBy) {

          case "low":

            return (
              Number(
                a?.price || 0
              ) -
              Number(
                b?.price || 0
              )
            );


          case "high":

            return (
              Number(
                b?.price || 0
              ) -
              Number(
                a?.price || 0
              )
            );


          case "rating":

            return (
              Number(
                b?.rating || 0
              ) -
              Number(
                a?.rating || 0
              )
            );


          case "new":

            return (
              Number(
                Boolean(
                  b?.newArrival
                )
              ) -
              Number(
                Boolean(
                  a?.newArrival
                )
              )
            );


          case "best":

            return (
              Number(
                Boolean(
                  b?.bestSeller
                )
              ) -
              Number(
                Boolean(
                  a?.bestSeller
                )
              )
            );


          default:

            return 0;

        }

      }
    );


  // =====================================================
  // SPECIAL PRODUCTS
  // =====================================================

  const offers =
    (products || []).filter(
      (product) =>
        product?.offer === true
    );


  const bestSellers =
    (products || []).filter(
      (product) =>
        product?.bestSeller === true
    );


  const newArrivals =
    (products || []).filter(
      (product) =>
        product?.newArrival === true
    );


  const recommended =
    (products || []).filter(
      (product) =>
        product?.recommended === true
    );


  // =====================================================
  // CATEGORY PRODUCTS
  // =====================================================

  const getCategoryProducts =
    (categoryName) => {

      const normalizedCategory =
        String(
          categoryName || ""
        )
          .trim()
          .toLowerCase();


      return (
        products || []
      ).filter(
        (product) =>
          String(
            product?.category ||
            ""
          )
            .trim()
            .toLowerCase() ===
          normalizedCategory
      );

    };


  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters =
    () => {

      setSelectedCategory(
        "الكل"
      );


      if (
        typeof setSearchTerm ===
        "function"
      ) {

        setSearchTerm("");

      }


      setSortBy(
        "default"
      );

      setShowOffersOnly(
        false
      );

      setMinPrice(
        ""
      );

      setMaxPrice(
        "");

    };


  // =====================================================
  // PRODUCT RATING
  // =====================================================

  const renderRating =
    (rating) => {

      const value =
        Math.min(
          5,
          Math.max(
            0,
            Math.round(
              Number(
                rating || 0
              )
            )
          )
        );


      return (
        <>
          {"★".repeat(
            value
          )}

          {"☆".repeat(
            5 - value
          )}
        </>
      );

    };


  // =====================================================
  // OPEN PRODUCT
  // =====================================================

  const openProduct =
    (id) => {

      if (!id) {

        return;

      }


      navigate(
        `/product/${id}`
      );

    };


  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart =
    (
      event,
      product
    ) => {

      event.stopPropagation();


      if (
        typeof addToCart !==
        "function"
      ) {

        return;

      }


      addToCart({
        ...product,
        quantity: 1,
      });

    };


  // =====================================================
  // DYNAMIC GLOBAL CSS VARIABLES
  // =====================================================

  const homeStyle = {

    // ================================================
    // THEME
    // ================================================

    "--store-primary":
      theme.primary ||
      "#071A36",

    "--store-secondary":
      theme.secondary ||
      "#0B1F3A",

    "--store-accent":
      theme.accent ||
      "#D4AF37",

    "--store-page-background":
      theme.pageBackground ||
      "#F5F6F8",

    "--store-card-background":
      theme.cardBackground ||
      "#FFFFFF",

    "--store-text-primary":
      theme.textPrimary ||
      "#071A36",

    "--store-text-secondary":
      theme.textSecondary ||
      "#64748B",

    "--store-border":
      theme.border ||
      "#EEEEEE",

    "--store-button-background":
      theme.buttonBackground ||
      "#D4AF37",

    "--store-button-text":
      theme.buttonText ||
      "#071A36",

    "--store-navbar-background":
      theme.navbarBackground ||
      "#071A36",

    "--store-navbar-text":
      theme.navbarText ||
      "#FFFFFF",

    "--store-category-background":
      theme.categoryBarBackground ||
      "#FFFFFF",

    "--store-category-text":
      theme.categoryBarText ||
      "#071A36",

    "--store-top-strip-background":
      theme.topStripBackground ||
      "#071A36",

    "--store-top-strip-text":
      theme.topStripText ||
      "#FFFFFF",

    "--store-footer-background":
      theme.footerBackground ||
      "#071A36",

    "--store-footer-text":
      theme.footerText ||
      "#FFFFFF",

    // Extra useful colors

    "--store-accent-dark":
      "#B8921F",

    "--store-accent-light":
      "#F4D06F",

    "--store-button-text-dark":
      "#071A36",

    "--store-soft-background":
      "#FAFAFA",

    "--store-feature-icon-background":
      "#F8F4E5",

    "--store-category-image-background":
      "#FAFAFA",

    "--store-rating-color":
      "#F2A900",

    "--store-footer-text-muted":
      "#CBD5E1",

    "--store-footer-link":
      "#E5E7EB",

    "--store-footer-bottom-text":
      "#AEB8C7",

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      className="home-page store-container"
      style={homeStyle}
    >

      {/* =================================================
          NAVBAR
      ================================================= */}

      <Navbar
        setCurrentView={
          setCurrentView
        }

        cartCount={
          cartCount
        }

        searchTerm={
          searchTerm
        }

        setSearchTerm={
          setSearchTerm
        }

        admin={
          admin
        }

        products={
          products
        }

        setSelectedCategory={
          setSelectedCategory
        }
      />


      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="hero-section"
      >

        <HeroSlider />

      </section>


      {/* =================================================
          CATEGORIES
      ================================================= */}

      <section
        className="categories-section categories"
      >

        <div className="section-header">

          <h2>
            الأقسام
          </h2>

          <button
            type="button"
            onClick={() =>
              handleCategoryClick(
                "الكل"
              )
            }
          >

            عرض الكل

          </button>

        </div>


        <div className="categories-grid">

          {/* ALL PRODUCTS */}

          <button
            type="button"
            className="category-card"
            onClick={() =>
              handleCategoryClick(
                "الكل"
              )
            }
          >

            <div className="category-image-wrap">

              <span className="category-icon">
                📦
              </span>

            </div>


            <strong>
              كل المنتجات
            </strong>


            <small>
              عرض كل المنتجات
            </small>

          </button>


          {/* CATEGORIES */}

          {categories.map(
            (category) => (

              <button
                type="button"
                key={
                  category?.id ||
                  category?.name
                }
                className="category-card"
                onClick={() =>
                  handleCategoryClick(
                    category?.name
                  )
                }
              >

                <div className="category-image-wrap">

                  {category?.image ? (

                    <img
                      src={
                        category.image
                      }
                      alt={
                        category?.name ||
                        "قسم"
                      }
                      className="category-cover"
                      loading="lazy"
                    />

                  ) : (

                    <span className="category-icon">
                      {
                        category?.icon ||
                        "📦"
                      }
                    </span>

                  )}

                </div>


                <strong>
                  {
                    category?.name
                  }
                </strong>


                <small>
                  تصفح المنتجات
                </small>

              </button>

            )
          )}

        </div>

      </section>


      {/* =================================================
          OFFER BANNER
      ================================================= */}

      <section
        className="offer-banner"
      >

        <div
          className="offer-banner-content"
        >

          <span
            className="offer-banner-icon"
          >
            🔥
          </span>


          <div>

            <h2>
              خصومات تصل إلى 50%
            </h2>

            <p>
              لفترة محدودة على منتجات مختارة
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              scrollToSection(
                ".products-section"
              )
            }
          >
            تسوق الآن
          </button>

        </div>

      </section>


      {/* =================================================
          OFFERS
      ================================================= */}

      {offers.length > 0 && (

        <ProductsSlider
          title="🔥 عروض اليوم"
          badge="🔥 خصم"
          badgeClass="offer"
          products={
            offers
          }
          addToCart={
            addToCart
          }
          onTitleClick={() =>
            scrollToSection(
              ".products-section"
            )
          }
        />

      )}


      {/* =================================================
          BEST SELLERS
      ================================================= */}

      {bestSellers.length > 0 && (

        <ProductsSlider
          title="⭐ الأكثر مبيعًا"
          badge="⭐ الأكثر طلبًا"
          badgeClass="best"
          products={
            bestSellers
          }
          addToCart={
            addToCart
          }
          onTitleClick={() =>
            scrollToSection(
              ".products-section"
            )
          }
        />

      )}


      {/* =================================================
          NEW ARRIVALS
      ================================================= */}

      {newArrivals.length > 0 && (

        <ProductsSlider
          title="🆕 وصل حديثًا"
          badge="🆕 جديد"
          badgeClass="new"
          products={
            newArrivals
          }
          addToCart={
            addToCart
          }
          onTitleClick={() =>
            scrollToSection(
              ".products-section"
            )
          }
        />

      )}


      {/* =================================================
          RECOMMENDED
      ================================================= */}

      {recommended.length > 0 && (

        <ProductsSlider
          title="❤️ قد يعجبك"
          badge="❤️ مميز"
          badgeClass="recommended"
          products={
            recommended
          }
          addToCart={
            addToCart
          }
          onTitleClick={() =>
            scrollToSection(
              ".products-section"
            )
          }
        />

      )}


      {/* =================================================
          CATEGORY PRODUCT ROWS
      ================================================= */}

      <section
        className="home-categories-products"
      >

        {categories.map(
          (category) => {

            const categoryProducts =
              getCategoryProducts(
                category?.name
              );


            if (
              !categoryProducts.length
            ) {

              return null;

            }


            return (

              <section
                className="category-products-section"
                key={
                  category?.id ||
                  category?.name
                }
              >

                {/* CATEGORY HEADER */}

                <div
                  className="category-products-header"
                >

                  <button
                    type="button"
                    className="category-section-title"
                    onClick={() =>
                      openCategory(
                        category?.name
                      )
                    }
                  >

                    {category?.image ? (

                      <img
                        src={
                          category.image
                        }
                        alt={
                          category?.name ||
                          "قسم"
                        }
                        loading="lazy"
                      />

                    ) : (

                      <span>
                        {
                          category?.icon ||
                          "📦"
                        }
                      </span>

                    )}


                    <strong>
                      {
                        category?.name
                      }
                    </strong>

                  </button>


                  <button
                    type="button"
                    className="category-view-all"
                    onClick={() =>
                      openCategory(
                        category?.name
                      )
                    }
                  >

                    عرض الكل ❯

                  </button>

                </div>


                {/* PRODUCTS */}

                <ProductsSlider
                  title=""
                  badge=""
                  products={
                    categoryProducts
                  }
                  addToCart={
                    addToCart
                  }
                  hideHeader={
                    true
                  }
                />

              </section>

            );

          }
        )}

      </section>


      {/* =================================================
          ALL PRODUCTS
      ================================================= */}

      <section
        className="products-section"
        ref={
          productsRef
        }
      >

        {/* SECTION HEADER */}

        <div
          className="section-header"
        >

          <div>

            <h2>
              📦 جميع المنتجات
            </h2>


            {selectedCategory !==
              "الكل" && (

              <p
                className="selected-category"
              >

                القسم:{" "}

                <strong>
                  {
                    selectedCategory
                  }
                </strong>

              </p>

            )}

          </div>


          <span
            className="products-count"
          >

            {
              filteredProducts.length
            }{" "}
            منتج

          </span>

        </div>


        {/* FILTERS */}

        <div
          className="products-filters"
        >

          <select
            value={
              sortBy
            }
            onChange={(event) =>
              setSortBy(
                event.target.value
              )
            }
            aria-label="ترتيب المنتجات"
          >

            <option value="default">
              ترتيب افتراضي
            </option>

            <option value="low">
              💰 الأقل سعرًا
            </option>

            <option value="high">
              💰 الأعلى سعرًا
            </option>

            <option value="rating">
              ⭐ الأعلى تقييمًا
            </option>

            <option value="new">
              🆕 الأحدث
            </option>

            <option value="best">
              🔥 الأكثر مبيعًا
            </option>

          </select>


          <input
            type="number"
            min="0"
            placeholder="من سعر"
            value={
              minPrice
            }
            onChange={(event) =>
              setMinPrice(
                event.target.value
              )
            }
            aria-label="أقل سعر"
          />


          <input
            type="number"
            min="0"
            placeholder="إلى سعر"
            value={
              maxPrice
            }
            onChange={(event) =>
              setMaxPrice(
                event.target.value
              )
            }
            aria-label="أعلى سعر"
          />


          <label
            className="offers-filter"
          >

            <input
              type="checkbox"
              checked={
                showOffersOnly
              }
              onChange={(event) =>
                setShowOffersOnly(
                  event.target.checked
                )
              }
            />


            <span>
              🔥 العروض فقط
            </span>

          </label>

        </div>


        {/* PRODUCTS GRID */}

        {filteredProducts.length >
        0 ? (

          <div
            className="products-grid"
          >

            {filteredProducts.map(
              (product) => {

                const id =
                  product?.id ||
                  product?._id;


                const image =
                  product?.image ||
                  product?.images?.[0] ||
                  "/default-product.png";


                const title =
                  product?.title ||
                  product?.name ||
                  product?.productName ||
                  "منتج";


                const price =
                  Number(
                    product?.price || 0
                  );


                const oldPrice =
                  Number(
                    product?.oldPrice || 0
                  );


                const discount =
                  oldPrice >
                    price &&
                  oldPrice >
                    0

                    ? Math.round(
                        (
                          (
                            oldPrice -
                            price
                          ) /
                          oldPrice
                        ) *
                        100
                      )

                    : 0;


                return (

                  <article
                    className="product-card"
                    key={id}
                    onClick={() =>
                      openProduct(
                        id
                      )
                    }
                  >

                    {/* IMAGE */}

                    <div
                      className="product-card-image"
                    >

                      {discount >
                        0 && (

                        <span
                          className="discount-badge"
                        >
                          -{discount}%
                        </span>

                      )}


                      {product?.newArrival && (

                        <span
                          className="new-badge"
                        >
                          جديد
                        </span>

                      )}


                      {product?.bestSeller && (

                        <span
                          className="product-badge"
                        >
                          ⭐
                        </span>

                      )}


                      <img
                        src={image}
                        alt={title}
                        loading="lazy"
                      />

                    </div>


                    {/* INFO */}

                    <div
                      className="product-card-info"
                    >

                      <h3>
                        {
                          title
                        }
                      </h3>


                      {/* RATING */}

                      <div
                        className="product-rating"
                      >

                        {
                          renderRating(
                            product?.rating
                          )
                        }


                        {Number(
                          product?.rating ||
                          0
                        ) > 0 && (

                          <span
                            className="rating-number"
                          >

                            {" "}

                            {Number(
                              product?.rating
                            ).toFixed(1)}

                          </span>

                        )}

                      </div>


                      {/* PRICE */}

                      <div
                        className="product-price"
                      >

                        <strong>
                          {price} ج.م
                        </strong>


                        {oldPrice >
                          price && (

                          <del>
                            {
                              oldPrice
                            }{" "}
                            ج.م
                          </del>

                        )}

                      </div>


                      {/* ACTIONS */}

                      <div
                        className="product-actions"
                      >

                        <button
                          type="button"
                          className="details-btn"
                          onClick={(
                            event
                          ) => {

                            event.stopPropagation();

                            openProduct(
                              id
                            );

                          }}
                        >

                          التفاصيل

                        </button>


                        <button
                          type="button"
                          className="add-to-cart-btn"
                          onClick={(
                            event
                          ) =>
                            handleAddToCart(
                              event,
                              product
                            )
                          }
                        >

                          🛒 أضف للسلة

                        </button>

                      </div>

                    </div>

                  </article>

                );

              }
            )}

          </div>

        ) : (

          /* NO PRODUCTS */

          <div
            className="no-products"
          >

            <div
              className="no-products-icon"
            >
              📦
            </div>


            <h3>
              لا توجد منتجات
            </h3>


            <p>
              جرب تغيير البحث أو الفلاتر
            </p>


            <button
              type="button"
              onClick={
                resetFilters
              }
            >
              إعادة ضبط الفلاتر
            </button>

          </div>

        )}

      </section>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer
        className="store-footer"
        style={{
          background:
            theme.footerBackground ||
            "#071A36",

          color:
            theme.footerText ||
            "#FFFFFF",
        }}
      >

        <div
          className="footer-container"
        >

          {/* ABOUT */}

          <div
            className="footer-column"
          >

            <h2>
              {
                storeSettings.storeName ||
                "Elsafty Store"
              }
            </h2>


            <p>
              متجر إلكتروني يوفر أفضل المنتجات
              بأفضل الأسعار مع خدمة عملاء متميزة.
            </p>


            {storeSettings.address && (

              <p>
                📍{" "}
                {
                  storeSettings.address
                }
              </p>

            )}


            {storeSettings.phone && (

              <p>
                📞{" "}
                {
                  storeSettings.phone
                }
              </p>

            )}


            {storeSettings.email && (

              <p>
                ✉️{" "}
                {
                  storeSettings.email
                }
              </p>

            )}

          </div>


          {/* QUICK LINKS */}

          <div
            className="footer-column"
          >

            <h3>
              روابط سريعة
            </h3>


            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate("/")
              }
            >
              🏠 الرئيسية
            </button>


            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate(
                  "/cart"
                )
              }
            >
              🛒 السلة
            </button>


            <button
              type="button"
              className="footer-link"
              onClick={() =>
                scrollToSection(
                  ".products-section"
                )
              }
            >
              📦 جميع المنتجات
            </button>


            <button
              type="button"
              className="footer-link"
              onClick={() =>
                scrollToSection(
                  ".offer-banner"
                )
              }
            >
              🔥 العروض
            </button>

          </div>


          {/* CUSTOMER SERVICE */}

          <div
            className="footer-column"
          >

            <h3>
              خدمة العملاء
            </h3>


            <p>
              🚚 شحن لجميع المحافظات
            </p>


            <p>
              🔒 دفع آمن
            </p>


            <p>
              ⭐ ضمان جودة المنتجات
            </p>


            {storeSettings.whatsapp && (

              <p>
                💬 واتساب:{" "}
                {
                  storeSettings.whatsapp
                }
              </p>

            )}

          </div>


          {/* SOCIAL */}

          <div
            className="footer-column"
          >

            <h3>
              تابعنا
            </h3>


            <div
              className="footer-social"
            >

              {storeSettings.facebook && (

                <button
                  type="button"
                  aria-label="Facebook"
                  onClick={() =>
                    window.open(
                      storeSettings.facebook,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  📘
                </button>

              )}


              {storeSettings.instagram && (

                <button
                  type="button"
                  aria-label="Instagram"
                  onClick={() =>
                    window.open(
                      storeSettings.instagram,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  📷
                </button>

              )}


              {storeSettings.telegram && (

                <button
                  type="button"
                  aria-label="Telegram"
                  onClick={() =>
                    window.open(
                      storeSettings.telegram,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  ✈️
                </button>

              )}


              {!storeSettings.facebook &&
                !storeSettings.instagram &&
                !storeSettings.telegram && (

                <span
                  style={{
                    opacity:
                      0.7,

                    fontSize:
                      "12px",
                  }}
                >
                  أضف روابط التواصل من لوحة الأدمن
                </span>

              )}

            </div>

          </div>

        </div>


        {/* FOOTER BOTTOM */}

        <div
          className="footer-bottom"
        >

          ©{" "}

          {
            new Date().getFullYear()
          }{" "}

          {
            storeSettings.storeName ||
            "Elsafty Store"
          }

          {" - "}

          جميع الحقوق محفوظة.

        </div>

      </footer>

    </div>

  );

}


export default Home;