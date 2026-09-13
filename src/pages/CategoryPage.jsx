import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../firebase";

import { CartContext } from "../context/CartContext";

import { getCategories } from "../services/categoryService";

import Navbar from "../components/Navbar/Navbar";
import ProductsSlider from "../components/ProductsSlider";

import "../styles/store.css";
import "./Home.css";

function CategoryPage({
  products = [],
  admin,
  searchTerm,
  setSearchTerm,
  setCurrentView,
}) {
  const navigate = useNavigate();

  // ======================================================
  // CATEGORY ID
  // ======================================================

  const { id } = useParams();

  // ======================================================
  // CART
  // ======================================================

  const {
    cart = [],
    addToCart,
  } = useContext(CartContext);

  // ======================================================
  // STATES
  // ======================================================

  const [categories, setCategories] =
    useState([]);

  const [sortBy, setSortBy] =
    useState("default");

  const [minPrice, setMinPrice] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  // ======================================================
  // STORE SETTINGS
  // ======================================================

  const [storeSettings, setStoreSettings] =
    useState(null);

  // ======================================================
  // CART COUNT
  // ======================================================

  const cartCount = cart.reduce(
    (total, item) =>
      total + Number(item?.quantity || 0),
    0
  );

  // ======================================================
  // LOAD STORE SETTINGS
  //
  // نستخدمها خصوصًا لرقم WhatsApp.
  // ======================================================

  useEffect(() => {
    let mounted = true;

    const loadStoreSettings = async () => {
      try {
        const snapshot = await getDoc(
          doc(db, "settings", "store")
        );

        if (!mounted) {
          return;
        }

        if (snapshot.exists()) {
          setStoreSettings(
            snapshot.data() || {}
          );
        } else {
          setStoreSettings({});
        }
      } catch (error) {
        console.error(
          "خطأ في تحميل إعدادات المتجر:",
          error
        );

        if (mounted) {
          setStoreSettings({});
        }
      }
    };

    loadStoreSettings();

    return () => {
      mounted = false;
    };
  }, []);

  // ======================================================
  // WHATSAPP NUMBER
  //
  // ندعم أكثر من شكل حتى لا تتأثر الصفحة
  // باختلاف بنية الإعدادات الحالية.
  // ======================================================

  const whatsappNumber = useMemo(() => {
    const raw =
      storeSettings?.whatsapp ||
      storeSettings?.phone ||
      storeSettings?.contact?.whatsapp ||
      storeSettings?.socials?.whatsapp ||
      "";

    return String(raw)
      .replace(/[^\d+]/g, "")
      .replace(/^00/, "+");
  }, [storeSettings]);

  // ======================================================
  // WHATSAPP LINK
  // ======================================================

  const whatsappLink = useMemo(() => {
    if (!whatsappNumber) {
      return "";
    }

    const digits =
      whatsappNumber.replace(/\D/g, "");

    if (!digits) {
      return "";
    }

    const message = encodeURIComponent(
      `مرحبًا، أريد الاستفسار عن قسم ${""}`
    );

    return `https://wa.me/${digits}?text=${message}`;
  }, [whatsappNumber]);

  // ======================================================
  // LOAD CATEGORIES
  // ======================================================

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const data = await getCategories();

        if (!mounted) {
          return;
        }

        const activeCategories =
          (data || []).filter(
            (category) =>
              category?.active === true
          );

        setCategories(
          activeCategories
        );
      } catch (error) {
        console.error(
          "خطأ في تحميل الأقسام:",
          error
        );

        if (mounted) {
          setCategories([]);
        }
      }
    };

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  // ======================================================
  // CURRENT CATEGORY
  // ======================================================

  const currentCategory = useMemo(() => {
    if (!id) {
      return null;
    }

    return categories.find(
      (category) =>
        String(category?.id || "") ===
          String(id) ||
        String(category?._id || "") ===
          String(id)
    );
  }, [categories, id]);

  // ======================================================
  // CURRENT CATEGORY NAME
  // ======================================================

  const currentCategoryName =
    currentCategory?.name || "";

  // ======================================================
  // CHILD CATEGORIES
  // ======================================================

  const childCategories = useMemo(() => {
    if (!currentCategory) {
      return [];
    }

    const currentId =
      String(
        currentCategory?.id ||
          currentCategory?._id ||
          ""
      );

    if (!currentId) {
      return [];
    }

    return categories
      .filter((category) => {
        const parentId =
          String(
            category?.parentId || ""
          );

        return (
          parentId !== "" &&
          parentId === currentId
        );
      })
      .slice()
      .sort(
        (a, b) =>
          Number(
            a?.sortOrder ?? 0
          ) -
          Number(
            b?.sortOrder ?? 0
          )
      );
  }, [
    categories,
    currentCategory,
  ]);

  // ======================================================
  // HAS CHILDREN
  // ======================================================

  const hasChildCategories =
    childCategories.length > 0;

  // ======================================================
  // GET CHILDREN COUNT
  // ======================================================

  const getChildrenCount =
    (category) => {
      if (!category) {
        return 0;
      }

      const categoryId =
        String(
          category?.id ||
            category?._id ||
            ""
        );

      if (!categoryId) {
        return 0;
      }

      return categories.filter(
        (item) =>
          String(
            item?.parentId || ""
          ) === categoryId
      ).length;
    };

  // ======================================================
  // GET CATEGORY PRODUCTS
  // ======================================================

  const getCategoryProducts =
    (categoryId, categoryName) => {
      const selectedId =
        String(
          categoryId || ""
        ).trim();

      const selectedName =
        String(
          categoryName || ""
        )
          .trim()
          .toLowerCase();

      return (
        products || []
      ).filter((product) => {
        const productCategoryId =
          String(
            product?.categoryId ||
              product?.category_id ||
              ""
          ).trim();

        const productCategoryName =
          String(
            product?.category || ""
          )
            .trim()
            .toLowerCase();

        if (
          productCategoryId !== ""
        ) {
          return (
            productCategoryId ===
            selectedId
          );
        }

        return (
          selectedName !== "" &&
          productCategoryName ===
            selectedName
        );
      });
    };

  // ======================================================
  // CATEGORY PRODUCTS
  // ======================================================

  const categoryProducts = useMemo(() => {
    if (!currentCategory) {
      return [];
    }

    if (hasChildCategories) {
      return [];
    }

    const selectedCategoryId =
      String(
        currentCategory?.id ||
          currentCategory?._id ||
          id ||
          ""
      ).trim();

    const selectedCategoryName =
      String(
        currentCategoryName || ""
      )
        .trim()
        .toLowerCase();

    const search =
      String(
        searchTerm || ""
      )
        .trim()
        .toLowerCase();

    return getCategoryProducts(
      selectedCategoryId,
      selectedCategoryName
    )
      .filter((product) => {
        const title =
          String(
            product?.title ||
              product?.name ||
              product?.productName ||
              ""
          )
            .toLowerCase();

        const description =
          String(
            product?.description || ""
          ).toLowerCase();

        const matchSearch =
          search === "" ||
          title.includes(search) ||
          description.includes(search);

        const price =
          Number(
            product?.price || 0
          );

        const matchMinPrice =
          minPrice === "" ||
          price >= Number(minPrice);

        const matchMaxPrice =
          maxPrice === "" ||
          price <= Number(maxPrice);

        return (
          matchSearch &&
          matchMinPrice &&
          matchMaxPrice
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "low":
            return (
              Number(a?.price || 0) -
              Number(b?.price || 0)
            );

          case "high":
            return (
              Number(b?.price || 0) -
              Number(a?.price || 0)
            );

          case "rating":
            return (
              Number(b?.rating || 0) -
              Number(a?.rating || 0)
            );

          case "new":
            return (
              Number(!!b?.newArrival) -
              Number(!!a?.newArrival)
            );

          case "best":
            return (
              Number(!!b?.bestSeller) -
              Number(!!a?.bestSeller)
            );

          default:
            return 0;
        }
      });
  }, [
    currentCategory,
    currentCategoryName,
    id,
    hasChildCategories,
    products,
    searchTerm,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // ======================================================
  // SPECIAL PRODUCTS
  // ======================================================

  const offers =
    categoryProducts.filter(
      (product) =>
        product?.offer === true
    );

  const bestSellers =
    categoryProducts.filter(
      (product) =>
        product?.bestSeller === true
    );

  const newArrivals =
    categoryProducts.filter(
      (product) =>
        product?.newArrival === true
    );

  const recommended =
    categoryProducts.filter(
      (product) =>
        product?.recommended === true
    );

  // ======================================================
  // RESET FILTERS
  // ======================================================

  const resetFilters = () => {
    if (
      typeof setSearchTerm ===
      "function"
    ) {
      setSearchTerm("");
    }

    setSortBy("default");
    setMinPrice("");
    setMaxPrice("");
  };

  // ======================================================
  // NAVBAR VIEW
  // ======================================================

  const handleViewChange = (view) => {
    if (
      typeof setCurrentView ===
      "function"
    ) {
      setCurrentView(view);
      return;
    }

    switch (view) {
      case "admin":
        navigate("/admin");
        break;

      case "cart":
        navigate("/cart");
        break;

      case "account":
        navigate("/account");
        break;

      case "orders":
        navigate("/orders");
        break;

      case "store":
      default:
        navigate("/");
        break;
    }
  };

  // ======================================================
  // OPEN CATEGORY
  // ======================================================

  const openCategory = (
    category
  ) => {
    if (!category) {
      return;
    }

    const categoryId =
      category?.id ||
      category?._id;

    const categoryName =
      category?.name;

    if (categoryId) {
      navigate(
        `/category/${encodeURIComponent(
          categoryId
        )}`
      );

      return;
    }

    if (categoryName) {
      navigate(
        `/category/${encodeURIComponent(
          categoryName
        )}`
      );
    }
  };

  // ======================================================
  // CATEGORY CARD CLASS
  // ======================================================

  const getCategoryCardClass =
    (category) => {
      const size =
        category?.cardSize ||
        "medium";

      if (
        size === "small"
      ) {
        return "store-choice-card small";
      }

      if (
        size === "large"
      ) {
        return "store-choice-card large";
      }

      return "store-choice-card medium";
    };

  // ======================================================
  // CATEGORY CARD STYLE
  // ======================================================

  const getCategoryCardStyle =
    (category) => {
      const color =
        category?.color ||
        "#071A36";

      return {
        "--category-color":
          color,

        "--category-color-light":
          `${color}18`,

        "--category-color-medium":
          `${color}30`,

        "--category-color-dark":
          color,
      };
    };

  // ======================================================
  // GET CATEGORY PRODUCT COUNT
  // ======================================================

  const getCategoryProductCount =
    (category) => {
      if (!category) {
        return 0;
      }

      const categoryId =
        String(
          category?.id ||
            category?._id ||
            ""
        );

      const categoryName =
        String(
          category?.name || ""
        )
          .trim()
          .toLowerCase();

      return getCategoryProducts(
        categoryId,
        categoryName
      ).length;
    };

  // ======================================================
  // FIND PARENT CATEGORY
  // ======================================================

  const parentCategory =
    useMemo(() => {
      if (!currentCategory) {
        return null;
      }

      const parentId =
        String(
          currentCategory?.parentId ||
            ""
        ).trim();

      if (!parentId) {
        return null;
      }

      return (
        categories.find(
          (category) =>
            String(
              category?.id ||
                category?._id ||
                ""
            ) === parentId
        ) || null
      );
    }, [
      categories,
      currentCategory,
    ]);

  // ======================================================
  // BACK
  // ======================================================

  const handleBack = () => {
    if (parentCategory) {
      const parentId =
        parentCategory?.id ||
        parentCategory?._id;

      if (parentId) {
        navigate(
          `/category/${encodeURIComponent(
            parentId
          )}`
        );

        return;
      }
    }

    navigate("/");
  };

  // ======================================================
  // CATEGORY NOT FOUND
  // ======================================================

  if (
    categories.length > 0 &&
    !currentCategory
  ) {
    return (
      <>
        <Navbar
          setCurrentView={
            handleViewChange
          }
          cartCount={cartCount}
          searchTerm={searchTerm}
          setSearchTerm={
            setSearchTerm
          }
          admin={admin}
          products={products}
        />

        <main
          className="category-page"
          style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            direction: "rtl",
          }}
        >
          <div className="no-products">
            <div className="no-products-icon">
              📂
            </div>

            <h3>
              القسم غير موجود
            </h3>

            <p>
              ربما تم حذف القسم أو
              الرابط غير صحيح
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
            >
              ← العودة للرئيسية
            </button>
          </div>
        </main>
      </>
    );
  }

  // ======================================================
  // WAITING FOR CATEGORY
  // ======================================================

  if (
    categories.length === 0
  ) {
    return (
      <>
        <Navbar
          setCurrentView={
            handleViewChange
          }
          cartCount={cartCount}
          searchTerm={searchTerm}
          setSearchTerm={
            setSearchTerm
          }
          admin={admin}
          products={products}
        />

        <main
          className="category-page"
          style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            direction: "rtl",
          }}
        >
          <div className="no-products">
            <div className="no-products-icon">
              ⏳
            </div>

            <h3>
              جاري تحميل القسم...
            </h3>
          </div>
        </main>
      </>
    );
  }

  // ======================================================
  // RETURN
  // ======================================================

  return (
    <>
      {/* ==================================================
          NAVBAR
      ================================================== */}

      <Navbar
        setCurrentView={
          handleViewChange
        }
        cartCount={cartCount}
        searchTerm={searchTerm}
        setSearchTerm={
          setSearchTerm
        }
        admin={admin}
        products={products}
      />

      {/* ==================================================
          CATEGORY PAGE
      ================================================== */}

      <main
        className="category-page"
        dir="rtl"
      >
        {/* ==================================================
            CATEGORY HERO
        ================================================== */}

        <section
          className="category-hero"
          style={{
            "--category-hero-color":
              currentCategory?.color ||
              "#071A36",
          }}
        >
          <div className="category-hero-glow" />

          <div className="category-hero-content">

            <div className="category-hero-image-wrap">

              <div className="category-hero-image">

                {currentCategory?.image ? (
                  <img
                    src={
                      currentCategory.image
                    }
                    alt={
                      currentCategoryName ||
                      "صورة القسم"
                    }
                    loading="eager"
                    onError={(
                      event
                    ) => {
                      event.currentTarget.style.display =
                        "none";

                      const fallback =
                        event.currentTarget
                          .parentElement
                          ?.querySelector(
                            ".category-hero-fallback"
                          );

                      if (fallback) {
                        fallback.style.display =
                          "flex";
                      }
                    }}
                  />
                ) : null}

                <div
                  className="category-hero-fallback"
                  style={{
                    display:
                      currentCategory?.image
                        ? "none"
                        : "flex",
                  }}
                >
                  {currentCategory?.icon ||
                    "📦"}
                </div>

              </div>

            </div>

            <div className="category-hero-info">

              <span className="category-hero-label">
                متجر ســـــَــــــــوا
              </span>

              <h1>
                {currentCategoryName ||
                  "القسم"}
              </h1>

              <p>
                {hasChildCategories
                  ? "اختارالبراند المناسب ليك وتصفح المنتجات بسهولة."
                  : "تصفح أفضل المنتجات الموجودة داخل هذا القسم واختر اللي يناسبك."}
              </p>

              <div className="category-hero-stats">

                {hasChildCategories ? (
                  <>
                    <div className="category-stat">
                      <strong>
                        {
                          childCategories.length
                        }
                      </strong>

                      <span>
                        قسم فرعي
                      </span>
                    </div>

                    <div className="category-stat">
                      <strong>
                        {childCategories.reduce(
                          (
                            total,
                            category
                          ) =>
                            total +
                            getCategoryProductCount(
                              category
                            ),
                          0
                        )}
                      </strong>

                      <span>
                        منتج
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="category-stat">
                      <strong>
                        {
                          categoryProducts.length
                        }
                      </strong>

                      <span>
                        منتج
                      </span>
                    </div>

                    <div className="category-stat">
                      <strong>
                        {offers.length}
                      </strong>

                      <span>
                        عرض
                      </span>
                    </div>
                  </>
                )}

              </div>

            </div>

            <button
              type="button"
              className="category-back-btn category-hero-back"
              onClick={
                handleBack
              }
            >
              <span>
                ←
              </span>

              <span>
                {parentCategory
                  ? `العودة إلى ${parentCategory.name}`
                  : "العودة للرئيسية"}
              </span>
            </button>

          </div>
        </section>

        {/* ==================================================
            SUB CATEGORIES
        ================================================== */}

        {hasChildCategories && (
          <section className="category-subcategories-section">

            <div className="category-section-heading">

              <div>
                <span className="category-section-kicker">
                  تصفح حسب القسم
                </span>

                <h2>
                  📂البراندات والمحلات
                </h2>

                <p>
                  اختار المكان اللي عايز
                  تتصفح منتجاته
                </p>
              </div>

              <span className="category-section-count">
                {childCategories.length} قسم
              </span>

            </div>

            <div className="store-choices-grid category-cards-grid">

              {childCategories.map(
                (category) => {

                  const childrenCount =
                    getChildrenCount(
                      category
                    );

                  const productCount =
                    getCategoryProductCount(
                      category
                    );

                  return (
                    <button
                      type="button"
                      key={
                        category?.id ||
                        category?._id ||
                        category?.name
                      }
                      className={`${getCategoryCardClass(
                        category
                      )} category-modern-card`}
                      style={getCategoryCardStyle(
                        category
                      )}
                      onClick={() =>
                        openCategory(
                          category
                        )
                      }
                    >
                      <div className="category-modern-image">

                        {category?.image ? (
                          <img
                            src={
                              category.image
                            }
                            alt={
                              category?.name ||
                              "قسم"
                            }
                            loading="lazy"
                            onError={(
                              event
                            ) => {
                              event.currentTarget.style.display =
                                "none";

                              const fallback =
                                event.currentTarget
                                  .parentElement
                                  ?.querySelector(
                                    ".category-modern-image-fallback"
                                  );

                              if (fallback) {
                                fallback.style.display =
                                  "flex";
                              }
                            }}
                          />
                        ) : null}

                        <span
                          className="category-modern-image-fallback"
                          style={{
                            display:
                              category?.image
                                ? "none"
                                : "flex",
                          }}
                        >
                          {category?.icon ||
                            "📂"}
                        </span>

                        <span className="category-modern-overlay">
                          عرض القسم
                          <span>
                            ←
                          </span>
                        </span>

                      </div>

                      <div className="category-modern-info">

                        <div className="category-modern-title-row">

                          <strong>
                            {category?.name ||
                              "قسم"}
                          </strong>

                          <span className="category-modern-arrow">
                            ❯
                          </span>

                        </div>

                        <div className="category-modern-meta">

                          {childrenCount >
                          0 ? (
                            <span>
                              📂{" "}
                              {
                                childrenCount
                              }{" "}
                              أقسام فرعية
                            </span>
                          ) : (
                            <span>
                              📦{" "}
                              {
                                productCount
                              }{" "}
                              منتج
                            </span>
                          )}

                        </div>

                      </div>
                    </button>
                  );
                }
              )}

            </div>
          </section>
        )}

        {/* ==================================================
            PRODUCTS AREA
        ================================================== */}

        {!hasChildCategories && (
          <>
            {/* ==================================================
                FILTERS
            ================================================== */}

            <section className="category-products-section">

              <div className="products-filters">

                <select
                  value={sortBy}
                  onChange={(
                    event
                  ) =>
                    setSortBy(
                      event.target.value
                    )
                  }
                >
                  <option value="default">
                    ترتيب افتراضي
                  </option>

                  <option value="low">
                    💰 الأقل سعرًا
                  </option>

                  <option value="high">
                    💰 الأعلى سعرًا
                  </option>

                  <option value="rating">
                    ⭐ الأعلى تقييمًا
                  </option>

                  <option value="new">
                    🆕 الأحدث
                  </option>

                  <option value="best">
                    🔥 الأكثر مبيعًا
                  </option>
                </select>

                <input
                  type="number"
                  min="0"
                  placeholder="من سعر"
                  value={minPrice}
                  onChange={(
                    event
                  ) =>
                    setMinPrice(
                      event.target.value
                    )
                  }
                />

                <input
                  type="number"
                  min="0"
                  placeholder="إلى سعر"
                  value={maxPrice}
                  onChange={(
                    event
                  ) =>
                    setMaxPrice(
                      event.target.value
                    )
                  }
                />

                {(searchTerm ||
                  minPrice ||
                  maxPrice ||
                  sortBy !==
                    "default") && (
                  <button
                    type="button"
                    className="category-reset-filters"
                    onClick={
                      resetFilters
                    }
                  >
                    إعادة الضبط
                  </button>
                )}

              </div>

              {/* ==================================================
                  PRODUCTS HEADER
              ================================================== */}

              <div className="section-header category-products-header">

                <div>
                  <span className="category-section-kicker">
                    اكتشف منتجاتنا
                  </span>

                  <h2>
                    📦 منتجات القسم
                  </h2>
                </div>

                <span className="products-count">
                  {
                    categoryProducts.length
                  }{" "}
                  منتج
                </span>

              </div>

              {/* ==================================================
                  OFFERS
              ================================================== */}

              {offers.length > 0 && (
                <ProductsSlider
                  title="🔥 عروض القسم"
                  badge="🔥 خصم"
                  badgeClass="offer"
                  products={
                    offers
                  }
                  addToCart={
                    addToCart
                  }
                  categoryName={
                    currentCategoryName
                  }
                />
              )}

              {/* ==================================================
                  BEST SELLERS
              ================================================== */}

              {bestSellers.length >
                0 && (
                <ProductsSlider
                  title="⭐ الأكثر مبيعًا"
                  badge="⭐ الأكثر طلبًا"
                  badgeClass="best"
                  products={
                    bestSellers
                  }
                  addToCart={
                    addToCart
                  }
                  categoryName={
                    currentCategoryName
                  }
                />
              )}

              {/* ==================================================
                  NEW ARRIVALS
              ================================================== */}

              {newArrivals.length >
                0 && (
                <ProductsSlider
                  title="🆕 وصل حديثًا"
                  badge="🆕 جديد"
                  badgeClass="new"
                  products={
                    newArrivals
                  }
                  addToCart={
                    addToCart
                  }
                  categoryName={
                    currentCategoryName
                  }
                />
              )}

              {/* ==================================================
                  RECOMMENDED
              ================================================== */}

              {recommended.length >
                0 && (
                <ProductsSlider
                  title="❤️ قد يعجبك"
                  badge="❤️ مميز"
                  badgeClass="recommended"
                  products={
                    recommended
                  }
                  addToCart={
                    addToCart
                  }
                  categoryName={
                    currentCategoryName
                  }
                />
              )}

              {/* ==================================================
                  ALL PRODUCTS
              ================================================== */}

              {categoryProducts.length >
              0 ? (
                <div className="products-grid">

                  {categoryProducts.map(
                    (product) => {

                      const productId =
                        product?.id ||
                        product?._id;

                      const image =
                        product?.image ||
                        product?.images?.[0] ||
                        "/default-product.png";

                      const title =
                        product?.title ||
                        product?.name ||
                        product?.productName ||
                        "منتج";

                      const price =
                        Number(
                          product?.price ||
                            0
                        );

                      const oldPrice =
                        Number(
                          product?.oldPrice ||
                            0
                        );

                      const discount =
                        oldPrice >
                          price &&
                        oldPrice > 0
                          ? Math.round(
                              (
                                (
                                  oldPrice -
                                  price
                                ) /
                                oldPrice
                              ) *
                                100
                            )
                          : 0;

                      return (
                        <article
                          key={
                            productId
                          }
                          className="product-card"
                          onClick={() =>
                            navigate(
                              `/product/${productId}`
                            )
                          }
                        >
                          <div className="product-card-image">

                            {discount >
                              0 && (
                              <span className="discount-badge">
                                -{discount}%
                              </span>
                            )}

                            {product?.newArrival && (
                              <span className="new-badge">
                                جديد
                              </span>
                            )}

                            {product?.bestSeller && (
                              <span className="product-badge">
                                ⭐
                              </span>
                            )}

                            <img
                              src={image}
                              alt={
                                title
                              }
                              loading="lazy"
                              onError={(
                                event
                              ) => {
                                event.currentTarget.src =
                                  "/default-product.png";
                              }}
                            />

                          </div>

                          <div className="product-card-info">

                            <h3>
                              {title}
                            </h3>

                            <div className="product-rating">
                              ⭐{" "}
                              {Number(
                                product?.rating ||
                                  0
                              ).toFixed(
                                1
                              )}
                            </div>

                            <div className="product-price">

                              <strong>
                                {price} ج.م
                              </strong>

                              {oldPrice >
                                price && (
                                <del>
                                  {
                                    oldPrice
                                  }{" "}
                                  ج.م
                                </del>
                              )}

                            </div>

                            <button
                              type="button"
                              className="add-to-cart-btn"
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                addToCart({
                                  ...product,
                                  quantity: 1,
                                });
                              }}
                            >
                              🛒 أضف للسلة
                            </button>

                          </div>
                        </article>
                      );
                    }
                  )}

                </div>
              ) : (
                <div className="no-products">

                  <div className="no-products-icon">
                    📦
                  </div>

                  <h3>
                    لا توجد منتجات في هذا القسم
                  </h3>

                  <p>
                    جرب تغيير البحث أو الفلاتر
                  </p>

                  <button
                    type="button"
                    onClick={
                      resetFilters
                    }
                  >
                    إعادة ضبط الفلاتر
                  </button>

                </div>
              )}

            </section>
          </>
        )}
      </main>

      {/* ==================================================
          FLOATING WHATSAPP
      ================================================== */}

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="category-floating-whatsapp"
          aria-label="تواصل معنا على واتساب"
          title="تواصل معنا على واتساب"
        >
          <span className="category-whatsapp-icon">
            <svg
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <path
                d="M16.04 3C8.85 3 3 8.82 3 16c0 2.3.61 4.56 1.76 6.53L3 29l6.63-1.73A13.04 13.04 0 0 0 16.04 29C23.22 29 29 23.18 29 16S23.22 3 16.04 3Zm0 23.75c-2.1 0-4.15-.56-5.96-1.63l-.43-.25-3.93 1.03 1.05-3.82-.28-.44A10.77 10.77 0 1 1 16.04 26.75Zm5.9-8.08c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.59-1.9-1.77-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.64s1.13 3.06 1.29 3.27c.16.21 2.23 3.4 5.4 4.77.76.33 1.35.53 1.81.68.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z"
                fill="currentColor"
              />
            </svg>
          </span>

          <span className="category-whatsapp-text">
            واتساب
          </span>
        </a>
      )}

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="store-footer">

        <div className="footer-container">

          <div className="footer-column">

            <h2>
              ســـــَــــــــوا
            </h2>

            <p>
              متجر إلكتروني يوفر أفضل
              المنتجات بأفضل الأسعار
              مع خدمة عملاء متميزة.
            </p>

          </div>

          <div className="footer-column">

            <h3>
              روابط سريعة
            </h3>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate("/")
              }
            >
              🏠 الرئيسية
            </button>

            <button
              type="button"
              className="footer-link"
              onClick={() =>
                navigate("/cart")
              }
            >
              🛒 السلة
            </button>

          </div>

          <div className="footer-column">

            <h3>
              خدمة العملاء
            </h3>

            <p>
              📞 دعم طوال الأسبوع
            </p>

            <p>
              🚚 شحن لجميع المحافظات
            </p>

            <p>
              🔒 دفع آمن
            </p>

            <p>
              ⭐ ضمان جودة المنتجات
            </p>

          </div>

        </div>

        <div className="footer-bottom">

          ©{" "}
          {new Date().getFullYear()}{" "}
          ســـــَــــــــوا
          {" - "}
          جميع الحقوق محفوظة.

        </div>

      </footer>
    </>
  );
}

export default CategoryPage;