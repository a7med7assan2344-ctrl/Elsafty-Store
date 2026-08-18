import React, {
  useEffect,
  useRef,
  useState,
  useContext,
} from "react";

import { useNavigate } from "react-router-dom";

import offerText from "../../config/offerConfig";

import { WishlistContext } from "../../context/WishlistContext";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../../firebase";

import { getCategories } from "../../services/categoryService";

import "./Navbar.css";

function Navbar({
  setCurrentView,
  cartCount,
  searchTerm,
  setSearchTerm,
  admin,
  products = [],
  setSelectedCategory,
}) {
  const navigate = useNavigate();

  const { wishlist = [] } =
    useContext(WishlistContext);

  // =========================
  // STATES
  // =========================

  const [user, setUser] = useState(null);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [logoZoom, setLogoZoom] =
    useState(false);

  const [categories, setCategories] =
    useState([]);

  const [suggestions, setSuggestions] =
    useState([]);

  // القسم المفتوح في Mega Menu
  const [openCategory, setOpenCategory] =
    useState(null);

  // للموبايل
  const [mobileCategory, setMobileCategory] =
    useState(null);

  const menuRef = useRef(null);

  const searchRef = useRef(null);

  const categoryMenuRef =
    useRef(null);

  // =========================
  // FIREBASE USER
  // =========================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
        }
      );

    return () => unsubscribe();
  }, []);

  // =========================
  // تحميل الأقسام
  // =========================

  useEffect(() => {
    const fetchCategories =
      async () => {
        try {
          const data =
            await getCategories();

          setCategories(
            (data || []).filter(
              (cat) =>
                cat.active === true
            )
          );
        } catch (error) {
          console.log(
            "Categories Error:",
            error
          );
        }
      };

    fetchCategories();
  }, []);

  // =========================
  // إغلاق البحث عند الضغط خارجه
  // =========================

  useEffect(() => {
    const closeSearch = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          e.target
        )
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener(
      "click",
      closeSearch
    );

    return () => {
      document.removeEventListener(
        "click",
        closeSearch
      );
    };
  }, []);

  // =========================
  // إغلاق الحساب عند الضغط خارجه
  // =========================

  useEffect(() => {
    const closeMenu = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          e.target
        )
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "click",
      closeMenu
    );

    return () => {
      document.removeEventListener(
        "click",
        closeMenu
      );
    };
  }, []);

  // =========================
  // إغلاق Mega Menu عند الضغط خارجه
  // =========================

  useEffect(() => {
    const closeCategoryMenu = (
      e
    ) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(
          e.target
        )
      ) {
        setOpenCategory(null);
        setMobileCategory(null);
      }
    };

    document.addEventListener(
      "click",
      closeCategoryMenu
    );

    return () => {
      document.removeEventListener(
        "click",
        closeCategoryMenu
      );
    };
  }, []);

  // =========================
  // تسجيل الخروج
  // =========================

  const logout = async () => {
    try {
      await signOut(auth);

      setMenuOpen(false);

      navigate("/");
    } catch (error) {
      console.log(
        "Logout Error:",
        error
      );
    }
  };

  // =========================
  // SCROLL
  // =========================

  const scrollToSection = (
    selector
  ) => {
    document
      .querySelector(selector)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  // =========================
  // تحريك شريط الأقسام
  // =========================

  const moveCategories = (
    direction
  ) => {
    const bar =
      document.querySelector(
        ".navbar-bottom"
      );

    if (bar) {
      bar.scrollBy({
        left: direction,
        behavior: "smooth",
      });
    }
  };

  // =========================
  // البحث
  // =========================

  const handleSearchChange = (
    e
  ) => {
    const value =
      e.target.value;

    setSearchTerm(value);

    if (value.trim()) {
      const searchValue =
        value
          .toLowerCase()
          .trim();

      const results = products
        .filter((item) => {
          const name =
            item.title ||
            item.name ||
            item.productName ||
            "";

          return String(name)
            .toLowerCase()
            .includes(searchValue);
        })
        .slice(0, 5);

      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  // =========================
  // تنفيذ البحث
  // =========================

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(
        `/search?q=${encodeURIComponent(
          searchTerm.trim()
        )}`
      );

      setSuggestions([]);
    }
  };

  // =========================
  // اختيار منتج من البحث
  // =========================

  const handleSuggestionClick = (
    product
  ) => {
    const id =
      product.id ||
      product._id;

    setSearchTerm("");

    setSuggestions([]);

    if (id) {
      navigate(`/product/${id}`);
    }
  };

  // =====================================================
  // CATEGORY HELPERS
  // =====================================================

  // تحويل ID إلى String
  const normalizeId = (value) => {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }

    return String(value);
  };

  // الحصول على الأب
  const getParentId = (
    category
  ) => {
    return normalizeId(
      category?.parentId
    );
  };

  // =========================
  // الأقسام الرئيسية
  // =========================

  const mainCategories =
    categories.filter(
      (cat) =>
        !getParentId(cat)
    );

  // =========================
  // الأبناء المباشرين
  // =========================

  const getChildren = (
    parentId
  ) => {
    const normalizedParent =
      normalizeId(parentId);

    return categories.filter(
      (cat) =>
        getParentId(cat) ===
        normalizedParent
    );
  };

  // =========================
  // معرفة هل للقسم أبناء
  // =========================

  const hasChildren = (
    category
  ) => {
    return getChildren(
      category.id
    ).length > 0;
  };

  // =========================
  // فلترة قسم
  // =========================

  const selectCategory = (
    category
  ) => {
    if (!category) return;

    const categoryName =
      category.name;

    if (setSelectedCategory) {
      setSelectedCategory(
        categoryName
      );
    }

    window.dispatchEvent(
      new CustomEvent(
        "filterCategory",
        {
          detail: categoryName,
        }
      )
    );

    setOpenCategory(null);
    setMobileCategory(null);

    scrollToSection(
      ".products-section"
    );
  };

  // =========================
  // الضغط على القسم الرئيسي
  // =========================

  const handleCategoryClick = (
    category
  ) => {
    const children =
      getChildren(category.id);

    // لو فيه أبناء:
    // موبايل = فتح القائمة
    // Desktop = لو القائمة مفتوحة نروح للقسم
    if (children.length > 0) {
      if (
        mobileCategory ===
        category.id
      ) {
        selectCategory(category);
      } else {
        setMobileCategory(
          category.id
        );

        setOpenCategory(
          category.id
        );
      }

      return;
    }

    // قسم بدون أبناء
    selectCategory(category);
  };

  // =========================
  // Hover على Desktop
  // =========================

  const handleCategoryMouseEnter =
    (category) => {
      if (
        window.innerWidth > 700
      ) {
        if (
          hasChildren(category)
        ) {
          setOpenCategory(
            category.id
          );
        }
      }
    };

  // =========================
  // خروج الماوس من Mega Menu
  // =========================

  const handleCategoryAreaLeave =
    () => {
      if (
        window.innerWidth > 700
      ) {
        setOpenCategory(null);
      }
    };

  // =========================
  // بناء الشجرة بشكل Recursive
  // =========================

  const renderCategoryTree = (
    parentId,
    level = 0
  ) => {
    const children =
      getChildren(parentId);

    if (!children.length) {
      return null;
    }

    return (
      <div
        className={`mega-sub-level level-${level}`}
      >
        {children.map((child) => {
          const childHasChildren =
            hasChildren(child);

          return (
            <div
              key={child.id}
              className="mega-child-wrapper"
            >
              <button
                type="button"
                className={`mega-child-item ${
                  level === 0
                    ? "mega-main-child"
                    : "mega-nested-child"
                }`}
                onClick={() =>
                  selectCategory(
                    child
                  )
                }
              >
                {child.image ? (
                  <img
                    src={child.image}
                    alt={child.name}
                    loading="lazy"
                  />
                ) : (
                  <span className="mega-child-icon">
                    {child.icon ||
                      "📦"}
                  </span>
                )}

                <span>
                  {child.name}
                </span>

                {childHasChildren && (
                  <b className="mega-arrow">
                    ‹
                  </b>
                )}
              </button>

              {childHasChildren &&
                renderCategoryTree(
                  child.id,
                  level + 1
                )}
            </div>
          );
        })}
      </div>
    );
  };

  // =========================
  // Mega Menu للقسم
  // =========================

  const renderMegaMenu = (
    category
  ) => {
    if (!category) {
      return null;
    }

    const children =
      getChildren(category.id);

    if (!children.length) {
      return null;
    }

    return (
      <div
        className="mega-menu"
        onMouseEnter={() =>
          setOpenCategory(
            category.id
          )
        }
      >
        <div className="mega-menu-inner">

          {/* عنوان القسم */}

          <div className="mega-menu-title">

            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
              />
            ) : (
              <span>
                {category.icon ||
                  "📦"}
              </span>
            )}

            <div>
              <strong>
                {category.name}
              </strong>

              <small>
                تصفح جميع منتجات القسم
              </small>
            </div>

          </div>

          {/* كل الأقسام الفرعية */}

          <div className="mega-columns">

            {children.map(
              (child) => {
                const grandchildren =
                  getChildren(
                    child.id
                  );

                return (
                  <div
                    className="mega-column"
                    key={child.id}
                  >

                    {/* عنوان العمود */}

                    <button
                      type="button"
                      className="mega-column-title"
                      onClick={() =>
                        selectCategory(
                          child
                        )
                      }
                    >

                      {child.image ? (
                        <img
                          src={
                            child.image
                          }
                          alt={
                            child.name
                          }
                        />
                      ) : (
                        <span>
                          {child.icon ||
                            "📦"}
                        </span>
                      )}

                      <span>
                        {child.name}
                      </span>

                    </button>

                    {/* أبناء العمود */}

                    {grandchildren.length >
                    0 ? (
                      <div className="mega-column-items">

                        {grandchildren.map(
                          (
                            grandChild
                          ) => (
                            <button
                              key={
                                grandChild.id
                              }
                              type="button"
                              className="mega-link"
                              onClick={() =>
                                selectCategory(
                                  grandChild
                                )
                              }
                            >
                              {grandChild.image ? (
                                <img
                                  src={
                                    grandChild.image
                                  }
                                  alt={
                                    grandChild.name
                                  }
                                />
                              ) : (
                                <span>
                                  {grandChild.icon ||
                                    "•"}
                                </span>
                              )}

                              <span>
                                {
                                  grandChild.name
                                }
                              </span>
                            </button>
                          )
                        )}

                      </div>
                    ) : (
                      <button
                        type="button"
                        className="mega-link mega-single-link"
                        onClick={() =>
                          selectCategory(
                            child
                          )
                        }
                      >
                        عرض المنتجات
                      </button>
                    )}

                  </div>
                );
              }
            )}

          </div>

        </div>
      </div>
    );
  };

  // =========================
  // JSX
  // =========================

  return (
    <>
      {/* =====================================================
          TOP OFFER BAR
      ===================================================== */}

      <div className="top-offer-bar">
        <div className="offer-track">

          {[
            ...offerText,
            ...offerText,
            ...offerText,
            ...offerText,
          ].map(
            (text, index) => (
              <span key={index}>
                {text}
              </span>
            )
          )}

        </div>
      </div>

      {/* =====================================================
          MAIN HEADER
      ===================================================== */}

      <header className="store-header">

        {/* LOGO */}

        <div className="nav-logo">

          <img
            src="/logo/logo.png"
            alt="Elsafty Store"
            onClick={(e) => {
              e.stopPropagation();

              setLogoZoom(true);
            }}
          />

        </div>

        {/* SEARCH */}

        <div
          className="search-box"
          ref={searchRef}
        >

          <input
            type="text"
            placeholder="ابحث عن أي منتج..."
            value={searchTerm}
            onChange={
              handleSearchChange
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                handleSearch();
              }
            }}
          />

          <button
            type="button"
            className="search-button"
            onClick={
              handleSearch
            }
          >
            🔍
          </button>

          {suggestions.length >
            0 && (
            <div className="search-suggestions">

              {suggestions.map(
                (item) => {
                  const id =
                    item.id ||
                    item._id;

                  const title =
                    item.title ||
                    item.name ||
                    item.productName ||
                    "منتج";

                  const image =
                    item.image ||
                    item.images?.[0];

                  return (
                    <div
                      key={id}
                      className="suggestion-item"
                      onClick={() =>
                        handleSuggestionClick(
                          item
                        )
                      }
                    >

                      {image && (
                        <img
                          src={image}
                          alt={title}
                          className="suggestion-image"
                        />
                      )}

                      <span>
                        {title}
                      </span>

                    </div>
                  );
                }
              )}

            </div>
          )}

          {searchTerm.trim() &&
            suggestions.length ===
              0 && (
              <div className="search-suggestions">

                <div className="search-no-result">
                  لا توجد منتجات
                </div>

              </div>
            )}

        </div>

        {/* NAV ACTIONS */}

        <div className="nav-actions">

          {/* WISHLIST */}

          <button
            type="button"
            className="nav-icon wishlist-icon"
            onClick={() =>
              navigate(
                "/wishlist"
              )
            }
          >

            <span>
              ❤️
            </span>

            {wishlist.length >
              0 && (
              <span className="wishlist-badge">
                {
                  wishlist.length
                }
              </span>
            )}

            <small>
              المفضلة
            </small>

          </button>

          {/* ACCOUNT */}

          <div
            className="account-menu"
            ref={menuRef}
          >

            <button
              type="button"
              className="nav-icon"
              onClick={() =>
                setMenuOpen(
                  !menuOpen
                )
              }
            >

              <span>
                👤
              </span>

              <small>
                {user
                  ? user.displayName ||
                    "حسابي"
                  : "حسابي"}
              </small>

            </button>

            {menuOpen && (
              <div className="account-dropdown">

                {!user ? (
                  <>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        navigate(
                          "/login"
                        );
                      }}
                    >
                      🔑 تسجيل الدخول
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        navigate(
                          "/register"
                        );
                      }}
                    >
                      ➕ إنشاء حساب
                    </button>

                  </>
                ) : (
                  <>

                    <div className="account-user-info">

                      <strong>
                        {user.displayName ||
                          "المستخدم"}
                      </strong>

                      <span>
                        {user.email}
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        navigate(
                          "/account"
                        );
                      }}
                    >
                      👤 حسابي
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        navigate(
                          "/orders"
                        );
                      }}
                    >
                      📦 طلباتي
                    </button>

                    <button
                      type="button"
                      onClick={logout}
                    >
                      🚪 تسجيل الخروج
                    </button>

                  </>
                )}

              </div>
            )}

          </div>

          {/* ADMIN */}

          {admin && (
            <button
              type="button"
              className="admin-btn"
              onClick={() =>
                navigate(
                  "/admin"
                )
              }
            >

              <span>
                ⚙️
              </span>

              <small>
                الإدارة
              </small>

            </button>
          )}

          {/* CART */}

          <button
            type="button"
            className="cart-icon"
            onClick={() =>
              navigate("/cart")
            }
          >

            <span className="cart-symbol">
              🛒
            </span>

            {cartCount > 0 && (
              <span className="cart-badge">
                {cartCount}
              </span>
            )}

            <small>
              السلة
            </small>

          </button>

        </div>

      </header>

      {/* =====================================================
          CATEGORY BAR + MEGA MENU
      ===================================================== */}

      <div
        className="navbar-bottom-wrapper"
        ref={categoryMenuRef}
        onMouseLeave={
          handleCategoryAreaLeave
        }
      >

        {/* LEFT ARROW */}

        <button
          type="button"
          className="category-arrow"
          onClick={() =>
            moveCategories(-300)
          }
        >
          ❮
        </button>

        {/* CATEGORIES */}

        <nav className="navbar-bottom">

          {/* HOME */}

          <button
            type="button"
            className="nav-category-item home-item"
            onClick={() =>
              navigate("/")
            }
          >

            <span>
              🏠
            </span>

            <strong>
              الرئيسية
            </strong>

          </button>

          {/* ALL CATEGORIES */}

          <button
            type="button"
            className="nav-category-item"
            onClick={() =>
              scrollToSection(
                ".categories"
              )
            }
          >

            <span>
              📱
            </span>

            <strong>
              الأقسام
            </strong>

          </button>

          {/* =================================================
              MAIN CATEGORIES
          ================================================= */}

          {mainCategories.map(
            (cat) => {

              const children =
                getChildren(
                  cat.id
                );

              const isOpen =
                openCategory ===
                cat.id;

              return (
                <div
                  key={cat.id}
                  className={`nav-category-wrapper ${
                    isOpen
                      ? "category-is-open"
                      : ""
                  }`}
                  onMouseEnter={() =>
                    handleCategoryMouseEnter(
                      cat
                    )
                  }
                >

                  <button
                    type="button"
                    className="nav-category-item main-category-item"
                    onClick={() =>
                      handleCategoryClick(
                        cat
                      )
                    }
                  >

                    {cat.image ? (
                      <img
                        src={
                          cat.image
                        }
                        alt={
                          cat.name
                        }
                        loading="lazy"
                      />
                    ) : (
                      <span>
                        {cat.icon ||
                          "📦"}
                      </span>
                    )}

                    <strong>
                      {cat.name}
                    </strong>

                    {children.length >
                      0 && (
                      <span className="category-down-arrow">
                        ▾
                      </span>
                    )}

                  </button>

                  {/* MEGA MENU */}

                  {isOpen &&
                    renderMegaMenu(
                      cat
                    )}

                </div>
              );
            }
          )}

          {/* OFFERS */}

          <button
            type="button"
            className="nav-category-item offer-item"
            onClick={() =>
              scrollToSection(
                ".offer-banner"
              )
            }
          >

            <span>
              🔥
            </span>

            <strong>
              العروض
            </strong>

          </button>

          {/* BEST SELLERS */}

          <button
            type="button"
            className="nav-category-item"
            onClick={() =>
              scrollToSection(
                ".best-selling-section"
              )
            }
          >

            <span>
              ⭐
            </span>

            <strong>
              الأكثر مبيعًا
            </strong>

          </button>

          {/* NEW ARRIVALS */}

          <button
            type="button"
            className="nav-category-item"
            onClick={() =>
              scrollToSection(
                ".new-arrivals-section"
              )
            }
          >

            <span>
              🆕
            </span>

            <strong>
              وصل حديثًا
            </strong>

          </button>

        </nav>

        {/* RIGHT ARROW */}

        <button
          type="button"
          className="category-arrow"
          onClick={() =>
            moveCategories(300)
          }
        >
          ❯
        </button>

      </div>

      {/* =====================================================
          LOGO MODAL
      ===================================================== */}

      {logoZoom && (
        <div
          className="logo-modal"
          onClick={() =>
            setLogoZoom(false)
          }
        >

          <button
            type="button"
            className="close-logo"
            onClick={() =>
              setLogoZoom(false)
            }
          >
            ✕
          </button>

          <img
            src="/logo/logo.png"
            alt="Elsafty Store"
            onClick={(e) =>
              e.stopPropagation()
            }
          />

        </div>
      )}
    </>
  );
}

export default Navbar;