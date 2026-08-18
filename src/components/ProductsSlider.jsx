import React from "react";
import { useNavigate } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

function ProductsSlider({
  title,
  badge,
  badgeClass = "",
  products = [],
  addToCart,
  categoryName,
  hideHeader = false,
  onTitleClick,
}) {
  const navigate = useNavigate();

  // =====================================================
  // NO PRODUCTS
  // =====================================================

  if (!products || products.length === 0) {
    return null;
  }

  // =====================================================
  // OPEN CATEGORY
  // =====================================================

  const openCategory = () => {
    if (!categoryName) return;

    navigate(
      `/category/${encodeURIComponent(categoryName)}`
    );
  };

  // =====================================================
  // TITLE CLICK
  // =====================================================

  const handleTitleClick = () => {
    if (onTitleClick) {
      onTitleClick();
      return;
    }

    openCategory();
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
    <section className="products-slider-section">

      {/* =================================================
          HEADER
      ================================================= */}

      {!hideHeader && (
        <div className="products-slider-header">

          <button
            type="button"
            className="section-title category-title-btn"
            onClick={handleTitleClick}
          >
            {title}
          </button>

          <button
            type="button"
            className="view-all-btn"
            onClick={handleTitleClick}
          >
            عرض الكل
          </button>

        </div>
      )}

      {/* =================================================
          SLIDER
      ================================================= */}

      <div className="products-slider-wrapper">

        <Swiper
          modules={[Navigation]}
          navigation

          slidesPerView={2}
          spaceBetween={8}

          watchOverflow={true}

          observer={true}
          observeParents={true}

          breakpoints={{

            // ---------------------------------------------
            // MOBILE
            // ---------------------------------------------

            320: {
              slidesPerView: 2,
              spaceBetween: 8,
            },

            400: {
              slidesPerView: 2,
              spaceBetween: 8,
            },

            480: {
              slidesPerView: 2,
              spaceBetween: 10,
            },

            // ---------------------------------------------
            // TABLET
            // ---------------------------------------------

            600: {
              slidesPerView: 3,
              spaceBetween: 12,
            },

            768: {
              slidesPerView: 3,
              spaceBetween: 14,
            },

            // ---------------------------------------------
            // DESKTOP
            // ---------------------------------------------

            900: {
              slidesPerView: 4,
              spaceBetween: 15,
            },

            1200: {
              slidesPerView: 5,
              spaceBetween: 18,
            },
          }}
        >

          {products.map((product, index) => {

            // =================================================
            // PRODUCT DATA
            // =================================================

            const id =
              product.id ||
              product._id ||
              `product-${index}`;

            const productTitle =
              product.title ||
              product.name ||
              product.productName ||
              "منتج";

            const image =
              product.image ||
              product.images?.[0] ||
              "/default-product.png";

            // =================================================
            // RATING
            // =================================================

            const ratingValue = Number(
              product.rating ?? 5
            );

            const safeRatingValue = Number.isFinite(
              ratingValue
            )
              ? Math.min(
                  5,
                  Math.max(0, ratingValue)
                )
              : 5;

            const rating = Math.floor(
              safeRatingValue
            );

            // =================================================
            // PRICE
            // =================================================

            const price = Number(
              product.price ?? 0
            );

            const safePrice = Number.isFinite(price)
              ? price
              : 0;

            const oldPrice = Number(
              product.oldPrice ?? 0
            );

            const safeOldPrice =
              Number.isFinite(oldPrice)
                ? oldPrice
                : 0;

            // =================================================
            // DISCOUNT
            // =================================================

            const discount =
              safeOldPrice > safePrice &&
              safeOldPrice > 0
                ? Math.round(
                    ((safeOldPrice - safePrice) /
                      safeOldPrice) *
                      100
                  )
                : 0;

            return (
              <SwiperSlide key={id}>

                <article
                  className="product-card"
                  onClick={() => openProduct(id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      openProduct(id);
                    }
                  }}
                >

                  {/* =========================================
                      BADGE
                  ========================================= */}

                  {badge && (
                    <span
                      className={`product-badge ${badgeClass}`}
                    >
                      {badge}
                    </span>
                  )}

                  {/* =========================================
                      DISCOUNT
                  ========================================= */}

                  {discount > 0 && (
                    <span className="discount-badge">
                      -{discount}%
                    </span>
                  )}

                  {/* =========================================
                      NEW
                  ========================================= */}

                  {product.newArrival && (
                    <span className="new-badge">
                      جديد
                    </span>
                  )}

                  {/* =========================================
                      IMAGE
                  ========================================= */}

                  <div className="product-img-container">

                    <img
                      src={image}
                      alt={productTitle}
                      loading="lazy"
                      draggable="false"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "/default-product.png";
                      }}
                    />

                  </div>

                  {/* =========================================
                      CONTENT
                  ========================================= */}

                  <div className="product-card-content">

                    <h3 title={productTitle}>
                      {productTitle}
                    </h3>

                    {/* =======================================
                        RATING
                    ======================================= */}

                    <div className="rating">

                      {"⭐".repeat(rating)}

                      {rating > 0 && (
                        <span className="rating-number">
                          {" "}
                          {safeRatingValue.toFixed(1)}
                        </span>
                      )}

                    </div>

                    {/* =======================================
                        PRICE
                    ======================================= */}

                    <p className="product-price">

                      <strong>
                        {safePrice} جنيه
                      </strong>

                      {safeOldPrice > safePrice && (
                        <del>
                          {safeOldPrice} جنيه
                        </del>
                      )}

                    </p>

                    {/* =======================================
                        ADD TO CART
                    ======================================= */}

                    <button
                      type="button"
                      className="add-to-cart-btn"
                      onClick={(event) => {
                        event.stopPropagation();

                        if (!addToCart) return;

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

              </SwiperSlide>
            );
          })}

        </Swiper>

      </div>

    </section>
  );
}

export default ProductsSlider;