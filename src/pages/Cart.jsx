import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";

import "./Cart.css";

import { CartContext } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();

  const {
    cart,
    updateQuantity,
    removeFromCart,
  } = useContext(CartContext);

  // =====================
  // TOTAL PRICE
  // =====================

  const totalPrice = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  // =====================
  // EMPTY CART
  // =====================

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <h2>🛒 السلة فارغة</h2>

          <p>
            لم تقم بإضافة أي منتجات للسلة بعد.
          </p>

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

  // =====================
  // SEND ORDER WHATSAPP
  // =====================

  const sendOrder = () => {
    let msg = "🛒 طلب جديد من الصفتي ستور\n\n";

    cart.forEach((item, index) => {
      const itemName =
        item.title ||
        item.name ||
        "منتج";

      const variantName =
        item.selectedVariant?.name ||
        "";

      const itemPrice =
        Number(item.price || 0);

      const itemQuantity =
        Number(item.quantity || 0);

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

    msg += `💰 الإجمالي النهائي: ${totalPrice} جنيه`;

    const whatsappUrl =
      `https://wa.me/201553570220?text=${encodeURIComponent(
        msg
      )}`;

    window.open(
      whatsappUrl,
      "_blank"
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
          CART ITEMS
      ===================== */}

      <div className="cart-items">
        {cart.map((item, index) => {
          const id =
            item.cartId ||
            item.id ||
            item._id ||
            index;

          const itemPrice =
            Number(item.price || 0);

          const itemQuantity =
            Number(item.quantity || 0);

          const itemStock =
            Number(item.stock || 0);

          const itemTotal =
            itemPrice * itemQuantity;

          const variantName =
            item.selectedVariant?.name;

          return (
            <div
              className="cart-item"
              key={id}
            >

              {/* =====================
                  IMAGE
              ===================== */}

              <div className="cart-item-image">
                <img
                  src={
                    item.image ||
                    item.images?.[0] ||
                    "https://via.placeholder.com/100"
                  }
                  alt={
                    item.title ||
                    item.name ||
                    "product"
                  }
                />
              </div>

              {/* =====================
                  INFO
              ===================== */}

              <div className="cart-item-info">

                <h3>
                  {item.title ||
                    item.name ||
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

                {/* =====================
                    QUANTITY
                ===================== */}

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
                      itemQuantity >= itemStock
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

              {/* =====================
                  REMOVE
              ===================== */}

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

        <div className="cart-total">
          <span>
            الإجمالي:
          </span>

          <strong>
            {totalPrice} جنيه
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
              navigate("/checkout")
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