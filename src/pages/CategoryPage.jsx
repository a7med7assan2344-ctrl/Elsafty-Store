import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { CartContext } from "../context/CartContext";

import { getCategories } from "../services/categoryService";

import Navbar from "../components/Navbar/Navbar";
import ProductsSlider from "../components/ProductsSlider";

import "../styles/store.css";
import "./Home.css";

function CategoryPage({
  products = [],
  admin,
  searchTerm,
  setSearchTerm,
  setCurrentView,
}) {
  const navigate = useNavigate();

  const { categoryName } = useParams();

  const {
    cart,
    addToCart,
  } = useContext(CartContext);

  // =========================
  // STATES
  // =========================

  const [categories, setCategories] =
    useState([]);

  const [sortBy, setSortBy] =
    useState("default");

  const [minPrice, setMinPrice] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  // =========================
  // DECODE CATEGORY
  // =========================

  const decodedCategory = useMemo(() => {
    try {
      return decodeURIComponent(
        categoryName || ""
      );
    } catch {
      return categoryName || "";
    }
  }, [categoryName]);

  // =========================
  // CART COUNT
  // =========================

  const cartCount = cart.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0
  );

  // =========================
  // LOAD CATEGORIES
  // =========================

  useEffect(() => {
    const loadCategories =
      async () => {
        try {
          const data =
            await getCategories();

          setCategories(
            (data || []).filter(
              (category) =>
                category.active === true
            )
          );
        } catch (error) {
          console.error(
            "خطأ في تحميل الأقسام:",
            error
          );

          setCategories([]);
        }
      };

    loadCategories();
  }, []);

  // =========================
  // CURRENT CATEGORY
  // =========================

  const currentCategory =
    categories.find(
      (category) =>
        String(
          category.name || ""
        )
          .trim()
          .toLowerCase() ===
        String(
          decodedCategory || ""
        )
          .trim()
          .toLowerCase()
    );

  // =========================
  // CATEGORY PRODUCTS
  // =========================

  const categoryProducts =
    useMemo(() => {
      const search =
        String(searchTerm || "")
          .trim()
          .toLowerCase();

      const selectedCategory =
        String(
          decodedCategory || ""
        )
          .trim()
          .toLowerCase();

      return (products || [])
        .filter((product) => {
          // =====================
          // CATEGORY
          // =====================

          const productCategory =
            String(
              product.category || ""
            )
              .trim()
              .toLowerCase();

          const matchCategory =
            productCategory ===
            selectedCategory;

          // =====================
          // SEARCH
          // =====================

          const title =
            String(
              product.title ||
                product.name ||
                product.productName ||
                ""
            ).toLowerCase();

          const description =
            String(
              product.description || ""
            ).toLowerCase();

          const matchSearch =
            search === "" ||
            title.includes(search) ||
            description.includes(search);

          // =====================
          // PRICE
          // =====================

          const price =
            Number(
              product.price || 0
            );

          const matchMinPrice =
            minPrice === "" ||
            price >=
              Number(minPrice);

          const matchMaxPrice =
            maxPrice === "" ||
            price <=
              Number(maxPrice);

          return (
            matchCategory &&
            matchSearch &&
            matchMinPrice &&
            matchMaxPrice
          );
        })

        // =====================
        // SORT
        // =====================

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
                Number(
                  b.rating || 0
                ) -
                Number(
                  a.rating || 0
                )
              );

            case "new":
              return (
                Number(
                  !!b.newArrival
                ) -
                Number(
                  !!a.newArrival
                )
              );

            case "best":
              return (
                Number(
                  !!b.bestSeller
                ) -
                Number(
                  !!a.bestSeller
                )
              );

            default:
              return 0;
          }
        });
    }, [
      products,
      decodedCategory,
      searchTerm,
      minPrice,
      maxPrice,
      sortBy,
    ]);

  // =========================
  // SPECIAL PRODUCTS
  // =========================

  const offers =
    categoryProducts.filter(
      (product) =>
        product.offer === true
    );

  const bestSellers =
    categoryProducts.filter(
      (product) =>
        product.bestSeller === true
    );

  const newArrivals =
    categoryProducts.filter(
      (product) =>
        product.newArrival === true
    );

  const recommended =
    categoryProducts.filter(
      (product) =>
        product.recommended === true
    );

  // =========================
  // RESET FILTERS
  // =========================

  const resetFilters = () => {
    setSearchTerm("");
    setSortBy("default");
    setMinPrice("");
    setMaxPrice("");
  };

  // =========================
  // NAVBAR VIEW
  // =========================

  const handleViewChange = (
    view
  ) => {
    if (setCurrentView) {
      setCurrentView(view);
      return;
    }

    switch (view) {
      case "admin":
        navigate("/admin");
        break;

      case "cart":
        navigate("/cart");
        break;

      case "store":
        navigate("/");
        break;

      default:
        break;
    }
  };

  // =========================
  // OPEN CATEGORY
  // =========================

  const openCategory = (
    name
  ) => {
    navigate(
      `/category/${encodeURIComponent(
        name
      )}`
    );
  };

  // =========================
  // RETURN
  // =========================

  return (
    <>
      {/* =========================
          NAVBAR
      ========================= */}

      <Navbar
        setCurrentView={
          handleViewChange
        }
        cartCount={cartCount}
        searchTerm={searchTerm}
        setSearchTerm={
          setSearchTerm
        }
        admin={admin}
        products={products}
      />

      {/* =========================
          CATEGORY PAGE
      ========================= */}

      <main className="category-page">

        {/* =========================
            CATEGORY HEADER
        ========================= */}

        <div className="category-page-header">

          <div className="category-page-title">

            {currentCategory?.image ? (
              <img
                src={
                  currentCategory.image
                }
                alt={
                  decodedCategory
                }
              />
            ) : (
              <span className="category-page-icon">
                {currentCategory?.icon ||
                  "📦"}
              </span>
            )}

            <div>

              <h1>
                {decodedCategory}
              </h1>

              <p>
                تصفح منتجات قسم{" "}
                <strong>
                  {decodedCategory}
                </strong>
              </p>

            </div>

          </div>

          <button
            type="button"
            className="category-back-btn"
            onClick={() =>
              navigate("/")
            }
          >
            ← العودة للرئيسية
          </button>

        </div>

        {/* =========================
            FILTERS
        ========================= */}

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

        </div>

        {/* =========================
            PRODUCTS COUNT
        ========================= */}

        <div className="section-header">

          <div>
            <h2>
              📦 منتجات القسم
            </h2>
          </div>

          <span className="products-count">
            {categoryProducts.length}{" "}
            منتج
          </span>

        </div>

        {/* =========================
            OFFERS
        ========================= */}

        {offers.length > 0 && (
          <ProductsSlider
            title="🔥 عروض القسم"
            badge="🔥 خصم"
            badgeClass="offer"
            products={offers}
            addToCart={addToCart}
            categoryName={
              decodedCategory
            }
          />
        )}

        {/* =========================
            BEST SELLERS
        ========================= */}

        {bestSellers.length > 0 && (
          <ProductsSlider
            title="⭐ الأكثر مبيعًا"
            badge="⭐ الأكثر طلبًا"
            badgeClass="best"
            products={
              bestSellers
            }
            addToCart={addToCart}
            categoryName={
              decodedCategory
            }
          />
        )}

        {/* =========================
            NEW ARRIVALS
        ========================= */}

        {newArrivals.length > 0 && (
          <ProductsSlider
            title="🆕 وصل حديثًا"
            badge="🆕 جديد"
            badgeClass="new"
            products={
              newArrivals
            }
            addToCart={addToCart}
            categoryName={
              decodedCategory
            }
          />
        )}

        {/* =========================
            RECOMMENDED
        ========================= */}

        {recommended.length > 0 && (
          <ProductsSlider
            title="❤️ قد يعجبك"
            badge="❤️ مميز"
            badgeClass="recommended"
            products={
              recommended
            }
            addToCart={addToCart}
            categoryName={
              decodedCategory
            }
          />
        )}

        {/* =========================
            ALL PRODUCTS
        ========================= */}

        {categoryProducts.length >
        0 ? (

          <div className="products-grid">

            {categoryProducts.map(
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
                    product.oldPrice ||
                      0
                  );

                const discount =
                  oldPrice > price &&
                  oldPrice > 0
                    ? Math.round(
                        (
                          (
                            oldPrice -
                            price
                          ) /
                          oldPrice
                        ) * 100
                      )
                    : 0;

                return (
                  <article
                    key={id}
                    className="product-card"
                    onClick={() =>
                      navigate(
                        `/product/${id}`
                      )
                    }
                  >

                    {/* IMAGE */}

                    <div className="product-card-image">

                      {discount >
                        0 && (
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
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            "/default-product.png";
                        }}
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
                          product.rating ||
                            0
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
                        onClick={(
                          event
                        ) => {

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
              لا توجد منتجات في هذا القسم
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

      </main>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="store-footer">

        <div className="footer-container">

          {/* BRAND */}

          <div className="footer-column">

            <h2>
              Elsafty Store
            </h2>

            <p>
              متجر إلكتروني يوفر أفضل
              المنتجات بأفضل الأسعار
              مع خدمة عملاء متميزة.
            </p>

          </div>

          {/* LINKS */}

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

          </div>

          {/* SERVICE */}

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

        </div>

        <div className="footer-bottom">

          ©{" "}
          {new Date().getFullYear()}{" "}
          Elsafty Store
          {" - "}
          جميع الحقوق محفوظة.

        </div>

      </footer>
    </>
  );
}

export default CategoryPage;