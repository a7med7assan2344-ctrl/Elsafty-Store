import React, {
  useState,
  useContext,
  useEffect
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

  // =====================
  // STATES
  // =====================

  const [quantity, setQuantity] = useState(1);

  const [selectedVariant, setSelectedVariant] =
    useState(null);

  const [selectedImage, setSelectedImage] =
    useState("");

  const [zoom, setZoom] = useState(false);

  const [reviews, setReviews] = useState([]);

  const [average, setAverage] = useState(0);

  const [reviewCount, setReviewCount] =
    useState(0);

  const [userRating, setUserRating] =
    useState(5);

  const [comment, setComment] =
    useState("");


  // =====================
  // PRODUCT IMAGES
  // =====================

  const productImages =
    product?.images?.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : [];


  // =====================
  // PRODUCT VARIANTS
  // =====================

  const hasVariants =
    product?.hasVariants === true &&
    Array.isArray(product?.variants) &&
    product.variants.length > 0;


  // =====================
  // CURRENT PRICE
  // =====================

  const currentPrice = hasVariants
    ? Number(selectedVariant?.price || 0)
    : Number(product?.price || 0);


  // =====================
  // CURRENT OLD PRICE
  // =====================

  const currentOldPrice = hasVariants
    ? Number(selectedVariant?.oldPrice || 0)
    : Number(product?.oldPrice || 0);


  // =====================
  // CURRENT STOCK
  // =====================

  const currentStock = hasVariants
    ? Number(selectedVariant?.stock || 0)
    : Number(product?.stock || 0);


  // =====================
  // CART COUNT
  // =====================

  const cartCount = (cart || []).reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );


  // =====================
  // PRODUCT CHANGE
  // =====================

  useEffect(() => {

    if (!product) return;

    // تصفير الكمية
    setQuantity(1);

    // تصفير الزوم
    setZoom(false);

    // اختيار صورة المنتج الأولى
    if (
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {

      setSelectedImage(
        product.images[0]
      );

    } else {

      setSelectedImage(
        product.image || ""
      );

    }


    // =====================
    // اختيار أول Variant
    // =====================

    if (
      product.hasVariants === true &&
      Array.isArray(product.variants) &&
      product.variants.length > 0
    ) {

      setSelectedVariant(
        product.variants[0]
      );

    } else {

      setSelectedVariant(null);

    }

  }, [product]);


  // =====================
  // LOAD REVIEWS
  // =====================

  useEffect(() => {

    if (!product?.id) return;

    const loadReviews = async () => {

      try {

        const list =
          await getReviews(product.id);

        const rating =
          await getRating(product.id);

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


  // =====================
  // NO PRODUCT
  // =====================

  if (!product) {

    return (

      <div className="product-not-found">

        <h2>
          المنتج غير موجود
        </h2>

        <button
          type="button"
          onClick={() => navigate("/")}
        >
          الرجوع للمتجر
        </button>

      </div>

    );

  }


  // =====================
  // QUANTITY
  // =====================

  const increaseQuantity = () => {

    if (currentStock <= 0) {

      alert(
        "هذا المنتج غير متوفر حالياً"
      );

      return;

    }

    if (quantity >= currentStock) {

      alert(
        "الكمية المطلوبة أكبر من المخزون المتاح"
      );

      return;

    }

    setQuantity(
      prev => prev + 1
    );

  };


  const decreaseQuantity = () => {

    setQuantity(
      prev =>
        prev > 1
          ? prev - 1
          : 1
    );

  };


  // =====================
  // CHANGE VARIANT
  // =====================

  const handleVariantChange = (variant) => {

    if (
      Number(variant?.stock || 0) <= 0
    ) {

      return;

    }

    setSelectedVariant(variant);

    // إعادة الكمية إلى 1
    setQuantity(1);

  };


  // =====================
  // ADD TO CART
  // =====================

  const handleAddToCart = () => {

    // لازم اختيار Variant
    if (
      hasVariants &&
      !selectedVariant
    ) {

      alert(
        "اختر النوع أولاً"
      );

      return;

    }


    // التأكد من المخزون
    if (currentStock <= 0) {

      alert(
        "هذا المنتج غير متوفر حالياً"
      );

      return;

    }


    // التأكد أن الكمية متاحة
    if (quantity > currentStock) {

      alert(
        "الكمية المطلوبة أكبر من المخزون المتاح"
      );

      return;

    }


    // =====================
    // ADD PRODUCT TO CART
    // =====================

    addToCart({

      ...product,

      // السعر الحالي
      price: currentPrice,

      // السعر القديم
      oldPrice: currentOldPrice,

      // المخزون الحالي
      stock: currentStock,

      // الكمية
      quantity: quantity,

      // بيانات الـ Variant
      selectedVariant:
        selectedVariant
          ? {
              ...selectedVariant
            }
          : null,

      // ID مختلف لكل Variant
      cartId:
        selectedVariant
          ? `${product.id}-${selectedVariant.id}`
          : product.id

    });


    // رسالة النجاح
    alert(
      `تم إضافة ${quantity} من المنتج للسلة 🛒`
    );

  };


  // =====================
  // SUBMIT REVIEW
  // =====================

  const handleSubmitReview = async () => {

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
          rating: userRating,
          comment: comment.trim()
        }
      );


      // تحميل التقييمات مرة أخرى
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


      // تنظيف الفورم
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


  // =====================
  // RETURN
  // =====================

  return (

    <div className="product-details">


      {/* =====================
          CART COUNT
      ===================== */}

      <div className="cart-count">
        🛒 {cartCount}
      </div>


      {/* =====================
          PRODUCT IMAGES
      ===================== */}

      <div className="product-images-section">

        <div className="details-image">

          {/* الصورة الرئيسية */}

          <img
            src={
              selectedImage ||
              product.image ||
              "https://via.placeholder.com/400"
            }
            alt={
              product.title ||
              "صورة المنتج"
            }
            className={`main-image ${
              zoom ? "zoomed" : ""
            }`}
            onMouseEnter={() =>
              setZoom(true)
            }
            onMouseLeave={() =>
              setZoom(false)
            }
            onClick={() =>
              setZoom(prev => !prev)
            }
          />


          {/* =====================
              IMAGE GALLERY
          ===================== */}

          {productImages.length > 1 && (

            <div className="image-gallery">

              {productImages.map(
                (img, index) => (

                  <img
                    key={`${img}-${index}`}
                    src={img}
                    alt={
                      `${product.title || "المنتج"} ${index + 1}`
                    }
                    className={
                      selectedImage === img
                        ? "gallery-thumb active"
                        : "gallery-thumb"
                    }
                    onClick={() => {

                      setSelectedImage(img);

                      setZoom(false);

                    }}
                  />

                )
              )}

            </div>

          )}

        </div>

      </div>


      {/* =====================
          PRODUCT INFO
      ===================== */}

      <div className="product-info-section">


        {/* PRODUCT TITLE */}

        <h1>
          {product.title || "منتج بدون اسم"}
        </h1>


        {/* =====================
            RATING
        ===================== */}

        <div className="product-rating">

          <span>
            ⭐⭐⭐⭐⭐
          </span>

          <span>
            (
            {
              average > 0
                ? average.toFixed(1)
                : Number(product.rating || 5).toFixed(1)
            }
            )
          </span>

          {reviewCount > 0 && (

            <span>
              {" "}
              - {reviewCount} تقييم
            </span>

          )}

        </div>


        {/* =====================
            DESCRIPTION
        ===================== */}

        <p className="product-description">

          {
            product.description ||
            "منتج مميز بجودة عالية، مناسب للاستخدام اليومي."
          }

        </p>


        {/* =====================
            VARIANTS
        ===================== */}

        {hasVariants && (

          <div className="product-variants">

            <h3>
              🔀 اختر النوع
            </h3>

            <div className="variants-list">

              {product.variants.map(
                (variant) => {

                  const variantStock =
                    Number(
                      variant.stock || 0
                    );

                  return (

                    <button
                      key={variant.id}
                      type="button"
                      disabled={
                        variantStock <= 0
                      }
                      className={
                        selectedVariant?.id ===
                        variant.id
                          ? "variant-btn active"
                          : "variant-btn"
                      }
                      onClick={() =>
                        handleVariantChange(
                          variant
                        )
                      }
                    >

                      <span>
                        {
                          variant.name ||
                          "نوع"
                        }
                      </span>

                      <span>
                        {
                          Number(
                            variant.price || 0
                          )
                        }{" "}
                        ج.م
                      </span>

                      {variantStock <= 0 && (

                        <small>
                          - غير متوفر
                        </small>

                      )}

                    </button>

                  );

                }
              )}

            </div>

          </div>

        )}


        {/* =====================
            PRICE
        ===================== */}

        <div className="product-price">

          {currentOldPrice > currentPrice && (

            <span className="old-price">
              {currentOldPrice} ج.م
            </span>

          )}

          <strong>

            {
              currentPrice * quantity
            }{" "}
            ج.م

          </strong>

        </div>


        {/* =====================
            STOCK
        ===================== */}

        <div className="product-stock">

          {
            currentStock > 0
              ? `المتاح: ${currentStock}`
              : "غير متوفر حالياً"
          }

        </div>


        {/* =====================
            QUANTITY
        ===================== */}

        <div className="quantity-box">

          <span>
            الكمية:
          </span>

          <button
            type="button"
            onClick={decreaseQuantity}
          >
            -
          </button>

          <span className="quantity-number">
            {quantity}
          </span>

          <button
            type="button"
            onClick={increaseQuantity}
            disabled={
              currentStock <= 0 ||
              quantity >= currentStock
            }
          >
            +
          </button>

        </div>


        {/* =====================
            ADD TO CART
        ===================== */}

        <button
          type="button"
          className="add-btn"
          onClick={handleAddToCart}
          disabled={
            currentStock <= 0
          }
        >
          🛒 أضف للسلة
        </button>


        {/* =====================
            REVIEW FORM
        ===================== */}

        <div className="review-form">

          <h3>
            أضف تقييمك
          </h3>


          <div className="stars-input">

            {[1, 2, 3, 4, 5].map(
              (star) => (

                <span
                  key={star}
                  className={
                    userRating >= star
                      ? "star active"
                      : "star"
                  }
                  onClick={() =>
                    setUserRating(star)
                  }
                >
                  ★
                </span>

              )
            )}

          </div>


          <textarea
            placeholder="اكتب رأيك عن المنتج"
            value={comment}
            onChange={(e) =>
              setComment(
                e.target.value
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


        {/* =====================
            REVIEWS
        ===================== */}

        {reviews.length > 0 && (

          <div className="reviews-list">

            <h3>
              تقييمات العملاء
            </h3>


            {reviews.map(
              (review, index) => (

                <div
                  className="review-item"
                  key={
                    review.id ||
                    index
                  }
                >

                  <div className="review-stars">

                    {
                      "⭐".repeat(
                        Math.min(
                          5,
                          Math.max(
                            0,
                            Number(
                              review.rating || 0
                            )
                          )
                        )
                      )
                    }

                  </div>


                  <p>
                    {
                      review.comment ||
                      ""
                    }
                  </p>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>

  );

}

export default ProductDetails;