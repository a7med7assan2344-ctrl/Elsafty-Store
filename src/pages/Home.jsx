import React, {
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";

import { useNavigate } from "react-router-dom";

import "./Home.css";
import "../styles/store.css";

import Navbar from "../components/Navbar/Navbar";
import HeroSlider from "../components/HeroSlider";
import ProductsSlider from "../components/ProductsSlider";

import { CartContext } from "../context/CartContext";
import { getCategories } from "../services/categoryService";

function Home({
  products = [],
  admin,
  searchTerm,
  setSearchTerm,
  setCurrentView,
}) {
  const navigate = useNavigate();
  const productsRef = useRef(null);

  const { cart, addToCart } = useContext(CartContext);

  // =====================================================
  // STATES
  // =====================================================

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const [sortBy, setSortBy] = useState("default");
  const [showOffersOnly, setShowOffersOnly] = useState(false);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // =====================================================
  // CART COUNT
  // =====================================================

  const cartCount = (cart || []).reduce(
    (total, item) => total + Number(item?.quantity || 0),
    0
  );

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();

        const activeCategories = (data || []).filter(
          (category) => category?.active === true
        );

        setCategories(activeCategories);
      } catch (error) {
        console.error("خطأ في تحميل الأقسام:", error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  // =====================================================
  // CATEGORY EVENT FROM NAVBAR
  // =====================================================

  useEffect(() => {
    const filterListener = (event) => {
      const category = event?.detail || "الكل";

      if (category === "الكل") {
        setSelectedCategory("الكل");

        setTimeout(() => {
          productsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);

        return;
      }

      navigate(
        `/category/${encodeURIComponent(category)}`
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
  }, [navigate]);

  // =====================================================
  // SCROLL TO SECTION
  // =====================================================

  const scrollToSection = (selector) => {
    const element = document.querySelector(selector);

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // =====================================================
  // CATEGORY CLICK
  // =====================================================

  const handleCategoryClick = (category) => {
    if (category === "الكل") {
      setSelectedCategory("الكل");

      setTimeout(() => {
        productsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      return;
    }

    navigate(
      `/category/${encodeURIComponent(category)}`
    );
  };

  // =====================================================
  // OPEN CATEGORY PAGE
  // =====================================================

  const openCategory = (categoryName) => {
    if (!categoryName) return;

    navigate(
      `/category/${encodeURIComponent(categoryName)}`
    );
  };

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = (products || [])
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

      // -------------------------------
      // SEARCH
      // -------------------------------

      const matchSearch =
        searchText === "" ||
        title.includes(searchText) ||
        description.includes(searchText) ||
        category.includes(searchText);

      // -------------------------------
      // CATEGORY
      // -------------------------------

      const matchCategory =
        selectedCategory === "الكل" ||
        String(product?.category || "").trim() ===
          String(selectedCategory || "").trim();

      if (!matchSearch || !matchCategory) {
        return false;
      }

      // -------------------------------
      // OFFERS
      // -------------------------------

      if (
        showOffersOnly &&
        product?.offer !== true
      ) {
        return false;
      }

      // -------------------------------
      // MIN PRICE
      // -------------------------------

      if (
        minPrice !== "" &&
        Number(product?.price || 0) <
          Number(minPrice)
      ) {
        return false;
      }

      // -------------------------------
      // MAX PRICE
      // -------------------------------

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

  // =====================================================
  // SPECIAL PRODUCTS
  // =====================================================

  const offers = (products || []).filter(
    (product) => product?.offer === true
  );

  const bestSellers = (products || []).filter(
    (product) => product?.bestSeller === true
  );

  const newArrivals = (products || []).filter(
    (product) => product?.newArrival === true
  );

  const recommended = (products || []).filter(
    (product) => product?.recommended === true
  );

  // =====================================================
  // CATEGORY PRODUCTS
  // =====================================================

  const getCategoryProducts = (categoryName) => {
    const normalizedCategory = String(
      categoryName || ""
    )
      .trim()
      .toLowerCase();

    return (products || []).filter(
      (product) =>
        String(product?.category || "")
          .trim()
          .toLowerCase() === normalizedCategory
    );
  };

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = () => {
    setSelectedCategory("الكل");
    setSearchTerm("");
    setSortBy("default");
    setShowOffersOnly(false);
    setMinPrice("");
    setMaxPrice("");
  };

  // =====================================================
  // PRODUCT RATING
  // =====================================================

  const renderRating = (rating) => {
    const value = Math.min(
      5,
      Math.max(
        0,
        Math.round(Number(rating || 0))
      )
    );

    return (
      <>
        {"★".repeat(value)}
        {"☆".repeat(5 - value)}
      </>
    );
  };

  // =====================================================
  // OPEN PRODUCT
  // =====================================================

  const openProduct = (id) => {
    if (!id) return;

    navigate(`/product/${id}`);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="store-container">

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
        setSelectedCategory={setSelectedCategory}
      />

      {/* =================================================
          FEATURES
      ================================================= */}

      <section className="features-section">

        <div className="feature-card">
          <div className="feature-icon">🚚</div>

          <h3>شحن سريع</h3>

          <p>
            توصيل لجميع المحافظات
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>

          <h3>دفع آمن</h3>

          <p>
            طرق دفع آمنة
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⭐</div>

          <h3>جودة مضمونة</h3>

          <p>
            منتجات أصلية
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💬</div>

          <h3>دعم فني</h3>

          <p>
            خدمة عملاء مستمرة
          </p>
        </div>

      </section>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="hero-section">
        <HeroSlider />
      </section>

      {/* =================================================
          CATEGORIES
      ================================================= */}

      <section className="categories">

        <div className="section-header">

          <h2>الأقسام</h2>

          <button
            type="button"
            onClick={() =>
              handleCategoryClick("الكل")
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
              handleCategoryClick("الكل")
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

          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className="category-card"
              onClick={() =>
                handleCategoryClick(
                  category.name
                )
              }
            >
              <div className="category-image-wrap">

                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="category-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="category-icon">
                    {category.icon || "📦"}
                  </span>
                )}

              </div>

              <strong>
                {category.name}
              </strong>

              <small>
                تصفح المنتجات
              </small>
            </button>
          ))}

        </div>
      </section>

      {/* =================================================
          OFFER BANNER
      ================================================= */}

      <section className="offer-banner">

        <div className="offer-banner-content">

          <span className="offer-banner-icon">
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
          products={offers}
          addToCart={addToCart}
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
          products={bestSellers}
          addToCart={addToCart}
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
          products={newArrivals}
          addToCart={addToCart}
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
          products={recommended}
          addToCart={addToCart}
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

      <section className="home-categories-products">

        {categories.map((category) => {

          const categoryProducts =
            getCategoryProducts(
              category.name
            );

          if (!categoryProducts.length) {
            return null;
          }

          return (
            <section
              className="category-products-section"
              key={category.id}
            >

              {/* CATEGORY HEADER */}

              <div className="category-products-header">

                <button
                  type="button"
                  className="category-section-title"
                  onClick={() =>
                    openCategory(
                      category.name
                    )
                  }
                >

                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                    />
                  ) : (
                    <span>
                      {category.icon || "📦"}
                    </span>
                  )}

                  <strong>
                    {category.name}
                  </strong>

                </button>

                <button
                  type="button"
                  className="category-view-all"
                  onClick={() =>
                    openCategory(
                      category.name
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
                products={categoryProducts}
                addToCart={addToCart}
                hideHeader={true}
              />

            </section>
          );
        })}

      </section>

      {/* =================================================
          ALL PRODUCTS
      ================================================= */}

      <section
        className="products-section"
        ref={productsRef}
      >

        {/* SECTION HEADER */}

        <div className="section-header">

          <div>
            <h2>
              📦 جميع المنتجات
            </h2>

            {selectedCategory !== "الكل" && (
              <p className="selected-category">
                القسم:{" "}
                <strong>
                  {selectedCategory}
                </strong>
              </p>
            )}
          </div>

          <span className="products-count">
            {filteredProducts.length} منتج
          </span>

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="products-filters">

          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value)
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
            value={minPrice}
            onChange={(event) =>
              setMinPrice(event.target.value)
            }
            aria-label="أقل سعر"
          />

          <input
            type="number"
            min="0"
            placeholder="إلى سعر"
            value={maxPrice}
            onChange={(event) =>
              setMaxPrice(event.target.value)
            }
            aria-label="أعلى سعر"
          />

          <label className="offers-filter">

            <input
              type="checkbox"
              checked={showOffersOnly}
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

        {/* =================================================
            PRODUCTS GRID
        ================================================= */}

        {filteredProducts.length > 0 ? (

          <div className="product-grid">

            {filteredProducts.map((product) => {

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
                Number(product?.price || 0);

              const oldPrice =
                Number(product?.oldPrice || 0);

              const discount =
                oldPrice > price && oldPrice > 0
                  ? Math.round(
                      ((oldPrice - price) /
                        oldPrice) *
                        100
                    )
                  : 0;

              return (
                <article
                  className="product-card"
                  key={id}
                  onClick={() =>
                    openProduct(id)
                  }
                >

                  {/* PRODUCT IMAGE */}

                  <div className="product-img-container">

                    {discount > 0 && (
                      <span className="product-badge offer">
                        -{discount}%
                      </span>
                    )}

                    {product?.newArrival && (
                      <span className="product-badge new">
                        جديد
                      </span>
                    )}

                    <img
                      src={image}
                      alt={title}
                      loading="lazy"
                    />

                  </div>

                  {/* PRODUCT INFO */}

                  <div className="product-info">

                    <h3>
                      {title}
                    </h3>

                    {/* RATING */}

                    <div className="rating">
                      {renderRating(
                        product?.rating
                      )}
                    </div>

                    {/* PRICE */}

                    <div className="product-price">

                      <strong>
                        {price} ج.م
                      </strong>

                      {oldPrice > price && (
                        <del>
                          {oldPrice} ج.م
                        </del>
                      )}

                    </div>

                    {/* ACTIONS */}

                    <div className="product-actions">

                      <button
                        type="button"
                        className="details-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          openProduct(id);
                        }}
                      >
                        التفاصيل
                      </button>

                      <button
                        type="button"
                        className="add-to-cart-btn"
                        onClick={(event) => {
                          event.stopPropagation();

                          addToCart({
                            ...product,
                            quantity: 1,
                          });
                        }}
                      >
                        🛒 أضف للسلة
                      </button>

                    </div>

                  </div>

                </article>
              );
            })}

          </div>

        ) : (

          /* =================================================
             NO PRODUCTS
          ================================================= */

          <div className="no-products">

            <div className="no-products-icon">
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
              onClick={resetFilters}
            >
              إعادة ضبط الفلاتر
            </button>

          </div>
        )}

      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="store-footer">

        <div className="footer-container">

          {/* ABOUT */}

          <div className="footer-column">

            <h2>
              Elsafty Store
            </h2>

            <p>
              متجر إلكتروني يوفر أفضل المنتجات
              بأفضل الأسعار مع خدمة عملاء متميزة.
            </p>

          </div>

          {/* QUICK LINKS */}

          <div className="footer-column">

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
                navigate("/cart")
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

          <div className="footer-column">

            <h3>
              خدمة العملاء
            </h3>

            <p>
              📞 دعم طوال الأسبوع
            </p>

            <p>
              🚚 شحن لجميع المحافظات
            </p>

            <p>
              🔒 دفع آمن
            </p>

            <p>
              ⭐ ضمان جودة المنتجات
            </p>

          </div>

          {/* SOCIAL */}

          <div className="footer-column">

            <h3>
              تابعنا
            </h3>

            <div className="footer-social">

              <button
                type="button"
                aria-label="Facebook"
              >
                📘
              </button>

              <button
                type="button"
                aria-label="Instagram"
              >
                📷
              </button>

              <button
                type="button"
                aria-label="TikTok"
              >
                🎵
              </button>

              <button
                type="button"
                aria-label="YouTube"
              >
                ▶️
              </button>

            </div>

          </div>

        </div>

        {/* FOOTER BOTTOM */}

        <div className="footer-bottom">
          © {new Date().getFullYear()} Elsafty Store
          {" - "}
          جميع الحقوق محفوظة.
        </div>

      </footer>

    </div>
  );
}

export default Home;