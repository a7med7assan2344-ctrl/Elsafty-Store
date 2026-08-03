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

  if (!products.length) return null;

  return (
    <section className="products-slider-section">

      <h2 className="section-title">
        {title}
      </h2>

      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={20}
        breakpoints={{
          320: { slidesPerView: 1 },
          600: { slidesPerView: 2 },
          900: { slidesPerView: 3 },
          1200: { slidesPerView: 4 },
        }}
      >
        {products.map((product) => {
          const id = product.id || product._id;

          return (
            <SwiperSlide key={id}>
              <div
                className="product-card"
                onClick={() => navigate(`/product/${id}`)}
              >
                <span className={`product-badge ${badgeClass}`}>
                  {badge}
                </span>

                <div className="product-img-container">
                  <img
                    src={product.image || "/default-product.png"}
                    alt={product.title || product.name || "product"}
                    loading="lazy"
                  />
                </div>

                <h3>
                  {product.title || product.name || "منتج"}
                </h3>

                <div className="rating">
                  {"⭐".repeat(Math.floor(product.rating || 5))}
                </div>

                <p className="product-price">
                  {product.oldPrice ? (
                    <>
                      <del
                        style={{
                          color: "#888",
                          marginLeft: "8px",
                        }}
                      >
                        {product.oldPrice} جنيه
                      </del>

                      <strong>{product.price} جنيه</strong>
                    </>
                  ) : (
                    <strong>{product.price || 0} جنيه</strong>
                  )}
                </p>

                <button
                  className="add-to-cart-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                >
                  🛒 أضف للسلة
                </button>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}

export default ProductsSlider;