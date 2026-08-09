import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useContext } from "react";
import { CartContext } from "../context/CartContext";

import "./CategoryProducts.css";

function CategoryProducts({ products = [] }) {
  const navigate = useNavigate();
  const { categoryName } = useParams();

  const { addToCart } = useContext(CartContext);

  const [sortBy, setSortBy] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // =========================
  // فك اسم القسم من الرابط
  // =========================

  const decodedCategory = decodeURIComponent(
    categoryName || ""
  );

  // =========================
  // منتجات القسم
  // =========================

  const categoryProducts = useMemo(() => {
    return products.filter((product) => {
      const productCategory = String(
        product.category || ""
      ).trim();

      return (
        productCategory ===
        decodedCategory.trim()
      );
    });
  }, [products, decodedCategory]);

  // =========================
  // فلترة وترتيب المنتجات
  // =========================

  const filteredProducts = useMemo(() => {
    const search = searchTerm
      .toLowerCase()
      .trim();

    return [...categoryProducts]
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

        const price = Number(
          product.price || 0
        );

        const matchesSearch =
          !search ||
          title.includes(search) ||
          description.includes(search);

        const matchesMinPrice =
          minPrice === "" ||
          price >= Number(minPrice);

        const matchesMaxPrice =
          maxPrice === "" ||
          price <= Number(maxPrice);

        return (
          matchesSearch &&
          matchesMinPrice &&
          matchesMaxPrice
        );
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
  }, [
    categoryProducts,
    searchTerm,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // =========================
  // إضافة للسلة
  // =========================

  const handleAddToCart = (
    event,
    product
  ) => {
    event.stopPropagation();

    if (addToCart) {
      addToCart({
        ...product,
        quantity: 1,
      });
    }
  };

  // =========================
  // إعادة الفلاتر
  // =========================

  const resetFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
  };

  // =========================
  // الصفحة
  // =========================

  return (
    <div className="category-products-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="category-products-header">

        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ❮ الرئيسية
        </button>

        <div className="category-title-box">

          <h1>
            {decodedCategory}
          </h1>

          <p>
            {filteredProducts.length} منتج
          </p>

        </div>

        <button
          type="button"
          className="home-btn"
          onClick={() => navigate("/")}
        >
          🏠
        </button>

      </header>

      {/* =========================
          FILTERS
      ========================= */}

      <section className="category-filters">

        <div className="category-search">

          <input
            type="text"
            placeholder="ابحث داخل القسم..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() =>
                setSearchTerm("")
              }
            >
              ✕
            </button>
          )}

        </div>

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

      </section>

      {/* =========================
          PRODUCTS
      ========================= */}

      <main className="category-products-container">

        {filteredProducts.length > 0 ? (

          <div className="category-products-grid">

            {filteredProducts.map(
              (product) => {

                const id =
                  product.id ||
                  product._id;

                const title =
                  product.title ||
                  product.name ||
                  product.productName ||
                  "منتج";

                const image =
                  product.image ||
                  product.images?.[0] ||
                  "/default-product.png";

                const price =
                  Number(
                    product.price || 0
                  );

                const oldPrice =
                  Number(
                    product.oldPrice || 0
                  );

                const rating =
                  Math.min(
                    5,
                    Math.max(
                      0,
                      Math.floor(
                        Number(
                          product.rating || 0
                        )
                      )
                    )
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
                    key={id}
                    className="category-product-card"
                    onClick={() =>
                      navigate(
                        `/product/${id}`
                      )
                    }
                  >

                    {/* BADGES */}

                    <div className="category-product-badges">

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

                      {product.bestSeller && (
                        <span className="best-badge">
                          ⭐ الأكثر مبيعًا
                        </span>
                      )}

                    </div>

                    {/* IMAGE */}

                    <div className="category-product-image">

                      <img
                        src={image}
                        alt={title}
                        loading="lazy"
                      />

                    </div>

                    {/* INFO */}

                    <div className="category-product-info">

                      <h2>
                        {title}
                      </h2>

                      <div className="category-product-rating">

                        {rating > 0
                          ? "⭐".repeat(
                              rating
                            )
                          : "☆☆☆☆☆"}

                        <span>
                          {Number(
                            product.rating || 0
                          ).toFixed(1)}
                        </span>

                      </div>

                      <div className="category-product-price">

                        <strong>
                          {price}
                          {" "}
                          ج.م
                        </strong>

                        {oldPrice > price && (
                          <del>
                            {oldPrice}
                            {" "}
                            ج.م
                          </del>
                        )}

                      </div>

                      <button
                        type="button"
                        className="category-add-cart"
                        onClick={(event) =>
                          handleAddToCart(
                            event,
                            product
                          )
                        }
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

          <div className="category-empty">

            <div>
              📦
            </div>

            <h2>
              لا توجد منتجات
            </h2>

            <p>
              لا توجد منتجات مطابقة
              للبحث أو الفلاتر الحالية.
            </p>

            <button
              type="button"
              onClick={resetFilters}
            >
              إعادة ضبط الفلاتر
            </button>

          </div>

        )}

      </main>

    </div>
  );
}

export default CategoryProducts;