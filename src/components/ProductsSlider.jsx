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
}) {
  const navigate = useNavigate();

  // لو مفيش منتجات، متعرضش القسم
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="products-slider-section">

      {/* =====================
          HEADER
      ===================== */}
      <div className="products-slider-header">

        <h2 className="section-title">
          {title}
        </h2>

        <button
          type="button"
          className="view-all-btn"
          onClick={() => {
            document
              .querySelector(".products-section")
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
          }}
        >
          عرض الكل
        </button>

      </div>


      {/* =====================
          PRODUCTS SLIDER
      ===================== */}
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

        {products.map((product) => {

          const id =
            product.id ||
            product._id;

          const productTitle =
            product.title ||
            product.name ||
            "منتج";

          const image =
            product.image ||
            product.images?.[0] ||
            "/default-product.png";

          const rating = Math.min(
            5,
            Math.max(
              0,
              Math.floor(
                Number(product.rating || 5)
              )
            )
          );

          return (
            <SwiperSlide key={id}>

              <div
                className="product-card"
                onClick={() =>
                  navigate(`/product/${id}`)
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
                    IMAGE
                ===================== */}
                <div className="product-img-container">

                  <img
                    src={image}
                    alt={productTitle}
                    loading="lazy"
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


                  {/* =====================
                      RATING
                  ===================== */}
                  <div className="rating">

                    {"⭐".repeat(rating)}

                  </div>


                  {/* =====================
                      PRICE
                  ===================== */}
                  <p className="product-price">

                    {product.oldPrice ? (
                      <>
                        <del>
                          {product.oldPrice} جنيه
                        </del>

                        <strong>
                          {product.price || 0} جنيه
                        </strong>
                      </>
                    ) : (
                      <strong>
                        {product.price || 0} جنيه
                      </strong>
                    )}

                  </p>


                  {/* =====================
                      ADD TO CART
                  ===================== */}
                  <button
                    type="button"
                    className="add-to-cart-btn"
                    onClick={(e) => {

                      e.stopPropagation();

                      if (addToCart) {
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

              </div>

            </SwiperSlide>
          );
        })}

      </Swiper>

    </section>
  );
}

export default ProductsSlider;