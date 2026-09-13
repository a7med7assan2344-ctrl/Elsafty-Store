import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";
import { CartContext } from "../context/CartContext";

const DEFAULT_PRODUCT_IMAGE = "/default-product.png";
const WHATSAPP_NUMBER = "201553570220";

const normalizePrizeType = (prize) =>
  String(
    prize?.type ||
      prize?.prizeType ||
      prize?.rewardType ||
      ""
  )
    .trim()
    .toLowerCase();

const getPrizeValue = (prize) =>
  Math.max(
    0,
    Number(
      prize?.value ??
        prize?.amount ??
        prize?.discountValue ??
        0
    )
  );

const isPercentagePrize = (type) =>
  ["discount", "percentage", "percent"].includes(type);

const isFixedPrize = (type) =>
  ["fixed", "fixed-discount", "amount"].includes(type);

const isFreeShippingPrize = (type) =>
  ["free-shipping", "free_shipping", "freeshipping"].includes(type);

const getProductImage = (item) =>
  item?.image ||
  (Array.isArray(item?.images) ? item.images[0] : "") ||
  DEFAULT_PRODUCT_IMAGE;

function Cart() {
  const navigate = useNavigate();

  const {
    cart = [],
    updateQuantity,
    removeFromCart,
  } = useContext(CartContext);

  const [discountCode, setDiscountCode] = useState("");
  const [discountData, setDiscountData] = useState(null);

  useEffect(() => {
    try {
      const gamePrize = localStorage.getItem("elsafty_game_prize");
      const wheelPrize = localStorage.getItem("elsafty_wheel_prize");
      const savedPrize = gamePrize || wheelPrize;

      if (!savedPrize) return;

      const parsedPrize = JSON.parse(savedPrize);

      if (parsedPrize && typeof parsedPrize === "object") {
        const prize =
          parsedPrize.prize &&
          typeof parsedPrize.prize === "object"
            ? {
                ...parsedPrize.prize,
                gameKey:
                  parsedPrize.gameKey ||
                  parsedPrize.prize.gameKey ||
                  "",
                gameName:
                  parsedPrize.gameName ||
                  parsedPrize.prize.gameName ||
                  "",
                source:
                  parsedPrize.source ||
                  "game",
                awardedAt:
                  parsedPrize.awardedAt || null,
              }
            : parsedPrize;

        setDiscountData(prize);

        if (prize.code) {
          setDiscountCode(String(prize.code));
        }
      }
    } catch (error) {
      console.error("Game Prize Load Error:", error);
    }
  }, []);

  const totalPrice = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item?.price || 0) *
            Number(item?.quantity || 0),
        0
      ),
    [cart]
  );

  const prizeType = normalizePrizeType(discountData);
  const prizeValue = getPrizeValue(discountData);

  const discountAmount = useMemo(() => {
    if (!discountData) return 0;

    if (isPercentagePrize(prizeType)) {
      return Math.min(
        totalPrice,
        (totalPrice * prizeValue) / 100
      );
    }

    if (isFixedPrize(prizeType)) {
      return Math.min(totalPrice, prizeValue);
    }

    return 0;
  }, [discountData, prizeType, prizeValue, totalPrice]);

  const freeShipping = isFreeShippingPrize(prizeType);

  const finalTotal = Math.max(
    0,
    totalPrice - discountAmount
  );

  const removeDiscount = () => {
    setDiscountData(null);
    setDiscountCode("");

    try {
      localStorage.removeItem("elsafty_game_prize");
      localStorage.removeItem("elsafty_wheel_prize");
    } catch (error) {
      console.error("Prize Remove Error:", error);
    }
  };

  const handleImageError = (event) => {
    if (event.currentTarget.dataset.fallbackApplied === "1") {
      return;
    }

    event.currentTarget.dataset.fallbackApplied = "1";
    event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
  };

  const sendOrder = () => {
    let msg = "🛒 طلب جديد من ســـــَــــــــوا\n\n";

    cart.forEach((item, index) => {
      const itemName =
        item?.title ||
        item?.name ||
        "منتج";

      const variantName =
        item?.selectedVariant?.name || "";

      const itemPrice = Number(item?.price || 0);
      const itemQuantity = Number(item?.quantity || 0);
      const itemTotal = itemPrice * itemQuantity;

      msg += `${index + 1}- ${itemName}\n`;

      if (variantName) {
        msg += `🔀 النوع: ${variantName}\n`;
      }

      msg += `🔢 الكمية: ${itemQuantity}\n`;
      msg += `💵 سعر الوحدة: ${itemPrice} جنيه\n`;
      msg += `💰 إجمالي المنتج: ${itemTotal} جنيه\n\n`;
    });

    if (discountData) {
      msg += `🎁 الجائزة: ${
        discountData.title || "جائزة من المتجر"
      }\n`;

      if (discountData.gameName) {
        msg += `🎮 اللعبة: ${discountData.gameName}\n`;
      }

      if (discountData.gameKey) {
        msg += `🔑 اللعبة: ${discountData.gameKey}\n`;
      }

      if (discountCode) {
        msg += `🏷️ كود الخصم: ${discountCode}\n`;
      }

      if (isPercentagePrize(prizeType)) {
        msg += `📉 قيمة الجائزة: خصم ${prizeValue}%\n`;
      } else if (isFixedPrize(prizeType)) {
        msg += `📉 قيمة الجائزة: خصم ${prizeValue} جنيه\n`;
      } else if (freeShipping) {
        msg += "🚚 الجائزة: شحن مجاني\n";
      } else if (prizeType === "gift") {
        msg += `🎁 الهدية: ${
          discountData.title || "هدية مجانية"
        }\n`;
      }

      msg += "\n";
    }

    msg += `💰 إجمالي المنتجات: ${totalPrice} جنيه\n`;

    if (discountAmount > 0) {
      msg += `🏷️ الخصم: -${discountAmount} جنيه\n`;
    }

    if (freeShipping) {
      msg += "🚚 الشحن: مجاني\n";
    }

    msg += `💵 الإجمالي النهائي: ${finalTotal} جنيه`;

    const whatsappUrl =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <h2>🛒 السلة فارغة</h2>
          <p>لم تقم بإضافة أي منتجات للسلة بعد.</p>

          <button
            type="button"
            className="back-store-btn"
            onClick={() => navigate("/")}
          >
            ⬅ العودة للمتجر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page" dir="rtl">
      <div className="cart-header">
        <h1>🛒 سلة المشتريات</h1>
        <span>
          {cart.length}{" "}
          {cart.length === 1 ? "منتج" : "منتجات"}
        </span>
      </div>

      {discountData && (
        <div
          className="cart-wheel-prize"
          style={{
            marginBottom: "20px",
            padding: "18px",
            borderRadius: "14px",
            background:
              "linear-gradient(135deg, #fff8e1, #fff)",
            border: "2px solid #D4AF37",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "30px", marginBottom: "8px" }}>
            🎉
          </div>

          <h3 style={{ margin: "0 0 8px" }}>
            الجائزة الخاصة بك
          </h3>

          <strong
            style={{
              display: "block",
              fontSize: "20px",
              marginBottom: "8px",
            }}
          >
            {discountData.title || "جائزة"}
          </strong>

          {discountData.gameName && (
            <div style={{ marginBottom: "8px", opacity: 0.8 }}>
              🎮 من لعبة: {discountData.gameName}
            </div>
          )}

          {discountData.code && (
            <div style={{ marginTop: "10px" }}>
              <small>كود الخصم</small>
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

          {isPercentagePrize(prizeType) && (
            <p>خصم {prizeValue}%</p>
          )}

          {isFixedPrize(prizeType) && (
            <p>خصم {prizeValue} جنيه</p>
          )}

          {freeShipping && <p>🚚 شحن مجاني</p>}

          {prizeType === "gift" && (
            <p>🎁 هدية مجانية</p>
          )}

          {!isPercentagePrize(prizeType) &&
            !isFixedPrize(prizeType) &&
            !freeShipping &&
            prizeType !== "gift" && (
              <p>🎁 جائزة خاصة من المتجر</p>
            )}

          <button
            type="button"
            onClick={removeDiscount}
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

      <div className="cart-items">
        {cart.map((item, index) => {
          const id =
            item?.cartId ||
            item?.id ||
            item?._id ||
            index;

          const itemPrice = Number(item?.price || 0);
          const itemQuantity = Number(item?.quantity || 0);
          const itemStock = Number(item?.stock || 0);
          const itemTotal = itemPrice * itemQuantity;
          const variantName =
            item?.selectedVariant?.name;

          return (
            <div className="cart-item" key={id}>
              <div className="cart-item-image">
                <img
                  src={getProductImage(item)}
                  alt={
                    item?.title ||
                    item?.name ||
                    "product"
                  }
                  onError={handleImageError}
                />
              </div>

              <div className="cart-item-info">
                <h3>
                  {item?.title ||
                    item?.name ||
                    "منتج"}
                </h3>

                {variantName && (
                  <div className="cart-variant">
                    🔀 النوع:{" "}
                    <strong>{variantName}</strong>
                  </div>
                )}

                <div className="cart-item-price">
                  {itemPrice} جنيه
                </div>

                <div className="cart-quantity">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(id, -1)
                    }
                    disabled={itemQuantity <= 1}
                  >
                    -
                  </button>

                  <span>{itemQuantity}</span>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(id, 1)
                    }
                    disabled={
                      itemStock > 0 &&
                      itemQuantity >= itemStock
                    }
                  >
                    +
                  </button>
                </div>

                {itemStock > 0 && (
                  <small className="cart-stock">
                    المتاح: {itemStock}
                  </small>
                )}

                <div className="cart-item-total">
                  الإجمالي:{" "}
                  <strong>{itemTotal} جنيه</strong>
                </div>
              </div>

              <button
                type="button"
                className="remove-btn"
                onClick={() => removeFromCart(id)}
              >
                🗑 حذف
              </button>
            </div>
          );
        })}
      </div>

      <div className="cart-summary">
        <div className="cart-total">
          <span>إجمالي المنتجات:</span>
          <strong>{totalPrice} جنيه</strong>
        </div>

        {discountAmount > 0 && (
          <div
            className="cart-total"
            style={{ color: "#198754" }}
          >
            <span>🎁 الخصم:</span>
            <strong>- {discountAmount} جنيه</strong>
          </div>
        )}

        {freeShipping && (
          <div
            className="cart-total"
            style={{ color: "#198754" }}
          >
            <span>🚚 الشحن:</span>
            <strong>مجاني</strong>
          </div>
        )}

        <div
          className="cart-total"
          style={{ fontSize: "20px" }}
        >
          <span>الإجمالي النهائي:</span>
          <strong>{finalTotal} جنيه</strong>
        </div>

        <div className="cart-actions">
          <button
            type="button"
            className="back-store-btn"
            onClick={() => navigate("/")}
          >
            ⬅ العودة للمتجر
          </button>

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
