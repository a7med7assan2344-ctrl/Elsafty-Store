import React, { useState } from "react";
import "./Checkout.css";

function Checkout({
  cart,
  setCart,
  setCurrentView,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // ==================================================
  // ADMIN WHATSAPP NUMBER
  // ==================================================

  const adminWhatsApp = "201553570220";

  // ==================================================
  // TOTAL PRICE
  // ==================================================

  const totalPrice = cart.reduce(
    (sum, item) =>
      sum +
      Number(item?.price || 0) *
        Number(item?.quantity || 1),
    0
  );

  // ==================================================
  // WHATSAPP ORDER
  // ==================================================

  const handleWhatsAppOrder = (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    // ------------------------------------------------
    // CHECK CART
    // ------------------------------------------------

    if (!Array.isArray(cart) || cart.length === 0) {
      alert("السلة فارغة");
      return;
    }

    // ------------------------------------------------
    // CLEAN DATA
    // ------------------------------------------------

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    // ------------------------------------------------
    // VALIDATION
    // ------------------------------------------------

    if (
      !cleanName ||
      !cleanPhone ||
      !cleanAddress
    ) {
      alert(
        "الرجاء إكمال بيانات الشحن (الاسم، الهاتف، العنوان)"
      );

      return;
    }

    // ------------------------------------------------
    // PHONE VALIDATION
    // ------------------------------------------------

    const phoneDigits =
      cleanPhone.replace(/\D/g, "");

    if (
      phoneDigits.length < 10 ||
      phoneDigits.length > 15
    ) {
      alert(
        "برجاء إدخال رقم هاتف صحيح"
      );

      return;
    }

    setLoading(true);

    try {
      // ==================================================
      // CREATE WHATSAPP MESSAGE
      // ==================================================

      let message =
`🛒 *طلب جديد من Elsafty Store* 🛒

━━━━━━━━━━━━━━━━━━

👤 *اسم العميل:*
${cleanName}

📞 *رقم الهاتف:*
${cleanPhone}

📍 *عنوان الشحن:*
${cleanAddress}

━━━━━━━━━━━━━━━━━━

📦 *المنتجات المطلوبة:*

`;

      // ------------------------------------------------
      // PRODUCTS
      // ------------------------------------------------

      cart.forEach((item, index) => {
        const itemTitle =
          item?.title ||
          item?.name ||
          "منتج";

        const quantity =
          Number(item?.quantity || 1);

        const price =
          Number(item?.price || 0);

        const itemTotal =
          price * quantity;

        message +=
`${index + 1}- ${itemTitle}
`;

        // Variant
        if (
          item?.variantName ||
          item?.selectedVariant?.name
        ) {
          message +=
`المتغير: ${
  item?.variantName ||
  item?.selectedVariant?.name ||
  ""
}
`;
        }

        message +=
`الكمية: ${quantity}
السعر: ${price.toLocaleString("ar-EG")} جنيه
الإجمالي: ${itemTotal.toLocaleString("ar-EG")} جنيه

`;
      });

      // ==================================================
      // TOTAL
      // ==================================================

      message +=
`━━━━━━━━━━━━━━━━━━

💰 *الإجمالي الكلي:*
${totalPrice.toLocaleString("ar-EG")} جنيه

💳 *طريقة الدفع:*
الدفع عند الاستلام

━━━━━━━━━━━━━━━━━━

🟢 *Elsafty Store*
`;

      // ==================================================
      // WHATSAPP URL
      // ==================================================

      const whatsappUrl =
        `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(
          message
        )}`;

      // ==================================================
      // OPEN WHATSAPP
      // ==================================================

      window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );

      // ==================================================
      // CLEAR CART
      // ==================================================

      setCart([]);

      // ==================================================
      // RETURN TO STORE
      // ==================================================

      setCurrentView("store");

      // ==================================================
      // SUCCESS
      // ==================================================

      alert(
        "تم تجهيز طلبك وفتح واتساب لإرساله ✅"
      );
    } catch (error) {
      console.error(
        "WhatsApp Order Error:",
        error
      );

      alert(
        "حدث خطأ أثناء تجهيز الطلب، حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // EMPTY CART
  // ==================================================

  if (
    !Array.isArray(cart) ||
    cart.length === 0
  ) {
    return (
      <div
        className="checkout-container"
        dir="rtl"
      >
        <h2>
          🛒 السلة فارغة
        </h2>

        <button
          type="button"
          className="whatsapp-submit-btn"
          onClick={() =>
            setCurrentView("store")
          }
        >
          العودة للمتجر 🛍️
        </button>
      </div>
    );
  }

  // ==================================================
  // RETURN
  // ==================================================

  return (
    <div
      className="checkout-container"
      dir="rtl"
    >
      <h2>
        إتمام الطلب عبر واتساب 📱
      </h2>

      <p className="checkout-subtitle">
        أدخل بياناتك لإرسال طلبك مباشرة عبر واتساب
      </p>

      <form
        onSubmit={handleWhatsAppOrder}
        className="checkout-form"
      >

        {/* ============================================
            NAME
        ============================================ */}

        <div className="form-group">
          <label>
            الاسم الكامل:
          </label>

          <input
            type="text"
            placeholder="أدخل اسمك هنا"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            disabled={loading}
            required
          />
        </div>

        {/* ============================================
            PHONE
        ============================================ */}

        <div className="form-group">
          <label>
            رقم الهاتف:
          </label>

          <input
            type="tel"
            inputMode="tel"
            placeholder="01553570220"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            disabled={loading}
            required
          />
        </div>

        {/* ============================================
            ADDRESS
        ============================================ */}

        <div className="form-group">
          <label>
            عنوان الشحن بالتفصيل:
          </label>

          <textarea
            placeholder="المحافظة - المدينة - الشارع - رقم المنزل"
            value={address}
            onChange={(e) =>
              setAddress(e.target.value)
            }
            rows="4"
            disabled={loading}
            required
          />
        </div>

        {/* ============================================
            PRODUCTS
        ============================================ */}

        <div className="order-products-preview">

          <h3>
            📦 المنتجات المطلوبة
          </h3>

          {cart.map(
            (item, index) => (
              <div
                className="checkout-product-row"
                key={
                  item?.id ||
                  index
                }
              >

                <div>
                  <strong>
                    {
                      item?.title ||
                      item?.name ||
                      "منتج"
                    }
                  </strong>

                  {(item?.variantName ||
                    item?.selectedVariant?.name) && (
                    <small>
                      المتغير:{" "}
                      {
                        item?.variantName ||
                        item?.selectedVariant?.name
                      }
                    </small>
                  )}
                </div>

                <span>
                  ×{" "}
                  {
                    item?.quantity ||
                    1
                  }
                </span>

                <strong>
                  {(
                    Number(
                      item?.price ||
                        0
                    ) *
                    Number(
                      item?.quantity ||
                        1
                    )
                  ).toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </strong>

              </div>
            )
          )}

        </div>

        {/* ============================================
            TOTAL
        ============================================ */}

        <div className="order-summary-box">

          <h4>
            إجمالي الطلب:

            <span>
              {totalPrice.toLocaleString(
                "ar-EG"
              )}{" "}
              جنيه
            </span>
          </h4>

        </div>

        {/* ============================================
            SUBMIT
        ============================================ */}

        <button
          type="submit"
          className="whatsapp-submit-btn"
          disabled={loading}
        >
          {loading
            ? "⏳ جاري تجهيز الطلب..."
            : "إرسال الطلب الآن عبر الواتساب 🟢"}
        </button>

      </form>
    </div>
  );
}

export default Checkout;