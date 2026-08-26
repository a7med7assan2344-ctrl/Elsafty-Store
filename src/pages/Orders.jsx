import React, {
  useEffect,
  useState,
} from "react";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase";

import {
  useNavigate,
} from "react-router-dom";

// ======================================================
// ORDERS
// ======================================================

function Orders() {

  const navigate = useNavigate();

  // ======================================================
  // STATES
  // ======================================================

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelingId, setCancelingId] = useState(null);
  const [message, setMessage] = useState("");

  // ======================================================
  // AUTH
  // ======================================================

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {

        setUser(currentUser);

        if (!currentUser) {
          setOrders([]);
          setLoading(false);
        }

      }
    );

    return () => unsubscribe();

  }, []);

  // ======================================================
  // LOAD ORDERS
  // ======================================================

  useEffect(() => {

    if (!user) {
      return;
    }

    setLoading(true);
    setError("");

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,

      (snapshot) => {

        try {

          const data = snapshot.docs.map(
            (orderDoc) => ({
              id: orderDoc.id,
              ...orderDoc.data(),
            })
          );

          // ==================================================
          // SORT LOCALLY
          // ==================================================

          data.sort((a, b) => {

            const getTime = (value) => {

              if (!value) {
                return 0;
              }

              if (
                typeof value.toMillis ===
                "function"
              ) {
                return value.toMillis();
              }

              if (value instanceof Date) {
                return value.getTime();
              }

              if (typeof value === "number") {
                return value;
              }

              const parsed = new Date(value).getTime();

              return Number.isNaN(parsed)
                ? 0
                : parsed;

            };

            return (
              getTime(b.createdAt) -
              getTime(a.createdAt)
            );

          });

          setOrders(data);
          setLoading(false);

        } catch (err) {

          console.error(
            "Orders Processing Error:",
            err
          );

          setError(
            "حدث خطأ أثناء تجهيز الطلبات."
          );

          setLoading(false);

        }

      },

      (err) => {

        console.error(
          "Orders Error:",
          err
        );

        setError(
          "حدث خطأ أثناء تحميل الطلبات."
        );

        setLoading(false);

      }
    );

    return () => unsubscribe();

  }, [user]);

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (value) => {

    if (!value) {
      return "غير محدد";
    }

    let date;

    try {

      if (
        typeof value.toDate ===
        "function"
      ) {

        date = value.toDate();

      } else if (
        value instanceof Date
      ) {

        date = value;

      } else {

        date = new Date(value);

      }

    } catch {

      return "غير محدد";

    }

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "غير محدد";
    }

    return date.toLocaleString(
      "ar-EG",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );

  };

  // ======================================================
  // NORMALIZE STATUS
  // ======================================================

  const normalizeStatus = (status) => {

    return String(status || "")
      .trim()
      .toLowerCase();

  };

  // ======================================================
  // PREPARING
  // ======================================================

  const isPreparing = (order) => {

    const status = normalizeStatus(
      order.status
    );

    return (
      status === "قيد التجهيز" ||
      status === "جاري التجهيز" ||
      status === "preparing"
    );

  };

  // ======================================================
  // CANCELLED
  // ======================================================

  const isCancelled = (order) => {

    const status = normalizeStatus(
      order.status
    );

    return (
      status === "ملغي" ||
      status === "ملغى" ||
      status === "cancelled" ||
      status === "canceled"
    );

  };

  // ======================================================
  // CAN EDIT
  // ======================================================

  const canEdit = (order) => {

    if (isPreparing(order)) {
      return false;
    }

    if (isCancelled(order)) {
      return false;
    }

    return true;

  };

  // ======================================================
  // CAN CANCEL
  // ======================================================

  const canCancel = (order) => {

    if (isPreparing(order)) {
      return false;
    }

    if (isCancelled(order)) {
      return false;
    }

    return true;

  };

  // ======================================================
  // CANCEL ORDER
  // ======================================================

  const handleCancelOrder = async (order) => {

    if (!canCancel(order)) {
      return;
    }

    const confirmed = window.confirm(
      "هل أنت متأكد من إلغاء هذا الطلب؟"
    );

    if (!confirmed) {
      return;
    }

    try {

      setCancelingId(order.id);
      setMessage("");

      await updateDoc(
        doc(
          db,
          "orders",
          order.id
        ),
        {
          status: "ملغي",
          cancelledAt: serverTimestamp(),
        }
      );

      setMessage(
        "تم إلغاء الطلب بنجاح."
      );

    } catch (err) {

      console.error(
        "Cancel Order Error:",
        err
      );

      setMessage(
        "تعذر إلغاء الطلب. حاول مرة أخرى."
      );

    } finally {

      setCancelingId(null);

    }

  };

  // ======================================================
  // PREPARE CART FROM ORDER
  // ======================================================

  const prepareCartFromOrder = (order) => {

    const products =
      Array.isArray(order.products)
        ? order.products
        : [];

    return products.map((item) => {

      const productId =
        item.productId ||
        item.id ||
        item._id ||
        null;

      const quantity = Math.max(
        1,
        Number(item.quantity || 1)
      );

      return {
        ...item,

        id:
          item.id ||
          item._id ||
          item.productId,

        productId,

        quantity,

        cartId:
          item.cartId ||
          productId,

        // الحفاظ على الـ variant
        selectedVariant:
          item.selectedVariant
            ? {
                ...item.selectedVariant,
              }
            : item.selectedVariant,

        variantName:
          item.variantName ||
          item.selectedVariant?.name ||
          item.selectedVariant?.title ||
          item.selectedVariant?.label ||
          "",

      };

    });

  };

  // ======================================================
  // SAVE CART
  // ======================================================

  const saveCartForCheckout = (preparedCart) => {

    try {

      localStorage.setItem(
        "cart",
        JSON.stringify(preparedCart)
      );

      // تحديث أي Cart Context أو listener
      window.dispatchEvent(
        new Event("storage")
      );

      return true;

    } catch (err) {

      console.error(
        "Save Checkout Cart Error:",
        err
      );

      return false;

    }

  };

  // ======================================================
  // OPEN CHECKOUT
  // ======================================================

  const openCheckoutWithCart = (
    order,
    type
  ) => {

    const preparedCart =
      prepareCartFromOrder(order);

    if (
      preparedCart.length === 0
    ) {

      setMessage(
        "لا توجد منتجات في هذا الطلب."
      );

      return;

    }

    const saved =
      saveCartForCheckout(
        preparedCart
      );

    if (!saved) {

      setMessage(
        "تعذر تجهيز المنتجات لإتمام الطلب."
      );

      return;

    }

    window.location.href =
      `/checkout?${type}=${encodeURIComponent(
        order.id
      )}`;

  };

  // ======================================================
  // EDIT ORDER
  // ======================================================

  const handleEditOrder = (order) => {

    if (!canEdit(order)) {
      return;
    }

    // ==================================================
    // CLEAR OLD PAYMENT DATA
    // ==================================================

    try {

      sessionStorage.removeItem(
        "paymentOrder"
      );

      // ==================================================
      // SAVE CURRENT ORDER FOR EDITING
      // ==================================================

      sessionStorage.setItem(
        "editingOrder",
        JSON.stringify(order)
      );

    } catch (err) {

      console.error(
        "Save Editing Order Error:",
        err
      );

      setMessage(
        "تعذر تجهيز الطلب للتعديل."
      );

      return;

    }

    // ==================================================
    // PREPARE PRODUCTS
    // ==================================================

    const preparedCart =
      prepareCartFromOrder(order);

    if (
      preparedCart.length === 0
    ) {

      setMessage(
        "لا توجد منتجات في هذا الطلب لتعديله."
      );

      return;

    }

    // ==================================================
    // SAVE CART
    // ==================================================

    const saved =
      saveCartForCheckout(
        preparedCart
      );

    if (!saved) {

      setMessage(
        "تعذر تجهيز الطلب للتعديل."
      );

      return;

    }

    // ==================================================
    // OPEN CHECKOUT IN EDIT MODE
    // ==================================================

    window.location.href =
      `/checkout?edit=${encodeURIComponent(
        order.id
      )}`;

  };

  // ======================================================
  // COMPLETE PAYMENT
  // ======================================================

  const handlePayment = (order) => {

    try {

      sessionStorage.removeItem(
        "editingOrder"
      );

      sessionStorage.setItem(
        "paymentOrder",
        JSON.stringify(order)
      );

    } catch (err) {

      console.error(
        "Payment Order Error:",
        err
      );

    }

    openCheckoutWithCart(
      order,
      "payment"
    );

  };

  // ======================================================
  // NOT LOGGED IN
  // ======================================================

  if (!user) {

    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          direction: "rtl",
          textAlign: "center",
          padding: "30px",
          background: "#f5f5f5",
          fontFamily:
            "Cairo, Tahoma, Arial, sans-serif",
        }}
      >

        <div
          style={{
            background: "#fff",
            padding: "35px",
            borderRadius: "16px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,.08)",
            maxWidth: "450px",
            width: "100%",
          }}
        >

          <div
            style={{
              fontSize: "55px",
              marginBottom: "15px",
            }}
          >
            🔐
          </div>

          <h2>
            يجب تسجيل الدخول أولاً
          </h2>

          <p
            style={{
              color: "#777",
            }}
          >
            سجل الدخول لمشاهدة طلباتك.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "12px 25px",
              cursor: "pointer",
              background: "#f68b1e",
              color: "#fff",
              fontWeight: "700",
              fontSize: "15px",
              fontFamily: "inherit",
            }}
          >
            تسجيل الدخول
          </button>

        </div>

      </div>

    );

  }

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {

    return (

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          direction: "rtl",
          fontFamily:
            "Cairo, Tahoma, Arial, sans-serif",
        }}
      >

        <h2>
          جاري تحميل الطلبات...
        </h2>

      </div>

    );

  }

  // ======================================================
  // PAGE
  // ======================================================

  return (

    <div
      className="orders-page"
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        direction: "rtl",
        padding: "25px 15px 50px",
        fontFamily:
          "Cairo, Tahoma, Arial, sans-serif",
      }}
    >

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow:
              "0 3px 15px rgba(0,0,0,.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >

          <div>

            <h1
              style={{
                margin: "0 0 5px",
                fontSize: "28px",
              }}
            >
              📦 طلباتي
            </h1>

            <p
              style={{
                margin: 0,
                color: "#777",
              }}
            >
              متابعة وإدارة طلباتك
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "11px 20px",
              cursor: "pointer",
              background: "#f68b1e",
              color: "#fff",
              fontWeight: "700",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          >
            🏠 العودة للمتجر
          </button>

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div
            style={{
              background: "#ffebee",
              color: "#c62828",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>

        )}

        {/* ==================================================
            MESSAGE
        ================================================== */}

        {message && (

          <div
            style={{
              background: "#e8f5e9",
              color: "#2e7d32",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontWeight: "600",
            }}
          >
            {message}
          </div>

        )}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {orders.length === 0 ? (

          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "50px 20px",
              textAlign: "center",
              boxShadow:
                "0 3px 15px rgba(0,0,0,.06)",
            }}
          >

            <div
              style={{
                fontSize: "60px",
                marginBottom: "15px",
              }}
            >
              📦
            </div>

            <h2>
              لا توجد طلبات حتى الآن
            </h2>

            <p
              style={{
                color: "#777",
              }}
            >
              عندما تقوم بعمل طلب، سيظهر هنا.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "12px 25px",
                cursor: "pointer",
                background: "#f68b1e",
                color: "#fff",
                fontWeight: "700",
                fontFamily: "inherit",
              }}
            >
              ابدأ التسوق
            </button>

          </div>

        ) : (

          orders.map((order) => {

            const preparing =
              isPreparing(order);

            const cancelled =
              isCancelled(order);

            const editable =
              canEdit(order);

            const cancelable =
              canCancel(order);

            const products =
              Array.isArray(order.products)
                ? order.products
                : [];

            return (

              <div
                key={order.id}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "20px",
                  marginBottom: "20px",
                  boxShadow:
                    "0 3px 15px rgba(0,0,0,.07)",
                }}
              >

                {/* ==================================================
                    ORDER HEADER
                ================================================== */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "15px",
                  }}
                >

                  <div>

                    <h3
                      style={{
                        margin: "0 0 5px",
                        wordBreak:
                          "break-word",
                      }}
                    >
                      طلب رقم #{order.id}
                    </h3>

                    <div
                      style={{
                        color: "#777",
                        fontSize: "13px",
                      }}
                    >
                      📅{" "}
                      {formatDate(
                        order.createdAt
                      )}
                    </div>

                  </div>

                  <div
                    style={{
                      background:
                        preparing
                          ? "#fff3e0"
                          : cancelled
                            ? "#ffebee"
                            : "#e8f5e9",

                      color:
                        preparing
                          ? "#e65100"
                          : cancelled
                            ? "#c62828"
                            : "#2e7d32",

                      padding: "7px 14px",
                      borderRadius: "20px",
                      fontWeight: "700",
                      fontSize: "13px",
                    }}
                  >
                    {order.status || "جديد"}
                  </div>

                </div>

                <hr />

                {/* ==================================================
                    CUSTOMER
                ================================================== */}

                <div
                  style={{
                    lineHeight: "1.9",
                    marginBottom: "15px",
                  }}
                >

                  <div>
                    👤{" "}
                    <strong>
                      {order.customerName ||
                        order.name ||
                        "غير محدد"}
                    </strong>
                  </div>

                  <div>
                    📱{" "}
                    {order.phone ||
                      "غير محدد"}
                  </div>

                  <div>
                    📍{" "}
                    {order.address ||
                      "غير محدد"}
                  </div>

                </div>

                <hr />

                {/* ==================================================
                    PRODUCTS
                ================================================== */}

                <h3>
                  المنتجات
                </h3>

                {products.length === 0 ? (

                  <p
                    style={{
                      color: "#777",
                    }}
                  >
                    لا توجد تفاصيل للمنتجات.
                  </p>

                ) : (

                  products.map(
                    (item, index) => (

                      <div
                        key={
                          item.cartId ||
                          item.id ||
                          item._id ||
                          index
                        }
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          gap: "15px",
                          padding: "10px 0",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: "10px",
                            minWidth: 0,
                          }}
                        >

                          {item.image && (

                            <img
                              src={item.image}
                              alt=""
                              style={{
                                width: "55px",
                                height: "55px",
                                objectFit: "cover",
                                borderRadius:
                                  "8px",
                                flexShrink: 0,
                              }}
                            />

                          )}

                          <div
                            style={{
                              minWidth: 0,
                            }}
                          >

                            <div
                              style={{
                                fontWeight: "700",
                                wordBreak:
                                  "break-word",
                              }}
                            >
                              {item.title ||
                                item.name ||
                                "منتج"}
                            </div>

                            <div
                              style={{
                                color: "#777",
                                fontSize: "13px",
                              }}
                            >
                              الكمية:{" "}
                              {item.quantity || 1}
                            </div>

                            {item.selectedVariant && (

                              <div
                                style={{
                                  color: "#777",
                                  fontSize: "12px",
                                  marginTop: "3px",
                                }}
                              >
                                الاختيار:{" "}
                                {
                                  item
                                    .selectedVariant
                                    .name ||
                                  item
                                    .selectedVariant
                                    .title ||
                                  item
                                    .selectedVariant
                                    .label ||
                                  ""
                                }
                              </div>

                            )}

                            {item.variantName &&
                              !item.selectedVariant && (

                                <div
                                  style={{
                                    color: "#777",
                                    fontSize: "12px",
                                    marginTop: "3px",
                                  }}
                                >
                                  الاختيار:{" "}
                                  {item.variantName}
                                </div>

                              )}

                          </div>

                        </div>

                        <strong
                          style={{
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {Number(
                            item.price || 0
                          ).toLocaleString(
                            "ar-EG"
                          )}{" "}
                          جنيه
                        </strong>

                      </div>

                    )
                  )

                )}

                {/* ==================================================
                    TOTAL
                ================================================== */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginTop: "20px",
                    padding: "15px",
                    background: "#f8f8f8",
                    borderRadius: "10px",
                    gap: "10px",
                  }}
                >

                  <strong>
                    الإجمالي
                  </strong>

                  <strong
                    style={{
                      fontSize: "20px",
                      color: "#f68b1e",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {Number(
                      order.total ||
                        order.totalPrice ||
                        0
                    ).toLocaleString(
                      "ar-EG"
                    )}{" "}
                    جنيه
                  </strong>

                </div>

                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "20px",
                  }}
                >

                  {/* ==================================================
                      EDIT
                  ================================================== */}

                  {editable && (

                    <button
                      type="button"
                      onClick={() =>
                        handleEditOrder(
                          order
                        )
                      }
                      style={{
                        flex:
                          "1 1 180px",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px",
                        cursor: "pointer",
                        background: "#1976d2",
                        color: "#fff",
                        fontWeight: "700",
                        fontFamily:
                          "inherit",
                      }}
                    >
                      ✏️ تعديل الطلب
                    </button>

                  )}

                  {/* ==================================================
                      CANCEL
                  ================================================== */}

                  {cancelable && (

                    <button
                      type="button"
                      onClick={() =>
                        handleCancelOrder(
                          order
                        )
                      }
                      disabled={
                        cancelingId ===
                        order.id
                      }
                      style={{
                        flex:
                          "1 1 180px",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px",
                        cursor:
                          cancelingId ===
                          order.id
                            ? "not-allowed"
                            : "pointer",
                        background: "#e53935",
                        color: "#fff",
                        fontWeight: "700",
                        opacity:
                          cancelingId ===
                          order.id
                            ? 0.7
                            : 1,
                        fontFamily:
                          "inherit",
                      }}
                    >
                      {cancelingId ===
                      order.id
                        ? "جارٍ الإلغاء..."
                        : "❌ إلغاء الطلب"}
                    </button>

                  )}

                  {/* ==================================================
                      PAYMENT
                  ================================================== */}

                  {!cancelled && (

                    <button
                      type="button"
                      onClick={() =>
                        handlePayment(
                          order
                        )
                      }
                      style={{
                        flex:
                          "1 1 180px",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px",
                        cursor: "pointer",
                        background: "#2e7d32",
                        color: "#fff",
                        fontWeight: "700",
                        fontFamily:
                          "inherit",
                      }}
                    >
                      💳 إكمال الدفع
                    </button>

                  )}

                </div>

                {/* ==================================================
                    PREPARING NOTICE
                ================================================== */}

                {preparing && (

                  <div
                    style={{
                      marginTop: "15px",
                      padding: "12px",
                      borderRadius: "8px",
                      background: "#fff8e1",
                      color: "#8d6e00",
                      fontSize: "13px",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    🔒 الطلب قيد التجهيز، لذلك لا يمكن
                    تعديله أو إلغاؤه حاليًا.
                  </div>

                )}

                {/* ==================================================
                    CANCELLED NOTICE
                ================================================== */}

                {cancelled && (

                  <div
                    style={{
                      marginTop: "15px",
                      padding: "12px",
                      borderRadius: "8px",
                      background: "#ffebee",
                      color: "#c62828",
                      fontSize: "13px",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    ❌ تم إلغاء هذا الطلب.
                  </div>

                )}

              </div>

            );

          })

        )}

      </div>

    </div>

  );

}

export default Orders;