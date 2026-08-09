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

  // =======================
  // STATES
  // =======================

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

  // =======================
  // CART COUNT
  // =======================

  const cartCount = cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  // =======================
  // LOAD CATEGORIES
  // =======================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();

        setCategories(
          (data || []).filter(
            (cat) => cat.active === true
          )
        );
      } catch (error) {
        console.error(
          "خطأ في تحميل الأقسام:",
          error
        );
      }
    };

    loadCategories();
  }, []);

  // =======================
  // CATEGORY EVENT FROM NAVBAR
  // =======================

  useEffect(() => {
    const filterListener = (event) => {
      const category =
        event.detail || "الكل";

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

  // =======================
  // SCROLL
  // =======================

  const scrollToSection = (selector) => {
    document
      .querySelector(selector)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  // =======================
  // CATEGORY CLICK
  // =======================

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

  // =======================
  // OPEN CATEGORY PAGE
  // =======================

  const openCategory = (categoryName) => {
    navigate(
      `/category/${encodeURIComponent(categoryName)}`
    );
  };

  // =======================
  // FILTER PRODUCTS
  // =======================

  const filteredProducts = (products || [])
    .filter((product) => {
      const title = String(
        product.title ||
          product.name ||
          product.productName ||
          ""
      ).toLowerCase();

      const description = String(
        product.description || ""
      ).toLowerCase();

      const category = String(
        product.category || ""
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
        product.category === selectedCategory;

      if (
        !matchSearch ||
        !matchCategory
      ) {
        return false;
      }

      if (
        showOffersOnly &&
        !product.offer
      ) {
        return false;
      }

      if (
        minPrice !== "" &&
        Number(product.price || 0) <
          Number(minPrice)
      ) {
        return false;
      }

      if (
        maxPrice !== "" &&
        Number(product.price || 0) >
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
            Number(a.price || 0) -
            Number(b.price || 0)
          );

        case "high":
          return (
            Number(b.price || 0) -
            Number(a.price || 0)
          );

        case "rating":
          return (
            Number(b.rating || 0) -
            Number(a.rating || 0)
          );

        case "new":
          return (
            Number(!!b.newArrival) -
            Number(!!a.newArrival)
          );

        case "best":
          return (
            Number(!!b.bestSeller) -
            Number(!!a.bestSeller)
          );

        default:
          return 0;
      }
    });

  // =======================
  // SPECIAL PRODUCTS
  // =======================

  const offers = (products || []).filter(
    (product) => product.offer === true
  );

  const bestSellers = (products || []).filter(
    (product) =>
      product.bestSeller === true
  );

  const newArrivals = (products || []).filter(
    (product) =>
      product.newArrival === true
  );

  const recommended = (products || []).filter(
    (product) =>
      product.recommended === true
  );

  // =======================
  // CATEGORY PRODUCTS
  // =======================

  const getCategoryProducts = (
    categoryName
  ) => {
    return (products || []).filter(
      (product) =>
        String(product.category || "")
          .trim()
          .toLowerCase() ===
        String(categoryName || "")
          .trim()
          .toLowerCase()
    );
  };

  // =======================
  // RESET FILTERS
  // =======================

  const resetFilters = () => {
    setSelectedCategory("الكل");
    setSearchTerm("");
    setSortBy("default");
    setShowOffersOnly(false);
    setMinPrice("");
    setMaxPrice("");
  };

  // =======================
  // RETURN
  // =======================

  return (
    <>

      {/* =======================
          NAVBAR
      ======================= */}

      <Navbar
        setCurrentView={setCurrentView}
        cartCount={cartCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        admin={admin}
        products={products}
        setSelectedCategory={setSelectedCategory}
      />

      {/* =======================
          FEATURES
      ======================= */}

      <section className="features-section">

        <div className="feature-card">
          <div className="feature-icon">
            🚚
          </div>

          <div>
            <strong>
              شحن سريع
            </strong>

            <span>
              توصيل لجميع المحافظات
            </span>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            🔒
          </div>

          <div>
            <strong>
              دفع آمن
            </strong>

            <span>
              طرق دفع آمنة
            </span>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            ⭐
          </div>

          <div>
            <strong>
              جودة مضمونة
            </strong>

            <span>
              منتجات أصلية
            </span>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            💬
          </div>

          <div>
            <strong>
              دعم فني
            </strong>

            <span>
              خدمة عملاء مستمرة
            </span>
          </div>
        </div>

      </section>

      {/* =======================
          HERO
      ======================= */}

      <section className="hero-section">
        <HeroSlider />
      </section>

      {/* =======================
          CATEGORIES
      ======================= */}

      <section className="categories-section">

        <div className="section-header">

          <h2>
            الأقسام
          </h2>

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

          {/* ALL */}

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

          {categories.map(
            (category) => (
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
                      {category.icon ||
                        "📦"}
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
            )
          )}

        </div>

      </section>

      {/* =======================
          OFFER BANNER
      ======================= */}

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

      {/* =======================
          OFFERS
      ======================= */}

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

      {/* =======================
          BEST SELLERS
      ======================= */}

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

      {/* =======================
          NEW ARRIVALS
      ======================= */}

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

      {/* =======================
          RECOMMENDED
      ======================= */}

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
          كل قسم = اسم القسم + سطر المنتجات
      ================================================= */}

      <section className="home-categories-products">

        {categories.map((category) => {

          const categoryProducts =
            getCategoryProducts(
              category.name
            );

          if (
            categoryProducts.length === 0
          ) {
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
                    />
                  ) : (
                    <span>
                      {category.icon ||
                        "📦"}
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
                products={
                  categoryProducts
                }
                addToCart={addToCart}
                hideHeader={true}
              />

            </section>
          );
        })}

      </section>

      {/* =======================
          ALL PRODUCTS
      ======================= */}

      <section
        className="products-section"
        ref={productsRef}
      >

        <div className="section-header">

          <div>

            <h2>
              📦 جميع المنتجات
            </h2>

            {selectedCategory !==
              "الكل" && (
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

        {/* FILTERS */}

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

        {/* PRODUCTS GRID */}

        {filteredProducts.length > 0 ? (

          <div className="products-grid">

            {filteredProducts.map(
              (product) => {

                const id =
                  product.id ||
                  product._id;

                const image =
                  product.image ||
                  product.images?.[0] ||
                  "/default-product.png";

                const title =
                  product.title ||
                  product.name ||
                  product.productName ||
                  "منتج";

                const price =
                  Number(
                    product.price || 0
                  );

                const oldPrice =
                  Number(
                    product.oldPrice || 0
                  );

                const discount =
                  oldPrice > price &&
                  oldPrice > 0
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
                      navigate(
                        `/product/${id}`
                      )
                    }
                  >

                    {/* IMAGE */}

                    <div className="product-card-image">

                      {discount > 0 && (
                        <span className="discount-badge">
                          -{discount}%
                        </span>
                      )}

                      {product.newArrival && (
                        <span className="new-badge">
                          جديد
                        </span>
                      )}

                      <img
                        src={image}
                        alt={title}
                        loading="lazy"
                      />

                    </div>

                    {/* INFO */}

                    <div className="product-card-info">

                      <h3>
                        {title}
                      </h3>

                      <div className="product-rating">
                        ⭐{" "}
                        {Number(
                          product.rating || 0
                        ).toFixed(1)}
                      </div>

                      <div className="product-price">

                        <strong>
                          {price} ج.م
                        </strong>

                        {oldPrice >
                          price && (
                          <del>
                            {oldPrice} ج.م
                          </del>
                        )}

                      </div>

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

                  </article>
                );
              }
            )}

          </div>

        ) : (

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

      {/* =======================
          FOOTER
      ======================= */}

      <footer className="store-footer">

        <div className="footer-container">

          <div className="footer-column">

            <h2>
              Elsafty Store
            </h2>

            <p>
              متجر إلكتروني يوفر أفضل المنتجات
              بأفضل الأسعار مع خدمة عملاء متميزة.
            </p>

          </div>

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

          <div className="footer-column">

            <h3>
              تابعنا
            </h3>

            <div className="footer-social">

              <button type="button">
                📘
              </button>

              <button type="button">
                📷
              </button>

              <button type="button">
                🎵
              </button>

              <button type="button">
                ▶️
              </button>

            </div>

          </div>

        </div>

        <div className="footer-bottom">

          © {new Date().getFullYear()}
          {" "}
          Elsafty Store
          {" - "}
          جميع الحقوق محفوظة.

        </div>

      </footer>

    </>
  );
}

export default Home;