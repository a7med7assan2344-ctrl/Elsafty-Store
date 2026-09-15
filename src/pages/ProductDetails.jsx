import React, {
  useState,
  useContext,
  useEffect,
  useMemo
} from "react";

import { useNavigate } from "react-router-dom";

import "./ProductDetails.css";

import { CartContext } from "../context/CartContext";

import {
  addReview,
  getReviews,
  getRating
} from "../services/reviewService";

function ProductDetails({ product }) {
  const navigate = useNavigate();

  const { addToCart, cart } = useContext(CartContext);

  // =========================================================
  // STATES
  // =========================================================

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedImage, setSelectedImage] = useState("");
  const [zoom, setZoom] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const [userRating, setUserRating] = useState(5);
  const [comment, setComment] = useState("");

  const [copied, setCopied] = useState(false);

  const [showVariantSelector, setShowVariantSelector] =
    useState(false);

  const [openAttribute, setOpenAttribute] = useState(null);

  // =========================================================
  // PRODUCT IMAGES
  // =========================================================

  const productImages = useMemo(() => {
    if (!product) return [];

    const images = [];

    if (Array.isArray(product.images)) {
      product.images.forEach((image) => {
        if (
          typeof image === "string" &&
          image.trim()
        ) {
          images.push(image);
        }
      });
    }

    if (
      typeof product.image === "string" &&
      product.image.trim()
    ) {
      images.push(product.image);
    }

    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((image) => {
        if (
          typeof image === "string" &&
          image.trim()
        ) {
          images.push(image);
        }
      });
    }

    return [...new Set(images)];
  }, [product]);

  // =========================================================
  // VARIANTS
  // =========================================================

  const variants = useMemo(() => {
    if (
      !product ||
      !Array.isArray(product.variants)
    ) {
      return [];
    }

    return product.variants.filter(Boolean);
  }, [product]);

  const hasVariants = variants.length > 0;

  // =========================================================
  // VARIANT ATTRIBUTES
  // =========================================================

  const getVariantAttributes = (variant) => {
    if (!variant) return {};

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

  // =========================================================
  // VARIANT PRICE
  // =========================================================

  const getVariantPrice = (variant) => {
    if (!variant) return 0;

    const price =
      variant.price ??
      variant.salePrice ??
      variant.finalPrice ??
      0;

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice)
      ? numericPrice
      : 0;
  };

  const getVariantOldPrice = (variant) => {
    if (!variant) return 0;

    const price =
      variant.oldPrice ??
      variant.compareAtPrice ??
      variant.originalPrice ??
      0;

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice)
      ? numericPrice
      : 0;
  };

  const getVariantStock = (variant) => {
    if (!variant) return 0;

    const stock = Number(
      variant.stock ?? 0
    );

    return Number.isFinite(stock)
      ? stock
      : 0;
  };

  // =========================================================
  // ATTRIBUTE GROUPS
  // =========================================================

  const attributeGroups = useMemo(() => {
    const groups = {};

    variants.forEach((variant) => {
      const attributes =
        getVariantAttributes(variant);

      Object.entries(attributes).forEach(
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

          const stringValue = String(value);

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

  const attributeKeys =
    Object.keys(attributeGroups);

  const hasAttributeVariants =
    attributeKeys.length > 0;

  // =========================================================
  // ATTRIBUTE NAMES
  // =========================================================

  const formatAttributeName = (key) => {
    const names = {
      color: "اللون",
      colour: "اللون",
      size: "المقاس",
      sizeName: "المقاس",
      material: "الخامة",
      weight: "الوزن",
      type: "النوع",
      model: "الموديل",
      style: "الشكل",
      capacity: "السعة",
      flavor: "النكهة",
      volume: "الحجم"
    };

    return names[key] || key;
  };

  // =========================================================
  // CURRENT PRODUCT VALUES
  // =========================================================

  const currentPrice = hasVariants
    ? selectedVariant
      ? getVariantPrice(selectedVariant)
      : 0
    : Number(product?.price || 0);

  const currentOldPrice = hasVariants
    ? selectedVariant
      ? getVariantOldPrice(
          selectedVariant
        )
      : 0
    : Number(product?.oldPrice || 0);

  const currentStock = hasVariants
    ? selectedVariant
      ? getVariantStock(
          selectedVariant
        )
      : 0
    : Number(product?.stock || 0);

  const currentSKU =
    selectedVariant?.sku ||
    selectedVariant?.SKU ||
    product?.sku ||
    product?.SKU ||
    "";

  // =========================================================
  // CART COUNT
  // =========================================================

  const cartCount = (cart || []).reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0
  );

  // =========================================================
  // IMAGE INDEX
  // =========================================================

  const currentImageIndex = Math.max(
    0,
    productImages.indexOf(
      selectedImage
    )
  );

  // =========================================================
  // VARIANT IMAGES
  // =========================================================

  const getVariantImages = (variant) => {
    if (!variant) return [];

    const images = [];

    if (
      typeof variant.image ===
        "string" &&
      variant.image.trim()
    ) {
      images.push(variant.image);
    }

    if (Array.isArray(variant.images)) {
      variant.images.forEach(
        (image) => {
          if (
            typeof image ===
              "string" &&
            image.trim()
          ) {
            images.push(image);
          }
        }
      );
    }

    if (
      typeof variant.imageUrl ===
        "string" &&
      variant.imageUrl.trim()
    ) {
      images.push(
        variant.imageUrl
      );
    }

    return [...new Set(images)];
  };

  // =========================================================
  // ATTRIBUTE OPTION PRICE
  // =========================================================

  const getAttributeOptionPrice = (
    attribute,
    value
  ) => {
    const possibleVariants =
      variants.filter(
        (variant) => {
          if (
            getVariantStock(
              variant
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
              attributes[
                attribute
              ] ?? ""
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
              ([
                key,
                selectedValue
              ]) =>
                String(
                  attributes[
                    key
                  ] ?? ""
                ) ===
                String(
                  selectedValue
                )
            );
        }
      );

    if (
      !possibleVariants.length
    ) {
      return null;
    }

    const prices = [
      ...new Set(
        possibleVariants
          .map(getVariantPrice)
          .filter(
            (price) =>
              price > 0
          )
      )
    ];

    if (!prices.length) {
      return null;
    }

    const min = Math.min(
      ...prices
    );

    const max = Math.max(
      ...prices
    );

    return {
      min,
      max,
      multiple:
        min !== max
    };
  };

  // =========================================================
  // RESET PRODUCT
  // =========================================================

  useEffect(() => {
    if (!product) return;

    setQuantity(1);
    setZoom(false);
    setLightbox(false);
    setCopied(false);

    setSelectedOptions({});
    setSelectedVariant(null);

    setSelectedImage(
      productImages[0] || ""
    );

    setShowVariantSelector(false);
    setOpenAttribute(null);
  }, [
    product,
    productImages
  ]);

  // =========================================================
  // LOAD REVIEWS
  // =========================================================

  useEffect(() => {
    if (!product?.id) return;

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

  // =========================================================
  // HANDLE VARIANT CHANGE
  // =========================================================

  const handleVariantChange = (
    variant
  ) => {
    if (!variant) return;

    if (
      getVariantStock(
        variant
      ) <= 0
    ) {
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

    const variantImages =
      getVariantImages(
        variant
      );

    if (
      variantImages.length
    ) {
      setSelectedImage(
        variantImages[0]
      );

      setZoom(false);
    }

    setOpenAttribute(null);
  };

  // =========================================================
  // HANDLE ATTRIBUTE CHANGE
  // =========================================================

  const handleAttributeChange = (
    attribute,
    value
  ) => {
    const nextOptions = {
      ...selectedOptions,
      [attribute]: value
    };

    setSelectedOptions(
      nextOptions
    );

    const allSelected =
      attributeKeys.every(
        (key) =>
          nextOptions[key] !==
            undefined &&
          nextOptions[key] !==
            null &&
          String(
            nextOptions[key]
          ).trim() !== ""
      );

    if (!allSelected) {
      setSelectedVariant(null);
      setQuantity(1);
      return;
    }

    const matchingVariant =
      variants.find(
        (variant) => {
          const attributes =
            getVariantAttributes(
              variant
            );

          return (
            getVariantStock(
              variant
            ) > 0 &&
            Object.entries(
              nextOptions
            ).every(
              ([
                key,
                selectedValue
              ]) =>
                String(
                  attributes[
                    key
                  ] ?? ""
                ) ===
                String(
                  selectedValue
                )
            )
          );
        }
      );

    if (!matchingVariant) {
      setSelectedVariant(null);
      setQuantity(1);
      return;
    }

    setSelectedVariant(
      matchingVariant
    );

    setQuantity(1);

    const variantImages =
      getVariantImages(
        matchingVariant
      );

    if (
      variantImages.length
    ) {
      setSelectedImage(
        variantImages[0]
      );

      setZoom(false);
    }

    setOpenAttribute(null);
  };

  // =========================================================
  // ATTRIBUTE AVAILABILITY
  // =========================================================

  const isAttributeValueAvailable = (
    attribute,
    value
  ) => {
    return variants.some(
      (variant) => {
        if (
          getVariantStock(
            variant
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
            attributes[
              attribute
            ] ?? ""
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
            ([
              key,
              selectedValue
            ]) =>
              String(
                attributes[
                  key
                ] ?? ""
              ) ===
              String(
                selectedValue
              )
          );
      }
    );
  };

  // =========================================================
  // QUANTITY
  // =========================================================

  const increaseQuantity = () => {
    if (
      hasVariants &&
      !selectedVariant
    ) {
      setShowVariantSelector(
        true
      );
      return;
    }

    if (currentStock <= 0) {
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
      (prev) => prev + 1
    );
  };

  const decreaseQuantity = () => {
    setQuantity(
      (prev) =>
        prev > 1
          ? prev - 1
          : 1
    );
  };

  // =========================================================
  // ADD TO CART
  // =========================================================

  const handleAddToCart = () => {
    if (
      hasVariants &&
      !selectedVariant
    ) {
      setShowVariantSelector(
        true
      );

      alert(
        hasAttributeVariants
          ? "اختار تفاصيل المنتج أولاً"
          : "اختر النوع أولاً"
      );

      return;
    }

    if (currentStock <= 0) {
      alert(
        "هذا المنتج غير متوفر حالياً"
      );
      return;
    }

    if (
      quantity > currentStock
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

      price: currentPrice,
      oldPrice:
        currentOldPrice,
      stock: currentStock,

      quantity,

      cartId,

      selectedVariant:
        selectedVariant
          ? {
              ...selectedVariant
            }
          : null,

      selectedOptions: {
        ...selectedOptions
      },

      selectedImage:
        selectedImage || null,

      sku: currentSKU
    });

    alert(
      `تم إضافة ${quantity} من المنتج للسلة 🛒`
    );
  };

  // =========================================================
  // IMAGE NAVIGATION
  // =========================================================

  const showPreviousImage = () => {
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

  const showNextImage = () => {
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

  // =========================================================
  // LIGHTBOX
  // =========================================================

  const openLightbox = () => {
    if (
      !productImages.length
    ) {
      return;
    }

    setLightboxIndex(
      currentImageIndex
    );

    setLightbox(true);
  };

  const changeLightboxImage = (
    direction
  ) => {
    if (
      productImages.length <= 1
    ) {
      return;
    }

    setLightboxIndex(
      (prev) => {
        if (
          direction === "next"
        ) {
          return prev >=
            productImages.length -
              1
            ? 0
            : prev + 1;
        }

        return prev <= 0
          ? productImages.length -
            1
          : prev - 1;
      }
    );
  };

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

  // =========================================================
  // LIGHTBOX KEYBOARD
  // =========================================================

  useEffect(() => {
    if (!lightbox) return;

    const handleKeyDown = (
      event
    ) => {
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

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    lightbox,
    productImages.length
  ]);

  // =========================================================
  // SHARE
  // =========================================================

  const handleShare = async () => {
    const shareData = {
      title:
        product.title ||
        "منتج",

      text: `شوف المنتج ده: ${
        product.title ||
        "منتج"
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

  // =========================================================
  // BACK TO CATEGORY
  // =========================================================

  const handleBackToCategory = () => {
    const categoryId =
      product?.categoryId ||
      product?.categoryID ||
      product?.category?.id;

    if (categoryId) {
      navigate(
        `/category/${encodeURIComponent(
          categoryId
        )}`
      );

      return;
    }

    navigate("/");
  };

  // =========================================================
  // SUBMIT REVIEW
  // =========================================================

  const handleSubmitReview =
    async () => {
      if (!comment.trim()) {
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

  // =========================================================
  // PRODUCT NOT FOUND
  // =========================================================

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

  // =========================================================
  // RATING
  // =========================================================

  const displayedRating =
    average > 0
      ? average
      : Number(
          product.rating || 5
        );

  // =========================================================
  // DISCOUNT
  // =========================================================

  const discountPercent =
    currentOldPrice >
      currentPrice &&
    currentOldPrice > 0 &&
    currentPrice > 0
      ? Math.round(
          ((currentOldPrice -
            currentPrice) /
            currentOldPrice) *
            100
        )
      : 0;

  const hasFinalVariantPrice =
    !hasVariants ||
    Boolean(selectedVariant);

  const selectedOptionsCount =
    Object.keys(
      selectedOptions
    ).filter(
      (key) =>
        selectedOptions[key] !==
          undefined &&
        selectedOptions[key] !==
          null &&
        String(
          selectedOptions[key]
        ).trim() !== ""
    ).length;

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="product-details"
      dir="rtl"
    >
      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <div className="product-details-top">
        <div className="details-back-actions">
          <button
            type="button"
            className="back-store-btn back-category-btn"
            onClick={
              handleBackToCategory
            }
          >
            ← العودة للقسم
          </button>

          <button
            type="button"
            className="back-store-btn back-home-btn"
            onClick={() =>
              navigate("/")
            }
          >
            الرئيسية
          </button>
        </div>

        <div className="details-top-actions">
          <button
            type="button"
            className="details-share-btn"
            onClick={
              handleShare
            }
            aria-label="مشاركة"
          >
            🔗
            <span>
              {copied
                ? "تم"
                : "مشاركة"}
            </span>
          </button>

          <button
            type="button"
            className="details-cart-btn"
            onClick={() =>
              navigate("/cart")
            }
            aria-label="السلة"
          >
            🛒

            {cartCount > 0 && (
              <span className="details-cart-count">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          MAIN PRODUCT
      ===================================================== */}

      <div className="product-details-main">
        {/* ===================================================
            IMAGES
        =================================================== */}

        <section className="product-images-section">
          <div className="product-image-viewer">
            {discountPercent > 0 && (
              <span className="product-discount-badge">
                -{discountPercent}%
              </span>
            )}

            <div
              className={`details-image ${
                zoom
                  ? "is-zoomed"
                  : ""
              }`}
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
                    aria-label="السابق"
                  >
                    ❮
                  </button>

                  <button
                    type="button"
                    className="image-nav image-nav-next"
                    onClick={
                      showNextImage
                    }
                    aria-label="التالي"
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
                aria-label="تكبير"
              >
                🔍
              </button>
            </div>

            {productImages.length >
              1 && (
              <div className="image-counter">
                {currentImageIndex +
                  1}{" "}
                /{" "}
                {
                  productImages.length
                }
              </div>
            )}

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
                      key={`${image}-${index}`}
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

                        setZoom(
                          false
                        );
                      }}
                    >
                      <img
                        src={image}
                        alt={`${product.title || "المنتج"} ${
                          index + 1
                        }`}
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            PRODUCT INFO
        =================================================== */}

        <section className="product-info-section">
          {product.categoryName && (
            <div className="product-category-label">
              {
                product.categoryName
              }
            </div>
          )}

          <h1 className="product-title">
            {product.title ||
              product.name ||
              "منتج بدون اسم"}
          </h1>

          {/* =================================================
              COMPACT RATING
          ================================================= */}

          <div className="product-rating product-rating-compact">
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
              {displayedRating.toFixed(
                1
              )}
            </strong>

            <span className="rating-count">
              {reviewCount || 0}
            </span>
          </div>

          {currentSKU && (
            <div className="product-sku">
              SKU: {currentSKU}
            </div>
          )}

          <div className="product-description">
            <p>
              {product.description ||
                "منتج مميز بجودة عالية، مناسب للاستخدام اليومي."}
            </p>
          </div>

          {/* =================================================
              VARIANTS
          ================================================= */}

          {hasVariants && (
            <div className="product-variant-selector">
              <button
                type="button"
                className={`variant-details-toggle ${
                  showVariantSelector
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setShowVariantSelector(
                    (prev) =>
                      !prev
                  )
                }
              >
                <span>
                  ⚙️
                </span>

                <strong>
                  {selectedVariant
                    ? "تعديل التفاصيل"
                    : "اختيار التفاصيل"}
                </strong>

                <span className="variant-details-arrow">
                  {showVariantSelector
                    ? "⌃"
                    : "⌄"}
                </span>
              </button>

              {selectedOptionsCount >
                0 && (
                <div className="variant-selection-summary">
                  {Object.entries(
                    selectedOptions
                  ).map(
                    ([
                      key,
                      value
                    ]) => (
                      <span
                        key={key}
                      >
                        {formatAttributeName(
                          key
                        )}
                        :{" "}
                        {value}
                      </span>
                    )
                  )}
                </div>
              )}

              {showVariantSelector && (
                <div className="variant-details-panel">
                  {hasAttributeVariants && (
                    <div className="product-attribute-selector">
                      {Object.entries(
                        attributeGroups
                      ).map(
                        ([
                          attribute,
                          values
                        ]) => {
                          const isOpen =
                            openAttribute ===
                            attribute;

                          const selectedValue =
                            selectedOptions[
                              attribute
                            ];

                          return (
                            <div
                              className={`variant-attribute-accordion ${
                                selectedValue
                                  ? "selected"
                                  : ""
                              } ${
                                isOpen
                                  ? "open"
                                  : ""
                              }`}
                              key={
                                attribute
                              }
                            >
                              <button
                                type="button"
                                className="attribute-selector-button"
                                onClick={() =>
                                  setOpenAttribute(
                                    isOpen
                                      ? null
                                      : attribute
                                  )
                                }
                              >
                                <span>
                                  {formatAttributeName(
                                    attribute
                                  )}
                                </span>

                                <span className="attribute-current-value">
                                  {selectedValue ||
                                    "اختيار"}
                                </span>

                                <span>
                                  {isOpen
                                    ? "⌃"
                                    : "⌄"}
                                </span>
                              </button>

                              {isOpen && (
                                <div className="attribute-options-panel">
                                  <div className="attribute-options">
                                    {values.map(
                                      (
                                        value
                                      ) => {
                                        const available =
                                          isAttributeValueAvailable(
                                            attribute,
                                            value
                                          );

                                        const active =
                                          String(
                                            selectedOptions[
                                              attribute
                                            ] ??
                                              ""
                                          ) ===
                                          String(
                                            value
                                          );

                                        const optionPrice =
                                          getAttributeOptionPrice(
                                            attribute,
                                            value
                                          );

                                        const isColor =
                                          attribute
                                            .toLowerCase()
                                            .includes(
                                              "color"
                                            ) ||
                                          attribute
                                            .toLowerCase()
                                            .includes(
                                              "colour"
                                            );

                                        return (
                                          <button
                                            type="button"
                                            key={`${attribute}-${value}`}
                                            disabled={
                                              !available
                                            }
                                            className={`attribute-option ${
                                              active
                                                ? "active"
                                                : ""
                                            } ${
                                              !available
                                                ? "disabled"
                                                : ""
                                            }`}
                                            onClick={() =>
                                              handleAttributeChange(
                                                attribute,
                                                value
                                              )
                                            }
                                          >
                                            <span className="attribute-option-main">
                                              {isColor && (
                                                <span className="attribute-color-dot" />
                                              )}

                                              <span>
                                                {
                                                  value
                                                }
                                              </span>

                                              {active && (
                                                <span>
                                                  ✓
                                                </span>
                                              )}
                                            </span>

                                            {available &&
                                              optionPrice && (
                                                <span className="attribute-option-price">
                                                  {optionPrice.multiple
                                                    ? `من ${optionPrice.min.toLocaleString(
                                                        "ar-EG"
                                                      )}`
                                                    : optionPrice.min.toLocaleString(
                                                        "ar-EG"
                                                      )}{" "}
                                                  ج.م
                                                </span>
                                              )}
                                          </button>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}

                  {hasVariants &&
                    !hasAttributeVariants && (
                      <div className="variants-list">
                        {variants.map(
                          (
                            variant
                          ) => {
                            const stock =
                              getVariantStock(
                                variant
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
                                  stock <=
                                  0
                                }
                                className={`variant-btn ${
                                  active
                                    ? "active"
                                    : ""
                                } ${
                                  stock <=
                                  0
                                    ? "out-of-stock"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleVariantChange(
                                    variant
                                  )
                                }
                              >
                                <span>
                                  {variant.name ||
                                    variant.title ||
                                    "نوع"}
                                </span>

                                <span>
                                  {getVariantPrice(
                                    variant
                                  ).toLocaleString(
                                    "ar-EG"
                                  )}{" "}
                                  ج.م
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* =================================================
              PRICE
          ================================================= */}

          <div className="product-price-card">
            {hasFinalVariantPrice ? (
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
                        وفر{" "}
                        {(
                          (currentOldPrice -
                            currentPrice) *
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
            ) : (
              <div className="product-variant-price-placeholder">
                <span>
                  اختار التفاصيل
                </span>
              </div>
            )}

            {hasFinalVariantPrice ? (
              <div
                className={
                  currentStock > 0
                    ? "product-stock available"
                    : "product-stock unavailable"
                }
              >
                <span>
                  ●
                </span>

                {currentStock >
                0
                  ? `${currentStock} قطعة متاحة`
                  : "غير متوفر"}
              </div>
            ) : null}
          </div>

          {/* =================================================
              PURCHASE
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
                    hasVariants &&
                    !selectedVariant
                      ? true
                      : currentStock <=
                          0 ||
                        quantity >=
                          currentStock
                  }
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              className="add-btn"
              onClick={
                handleAddToCart
              }
              disabled={
                currentStock <= 0 ||
                (hasVariants &&
                  !selectedVariant)
              }
            >
              🛒

              <span>
                {hasVariants &&
                !selectedVariant
                  ? "اختيار التفاصيل"
                  : "أضف للسلة"}
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* =====================================================
          REVIEWS
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
              {displayedRating.toFixed(
                1
              )}
            </strong>

            <span>
              ★
            </span>

            <small>
              {reviewCount} تقييم
            </small>
          </div>
        </div>

        {/* REVIEW FORM */}

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
                  aria-label={`تقييم ${star} من 5`}
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

        {/* REVIEWS LIST */}

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
                      {(
                        review.userName ||
                        review.name ||
                        "ع"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {review.userName ||
                          review.name ||
                          "عميل"}
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
                    {review.comment ||
                      ""}
                  </p>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="no-reviews">
            لسه مفيش تقييمات للمنتج ⭐
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
              aria-label="السابق"
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
                {lightboxIndex +
                  1}{" "}
                /{" "}
                {
                  productImages.length
                }
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
              aria-label="التالي"
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