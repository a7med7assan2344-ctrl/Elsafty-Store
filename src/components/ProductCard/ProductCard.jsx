import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import "./ProductCard.css";

import { CartContext } from "../../context/CartContext";
import { WishlistContext } from "../../context/WishlistContext";

const safeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const getFirstValue = (...values) => {
  for (const value of values) {
    const normalized = safeString(value);

    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const getNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const getImage = (product) => {
  if (!product) {
    return "";
  }

  return getFirstValue(
    product.image,
    product.imageUrl,
    product.imageURL,
    product.photo,
    product.productImage,
    product.thumbnail,
    product.mainImage,
    Array.isArray(product.images)
      ? product.images[0]
      : ""
  );
};

const isExternalUrl = (value) =>
  /^https?:\/\//i.test(safeString(value));

function ProductCard({
  product,
  storeSettings = {},
  onProductClick,
}) {
  const navigate = useNavigate();

  /* =====================================================
     CART
  ===================================================== */

  const cartContext = useContext(CartContext) || {};

  const addToCart = cartContext.addToCart;

  /* =====================================================
     WISHLIST
  ===================================================== */

  const wishlistContext =
    useContext(WishlistContext) || {};

  const toggleWishlist =
    wishlistContext.toggleWishlist;

  const isFavorite =
    wishlistContext.isFavorite;

  /* =====================================================
     PRODUCT ID
  ===================================================== */

  const productId = getFirstValue(
    product?.id,
    product?._id,
    product?.productId
  );

  /* =====================================================
     PRODUCT DATA
  ===================================================== */

  const title = getFirstValue(
    product?.title,
    product?.name,
    product?.productName
  );

  const description = getFirstValue(
    product?.description,
    product?.shortDescription,
    product?.subtitle,
    product?.summary
  );

  const image = getImage(product);

  const price = getNumber(
    product?.price ??
      product?.salePrice ??
      product?.currentPrice,
    0
  );

  const oldPrice = getNumber(
    product?.oldPrice ??
      product?.compareAtPrice ??
      product?.originalPrice ??
      product?.beforePrice,
    0
  );

  /* =====================================================
     PRODUCT STATUS
  ===================================================== */

  const isActive =
    product?.active !== false &&
    product?.enabled !== false &&
    product?.visible !== false;

  const stock = getNumber(
    product?.stock ??
      product?.quantity ??
      product?.inventory,
    0
  );

  const hasStockField =
    product?.stock !== undefined ||
    product?.quantity !== undefined ||
    product?.inventory !== undefined;

  const isOutOfStock =
    product?.outOfStock === true ||
    product?.soldOut === true ||
    (hasStockField && stock <= 0);

  /* =====================================================
     OFFER
  ===================================================== */

  const hasOffer =
    oldPrice > price &&
    oldPrice > 0 &&
    price >= 0;

  const discountPercentage = useMemo(() => {
    if (!hasOffer) {
      return 0;
    }

    return Math.max(
      0,
      Math.round(
        ((oldPrice - price) / oldPrice) * 100
      )
    );
  }, [hasOffer, oldPrice, price]);

  /* =====================================================
     ADMIN-CONTROLLED LABELS
  ===================================================== */

  const cardSettings =
    storeSettings?.productCard ||
    storeSettings?.productCardSettings ||
    {};

  const addToCartText = getFirstValue(
    cardSettings.addToCartText,
    cardSettings.cartButtonText,
    storeSettings?.addToCartText,
    "أضف للسلة"
  );

  const outOfStockText = getFirstValue(
    cardSettings.outOfStockText,
    storeSettings?.outOfStockText,
    "غير متوفر"
  );

  const offerPrefix = getFirstValue(
    cardSettings.offerPrefix,
    storeSettings?.offerPrefix,
    "-"
  );

  const currency = getFirstValue(
    product?.currency,
    storeSettings?.currency,
    storeSettings?.currencySymbol,
    "ج.م"
  );

  /* =====================================================
     CARD DISPLAY SETTINGS
  ===================================================== */

  const showDescription =
    cardSettings.showDescription !== false;

  const showWishlist =
    cardSettings.showWishlist !== false;

  const showOfferBadge =
    cardSettings.showOfferBadge !== false;

  const showAddToCart =
    cardSettings.showAddToCart !== false;

  const showOldPrice =
    cardSettings.showOldPrice !== false;

  const showStockStatus =
    cardSettings.showStockStatus === true;

  const showProductBadge =
    cardSettings.showProductBadge !== false;

  /* =====================================================
     PRODUCT BADGE
  ===================================================== */

  const productBadge = getFirstValue(
    product?.badge,
    product?.label,
    product?.tag,
    product?.ribbon
  );

  /* =====================================================
     FAVORITE
  ===================================================== */

  const favorite =
    typeof isFavorite === "function"
      ? Boolean(isFavorite(productId))
      : false;

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const handleProductClick = () => {
    if (!productId) {
      return;
    }

    if (typeof onProductClick === "function") {
      onProductClick(product);
      return;
    }

    navigate(`/product/${productId}`);
  };

  /* =====================================================
     WISHLIST
  ===================================================== */

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      !productId ||
      typeof toggleWishlist !== "function"
    ) {
      return;
    }

    toggleWishlist(product);
  };

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      isOutOfStock ||
      typeof addToCart !== "function"
    ) {
      return;
    }

    addToCart(product);
  };

  /* =====================================================
     IMAGE FALLBACK
  ===================================================== */

  const handleImageError = (event) => {
    event.currentTarget.style.display = "none";

    const parent =
      event.currentTarget.parentElement;

    if (parent) {
      parent.classList.add(
        "product-image-error"
      );
    }
  };

  /* =====================================================
     LINK
  ===================================================== */

  const productLink =
    getFirstValue(
      product?.link,
      product?.url,
      product?.productUrl
    );

  const hasExternalProductLink =
    isExternalUrl(productLink);

  /* =====================================================
     RENDER
  ===================================================== */

  if (!product || !isActive) {
    return null;
  }

  return (
    <article
      className={[
        "product-card",
        isOutOfStock
          ? "product-card-out-of-stock"
          : "",
        favorite
          ? "product-card-favorite"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleProductClick}
      role="article"
    >
      {/* =================================================
          IMAGE
      ================================================= */}

      <div className="image-box">

        {showWishlist && (
          <button
            type="button"
            className={[
              "wishlist-btn",
              favorite
                ? "wishlist-active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={
              favorite
                ? "إزالة المنتج من المفضلة"
                : "إضافة المنتج للمفضلة"
            }
            aria-pressed={favorite}
            onClick={handleWishlist}
          >
            <span aria-hidden="true">
              {favorite ? "♥" : "♡"}
            </span>
          </button>
        )}

        {/* OFFER */}

        {showOfferBadge && hasOffer && (
          <span
            className="offer-badge"
            aria-label={`خصم ${discountPercentage}%`}
          >
            {offerPrefix}
            {discountPercentage}%
          </span>
        )}

        {/* CUSTOM PRODUCT BADGE */}

        {showProductBadge &&
          productBadge && (
            <span className="product-badge">
              {productBadge}
            </span>
          )}

        {/* IMAGE */}

        <div className="product-image-wrapper">
          {image ? (
            <img
              src={image}
              alt={title || "منتج"}
              className="product-image"
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
          ) : (
            <div
              className="product-image-placeholder"
              aria-label="لا توجد صورة للمنتج"
            >
              <span aria-hidden="true">
                🛍️
              </span>
            </div>
          )}
        </div>

        {/* OUT OF STOCK */}

        {isOutOfStock && (
          <div className="product-stock-overlay">
            <span>
              {outOfStockText}
            </span>
          </div>
        )}
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="product-card-content">

        {/* TITLE */}

        <h3
          className="product-title"
          title={title}
        >
          {title || "منتج"}
        </h3>

        {/* DESCRIPTION */}

        {showDescription &&
          description && (
            <p className="description">
              {description}
            </p>
          )}

        {/* STOCK */}

        {showStockStatus &&
          !isOutOfStock &&
          hasStockField && (
            <div className="product-stock">
              {stock > 0
                ? `متوفر: ${stock}`
                : outOfStockText}
            </div>
          )}

        {/* PRICE */}

        <div className="product-price">

          {showOldPrice &&
            hasOffer && (
              <span className="old-price">
                {oldPrice.toLocaleString(
                  "ar-EG"
                )}
                {" "}
                {currency}
              </span>
            )}

          <span className="current-price">
            {price.toLocaleString(
              "ar-EG"
            )}
            {" "}
            {currency}
          </span>
        </div>

        {/* ACTION */}

        {showAddToCart && (
          <button
            type="button"
            className="add-to-cart-btn"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            <span
              className="cart-icon"
              aria-hidden="true"
            >
              🛒
            </span>

            <span>
              {isOutOfStock
                ? outOfStockText
                : addToCartText}
            </span>
          </button>
        )}

        {/* EXTERNAL PRODUCT LINK */}

        {hasExternalProductLink && (
          <a
            href={productLink}
            target="_blank"
            rel="noopener noreferrer"
            className="product-external-link"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            عرض المنتج
          </a>
        )}
      </div>
    </article>
  );
}

export default ProductCard;