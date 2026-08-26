import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Cart.css";

import { CartContext } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();

  const {
    cart = [],
    updateQuantity,
    removeFromCart,
  } = useContext(CartContext);

  // =====================
  // DISCOUNT / WHEEL PRIZE
  // =====================

  const [discountCode, setDiscountCode] = useState("");
  const [discountData, setDiscountData] = useState(null);

  // =====================
  // LOAD SAVED PRIZE
  // =====================

  useEffect(() => {
    try {
      const savedPrize = localStorage.getItem(
        "elsafty_wheel_prize"
      );

      if (!savedPrize) {
        return;
      }

      const parsedPrize = JSON.parse(savedPrize);

      if (
        parsedPrize &&
        typeof parsedPrize === "object"
      ) {
        setDiscountData(parsedPrize);

        if (parsedPrize.code) {
          setDiscountCode(parsedPrize.code);
        }
      }
    } catch (error) {
      console.error(
        "Wheel Prize Load Error:",
        error
      );
    }
  }, []);

  // =====================
  // TOTAL PRICE
  // =====================

  const totalPrice = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item?.price || 0) *
          Number(item?.quantity || 0),
      0
    );
  }, [cart]);

  // =====================
  // DISCOUNT CALCULATION
  // =====================

  const discountAmount = useMemo(() => {
    if (!discountData) {
      return 0;
    }

    if (
      discountData.type === "discount" ||
      discountData.type === "percentage"
    ) {
      const percentage = Number(
        discountData.value || 0
      );

      return Math.min(
        totalPrice,
        (totalPrice * percentage) / 100
      );
    }

    if (
      discountData.type === "fixed"
    ) {
      const fixedAmount = Number(
        discountData.value || 0
      );

      return Math.min(
        totalPrice,
        fixedAmount
      );
    }

    return 0;
  }, [discountData, totalPrice]);

  // =====================
  // FINAL TOTAL
  // =====================

  const finalTotal = Math.max(
    0,
    totalPrice - discountAmount
  );

  // =====================
  // EMPTY CART
  // =====================

  if (cart.length === 0) {
    return (
      <div className="cart-page">

        <div className="empty-cart">

          <h2>
            🛒 السلة فارغة
          </h2>

          <p>
            لم تقم بإضافة أي منتجات للسلة بعد.
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

  // =====================
  // REMOVE WHEEL PRIZE
  // =====================

  const removeDiscount = () => {
    setDiscountData(null);
    setDiscountCode("");

    try {
      localStorage.removeItem(
        "elsafty_wheel_prize"
      );
    } catch (error) {
      console.error(
        "Wheel Prize Remove Error:",
        error
      );
    }
  };

  // =====================
  // SEND ORDER WHATSAPP
  // =====================

  const sendOrder = () => {
    let msg =
      "🛒 طلب جديد من الصفتي ستور\n\n";

    cart.forEach((item, index) => {
      const itemName =
        item?.title ||
        item?.name ||
        "منتج";

      const variantName =
        item?.selectedVariant?.name ||
        "";

      const itemPrice =
        Number(item?.price || 0);

      const itemQuantity =
        Number(item?.quantity || 0);

      const itemTotal =
        itemPrice * itemQuantity;

      msg += `${index + 1}- ${itemName}\n`;

      if (variantName) {
        msg += `🔀 النوع: ${variantName}\n`;
      }

      msg += `🔢 الكمية: ${itemQuantity}\n`;
      msg += `💵 سعر الوحدة: ${itemPrice} جنيه\n`;
      msg += `💰 إجمالي المنتج: ${itemTotal} جنيه\n\n`;
    });

    // =====================
    // DISCOUNT
    // =====================

    if (
      discountData &&
      discountAmount > 0
    ) {
      msg += `🎁 كود الخصم: ${
        discountCode || "غير محدد"
      }\n`;

      msg += `🏷️ قيمة الخصم: ${discountAmount} جنيه\n\n`;
    }

    // =====================
    // FREE SHIPPING
    // =====================

    if (
      discountData?.type ===
      "free-shipping"
    ) {
      msg +=
        "🚚 الجائزة: شحن مجاني\n\n";
    }

    // =====================
    // GIFT
    // =====================

    if (
      discountData?.type === "gift"
    ) {
      msg += `🎁 الجائزة: ${
        discountData?.title ||
        "هدية"
      }\n\n`;
    }

    msg += `💰 إجمالي المنتجات: ${totalPrice} جنيه\n`;

    if (discountAmount > 0) {
      msg += `🏷️ الخصم: -${discountAmount} جنيه\n`;
    }

    msg += `💵 الإجمالي النهائي: ${finalTotal} جنيه`;

    // =====================
    // WHATSAPP
    // =====================

    const whatsappNumber =
      "201553570220";

    const whatsappUrl =
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        msg
      )}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =====================
  // RETURN
  // =====================

  return (
    <div className="cart-page">

      {/* =====================
          CART HEADER
      ===================== */}

      <div className="cart-header">

        <h1>
          🛒 سلة المشتريات
        </h1>

        <span>
          {cart.length} منتج
        </span>

      </div>

      {/* =====================
          WHEEL PRIZE
      ===================== */}

      {discountData && (
        <div
          className="cart-wheel-prize"
          style={{
            marginBottom: "20px",
            padding: "18px",
            borderRadius: "14px",
            background:
              "linear-gradient(135deg, #fff8e1, #fff)",
            border:
              "2px solid #D4AF37",
            textAlign: "center",
          }}
        >

          <div
            style={{
              fontSize: "30px",
              marginBottom: "8px",
            }}
          >
            🎉
          </div>

          <h3
            style={{
              margin: "0 0 8px",
            }}
          >
            الجائزة الخاصة بك
          </h3>

          <strong
            style={{
              display: "block",
              fontSize: "20px",
              marginBottom: "8px",
            }}
          >
            {discountData.title ||
              "جائزة"}
          </strong>

          {discountData.code && (
            <div
              style={{
                marginTop: "10px",
              }}
            >

              <small>
                كود الخصم
              </small>

              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  marginTop: "5px",
                }}
              >
                {discountData.code}
              </div>

            </div>
          )}

          {discountData.type ===
            "discount" && (
            <p>
              خصم{" "}
              {Number(
                discountData.value || 0
              )}
              %
            </p>
          )}

          {discountData.type ===
            "fixed" && (
            <p>
              خصم{" "}
              {Number(
                discountData.value || 0
              )}{" "}
              جنيه
            </p>
          )}

          {discountData.type ===
            "free-shipping" && (
            <p>
              🚚 شحن مجاني
            </p>
          )}

          {discountData.type ===
            "gift" && (
            <p>
              🎁 هدية مجانية
            </p>
          )}

          <button
            type="button"
            onClick={
              removeDiscount
            }
            style={{
              marginTop: "8px",
              border: "none",
              background: "transparent",
              color: "#d32f2f",
              cursor: "pointer",
            }}
          >
            إزالة الجائزة
          </button>

        </div>
      )}

      {/* =====================
          CART ITEMS
      ===================== */}

      <div className="cart-items">

        {cart.map((item, index) => {

          const id =
            item?.cartId ||
            item?.id ||
            item?._id ||
            index;

          const itemPrice =
            Number(item?.price || 0);

          const itemQuantity =
            Number(item?.quantity || 0);

          const itemStock =
            Number(item?.stock || 0);

          const itemTotal =
            itemPrice *
            itemQuantity;

          const variantName =
            item?.selectedVariant?.name;

          return (
            <div
              className="cart-item"
              key={id}
            >

              {/* IMAGE */}

              <div className="cart-item-image">

                <img
                  src={
                    item?.image ||
                    item?.images?.[0] ||
                    "https://via.placeholder.com/100"
                  }
                  alt={
                    item?.title ||
                    item?.name ||
                    "product"
                  }
                />

              </div>

              {/* INFO */}

              <div className="cart-item-info">

                <h3>
                  {item?.title ||
                    item?.name ||
                    "منتج"}
                </h3>

                {/* VARIANT */}

                {variantName && (
                  <div className="cart-variant">

                    🔀 النوع:{" "}

                    <strong>
                      {variantName}
                    </strong>

                  </div>
                )}

                {/* PRICE */}

                <div className="cart-item-price">
                  {itemPrice} جنيه
                </div>

                {/* QUANTITY */}

                <div className="cart-quantity">

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        id,
                        -1
                      )
                    }
                    disabled={
                      itemQuantity <= 1
                    }
                  >
                    -
                  </button>

                  <span>
                    {itemQuantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        id,
                        1
                      )
                    }
                    disabled={
                      itemStock > 0 &&
                      itemQuantity >=
                        itemStock
                    }
                  >
                    +
                  </button>

                </div>

                {/* STOCK */}

                {itemStock > 0 && (
                  <small className="cart-stock">
                    المتاح: {itemStock}
                  </small>
                )}

                {/* TOTAL */}

                <div className="cart-item-total">

                  الإجمالي:{" "}

                  <strong>
                    {itemTotal} جنيه
                  </strong>

                </div>

              </div>

              {/* REMOVE */}

              <button
                type="button"
                className="remove-btn"
                onClick={() =>
                  removeFromCart(id)
                }
              >
                🗑 حذف
              </button>

            </div>
          );
        })}

      </div>

      {/* =====================
          CART SUMMARY
      ===================== */}

      <div className="cart-summary">

        {/* PRODUCTS TOTAL */}

        <div className="cart-total">

          <span>
            إجمالي المنتجات:
          </span>

          <strong>
            {totalPrice} جنيه
          </strong>

        </div>

        {/* DISCOUNT */}

        {discountAmount > 0 && (
          <div
            className="cart-total"
            style={{
              color: "#198754",
            }}
          >

            <span>
              🎁 الخصم:
            </span>

            <strong>
              - {discountAmount} جنيه
            </strong>

          </div>
        )}

        {/* FREE SHIPPING */}

        {discountData?.type ===
          "free-shipping" && (
          <div
            className="cart-total"
            style={{
              color: "#198754",
            }}
          >

            <span>
              🚚 الشحن:
            </span>

            <strong>
              مجاني
            </strong>

          </div>
        )}

        {/* FINAL TOTAL */}

        <div
          className="cart-total"
          style={{
            fontSize: "20px",
          }}
        >

          <span>
            الإجمالي النهائي:
          </span>

          <strong>
            {finalTotal} جنيه
          </strong>

        </div>

        {/* =====================
            ACTIONS
        ===================== */}

        <div className="cart-actions">

          {/* العودة للمتجر */}

          <button
            type="button"
            className="back-store-btn"
            onClick={() =>
              navigate("/")
            }
          >
            ⬅ العودة للمتجر
          </button>

          {/* إتمام الطلب */}

          <button
            type="button"
            className="checkout-btn"
            onClick={() =>
              navigate("/checkout", {
                state: {
                  discountData,
                  discountCode,
                  discountAmount,
                  totalPrice,
                  finalTotal,
                },
              })
            }
          >
            📦 إتمام الطلب
          </button>

          {/* واتساب */}

          <button
            type="button"
            className="checkout-btn"
            onClick={sendOrder}
          >
            واتساب 📱
          </button>

        </div>

      </div>

    </div>
  );
}

export default Cart;