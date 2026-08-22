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


// =====================================================
// PRODUCTS SLIDER
// =====================================================

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

  const navigate =
    useNavigate();


  // =====================================================
  // NO PRODUCTS
  // =====================================================

  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {

    return null;

  }


  // =====================================================
  // OPEN CATEGORY
  // =====================================================

  const openCategory =
    () => {

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
  // TITLE CLICK
  // =====================================================

  const handleTitleClick =
    () => {

      if (
        typeof onTitleClick ===
        "function"
      ) {

        onTitleClick();

        return;

      }


      openCategory();

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
  // RATING
  // =====================================================

  const renderRating =
    (rating) => {

      const safeValue =
        Number.isFinite(
          Number(rating)
        )
          ? Math.min(
              5,
              Math.max(
                0,
                Number(rating)
              )
            )
          : 0;


      const rounded =
        Math.round(
          safeValue
        );


      return (
        <>
          {"★".repeat(
            rounded
          )}

          {"☆".repeat(
            5 - rounded
          )}
        </>
      );

    };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <section
      className="products-slider-section"
    >

      {/* =================================================
          HEADER
      ================================================= */}

      {!hideHeader && (

        <div
          className="products-slider-header"
        >

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


      {/* =================================================
          SLIDER
      ================================================= */}

      <div
        className="products-slider-wrapper"
      >

        <Swiper
          modules={[
            Navigation,
          ]}
          navigation

          slidesPerView={2}

          spaceBetween={8}

          watchOverflow={
            true
          }

          observer={
            true
          }

          observeParents={
            true
          }

          breakpoints={{

            // =============================================
            // MOBILE
            // =============================================

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


            // =============================================
            // TABLET
            // =============================================

            600: {
              slidesPerView: 3,
              spaceBetween: 12,
            },

            768: {
              slidesPerView: 3,
              spaceBetween: 14,
            },


            // =============================================
            // DESKTOP
            // =============================================

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
            (
              product,
              index
            ) => {

              // =========================================
              // PRODUCT ID
              // =========================================

              const id =
                product?.id ||
                product?._id ||
                `product-${index}`;


              // =========================================
              // PRODUCT TITLE
              // =========================================

              const productTitle =
                product?.title ||
                product?.name ||
                product?.productName ||
                "منتج";


              // =========================================
              // IMAGE
              // =========================================

              const image =
                product?.image ||
                product?.images?.[0] ||
                "/default-product.png";


              // =========================================
              // RATING
              // =========================================

              const ratingValue =
                Number(
                  product?.rating ??
                  0
                );


              const safeRatingValue =
                Number.isFinite(
                  ratingValue
                )
                  ? Math.min(
                      5,
                      Math.max(
                        0,
                        ratingValue
                      )
                    )
                  : 0;


              // =========================================
              // PRICE
              // =========================================

              const safePrice =
                Number.isFinite(
                  Number(
                    product?.price
                  )
                )
                  ? Number(
                      product?.price
                    )
                  : 0;


              // =========================================
              // OLD PRICE
              // =========================================

              const safeOldPrice =
                Number.isFinite(
                  Number(
                    product?.oldPrice
                  )
                )
                  ? Number(
                      product?.oldPrice
                    )
                  : 0;


              // =========================================
              // DISCOUNT
              // =========================================

              const discount =
                safeOldPrice >
                  safePrice &&
                safeOldPrice >
                  0

                  ? Math.round(
                      (
                        (
                          safeOldPrice -
                          safePrice
                        ) /
                        safeOldPrice
                      ) *
                      100
                    )

                  : 0;


              // =========================================
              // CARD
              // =========================================

              return (

                <SwiperSlide
                  key={id}
                >

                  <article
                    className="product-card"
                    onClick={() =>
                      openProduct(
                        id
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(
                      event
                    ) => {

                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {

                        event.preventDefault();

                        openProduct(
                          id
                        );

                      }

                    }}
                  >

                    {/* ===================================
                        CUSTOM BADGE
                    =================================== */}

                    {badge && (

                      <span
                        className={`product-badge ${
                          badgeClass || ""
                        }`}
                      >

                        {
                          badge
                        }

                      </span>

                    )}


                    {/* ===================================
                        DISCOUNT
                    =================================== */}

                    {discount >
                      0 && (

                      <span
                        className="discount-badge"
                      >

                        -{discount}%

                      </span>

                    )}


                    {/* ===================================
                        NEW
                    =================================== */}

                    {product?.newArrival && (

                      <span
                        className="new-badge"
                      >

                        جديد

                      </span>

                    )}


                    {/* ===================================
                        BEST SELLER
                    =================================== */}

                    {product?.bestSeller &&
                      !badge && (

                      <span
                        className="product-badge best"
                      >

                        ⭐

                      </span>

                    )}


                    {/* ===================================
                        IMAGE
                    =================================== */}

                    <div
                      className="product-img-container"
                    >

                      <img
                        src={image}
                        alt={
                          productTitle
                        }
                        loading="lazy"
                        draggable={
                          false
                        }
                        onError={(
                          event
                        ) => {

                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            "/default-product.png";

                        }}
                      />

                    </div>


                    {/* ===================================
                        CONTENT
                    =================================== */}

                    <div
                      className="product-card-content"
                    >

                      <h3
                        title={
                          productTitle
                        }
                      >

                        {
                          productTitle
                        }

                      </h3>


                      {/* =================================
                          RATING
                      ================================= */}

                      <div
                        className="rating"
                        aria-label={`التقييم ${safeRatingValue} من 5`}
                      >

                        {
                          renderRating(
                            safeRatingValue
                          )
                        }


                        {safeRatingValue >
                          0 && (

                          <span
                            className="rating-number"
                          >

                            {" "}

                            {
                              safeRatingValue.toFixed(
                                1
                              )
                            }

                          </span>

                        )}

                      </div>


                      {/* =================================
                          PRICE
                      ================================= */}

                      <p
                        className="product-price"
                      >

                        <strong>

                          {
                            safePrice.toLocaleString(
                              "ar-EG"
                            )
                          }

                          {" "}
                          جنيه

                        </strong>


                        {safeOldPrice >
                          safePrice && (

                          <del>

                            {
                              safeOldPrice.toLocaleString(
                                "ar-EG"
                              )
                            }

                            {" "}
                            جنيه

                          </del>

                        )}

                      </p>


                      {/* =================================
                          ADD TO CART
                      ================================= */}

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