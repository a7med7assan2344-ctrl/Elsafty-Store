import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase";

import "./Home.css";
import "../styles/store.css";

import Navbar from "../components/Navbar/Navbar";
import HeroSlider from "../components/HeroSlider";
import ProductsSlider from "../components/ProductsSlider";

import { CartContext } from "../context/CartContext";

import { getCategories } from "../services/categoryService";

// =====================================================
// DEFAULT STORE SETTINGS
// =====================================================

const defaultStoreSettings = {
  storeName: "Elsafty Store",

  phone: "",
  whatsapp: "",
  email: "",
  address: "",

  facebook: "",
  instagram: "",
  telegram: "",

  announcement: "",

  theme: {
    primary: "#F68B1E",
    secondary: "#E97B10",
    accent: "#F68B1E",

    pageBackground: "#F5F5F5",
    cardBackground: "#FFFFFF",

    textPrimary: "#313133",
    textSecondary: "#75757A",

    border: "#E5E5E5",

    buttonBackground: "#F68B1E",
    buttonText: "#FFFFFF",

    navbarBackground: "#FFFFFF",
    navbarText: "#313133",

    categoryBarBackground: "#FFFFFF",
    categoryBarText: "#313133",

    topStripBackground: "#F68B1E",
    topStripText: "#FFFFFF",

    footerBackground: "#313133",
    footerText: "#FFFFFF",
  },

  bannerSettings: {
    heightDesktop: 420,
    heightTablet: 350,
    heightMobile: 240,

    borderRadius: 0,
    overlayOpacity: 0.35,
  },

  topStrip: {
    enabled: true,
    direction: "rtl",
    speed: 40,
    height: 42,
    fontSize: 15,
    items: [],
  },

  featuresBar: {
    enabled: true,
    background: "#FFFFFF",
    color: "#313133",
    accentColor: "#F68B1E",
    height: 80,
    fontSize: 16,
    items: [],
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
  const navigate = useNavigate();

  const productsRef = useRef(null);

  const {
    cart = [],
    addToCart,
  } = useContext(CartContext);

  // ===================================================
  // STATES
  // ===================================================

  const [categories, setCategories] = useState([]);

  const [selectedCategory, setSelectedCategory] =
    useState("الكل");

  const [sortBy, setSortBy] =
    useState("default");

  const [showOffersOnly, setShowOffersOnly] =
    useState(false);

  const [minPrice, setMinPrice] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  const [storeSettings, setStoreSettings] =
    useState(defaultStoreSettings);

  // ===================================================
  // LOAD STORE SETTINGS
  // ===================================================

  useEffect(() => {
    const settingsRef = doc(
      db,
      "settings",
      "store"
    );

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        const data = snapshot.data();

        setStoreSettings((previous) => ({
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
        }));
      },
      (error) => {
        console.error(
          "Store Settings Error:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ===================================================
  // LOAD CATEGORIES
  // ===================================================

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const data = await getCategories();

        if (!mounted) {
          return;
        }

        const activeCategories = (data || [])
          .filter(
            (category) =>
              category?.active === true
          )
          .sort(
            (a, b) =>
              Number(a?.sortOrder ?? 0) -
              Number(b?.sortOrder ?? 0)
          );

        setCategories(activeCategories);
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

  // ===================================================
  // THEME
  // ===================================================

  const theme =
    storeSettings.theme ||
    defaultStoreSettings.theme;

  // ===================================================
  // CART COUNT
  // ===================================================

  const cartCount = cart.reduce(
    (total, item) =>
      total +
      Number(item?.quantity || 0),
    0
  );

  // ===================================================
  // ROOT CATEGORIES
  // ===================================================

  const rootCategories = useMemo(() => {
    return categories
      .filter(
        (category) =>
          !category?.parentId ||
          category.parentId === null ||
          category.parentId === ""
      )
      .slice()
      .sort(
        (a, b) =>
          Number(a?.sortOrder ?? 0) -
          Number(b?.sortOrder ?? 0)
      );
  }, [categories]);

  // ===================================================
  // CHILD CATEGORIES
  // ===================================================

  const getChildCategories = (parentId) => {
    if (!parentId) {
      return [];
    }

    return categories
      .filter(
        (category) =>
          String(category?.parentId || "") ===
          String(parentId)
      )
      .slice()
      .sort(
        (a, b) =>
          Number(a?.sortOrder ?? 0) -
          Number(b?.sortOrder ?? 0)
      );
  };

  // ===================================================
  // CATEGORY PRODUCTS
  // ===================================================

  const getCategoryProducts = (category) => {
    if (!category) {
      return [];
    }

    const categoryId =
      String(category?.id || "");

    const categoryName =
      String(category?.name || "")
        .trim()
        .toLowerCase();

    return (products || []).filter(
      (product) => {
        const productCategoryId =
          String(
            product?.categoryId || ""
          );

        const productCategory =
          String(
            product?.category || ""
          )
            .trim()
            .toLowerCase();

        return (
          (
            categoryId &&
            productCategoryId ===
              categoryId
          ) ||
          (
            categoryName &&
            productCategory ===
              categoryName
          )
        );
      }
    );
  };

  // ===================================================
  // OPEN CATEGORY
  // ===================================================

  const openCategory = (category) => {
    if (!category) {
      return;
    }

    const categoryId =
      category?.id;

    const categoryName =
      category?.name;

    if (categoryId) {
      navigate(
        `/category/${encodeURIComponent(
          categoryId
        )}`
      );

      return;
    }

    if (categoryName) {
      navigate(
        `/category/${encodeURIComponent(
          categoryName
        )}`
      );
    }
  };

  // ===================================================
  // NAVBAR CATEGORY EVENT
  // ===================================================

  useEffect(() => {
    const filterListener = (event) => {
      const category =
        event?.detail || "الكل";

      if (category === "الكل") {
        setSelectedCategory("الكل");
        return;
      }

      const foundCategory =
        categories.find(
          (item) =>
            item?.name === category ||
            item?.id === category
        );

      if (foundCategory) {
        openCategory(foundCategory);
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
    categories,
    navigate,
  ]);

  // ===================================================
  // SCROLL
  // ===================================================

  const scrollToSection = (selector) => {
    const element =
      document.querySelector(selector);

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ===================================================
  // SPECIAL PRODUCTS
  // ===================================================

  const offers = useMemo(
    () =>
      (products || []).filter(
        (product) =>
          product?.offer === true
      ),
    [products]
  );

  const bestSellers = useMemo(
    () =>
      (products || []).filter(
        (product) =>
          product?.bestSeller === true
      ),
    [products]
  );

  const newArrivals = useMemo(
    () =>
      (products || []).filter(
        (product) =>
          product?.newArrival === true
      ),
    [products]
  );

  const recommended = useMemo(
    () =>
      (products || []).filter(
        (product) =>
          product?.recommended === true
      ),
    [products]
  );

  // ===================================================
  // FILTER PRODUCTS
  // ===================================================

  const filteredProducts = useMemo(() => {
    return [...(products || [])]
      .filter((product) => {
        const title = String(
          product?.title ||
          product?.name ||
          product?.productName ||
          ""
        ).toLowerCase();

        const description = String(
          product?.description || ""
        ).toLowerCase();

        const category = String(
          product?.category || ""
        ).toLowerCase();

        const searchText = String(
          searchTerm || ""
        )
          .toLowerCase()
          .trim();

        const matchSearch =
          searchText === "" ||
          title.includes(searchText) ||
          description.includes(searchText) ||
          category.includes(searchText);

        const matchCategory =
          selectedCategory === "الكل" ||
          String(
            product?.category || ""
          )
            .trim() ===
            String(
              selectedCategory || ""
            ).trim();

        if (
          !matchSearch ||
          !matchCategory
        ) {
          return false;
        }

        if (
          showOffersOnly &&
          product?.offer !== true
        ) {
          return false;
        }

        if (
          minPrice !== "" &&
          Number(product?.price || 0) <
            Number(minPrice)
        ) {
          return false;
        }

        if (
          maxPrice !== "" &&
          Number(product?.price || 0) >
            Number(maxPrice)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "low":
            return (
              Number(a?.price || 0) -
              Number(b?.price || 0)
            );

          case "high":
            return (
              Number(b?.price || 0) -
              Number(a?.price || 0)
            );

          case "rating":
            return (
              Number(b?.rating || 0) -
              Number(a?.rating || 0)
            );

          case "new":
            return (
              Number(Boolean(b?.newArrival)) -
              Number(Boolean(a?.newArrival))
            );

          case "best":
            return (
              Number(Boolean(b?.bestSeller)) -
              Number(Boolean(a?.bestSeller))
            );

          default:
            return 0;
        }
      });
  }, [
    products,
    searchTerm,
    selectedCategory,
    showOffersOnly,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // ===================================================
  // RESET FILTERS
  // ===================================================

  const resetFilters = () => {
    setSelectedCategory("الكل");

    if (
      typeof setSearchTerm ===
      "function"
    ) {
      setSearchTerm("");
    }

    setSortBy("default");
    setShowOffersOnly(false);
    setMinPrice("");
    setMaxPrice("");
  };

  // ===================================================
  // OPEN PRODUCT
  // ===================================================

  const openProduct = (id) => {
    if (!id) {
      return;
    }

    navigate(`/product/${id}`);
  };

  // ===================================================
  // ADD TO CART
  // ===================================================

  const handleAddToCart = (
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

  // ===================================================
  // CATEGORY CARD STYLE
  // ===================================================

  const getCategoryCardStyle = (
    category
  ) => {
    const color =
      category?.color ||
      "#F68B1E";

    return {
      "--category-color": color,
      "--category-color-light":
        `${color}18`,
      "--category-color-medium":
        `${color}30`,
    };
  };

  // ===================================================
  // DYNAMIC CSS
  // ===================================================

  const homeStyle = {
    "--store-primary":
      theme.primary ||
      "#F68B1E",

    "--store-secondary":
      theme.secondary ||
      "#E97B10",

    "--store-accent":
      theme.accent ||
      "#F68B1E",

    "--store-page-background":
      theme.pageBackground ||
      "#F5F5F5",

    "--store-card-background":
      theme.cardBackground ||
      "#FFFFFF",

    "--store-text-primary":
      theme.textPrimary ||
      "#313133",

    "--store-text-secondary":
      theme.textSecondary ||
      "#75757A",

    "--store-border":
      theme.border ||
      "#E5E5E5",

    "--store-button-background":
      theme.buttonBackground ||
      "#F68B1E",

    "--store-button-text":
      theme.buttonText ||
      "#FFFFFF",

    "--store-navbar-background":
      theme.navbarBackground ||
      "#FFFFFF",

    "--store-navbar-text":
      theme.navbarText ||
      "#313133",

    "--store-category-background":
      theme.categoryBarBackground ||
      "#FFFFFF",

    "--store-category-text":
      theme.categoryBarText ||
      "#313133",

    "--store-top-strip-background":
      theme.topStripBackground ||
      "#F68B1E",

    "--store-top-strip-text":
      theme.topStripText ||
      "#FFFFFF",

    "--store-footer-background":
      theme.footerBackground ||
      "#313133",

    "--store-footer-text":
      theme.footerText ||
      "#FFFFFF",
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      className="home-page jumia-home"
      style={homeStyle}
      dir="rtl"
    >

      {/* =================================================
          NAVBAR
      ================================================= */}

      <Navbar
        setCurrentView={setCurrentView}
        cartCount={cartCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        admin={admin}
        products={products}
        setSelectedCategory={
          setSelectedCategory
        }
      />

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="jumia-main">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="jumia-hero">
          <HeroSlider />
        </section>

        {/* =================================================
            QUICK CATEGORIES
        ================================================= */}

        <section
          className="jumia-section quick-shop-section"
        >

          <div className="jumia-section-title">

            <h2>
              كل اللي هتحتاجه في مكان واحد
            </h2>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  ".jumia-all-categories"
                )
              }
            >
              عرض الكل
            </button>

          </div>

          <div className="jumia-categories">

            {rootCategories.length > 0 ? (
              rootCategories
                .slice(0, 8)
                .map((category) => {

                  const children =
                    getChildCategories(
                      category?.id
                    );

                  const categoryProducts =
                    getCategoryProducts(
                      category
                    );

                  return (
                    <button
                      type="button"
                      key={
                        category?.id ||
                        category?.name
                      }
                      className="store-choice-card"
                      style={getCategoryCardStyle(
                        category
                      )}
                      onClick={() =>
                        openCategory(
                          category
                        )
                      }
                    >

                      <div className="store-choice-image">

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

                      </div>

                      <strong>
                        {
                          category?.name ||
                          "قسم"
                        }
                      </strong>

                      <small>
                        {children.length > 0
                          ? `${children.length} قسم فرعي`
                          : categoryProducts.length >
                              0
                            ? `${categoryProducts.length} منتج`
                            : "تصفح الآن"}
                      </small>

                    </button>
                  );
                })
            ) : (
              <div className="store-empty-choice">

                <div>📂</div>

                <h3>
                  لا توجد أقسام حاليًا
                </h3>

                <p>
                  أضف الأقسام من لوحة الأدمن
                </p>

              </div>
            )}

          </div>

        </section>

        {/* =================================================
            TODAY OFFERS
        ================================================= */}

        {offers.length > 0 && (
          <section
            className="jumia-section"
            id="today-offers"
          >

            <ProductsSlider
              title="عروض اليوم"
              badge="خصم"
              badgeClass="offer"
              products={offers}
              addToCart={addToCart}
              onTitleClick={() =>
                scrollToSection(
                  "#today-offers"
                )
              }
            />

          </section>
        )}

        {/* =================================================
            BEST SELLERS
        ================================================= */}

        {bestSellers.length > 0 && (
          <section
            className="jumia-section"
            id="best-sellers"
          >

            <ProductsSlider
              title="المنتجات الأفضل مبيعاً"
              badge="الأكثر مبيعاً"
              badgeClass="best"
              products={bestSellers}
              addToCart={addToCart}
              onTitleClick={() =>
                scrollToSection(
                  "#best-sellers"
                )
              }
            />

          </section>
        )}

        {/* =================================================
            COUPONS
        ================================================= */}

        <section className="jumia-promo-strip">

          <div className="promo-content">

            <span className="promo-icon">
              🏷️
            </span>

            <div>
              <h2>
                ألحق أكواد الخصم!
              </h2>

              <p>
                وفر أكتر مع العروض والكوبونات
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "#today-offers"
              )
            }
          >
            تسوق الآن
          </button>

        </section>

        {/* =================================================
            NEW ARRIVALS
        ================================================= */}

        {newArrivals.length > 0 && (
          <section
            className="jumia-section"
            id="new-arrivals"
          >

            <ProductsSlider
              title="وصل حديثاً"
              badge="جديد"
              badgeClass="new"
              products={newArrivals}
              addToCart={addToCart}
              onTitleClick={() =>
                scrollToSection(
                  "#new-arrivals"
                )
              }
            />

          </section>
        )}

        {/* =================================================
            RECOMMENDED
        ================================================= */}

        {recommended.length > 0 && (
          <section
            className="jumia-section"
            id="recommended"
          >

            <ProductsSlider
              title="قد يعجبك"
              badge="مميز"
              badgeClass="recommended"
              products={recommended}
              addToCart={addToCart}
              onTitleClick={() =>
                scrollToSection(
                  "#recommended"
                )
              }
            />

          </section>
        )}

        {/* =================================================
            ALL CATEGORIES
        ================================================= */}

        <section
          className="jumia-section all-categories-section"
        >

          <div className="jumia-section-title">

            <h2>
              تصفح الأقسام
            </h2>

            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
            >
              الرئيسية
            </button>

          </div>

          <div className="jumia-all-categories">

            {rootCategories.map(
              (category) => {

                const categoryProducts =
                  getCategoryProducts(
                    category
                  );

                return (
                  <button
                    type="button"
                    key={
                      category?.id ||
                      category?.name
                    }
                    className="jumia-category-tile"
                    onClick={() =>
                      openCategory(
                        category
                      )
                    }
                  >

                    <div className="jumia-category-image">

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

                    </div>

                    <strong>
                      {
                        category?.name ||
                        "قسم"
                      }
                    </strong>

                    <small>
                      {categoryProducts.length >
                      0
                        ? `${categoryProducts.length} منتج`
                        : "اكتشف الآن"}
                    </small>

                  </button>
                );
              }
            )}

          </div>

        </section>

        {/* =================================================
            FLASH SALES
        ================================================= */}

        {offers.length > 0 && (
          <section
            className="jumia-flash-section"
          >

            <div className="jumia-flash-header">

              <div className="flash-title">

                <span className="flash-icon">
                  ⚡
                </span>

                <div>
                  <h2>
                    Flash Sales
                  </h2>

                  <p>
                    عروض لفترة محدودة
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "#today-offers"
                  )
                }
              >
                عرض الكل
              </button>

            </div>

            <ProductsSlider
              title=""
              badge="FLASH"
              badgeClass="offer"
              products={offers}
              addToCart={addToCart}
              onTitleClick={() =>
                scrollToSection(
                  "#today-offers"
                )
              }
            />

          </section>
        )}

        {/* =================================================
            CATEGORY PRODUCT SECTIONS
            نفس فكرة جوميا: كل قسم له عنوان
            وتحته المنتجات الخاصة به
        ================================================= */}

        {rootCategories.map(
          (category) => {

            const categoryProducts =
              getCategoryProducts(
                category
              );

            if (
              categoryProducts.length ===
              0
            ) {
              return null;
            }

            return (
              <section
                key={
                  `products-${category?.id}`
                }
                className="jumia-section category-products-section"
              >

                <div className="jumia-section-title">

                  <div>
                    <h2>
                      {
                        category?.name ||
                        "منتجات"
                      }
                    </h2>

                    <p>
                      اكتشف أفضل المنتجات
                      في هذا القسم
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openCategory(
                        category
                      )
                    }
                  >
                    عرض الكل
                  </button>

                </div>

                <ProductsSlider
                  title=""
                  products={
                    categoryProducts
                  }
                  addToCart={addToCart}
                  onTitleClick={() =>
                    openCategory(
                      category
                    )
                  }
                />

              </section>
            );
          }
        )}

        {/* =================================================
            FILTERED PRODUCTS
            مخفي للحفاظ على وظائف البحث والفلاتر
        ================================================= */}

        <section
          className="products-section"
          ref={productsRef}
          style={{
            display: "none",
          }}
        >

          <div className="section-header">

            <div>

              <h2>
                جميع المنتجات
              </h2>

              {selectedCategory !==
                "الكل" && (
                <p>
                  القسم:
                  {" "}
                  <strong>
                    {selectedCategory}
                  </strong>
                </p>
              )}

            </div>

            <span>
              {filteredProducts.length} منتج
            </span>

          </div>

          <div className="products-filters">

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
              }
            >

              <option value="default">
                ترتيب افتراضي
              </option>

              <option value="low">
                الأقل سعرًا
              </option>

              <option value="high">
                الأعلى سعرًا
              </option>

              <option value="rating">
                الأعلى تقييمًا
              </option>

              <option value="new">
                الأحدث
              </option>

              <option value="best">
                الأكثر مبيعًا
              </option>

            </select>

            <input
              type="number"
              min="0"
              placeholder="من سعر"
              value={minPrice}
              onChange={(event) =>
                setMinPrice(
                  event.target.value
                )
              }
            />

            <input
              type="number"
              min="0"
              placeholder="إلى سعر"
              value={maxPrice}
              onChange={(event) =>
                setMaxPrice(
                  event.target.value
                )
              }
            />

            <label>

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
                العروض فقط
              </span>

            </label>

          </div>

        </section>

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer
        className="store-footer jumia-footer"
        style={{
          background:
            theme.footerBackground ||
            "#313133",

          color:
            theme.footerText ||
            "#FFFFFF",
        }}
      >

        <div className="footer-container">

          {/* BRAND */}

          <div className="footer-column">

            <h2>
              {
                storeSettings.storeName ||
                "Elsafty Store"
              }
            </h2>

            <p>
              كل اللي تحتاجه في مكان واحد.
              تسوق بسهولة واحصل على أفضل
              المنتجات والأسعار.
            </p>

            {storeSettings.address && (
              <p>
                📍 {storeSettings.address}
              </p>
            )}

            {storeSettings.phone && (
              <p>
                📞 {storeSettings.phone}
              </p>
            )}

            {storeSettings.email && (
              <p>
                ✉️ {storeSettings.email}
              </p>
            )}

          </div>

          {/* HELP */}

          <div className="footer-column">

            <h3>
              تحتاج مساعدة؟
            </h3>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate("/")
              }
            >
              الرئيسية
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate("/account")
              }
            >
              حسابي
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate("/orders")
              }
            >
              طلباتي
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate("/cart")
              }
            >
              سلة التسوق
            </button>

          </div>

          {/* SHOP */}

          <div className="footer-column">

            <h3>
              تسوق معنا
            </h3>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                scrollToSection(
                  ".jumia-categories"
                )
              }
            >
              الأقسام
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                scrollToSection(
                  "#today-offers"
                )
              }
            >
              عروض اليوم
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                scrollToSection(
                  "#best-sellers"
                )
              }
            >
              الأكثر مبيعًا
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                scrollToSection(
                  "#new-arrivals"
                )
              }
            >
              وصل حديثًا
            </button>

          </div>

          {/* CUSTOMER SERVICE */}

          <div className="footer-column">

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
              ⭐ منتجات مختارة
            </p>

            {storeSettings.whatsapp && (
              <p>
                💬 واتساب:
                {" "}
                {storeSettings.whatsapp}
              </p>
            )}

          </div>

          {/* SOCIAL */}

          <div className="footer-column">

            <h3>
              تابعنا
            </h3>

            <div className="footer-social">

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
                  <span>
                    أضف روابط التواصل
                    من لوحة الأدمن
                  </span>
                )}

            </div>

          </div>

        </div>

        <div className="footer-bottom">

          © {new Date().getFullYear()}
          {" "}
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