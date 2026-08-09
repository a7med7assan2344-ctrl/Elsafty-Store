import React from "react";
import { useNavigate } from "react-router-dom";

import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import {
  Navigation,
} from "swiper/modules";

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

  // =========================
  // لو مفيش منتجات
  // =========================

  if (
    !products ||
    products.length === 0
  ) {
    return null;
  }

  // =========================
  // فتح صفحة القسم
  // =========================

  const openCategory = () => {
    if (!categoryName) {
      return;
    }

    navigate(
      `/category/${encodeURIComponent(
        categoryName
      )}`
    );
  };

  // =========================
  // الضغط على عنوان القسم
  // =========================

  const handleTitleClick = () => {
    if (onTitleClick) {
      onTitleClick();
      return;
    }

    openCategory();
  };

  // =========================
  // PRODUCT CLICK
  // =========================

  const openProduct = (id) => {
    if (!id) {
      return;
    }

    navigate(`/product/${id}`);
  };

  // =========================
  // RETURN
  // =========================

  return (
    <section className="products-slider-section">

      {/* =========================
          HEADER
      ========================= */}

      {!hideHeader && (
        <div className="products-slider-header">

          <button
            type="button"
            className="section-title category-title-btn"
            onClick={
              handleTitleClick
            }
          >
            {title}
          </button>

          <button
            type="button"
            className="view-all-btn"
            onClick={
              handleTitleClick
            }
          >
            عرض الكل
          </button>

        </div>
      )}

      {/* =========================
          PRODUCTS SLIDER
      ========================= */}

      <div className="products-slider-wrapper">

        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={10}
          slidesPerView={2}

          breakpoints={{
            320: {
              slidesPerView: 2,
              spaceBetween: 8,
            },

            480: {
              slidesPerView: 2,
              spaceBetween: 10,
            },

            600: {
              slidesPerView: 3,
              spaceBetween: 12,
            },

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

          {products.map(
            (product) => {

              const id =
                product.id ||
                product._id;

              const productTitle =
                product.title ||
                product.name ||
                product.productName ||
                "منتج";

              const image =
                product.image ||
                product.images?.[0] ||
                "/default-product.png";

              // =====================
              // RATING
              // =====================

              const ratingValue =
                Number(
                  product.rating || 5
                );

              const rating = Math.min(
                5,
                Math.max(
                  0,
                  Math.floor(
                    ratingValue
                  )
                )
              );

              // =====================
              // PRICE
              // =====================

              const price =
                Number(
                  product.price || 0
                );

              const oldPrice =
                Number(
                  product.oldPrice || 0
                );

              // =====================
              // DISCOUNT
              // =====================

              const discount =
                oldPrice > price &&
                oldPrice > 0
                  ? Math.round(
                      (
                        (oldPrice -
                          price) /
                        oldPrice
                      ) * 100
                    )
                  : 0;

              return (
                <SwiperSlide
                  key={id}
                >

                  <article
                    className="product-card"
                    onClick={() =>
                      openProduct(id)
                    }
                  >

                    {/* =====================
                        BADGE
                    ===================== */}

                    {badge && (
                      <span
                        className={`product-badge ${badgeClass}`}
                      >
                        {badge}
                      </span>
                    )}

                    {/* =====================
                        DISCOUNT
                    ===================== */}

                    {discount > 0 && (
                      <span className="discount-badge">
                        -{discount}%
                      </span>
                    )}

                    {/* =====================
                        NEW
                    ===================== */}

                    {product.newArrival && (
                      <span className="new-badge">
                        جديد
                      </span>
                    )}

                    {/* =====================
                        IMAGE
                    ===================== */}

                    <div className="product-img-container">

                      <img
                        src={image}
                        alt={productTitle}
                        loading="lazy"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            "/default-product.png";
                        }}
                      />

                    </div>

                    {/* =====================
                        CONTENT
                    ===================== */}

                    <div className="product-card-content">

                      {/* اسم المنتج */}

                      <h3>
                        {productTitle}
                      </h3>

                      {/* التقييم */}

                      <div className="rating">

                        {"⭐".repeat(
                          rating
                        )}

                        {rating > 0 && (
                          <span className="rating-number">
                            {" "}
                            {ratingValue.toFixed(
                              1
                            )}
                          </span>
                        )}

                      </div>

                      {/* السعر */}

                      <p className="product-price">

                        <strong>
                          {price} جنيه
                        </strong>

                        {oldPrice >
                          price && (
                          <del>
                            {oldPrice} جنيه
                          </del>
                        )}

                      </p>

                      {/* إضافة للسلة */}

                      <button
                        type="button"
                        className="add-to-cart-btn"
                        onClick={(
                          event
                        ) => {

                          event.stopPropagation();

                          if (
                            addToCart
                          ) {
                            addToCart({
                              ...product,
                              quantity: 1,
                            });
                          }

                        }}
                      >
                        🛒 أضف للسلة
                      </button>

                    </div>

                  </article>

                </SwiperSlide>
              );
            }
          )}

        </Swiper>

      </div>

    </section>
  );
}

export default ProductsSlider;