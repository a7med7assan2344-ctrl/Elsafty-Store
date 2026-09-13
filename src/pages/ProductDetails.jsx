import React, {
useState,
useContext,
useEffect,
useMemo
} from "react";

import {
useNavigate
} from "react-router-dom";

import "./ProductDetails.css";

import {
CartContext
} from "../context/CartContext";

import {
addReview,
getReviews,
getRating
} from "../services/reviewService";

function ProductDetails({ product }) {

const navigate = useNavigate();

const {
addToCart,
cart
} = useContext(CartContext);

// =====================================================
// STATES
// =====================================================

const [quantity, setQuantity] =
useState(1);

const [selectedVariant, setSelectedVariant] =
useState(null);

const [selectedOptions, setSelectedOptions] =
useState({});

const [selectedImage, setSelectedImage] =
useState("");

const [zoom, setZoom] =
useState(false);

const [lightbox, setLightbox] =
useState(false);

const [lightboxIndex, setLightboxIndex] =
useState(0);

const [reviews, setReviews] =
useState([]);

const [average, setAverage] =
useState(0);

const [reviewCount, setReviewCount] =
useState(0);

const [userRating, setUserRating] =
useState(5);

const [comment, setComment] =
useState("");

const [copied, setCopied] =
useState(false);

// =====================================================
// PRODUCT IMAGES
// =====================================================

const productImages = useMemo(() => {

if (!product) {
  return [];
}


const images = [];


// الصور الرئيسية

if (
  Array.isArray(product.images)
) {

  product.images.forEach((image) => {

    if (
      typeof image === "string" &&
      image.trim()
    ) {

      images.push(image);

    }

  });

}


// الصورة القديمة

if (
  typeof product.image === "string" &&
  product.image.trim()
) {

  images.push(product.image);

}


// صور Gallery القديمة لو موجودة

if (
  Array.isArray(product.gallery)
) {

  product.gallery.forEach((image) => {

    if (
      typeof image === "string" &&
      image.trim()
    ) {

      images.push(image);

    }

  });

}


// إزالة الصور المكررة

return [
  ...new Set(images)
];

}, [product]);

// =====================================================
// ALL VARIANTS
// =====================================================

const variants = useMemo(() => {

if (
  !product ||
  !Array.isArray(product.variants)
) {

  return [];

}


return product.variants.filter(
  Boolean
);

}, [product]);

const hasVariants =
product?.hasVariants === true &&
variants.length > 0;

// =====================================================
// VARIANT ATTRIBUTES
//
// يدعم:
//
// variant.attributes = {
//   color: "أحمر",
//   size: "XL"
// }
//
// أو:
//
// variant.options = {
//   color: "أحمر",
//   size: "XL"
// }
//
// =====================================================

const getVariantAttributes = (
variant
) => {

if (!variant) {
  return {};
}


const attributes =
  variant.attributes ||
  variant.options ||
  variant.specifications ||
  {};


if (
  typeof attributes !== "object" ||
  Array.isArray(attributes)
) {

  return {};

}


return attributes;

};

// =====================================================
// ATTRIBUTE GROUPS
// =====================================================

const attributeGroups = useMemo(() => {

const groups = {};


variants.forEach((variant) => {

  const attributes =
    getVariantAttributes(
      variant
    );


  Object.entries(attributes)
    .forEach(
      ([key, value]) => {

        if (
          value === undefined ||
          value === null ||
          value === ""
        ) {

          return;

        }


        if (!groups[key]) {
          groups[key] = [];
        }


        const stringValue =
          String(value);


        if (
          !groups[key].includes(
            stringValue
          )
        ) {

          groups[key].push(
            stringValue
          );

        }

      }
    );

});


return groups;

}, [variants]);

const hasAttributeVariants =
Object.keys(
attributeGroups
).length > 0;

// =====================================================
// ATTRIBUTE DISPLAY NAMES
// =====================================================

const formatAttributeName = (
key
) => {

const names = {

  color: "اللون",

  colour: "اللون",

  size: "المقاس",

  material: "الخامة",

  weight: "الوزن",

  type: "النوع",

  model: "الموديل",

  style: "الشكل",

  capacity: "السعة",

  flavor: "النكهة",

  volume: "الحجم",

  sizeName: "المقاس"

};


return (
  names[key] ||
  key
);

};

// =====================================================
// CURRENT PRICE
// =====================================================

const currentPrice =
hasVariants && selectedVariant
? Number(
selectedVariant.price ??
product.price ??
0
)
: Number(
product?.price || 0
);

// =====================================================
// CURRENT OLD PRICE
// =====================================================

const currentOldPrice =
hasVariants && selectedVariant
? Number(
selectedVariant.oldPrice ??
product.oldPrice ??
0
)
: Number(
product?.oldPrice || 0
);

// =====================================================
// CURRENT STOCK
// =====================================================

const currentStock =
hasVariants && selectedVariant
? Number(
selectedVariant.stock ?? 0
)
: Number(
product?.stock || 0
);

// =====================================================
// CURRENT SKU
// =====================================================

const currentSKU =
selectedVariant?.sku ||
selectedVariant?.SKU ||
product?.sku ||
product?.SKU ||
"";

// =====================================================
// CART COUNT
// =====================================================

const cartCount =
(cart || []).reduce(
(total, item) =>
total +
Number(
item.quantity || 0
),
0
);

// =====================================================
// CURRENT IMAGE INDEX
// =====================================================

const currentImageIndex =
Math.max(
0,
productImages.indexOf(
selectedImage
)
);

// =====================================================
// VARIANT IMAGES
// =====================================================

const getVariantImages = (
variant
) => {

if (!variant) {
  return [];
}


const images = [];


if (
  typeof variant.image === "string" &&
  variant.image.trim()
) {

  images.push(
    variant.image
  );

}


if (
  Array.isArray(
    variant.images
  )
) {

  variant.images.forEach(
    (image) => {

      if (
        typeof image === "string" &&
        image.trim()
      ) {

        images.push(image);

      }

    }
  );

}


if (
  typeof variant.imageUrl === "string" &&
  variant.imageUrl.trim()
) {

  images.push(
    variant.imageUrl
  );

}


return [
  ...new Set(images)
];

};

// =====================================================
// CHANGE PRODUCT
// =====================================================

useEffect(() => {

if (!product) {
  return;
}


setQuantity(1);

setZoom(false);

setLightbox(false);

setCopied(false);

setSelectedOptions({});


// ================================================
// أول صورة
// ================================================

setSelectedImage(
  productImages[0] ||
  ""
);


// ================================================
// أول Variant متاح
// ================================================

if (hasVariants) {

  const availableVariant =
    variants.find(
      (variant) =>
        Number(
          variant?.stock || 0
        ) > 0
    ) ||
    variants[0];


  setSelectedVariant(
    availableVariant || null
  );


  // لو عنده Attributes

  if (availableVariant) {

    setSelectedOptions(
      getVariantAttributes(
        availableVariant
      )
    );

  }

} else {

  setSelectedVariant(
    null
  );

}

}, [
product,
productImages,
hasVariants,
variants
]);

// =====================================================
// LOAD REVIEWS
// =====================================================

useEffect(() => {

if (!product?.id) {
  return;
}


const loadReviews =
  async () => {

    try {

      const list =
        await getReviews(
          product.id
        );


      const rating =
        await getRating(
          product.id
        );


      setReviews(
        list || []
      );


      setAverage(
        Number(
          rating?.average || 0
        )
      );


      setReviewCount(
        Number(
          rating?.count || 0
        )
      );

    } catch (error) {

      console.log(
        "خطأ في تحميل التقييمات:",
        error
      );


      setReviews([]);

      setAverage(0);

      setReviewCount(0);

    }

  };


loadReviews();

}, [product]);

// =====================================================
// SELECT VARIANT DIRECTLY
// =====================================================

const handleVariantChange =
(variant) => {

  if (!variant) {
    return;
  }


  const stock =
    Number(
      variant.stock || 0
    );


  if (stock <= 0) {
    return;
  }


  setSelectedVariant(
    variant
  );


  setSelectedOptions(
    getVariantAttributes(
      variant
    )
  );


  setQuantity(1);


  // ================================================
  // تغيير الصورة حسب الـ Variant
  // ================================================

  const variantImages =
    getVariantImages(
      variant
    );


  if (
    variantImages.length > 0
  ) {

    const image =
      variantImages[0];


    setSelectedImage(
      image
    );

    setZoom(false);

  }

};

// =====================================================
// SELECT ATTRIBUTE
// =====================================================

const handleAttributeChange =
(
attribute,
value
) => {

  const nextOptions = {

    ...selectedOptions,

    [attribute]:
      value

  };


  setSelectedOptions(
    nextOptions
  );


  // ================================================
  // البحث عن Variant مطابق
  // ================================================

  const matchingVariant =
    variants.find(
      (variant) => {

        const attributes =
          getVariantAttributes(
            variant
          );


        return Object.entries(
          nextOptions
        ).every(
          ([key, selectedValue]) =>
            String(
              attributes[key] ?? ""
            ) ===
            String(
              selectedValue
            )
        );

      }
    );


  if (matchingVariant) {

    setSelectedVariant(
      matchingVariant
    );


    setQuantity(1);


    const variantImages =
      getVariantImages(
        matchingVariant
      );


    if (
      variantImages.length > 0
    ) {

      setSelectedImage(
        variantImages[0]
      );

    }

  } else {

    // لسه الاختيارات مش مكتملة

    setSelectedVariant(
      null
    );

    setQuantity(1);

  }

};

// =====================================================
// CHECK OPTION AVAILABILITY
// =====================================================

const isAttributeValueAvailable =
(
attribute,
value
) => {

  return variants.some(
    (variant) => {

      if (
        Number(
          variant?.stock || 0
        ) <= 0
      ) {

        return false;

      }


      const attributes =
        getVariantAttributes(
          variant
        );


      if (
        String(
          attributes[attribute] ?? ""
        ) !==
        String(value)
      ) {

        return false;

      }


      return Object.entries(
        selectedOptions
      )
        .filter(
          ([key]) =>
            key !== attribute
        )
        .every(
          ([key, selectedValue]) =>
            String(
              attributes[key] ?? ""
            ) ===
            String(
              selectedValue
            )
        );

    }
  );

};

// =====================================================
// INCREASE QUANTITY
// =====================================================

const increaseQuantity =
() => {

  if (
    currentStock <= 0
  ) {

    alert(
      "هذا المنتج غير متوفر حالياً"
    );

    return;

  }


  if (
    quantity >= currentStock
  ) {

    alert(
      "الكمية المطلوبة أكبر من المخزون المتاح"
    );

    return;

  }


  setQuantity(
    (prev) =>
      prev + 1
  );

};

// =====================================================
// DECREASE QUANTITY
// =====================================================

const decreaseQuantity =
() => {

  setQuantity(
    (prev) =>
      prev > 1
        ? prev - 1
        : 1
  );

};

// =====================================================
// ADD TO CART
// =====================================================

const handleAddToCart =
() => {

  if (
    hasVariants &&
    !selectedVariant
  ) {

    alert(
      hasAttributeVariants
        ? "اختار كل خيارات المنتج أولاً"
        : "اختر النوع أولاً"
    );

    return;

  }


  if (
    currentStock <= 0
  ) {

    alert(
      "هذا المنتج غير متوفر حالياً"
    );

    return;

  }


  if (
    quantity >
    currentStock
  ) {

    alert(
      "الكمية المطلوبة أكبر من المخزون المتاح"
    );

    return;

  }


  const cartId =
    selectedVariant
      ? `${product.id}-${selectedVariant.id}`
      : product.id;


  addToCart({

    ...product,

    price:
      currentPrice,

    oldPrice:
      currentOldPrice,

    stock:
      currentStock,

    quantity,

    cartId,

    selectedVariant:
      selectedVariant
        ? {
            ...selectedVariant
          }
        : null,

    selectedOptions:
      {
        ...selectedOptions
      },

    selectedImage:
      selectedImage || null,

    sku:
      currentSKU

  });


  alert(
    `تم إضافة ${quantity} من المنتج للسلة 🛒`
  );

};

// =====================================================
// IMAGE NAVIGATION
// =====================================================

const showPreviousImage =
() => {

  if (
    productImages.length <= 1
  ) {
    return;
  }


  const nextIndex =
    currentImageIndex <= 0
      ? productImages.length - 1
      : currentImageIndex - 1;


  setSelectedImage(
    productImages[nextIndex]
  );


  setZoom(false);

};

const showNextImage =
() => {

  if (
    productImages.length <= 1
  ) {
    return;
  }


  const nextIndex =
    currentImageIndex >=
    productImages.length - 1
      ? 0
      : currentImageIndex + 1;


  setSelectedImage(
    productImages[nextIndex]
  );


  setZoom(false);

};

// =====================================================
// OPEN LIGHTBOX
// =====================================================

const openLightbox =
() => {

  if (
    productImages.length === 0
  ) {
    return;
  }


  setLightboxIndex(
    currentImageIndex
  );


  setLightbox(true);

};

// =====================================================
// LIGHTBOX NAVIGATION
// =====================================================

const changeLightboxImage =
(direction) => {

  if (
    productImages.length <= 1
  ) {
    return;
  }


  setLightboxIndex(
    (prev) => {

      if (direction === "next") {

        return prev >=
          productImages.length - 1
          ? 0
          : prev + 1;

      }


      return prev <= 0
        ? productImages.length - 1
        : prev - 1;

    }
  );

};

// =====================================================
// UPDATE MAIN IMAGE AFTER LIGHTBOX
// =====================================================

useEffect(() => {

if (
  !lightbox ||
  !productImages[
    lightboxIndex
  ]
) {

  return;

}


setSelectedImage(
  productImages[
    lightboxIndex
  ]
);

}, [
lightboxIndex,
lightbox,
productImages
]);

// =====================================================
// ESCAPE KEY
// =====================================================

useEffect(() => {

if (!lightbox) {
  return;
}


const handleKeyDown =
  (event) => {

    if (
      event.key === "Escape"
    ) {

      setLightbox(false);

    }


    if (
      event.key === "ArrowLeft"
    ) {

      changeLightboxImage(
        "next"
      );

    }


    if (
      event.key === "ArrowRight"
    ) {

      changeLightboxImage(
        "prev"
      );

    }

  };


window.addEventListener(
  "keydown",
  handleKeyDown
);


return () =>
  window.removeEventListener(
    "keydown",
    handleKeyDown
  );

}, [
lightbox,
productImages.length
]);

// =====================================================
// SHARE PRODUCT
// =====================================================

const handleShare =
async () => {

  const shareData = {

    title:
      product.title ||
      "منتج",

    text:
      `شوف المنتج ده: ${
        product.title || "منتج"
      }`,

    url:
      window.location.href

  };


  try {

    if (
      navigator.share
    ) {

      await navigator.share(
        shareData
      );

      return;

    }


    await navigator.clipboard.writeText(
      window.location.href
    );


    setCopied(true);


    setTimeout(
      () =>
        setCopied(false),
      2000
    );

  } catch (error) {

    console.log(
      "Share cancelled:",
      error
    );

  }

};

// =====================================================
// SUBMIT REVIEW
// =====================================================

const handleSubmitReview =
async () => {

  if (
    !comment.trim()
  ) {

    alert(
      "اكتب رأيك عن المنتج أولاً"
    );

    return;

  }


  try {

    await addReview(
      product.id,
      {

        rating:
          userRating,

        comment:
          comment.trim()

      }
    );


    const list =
      await getReviews(
        product.id
      );


    const rating =
      await getRating(
        product.id
      );


    setReviews(
      list || []
    );


    setAverage(
      Number(
        rating?.average || 0
      )
    );


    setReviewCount(
      Number(
        rating?.count || 0
      )
    );


    setComment("");

    setUserRating(5);


    alert(
      "تم إضافة تقييمك بنجاح ⭐"
    );

  } catch (error) {

    console.log(
      "Review Error:",
      error
    );


    alert(
      "حدث خطأ أثناء إضافة التقييم"
    );

  }

};

// =====================================================
// NO PRODUCT
// =====================================================

if (!product) {

return (

  <div className="product-not-found">

    <div className="product-not-found-card">

      <div className="not-found-icon">
        🛍️
      </div>

      <h2>
        المنتج غير موجود
      </h2>

      <p>
        المنتج المطلوب غير متاح حالياً.
      </p>

      <button
        type="button"
        className="back-store-btn"
        onClick={() =>
          navigate("/")
        }
      >
        ⬅ العودة للمتجر
      </button>

    </div>

  </div>

);

}

// =====================================================
// PRODUCT RATING
// =====================================================

const displayedRating =
average > 0
? average
: Number(
product.rating || 5
);

// =====================================================
// DISCOUNT
// =====================================================

const discountPercent =
currentOldPrice >
currentPrice &&
currentOldPrice > 0
? Math.round(
(
(
currentOldPrice -
currentPrice
) /
currentOldPrice
) *
100
)
: 0;

// =====================================================
// RETURN
// =====================================================

return (

<div
  className="product-details"
  dir="rtl"
>

  {/* =================================================
      TOP BAR
  ================================================= */}

  <div className="product-details-top">

    <button
      type="button"
      className="back-store-btn"
      onClick={() =>
        navigate("/")
      }
    >
      <span>
        ←
      </span>

      العودة للمتجر

    </button>


    <div className="details-top-actions">

      <button
        type="button"
        className="details-share-btn"
        onClick={
          handleShare
        }
      >

        🔗

        <span>
          {copied
            ? "تم النسخ"
            : "مشاركة"}
        </span>

      </button>


      <button
        type="button"
        className="details-cart-btn"
        onClick={() =>
          navigate("/cart")
        }
      >

        🛒

        <span>
          السلة
        </span>


        {cartCount > 0 && (

          <span className="details-cart-count">
            {cartCount}
          </span>

        )}

      </button>

    </div>

  </div>


  {/* =================================================
      MAIN PRODUCT
  ================================================= */}

  <div className="product-details-main">


    {/* =================================================
        IMAGES
    ================================================= */}

    <section className="product-images-section">


      <div className="product-image-viewer">


        {/* DISCOUNT BADGE */}

        {discountPercent > 0 && (

          <span className="product-discount-badge">
            -{discountPercent}%
          </span>

        )}


        {/* MAIN IMAGE */}

        <div
          className={
            `details-image ${
              zoom
                ? "is-zoomed"
                : ""
            }`
          }
        >

          {selectedImage ? (

            <img
              src={
                selectedImage
              }
              alt={
                product.title ||
                "صورة المنتج"
              }
              className="main-image"
              onMouseEnter={() =>
                setZoom(true)
              }
              onMouseLeave={() =>
                setZoom(false)
              }
              onClick={
                openLightbox
              }
            />

          ) : (

            <div className="product-image-placeholder">
              🛍️
            </div>

          )}


          {productImages.length >
            1 && (

            <>

              <button
                type="button"
                className="image-nav image-nav-prev"
                onClick={
                  showPreviousImage
                }
                aria-label="الصورة السابقة"
              >
                ❮
              </button>


              <button
                type="button"
                className="image-nav image-nav-next"
                onClick={
                  showNextImage
                }
                aria-label="الصورة التالية"
              >
                ❯
              </button>

            </>

          )}


          <button
            type="button"
            className="image-zoom-button"
            onClick={
              openLightbox
            }
            aria-label="تكبير الصورة"
          >
            🔍
          </button>

        </div>


        {/* IMAGE COUNTER */}

        {productImages.length >
          1 && (

          <div className="image-counter">
            {currentImageIndex + 1}
            {" / "}
            {productImages.length}
          </div>

        )}


        {/* THUMBNAILS */}

        {productImages.length >
          0 && (

          <div
            className="image-gallery"
            aria-label="صور المنتج"
          >

            {productImages.map(
              (
                image,
                index
              ) => (

                <button
                  type="button"
                  key={
                    `${image}-${index}`
                  }
                  className={
                    selectedImage ===
                    image
                      ? "gallery-thumb active"
                      : "gallery-thumb"
                  }
                  onClick={() => {

                    setSelectedImage(
                      image
                    );

                    setZoom(false);

                  }}
                >

                  <img
                    src={
                      image
                    }
                    alt={
                      `${product.title || "المنتج"} - صورة ${
                        index + 1
                      }`
                    }
                  />

                </button>

              )
            )}

          </div>

        )}

      </div>

    </section>


    {/* =================================================
        PRODUCT INFO
    ================================================= */}

    <section className="product-info-section">


      {/* CATEGORY */}

      {product.categoryName && (

        <div className="product-category-label">
          {product.categoryName}
        </div>

      )}


      {/* TITLE */}

      <h1 className="product-title">

        {
          product.title ||
          product.name ||
          "منتج بدون اسم"
        }

      </h1>


      {/* RATING */}

      <div className="product-rating">

        <span className="rating-stars">

          {"★".repeat(
            Math.round(
              displayedRating
            )
          )}

          <span className="rating-stars-empty">

            {"★".repeat(
              Math.max(
                0,
                5 -
                  Math.round(
                    displayedRating
                  )
              )
            )}

          </span>

        </span>


        <strong>
          {displayedRating.toFixed(1)}
        </strong>


        {reviewCount > 0 && (

          <span>
            ({reviewCount} تقييم)
          </span>

        )}

      </div>


      {/* SKU */}

      {currentSKU && (

        <div className="product-sku">
          SKU: {currentSKU}
        </div>

      )}


      {/* DESCRIPTION */}

      <div className="product-description">

        <p>
          {
            product.description ||
            "منتج مميز بجودة عالية، مناسب للاستخدام اليومي."
          }
        </p>

      </div>


      {/* =================================================
          ATTRIBUTE VARIANTS
      ================================================= */}

      {hasAttributeVariants && (

        <div className="product-variants attribute-variants">

          {Object.entries(
            attributeGroups
          ).map(
            (
              [
                attribute,
                values
              ]
            ) => (

              <div
                className="variant-attribute-group"
                key={attribute}
              >

                <div className="variant-attribute-header">

                  <h3>
                    {formatAttributeName(
                      attribute
                    )}
                  </h3>


                  {selectedOptions[
                    attribute
                  ] && (

                    <span>
                      {selectedOptions[
                        attribute
                      ]}
                    </span>

                  )}

                </div>


                <div className="attribute-options">

                  {values.map(
                    (value) => {

                      const available =
                        isAttributeValueAvailable(
                          attribute,
                          value
                        );


                      const active =
                        String(
                          selectedOptions[
                            attribute
                          ] ?? ""
                        ) ===
                        String(value);


                      return (

                        <button
                          type="button"
                          key={
                            `${attribute}-${value}`
                          }
                          disabled={
                            !available
                          }
                          className={
                            `attribute-option ${
                              active
                                ? "active"
                                : ""
                            } ${
                              !available
                                ? "disabled"
                                : ""
                            }`
                          }
                          onClick={() =>
                            handleAttributeChange(
                              attribute,
                              value
                            )
                          }
                        >

                          {attribute
                            .toLowerCase()
                            .includes(
                              "color"
                            ) ||
                          attribute
                            .toLowerCase()
                            .includes(
                              "colour"
                            ) ? (

                            <span
                              className="attribute-color-dot"
                              title={value}
                            />

                          ) : null}


                          <span>
                            {value}
                          </span>

                        </button>

                      );

                    }
                  )}

                </div>

              </div>

            )
          )}

        </div>

      )}


      {/* =================================================
          LEGACY VARIANTS
      ================================================= */}

      {hasVariants &&
        !hasAttributeVariants && (

        <div className="product-variants">

          <div className="variant-section-title">

            <h3>
              اختر النوع
            </h3>

          </div>


          <div className="variants-list">

            {variants.map(
              (variant) => {

                const variantStock =
                  Number(
                    variant?.stock || 0
                  );


                const active =
                  selectedVariant?.id ===
                  variant.id;


                return (

                  <button
                    key={
                      variant.id ||
                      JSON.stringify(
                        variant
                      )
                    }
                    type="button"
                    disabled={
                      variantStock <= 0
                    }
                    className={
                      `variant-btn ${
                        active
                          ? "active"
                          : ""
                      } ${
                        variantStock <= 0
                          ? "out-of-stock"
                          : ""
                      }`
                    }
                    onClick={() =>
                      handleVariantChange(
                        variant
                      )
                    }
                  >

                    <span className="variant-name">
                      {
                        variant.name ||
                        variant.title ||
                        "نوع"
                      }
                    </span>


                    <span className="variant-price">

                      {
                        Number(
                          variant.price || 0
                        )
                      }

                      {" "}
                      ج.م

                    </span>


                    {variantStock <=
                      0 && (

                      <small>
                        غير متوفر
                      </small>

                    )}

                  </button>

                );

              }
            )}

          </div>

        </div>

      )}


      {/* =================================================
          PRICE CARD
      ================================================= */}

      <div className="product-price-card">

        <div className="product-price">

          <div className="current-price">

            <strong>
              {(
                currentPrice *
                quantity
              ).toLocaleString(
                "ar-EG"
              )}
            </strong>

            <span>
              ج.م
            </span>

          </div>


          {currentOldPrice >
            currentPrice && (

            <div className="price-before">

              <span className="old-price">
                {Number(
                  currentOldPrice *
                    quantity
                ).toLocaleString(
                  "ar-EG"
                )}{" "}
                ج.م
              </span>


              {discountPercent >
                0 && (

                <span className="discount-text">
                  وفر {(
                    (
                      currentOldPrice -
                      currentPrice
                    ) *
                    quantity
                  ).toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </span>

              )}

            </div>

          )}

        </div>


        {/* STOCK */}

        <div
          className={
            currentStock > 0
              ? "product-stock available"
              : "product-stock unavailable"
          }
        >

          <span>
            {currentStock > 0
              ? "●"
              : "●"}
          </span>


          {currentStock > 0
            ? `متاح في المخزون — ${currentStock} قطعة`
            : "غير متوفر حالياً"}

        </div>

      </div>


      {/* =================================================
          QUANTITY
      ================================================= */}

      <div className="purchase-row">


        <div className="quantity-box">

          <span className="quantity-label">
            الكمية
          </span>


          <div className="quantity-controls">

            <button
              type="button"
              onClick={
                decreaseQuantity
              }
              disabled={
                quantity <= 1
              }
            >
              −
            </button>


            <span className="quantity-number">
              {quantity}
            </span>


            <button
              type="button"
              onClick={
                increaseQuantity
              }
              disabled={
                currentStock <= 0 ||
                quantity >=
                  currentStock
              }
            >
              +
            </button>

          </div>

        </div>


        {/* ADD */}

        <button
          type="button"
          className="add-btn"
          onClick={
            handleAddToCart
          }
          disabled={
            currentStock <= 0 ||
            (
              hasVariants &&
              !selectedVariant
            )
          }
        >

          🛒

          <span>
            أضف للسلة
          </span>

        </button>

      </div>


      {/* VARIANT WARNING */}

      {hasVariants &&
        !selectedVariant && (

        <div className="variant-selection-warning">

          ⚠️

          <span>
            اختر جميع خيارات المنتج لإتمام الطلب
          </span>

        </div>

      )}


      {/* =================================================
          PRODUCT FEATURES
      ================================================= */}

      <div className="product-features">

        <div className="product-feature">

          <span className="feature-icon">
            🚚
          </span>

          <div>
            <strong>
              شحن سريع
            </strong>

            <small>
              توصيل حسب منطقتك
            </small>
          </div>

        </div>


        <div className="product-feature">

          <span className="feature-icon">
            🔒
          </span>

          <div>
            <strong>
              شراء آمن
            </strong>

            <small>
              بياناتك محمية
            </small>
          </div>

        </div>


        <div className="product-feature">

          <span className="feature-icon">
            ↩️
          </span>

          <div>
            <strong>
              خدمة موثوقة
            </strong>

            <small>
              دعم للعملاء
            </small>
          </div>

        </div>

      </div>


    </section>

  </div>


  {/* =====================================================
      REVIEWS SECTION
  ===================================================== */}

  <section className="product-reviews-section">


    <div className="reviews-header">

      <div>

        <span className="section-kicker">
          آراء العملاء
        </span>

        <h2>
          تقييمات المنتج
        </h2>

      </div>


      <div className="reviews-summary">

        <strong>
          {displayedRating.toFixed(1)}
        </strong>

        <span>
          ⭐
        </span>

        <small>
          {reviewCount} تقييم
        </small>

      </div>

    </div>


    {/* =================================================
        REVIEW FORM
    ================================================= */}

    <div className="review-form">

      <h3>
        أضف تقييمك
      </h3>


      <div className="stars-input">

        {[1, 2, 3, 4, 5].map(
          (star) => (

            <button
              type="button"
              key={star}
              className={
                userRating >=
                star
                  ? "star active"
                  : "star"
              }
              onClick={() =>
                setUserRating(
                  star
                )
              }
              aria-label={
                `تقييم ${star} من 5`
              }
            >
              ★
            </button>

          )
        )}

      </div>


      <textarea
        placeholder="اكتب رأيك عن المنتج..."
        value={comment}
        onChange={(event) =>
          setComment(
            event.target.value
          )
        }
      />


      <button
        type="button"
        onClick={
          handleSubmitReview
        }
      >
        إرسال التقييم
      </button>

    </div>


    {/* =================================================
        REVIEWS
    ================================================= */}

    {reviews.length > 0 ? (

      <div className="reviews-list">

        {reviews.map(
          (
            review,
            index
          ) => (

            <article
              className="review-item"
              key={
                review.id ||
                index
              }
            >

              <div className="review-item-header">

                <div className="review-avatar">
                  {
                    (
                      review.userName ||
                      review.name ||
                      "ع"
                    )
                      .charAt(0)
                      .toUpperCase()
                  }
                </div>


                <div>

                  <strong>
                    {
                      review.userName ||
                      review.name ||
                      "عميل"
                    }
                  </strong>


                  <div className="review-stars">

                    {"★".repeat(
                      Math.min(
                        5,
                        Math.max(
                          0,
                          Number(
                            review.rating ||
                            0
                          )
                        )
                      )
                    )}

                  </div>

                </div>

              </div>


              <p>
                {
                  review.comment ||
                  ""
                }
              </p>

            </article>

          )
        )}

      </div>

    ) : (

      <div className="no-reviews">
        لسه مفيش تقييمات للمنتج. كن أول واحد يقيّمه ⭐
      </div>

    )}

  </section>


  {/* =====================================================
      LIGHTBOX
  ===================================================== */}

  {lightbox && (
    <div
      className="product-lightbox"
      role="dialog"
      aria-modal="true"
      onClick={() =>
        setLightbox(false)
      }
    >

      <button
        type="button"
        className="lightbox-close"
        onClick={() =>
          setLightbox(false)
        }
        aria-label="إغلاق"
      >
        ×
      </button>


      {productImages.length >
        1 && (

        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          onClick={(event) => {

            event.stopPropagation();

            changeLightboxImage(
              "prev"
            );

          }}
          aria-label="الصورة السابقة"
        >
          ❮
        </button>

      )}


      <div
        className="lightbox-content"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <img
          src={
            productImages[
              lightboxIndex
            ]
          }
          alt={
            product.title ||
            "صورة المنتج"
          }
        />


        {productImages.length >
          1 && (

          <div className="lightbox-counter">
            {lightboxIndex + 1}
            {" / "}
            {productImages.length}
          </div>

        )}

      </div>


      {productImages.length >
        1 && (

        <button
          type="button"
          className="lightbox-nav lightbox-next"
          onClick={(event) => {

            event.stopPropagation();

            changeLightboxImage(
              "next"
            );

          }}
          aria-label="الصورة التالية"
        >
          ❯
        </button>

      )}

    </div>
  )}

</div>

);

}

export default ProductDetails;
