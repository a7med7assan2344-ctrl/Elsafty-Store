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
  // CART COUNT
  // ======================================================

  const cartCount = cart.reduce(
    (total, item) =>
      total + Number(item?.quantity || 0),
    0
  );

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
  //
  // أي قسم له parentId يساوي ID القسم الحالي
  // يعتبر قسمًا فرعيًا تابعًا له.
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
  //
  // نستخدمه لإظهار عدد الأقسام الفرعية
  // الموجودة داخل الكارت.
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
  //
  // المنتجات تظهر فقط عندما لا يكون هناك
  // أقسام فرعية.
  // ======================================================

  const categoryProducts = useMemo(() => {
    if (!currentCategory) {
      return [];
    }

    // ----------------------------------------------------
    // مهم:
    // لو القسم له أقسام فرعية، لا نعرض أي منتجات هنا.
    // ----------------------------------------------------

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
        // ==================================================
        // SEARCH
        // ==================================================

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

        // ==================================================
        // PRICE
        // ==================================================

        const price =
          Number(
            product?.price || 0
          );

        const matchMinPrice =
          minPrice === "" ||
          price >= Number(
            minPrice
          );

        const matchMaxPrice =
          maxPrice === "" ||
          price <= Number(
            maxPrice
          );

        return (
          matchSearch &&
          matchMinPrice &&
          matchMaxPrice
        );
      })

      // ====================================================
      // SORT
      // ====================================================

      .sort((a, b) => {
        switch (sortBy) {
          case "low":
            return (
              Number(
                a?.price || 0
              ) -
              Number(
                b?.price || 0
              )
            );

          case "high":
            return (
              Number(
                b?.price || 0
              ) -
              Number(
                a?.price || 0
              )
            );

          case "rating":
            return (
              Number(
                b?.rating || 0
              ) -
              Number(
                a?.rating || 0
              )
            );

          case "new":
            return (
              Number(
                !!b?.newArrival
              ) -
              Number(
                !!a?.newArrival
              )
            );

          case "best":
            return (
              Number(
                !!b?.bestSeller
              ) -
              Number(
                !!a?.bestSeller
              )
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
  // GET CATEGORY CARD CLASS
  //
  // يحافظ على cardSize القادم من الأدمن.
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
  // GET CATEGORY CARD STYLE
  //
  // يحافظ على color القادم من الأدمن.
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

      <main className="category-page">

        {/* ==================================================
            CATEGORY HEADER
        ================================================== */}

        <div className="category-page-header">

          <div className="category-page-title">

            {currentCategory?.image ? (
              <img
                src={
                  currentCategory.image
                }
                alt={
                  currentCategoryName
                }
              />
            ) : (
              <span className="category-page-icon">
                {currentCategory?.icon ||
                  "📦"}
              </span>
            )}

            <div>
              <h1>
                {currentCategoryName ||
                  "القسم"}
              </h1>

              <p>
                {hasChildCategories
                  ? "اختار القسم الفرعي"
                  : "تصفح منتجات قسم "}
                {!hasChildCategories && (
                  <strong>
                    {currentCategoryName ||
                      "القسم"}
                  </strong>
                )}
              </p>
            </div>

          </div>

          <button
            type="button"
            className="category-back-btn"
            onClick={
              handleBack
            }
          >
            ←{" "}
            {parentCategory
              ? `العودة إلى ${parentCategory.name}`
              : "العودة للرئيسية"}
          </button>

        </div>

        {/* ==================================================
            SUB CATEGORIES
            تظهر فقط إذا كان للقسم أبناء.
        ================================================== */}

        {hasChildCategories && (

          <section
            className="store-choices-section category-subcategories-section"
          >

            <div className="store-choices-header">

              <div>
                <h2>
                  📂 الأقسام الفرعية
                </h2>

                <p>
                  اختار القسم اللي عايز
                  تتصفح منتجاته
                </p>
              </div>

            </div>

            <div className="store-choices-grid">

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
                      className={getCategoryCardClass(
                        category
                      )}
                      style={getCategoryCardStyle(
                        category
                      )}
                      onClick={() =>
                        openCategory(
                          category
                        )
                      }
                    >

                      {/* IMAGE */}

                      <div className="store-choice-image">

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
                            }}
                          />
                        ) : (
                          <span>
                            {
                              category?.icon ||
                              "📂"
                            }
                          </span>
                        )}

                      </div>

                      {/* NAME */}

                      <strong>
                        {
                          category?.name ||
                          "قسم"
                        }
                      </strong>

                      {/* INFO */}

                      <small>
                        {childrenCount >
                        0
                          ? `${childrenCount} قسم فرعي`
                          : productCount >
                              0
                            ? `${productCount} منتج`
                            : "تصفح القسم"}
                      </small>

                      {/* ARROW */}

                      <span className="store-choice-arrow">
                        ❯
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </section>
        )}

        {/* ==================================================
            PRODUCTS AREA
            لا تظهر إلا إذا لم يوجد أبناء.
        ================================================== */}

        {!hasChildCategories && (

          <>

            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="products-filters">

              <select
                value={sortBy}
                onChange={(event) =>
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
                onChange={(event) =>
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
                onChange={(event) =>
                  setMaxPrice(
                    event.target.value
                  )
                }
              />

            </div>

            {/* ==================================================
                PRODUCTS COUNT
            ================================================== */}

            <div className="section-header">

              <div>
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

                        {/* IMAGE */}

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

                        {/* INFO */}

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

          </>
        )}

      </main>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="store-footer">

        <div className="footer-container">

          {/* BRAND */}

          <div className="footer-column">

            <h2>
              Elsafty Store
            </h2>

            <p>
              متجر إلكتروني يوفر أفضل
              المنتجات بأفضل الأسعار
              مع خدمة عملاء متميزة.
            </p>

          </div>

          {/* LINKS */}

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

          {/* SERVICE */}

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
          Elsafty Store
          {" - "}
          جميع الحقوق محفوظة.

        </div>

      </footer>
    </>
  );
}

export default CategoryPage;