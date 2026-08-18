import React, {
  useContext
} from "react";

import {
  useNavigate
} from "react-router-dom";

import "./ProductCard.css";

import {
  CartContext
} from "../../context/CartContext";

import {
  WishlistContext
} from "../../context/WishlistContext";


function ProductCard({ product }) {

  // =====================================================
  // NAVIGATION
  // =====================================================

  const navigate = useNavigate();


  // =====================================================
  // CART
  // =====================================================

  const {
    addToCart
  } = useContext(CartContext);


  // =====================================================
  // WISHLIST
  // =====================================================

  const {
    toggleWishlist,
    isFavorite
  } = useContext(WishlistContext);


  // =====================================================
  // PRODUCT ID
  // =====================================================

  const productId =
    product?.id ||
    product?._id;


  // =====================================================
  // FAVORITE
  // =====================================================

  const favorite =
    isFavorite(productId);


  // =====================================================
  // PRODUCT DATA
  // =====================================================

  const title =
    product?.title ||
    product?.name ||
    "منتج بدون اسم";


  const image =
    product?.image ||
    "https://via.placeholder.com/300";


  const price =
    Number(product?.price || 0);


  const oldPrice =
    Number(product?.oldPrice || 0);


  const description =
    product?.description ||
    "منتج مميز بجودة عالية";


  // =====================================================
  // OFFER PERCENTAGE
  // =====================================================

  const hasOffer =
    Boolean(
      product?.offer &&
      oldPrice > price &&
      oldPrice > 0
    );


  const discountPercentage =
    hasOffer
      ? Math.round(
          (
            (oldPrice - price) /
            oldPrice
          ) * 100
        )
      : 0;


  // =====================================================
  // OPEN PRODUCT DETAILS
  // =====================================================

  const handleProductClick = () => {

    if (!productId) {
      return;
    }

    navigate(
      `/product/${productId}`
    );

  };


  // =====================================================
  // WISHLIST
  // =====================================================

  const handleWishlist = (e) => {

    e.stopPropagation();

    toggleWishlist(product);

  };


  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = (e) => {

    e.stopPropagation();

    if (addToCart) {
      addToCart(product);
    }

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      className="product-card"
      onClick={handleProductClick}
    >

      {/* =================================================
          IMAGE
          ================================================= */}

      <div className="image-box">


        {/* WISHLIST */}

        <button
          type="button"
          className="wishlist-btn"
          aria-label={
            favorite
              ? "إزالة المنتج من المفضلة"
              : "إضافة المنتج للمفضلة"
          }
          onClick={handleWishlist}
        >

          {
            favorite
              ? "❤️"
              : "🤍"
          }

        </button>


        {/* OFFER */}

        {
          hasOffer && (

            <span className="offer-badge">

              🔥 -
              {discountPercentage}
              %

            </span>

          )
        }


        {/* PRODUCT IMAGE */}

        <img
          src={image}
          alt={title}
          loading="lazy"
        />

      </div>


      {/* =================================================
          TITLE
          ================================================= */}

      <h3>
        {title}
      </h3>


      {/* =================================================
          DESCRIPTION
          ================================================= */}

      <p className="description">
        {description}
      </p>


      {/* =================================================
          PRICE
          ================================================= */}

      <div className="product-price">


        {
          hasOffer && (

            <span className="old-price">

              {
                oldPrice.toLocaleString(
                  "ar-EG"
                )
              }

              {" "}ج.م

            </span>

          )
        }


        <span className="current-price">

          {
            price.toLocaleString(
              "ar-EG"
            )
          }

          {" "}ج.م

        </span>


      </div>


      {/* =================================================
          ADD TO CART
          ================================================= */}

      <button
        type="button"
        onClick={handleAddToCart}
      >

        🛒 أضف للسلة

      </button>


    </div>

  );

}


export default ProductCard;