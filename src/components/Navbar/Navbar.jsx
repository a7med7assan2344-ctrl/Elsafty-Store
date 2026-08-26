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

import {
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../../firebase";

import { getCategories } from "../../services/categoryService";

import "./Navbar.css";

// =====================================================
// DEFAULT STORE SETTINGS
// =====================================================

const defaultStoreSettings = {
  storeName: "Elsafty Store",

  theme: {
    primary: "#f68b1e",
    secondary: "#ff9900",
    accent: "#f68b1e",

    pageBackground: "#f5f5f5",
    cardBackground: "#ffffff",

    textPrimary: "#313133",
    textSecondary: "#75757a",

    border: "#e2e2e2",

    buttonBackground: "#f68b1e",
    buttonText: "#ffffff",

    navbarBackground: "#ffffff",
    navbarText: "#313133",

    categoryBarBackground: "#ffffff",
    categoryBarText: "#313133",

    topStripBackground: "#f68b1e",
    topStripText: "#ffffff",

    footerBackground: "#313133",
    footerText: "#ffffff",
  },

  topStrip: {
    enabled: true,
    direction: "rtl",
    speed: 40,
    height: 36,
    fontSize: 13,
    fontFamily: "Cairo",
    items: [],
  },
};

// =====================================================
// COMPONENT
// =====================================================

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

  // =====================================================
  // STATES
  // =====================================================

  const [user, setUser] =
    useState(null);

  const [accountName, setAccountName] =
    useState("");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [helpOpen, setHelpOpen] =
    useState(false);

  const [logoZoom, setLogoZoom] =
    useState(false);

  const [categories, setCategories] =
    useState([]);

  const [suggestions, setSuggestions] =
    useState([]);

  const [openCategory, setOpenCategory] =
    useState(null);

  const [mobileCategory, setMobileCategory] =
    useState(null);

  const [openSubCategories, setOpenSubCategories] =
    useState([]);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [storeSettings, setStoreSettings] =
    useState(defaultStoreSettings);

  // =====================================================
  // REFS
  // =====================================================

  const menuRef = useRef(null);

  const helpRef = useRef(null);

  const searchRef = useRef(null);

  const categoryMenuRef =
    useRef(null);

  const categoryBarRef =
    useRef(null);

  // =====================================================
  // THEME
  // =====================================================

  const theme =
    storeSettings.theme ||
    defaultStoreSettings.theme;

  const topStrip =
    storeSettings.topStrip ||
    defaultStoreSettings.topStrip;

  // =====================================================
  // LOAD STORE SETTINGS
  // =====================================================

  useEffect(() => {
    const settingsRef = doc(
      db,
      "settings",
      "store"
    );

    const unsubscribe =
      onSnapshot(
        settingsRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            return;
          }

          const data =
            snapshot.data();

          setStoreSettings(
            (previous) => ({
              ...previous,

              ...data,

              theme: {
                ...previous.theme,
                ...(data.theme || {}),
              },

              topStrip: {
                ...previous.topStrip,
                ...(data.topStrip || {}),
              },
            })
          );
        },
        (error) => {
          console.error(
            "Store Settings Error:",
            error
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  // =====================================================
  // FIREBASE USER
  // =====================================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser);

          if (!currentUser) {
            setAccountName("");
            return;
          }

          let name =
            currentUser.displayName ||
            "";

          try {
            const userRef =
              doc(
                db,
                "users",
                currentUser.uid
              );

            const userSnap =
              await getDoc(
                userRef
              );

            if (userSnap.exists()) {
              const data =
                userSnap.data();

              name =
                data.name ||
                data.displayName ||
                currentUser.displayName ||
                "حسابي";
            }
          } catch (error) {
            console.error(
              "Error loading account name:",
              error
            );
          }

          setAccountName(
            name || "حسابي"
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  useEffect(() => {
    const fetchCategories =
      async () => {
        try {
          const data =
            await getCategories();

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
            "Categories Error:",
            error
          );

          setCategories([]);
        }
      };

    fetchCategories();
  }, []);

  // =====================================================
  // CLOSE SEARCH OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleOutsideSearch =
      (event) => {
        if (
          searchRef.current &&
          !searchRef.current.contains(
            event.target
          )
        ) {
          setSuggestions([]);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideSearch
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideSearch
      );
    };
  }, []);

  // =====================================================
  // CLOSE ACCOUNT OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleOutsideAccount =
      (event) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(
            event.target
          )
        ) {
          setMenuOpen(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideAccount
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideAccount
      );
    };
  }, []);

  // =====================================================
  // CLOSE HELP OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleOutsideHelp =
      (event) => {
        if (
          helpRef.current &&
          !helpRef.current.contains(
            event.target
          )
        ) {
          setHelpOpen(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideHelp
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideHelp
      );
    };
  }, []);

  // =====================================================
  // CLOSE CATEGORY OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleOutsideCategory =
      (event) => {
        if (
          categoryMenuRef.current &&
          !categoryMenuRef.current.contains(
            event.target
          )
        ) {
          setOpenCategory(null);
          setMobileCategory(null);
          setOpenSubCategories([]);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideCategory
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideCategory
      );
    };
  }, []);

  // =====================================================
  // ESC
  // =====================================================

  useEffect(() => {
    const handleEscape =
      (event) => {
        if (
          event.key !==
          "Escape"
        ) {
          return;
        }

        setMenuOpen(false);
        setHelpOpen(false);
        setSuggestions([]);
        setOpenCategory(null);
        setMobileCategory(null);
        setOpenSubCategories([]);
        setLogoZoom(false);
        setMobileMenuOpen(false);
      };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = async () => {
    try {
      await signOut(auth);

      setMenuOpen(false);

      navigate("/");
    } catch (error) {
      console.error(
        "Logout Error:",
        error
      );
    }
  };

  // =====================================================
  // SCROLL
  // =====================================================

  const scrollToSection = (
    selector
  ) => {
    const element =
      document.querySelector(
        selector
      );

    if (!element) {
      navigate("/");
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // =====================================================
  // CATEGORY BAR SCROLL
  // =====================================================

  const moveCategories = (
    direction
  ) => {
    const bar =
      categoryBarRef.current;

    if (!bar) {
      return;
    }

    bar.scrollBy({
      left: direction,
      behavior: "smooth",
    });
  };

  // =====================================================
  // SEARCH CHANGE
  // =====================================================

  const handleSearchChange =
    (event) => {
      const value =
        event.target.value;

      setSearchTerm(value);

      const trimmedValue =
        value.trim();

      if (!trimmedValue) {
        setSuggestions([]);
        return;
      }

      const searchValue =
        trimmedValue.toLowerCase();

      const results =
        (products || [])
          .filter((product) => {
            const name =
              product?.title ||
              product?.name ||
              product?.productName ||
              "";

            return String(name)
              .toLowerCase()
              .includes(
                searchValue
              );
          })
          .slice(0, 6);

      setSuggestions(results);
    };

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = () => {
    const value =
      searchTerm?.trim();

    if (!value) {
      return;
    }

    navigate(
      `/search?q=${encodeURIComponent(
        value
      )}`
    );

    setSuggestions([]);
    setMobileMenuOpen(false);
  };

  // =====================================================
  // SEARCH SUGGESTION
  // =====================================================

  const handleSuggestionClick =
    (product) => {
      const id =
        product?.id ||
        product?._id;

      setSearchTerm("");
      setSuggestions([]);

      if (id) {
        navigate(
          `/product/${id}`
        );
      }
    };

  // =====================================================
  // CATEGORY HELPERS
  // =====================================================

  const normalizeId = (
    value
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }

    return String(value);
  };

  const getParentId = (
    category
  ) => {
    return normalizeId(
      category?.parentId
    );
  };

  const mainCategories =
    categories.filter(
      (category) =>
        !getParentId(category)
    );

  const getChildren = (
    parentId
  ) => {
    const normalizedParent =
      normalizeId(parentId);

    return categories.filter(
      (category) =>
        getParentId(category) ===
        normalizedParent
    );
  };

  const hasChildren = (
    category
  ) => {
    if (!category?.id) {
      return false;
    }

    return (
      getChildren(
        category.id
      ).length > 0
    );
  };

  const isSubCategoryOpen = (
    categoryId
  ) => {
    return openSubCategories.includes(
      normalizeId(categoryId)
    );
  };

  // =====================================================
  // DESCENDANTS
  // =====================================================

  const getDescendantIds = (
    parentId
  ) => {
    const result = [];

    const walk = (id) => {
      const children =
        getChildren(id);

      children.forEach(
        (child) => {
          const childId =
            normalizeId(child.id);

          result.push(childId);

          walk(child.id);
        }
      );
    };

    walk(parentId);

    return result;
  };

  // =====================================================
  // OPEN SUBCATEGORY
  // =====================================================

  const openSubCategory = (
    categoryId
  ) => {
    const id =
      normalizeId(categoryId);

    setOpenSubCategories(
      (previous) => {
        if (
          previous.includes(id)
        ) {
          return previous;
        }

        return [
          ...previous,
          id,
        ];
      }
    );
  };

  // =====================================================
  // TOGGLE SUBCATEGORY
  // =====================================================

  const toggleSubCategory =
    (category) => {
      if (!category) {
        return;
      }

      const id =
        normalizeId(
          category.id
        );

      const children =
        getChildren(
          category.id
        );

      if (!children.length) {
        selectCategory(
          category
        );
        return;
      }

      setOpenSubCategories(
        (previous) => {
          if (
            previous.includes(id)
          ) {
            const descendants =
              getDescendantIds(
                category.id
              );

            return previous.filter(
              (itemId) =>
                itemId !== id &&
                !descendants.includes(
                  itemId
                )
            );
          }

          return [
            ...previous,
            id,
          ];
        }
      );
    };

  // =====================================================
  // SELECT CATEGORY
  // =====================================================

  const selectCategory =
    (category) => {
      if (!category) {
        return;
      }

      const categoryName =
        category.name;

      if (
        setSelectedCategory
      ) {
        setSelectedCategory(
          categoryName
        );
      }

      window.dispatchEvent(
        new CustomEvent(
          "filterCategory",
          {
            detail:
              categoryName,
          }
        )
      );

      setOpenCategory(null);
      setMobileCategory(null);
      setOpenSubCategories([]);
      setMobileMenuOpen(false);

      setTimeout(() => {
        scrollToSection(
          ".products-section"
        );
      }, 50);
    };

  // =====================================================
  // CATEGORY CLICK
  // =====================================================

  const handleCategoryClick =
    (category) => {
      if (!category) {
        return;
      }

      const children =
        getChildren(
          category.id
        );

      if (!children.length) {
        selectCategory(
          category
        );
        return;
      }

      const id =
        normalizeId(
          category.id
        );

      if (
        window.innerWidth <=
        700
      ) {
        if (
          mobileCategory ===
            id &&
          openCategory === id
        ) {
          selectCategory(
            category
          );

          return;
        }

        setMobileCategory(id);
        setOpenCategory(id);
        setOpenSubCategories([
          id,
        ]);

        return;
      }

      if (
        openCategory === id
      ) {
        selectCategory(
          category
        );

        return;
      }

      setOpenCategory(id);

      setOpenSubCategories([
        id,
      ]);
    };

  // =====================================================
  // DESKTOP HOVER
  // =====================================================

  const handleCategoryMouseEnter =
    (category) => {
      if (
        window.innerWidth <=
        700
      ) {
        return;
      }

      const id =
        normalizeId(
          category.id
        );

      if (
        hasChildren(category)
      ) {
        setOpenCategory(id);

        setOpenSubCategories([
          id,
        ]);
      } else {
        setOpenCategory(null);
        setOpenSubCategories([]);
      }
    };

  const handleSubCategoryMouseEnter =
    (category) => {
      if (
        window.innerWidth <=
        700
      ) {
        return;
      }

      if (
        hasChildren(category)
      ) {
        openSubCategory(
          category.id
        );
      }
    };

  const handleCategoryAreaLeave =
    () => {
      if (
        window.innerWidth <=
        700
      ) {
        return;
      }

      setOpenCategory(null);
      setOpenSubCategories([]);
    };

  // =====================================================
  // DEEP MENU
  // =====================================================

  const renderDeepChildren = (
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
        className={`mega-deep-children level-${level}`}
      >
        {children.map(
          (child) => {
            const childId =
              normalizeId(
                child.id
              );

            const childHasChildren =
              hasChildren(child);

            const childIsOpen =
              isSubCategoryOpen(
                childId
              );

            return (
              <div
                key={childId}
                className={`mega-deep-item ${
                  childIsOpen
                    ? "mega-link-open"
                    : ""
                }`}
                onMouseEnter={() =>
                  handleSubCategoryMouseEnter(
                    child
                  )
                }
              >
                <button
                  type="button"
                  className={`mega-link ${
                    childIsOpen
                      ? "active-subcategory"
                      : ""
                  }`}
                  onClick={() => {
                    if (
                      childHasChildren
                    ) {
                      toggleSubCategory(
                        child
                      );
                    } else {
                      selectCategory(
                        child
                      );
                    }
                  }}
                >
                  {child.image ? (
                    <img
                      src={
                        child.image
                      }
                      alt={
                        child.name
                      }
                      loading="lazy"
                    />
                  ) : (
                    <span className="mega-link-icon">
                      {child.icon ||
                        "•"}
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
                  childIsOpen && (
                    <div className="mega-deep-level">
                      {renderDeepChildren(
                        child.id,
                        level + 1
                      )}
                    </div>
                  )}
              </div>
            );
          }
        )}
      </div>
    );
  };

  // =====================================================
  // MEGA MENU
  // =====================================================

  const renderMegaMenu =
    (category) => {
      if (!category) {
        return null;
      }

      const children =
        getChildren(
          category.id
        );

      if (!children.length) {
        return null;
      }

      const categoryId =
        normalizeId(
          category.id
        );

      return (
        <div
          className={`mega-menu ${
            mobileCategory ===
            categoryId
              ? "mega-menu-mobile-open"
              : ""
          }`}
          onMouseEnter={() => {
            if (
              window.innerWidth >
              700
            ) {
              setOpenCategory(
                categoryId
              );
            }
          }}
        >
          <div className="mega-menu-inner">

            <div className="mega-menu-title">
              <div className="mega-menu-title-icon">
                {category.image ? (
                  <img
                    src={
                      category.image
                    }
                    alt={
                      category.name
                    }
                    loading="lazy"
                  />
                ) : (
                  <span>
                    {category.icon ||
                      "📦"}
                  </span>
                )}
              </div>

              <div className="mega-menu-title-content">
                <strong>
                  {category.name}
                </strong>

                <small>
                  تصفح أقسام{" "}
                  {category.name}
                </small>
              </div>
            </div>

            <div className="mega-columns">
              {children.map(
                (child) => {
                  const childId =
                    normalizeId(
                      child.id
                    );

                  const grandchildren =
                    getChildren(
                      child.id
                    );

                  const childHasChildren =
                    grandchildren.length >
                    0;

                  const childIsOpen =
                    isSubCategoryOpen(
                      childId
                    );

                  return (
                    <div
                      className={`mega-column ${
                        childIsOpen
                          ? "mega-column-open"
                          : ""
                      }`}
                      key={
                        childId
                      }
                      onMouseEnter={() =>
                        handleSubCategoryMouseEnter(
                          child
                        )
                      }
                    >
                      <button
                        type="button"
                        className={`mega-column-title ${
                          childIsOpen
                            ? "active-subcategory"
                            : ""
                        }`}
                        onClick={() => {
                          if (
                            childHasChildren
                          ) {
                            toggleSubCategory(
                              child
                            );
                          } else {
                            selectCategory(
                              child
                            );
                          }
                        }}
                      >
                        {child.image ? (
                          <img
                            src={
                              child.image
                            }
                            alt={
                              child.name
                            }
                            loading="lazy"
                          />
                        ) : (
                          <span>
                            {child.icon ||
                              "📦"}
                          </span>
                        )}

                        <span>
                          {
                            child.name
                          }
                        </span>

                        {childHasChildren && (
                          <b className="mega-arrow">
                            ‹
                          </b>
                        )}
                      </button>

                      {childHasChildren &&
                        childIsOpen && (
                          <div className="mega-column-items">
                            {grandchildren.map(
                              (
                                grandChild
                              ) => {
                                const grandId =
                                  normalizeId(
                                    grandChild.id
                                  );

                                const grandHasChildren =
                                  hasChildren(
                                    grandChild
                                  );

                                const grandIsOpen =
                                  isSubCategoryOpen(
                                    grandId
                                  );

                                return (
                                  <div
                                    key={
                                      grandId
                                    }
                                    className={`mega-link-wrapper ${
                                      grandIsOpen
                                        ? "mega-link-open"
                                        : ""
                                    }`}
                                    onMouseEnter={() =>
                                      handleSubCategoryMouseEnter(
                                        grandChild
                                      )
                                    }
                                  >
                                    <button
                                      type="button"
                                      className={`mega-link ${
                                        grandIsOpen
                                          ? "active-subcategory"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        if (
                                          grandHasChildren
                                        ) {
                                          toggleSubCategory(
                                            grandChild
                                          );
                                        } else {
                                          selectCategory(
                                            grandChild
                                          );
                                        }
                                      }}
                                    >
                                      {grandChild.image ? (
                                        <img
                                          src={
                                            grandChild.image
                                          }
                                          alt={
                                            grandChild.name
                                          }
                                          loading="lazy"
                                        />
                                      ) : (
                                        <span className="mega-link-icon">
                                          {grandChild.icon ||
                                            "•"}
                                        </span>
                                      )}

                                      <span>
                                        {
                                          grandChild.name
                                        }
                                      </span>

                                      {grandHasChildren && (
                                        <b className="mega-arrow">
                                          ‹
                                        </b>
                                      )}
                                    </button>

                                    {grandHasChildren &&
                                      grandIsOpen && (
                                        <div className="mega-deep-level">
                                          {renderDeepChildren(
                                            grandChild.id,
                                            0
                                          )}
                                        </div>
                                      )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}

                      {!childHasChildren && (
                        <button
                          type="button"
                          className="mega-link mega-single-link"
                          onClick={() =>
                            selectCategory(
                              child
                            )
                          }
                        >
                          <span>
                            عرض المنتجات
                          </span>
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

  // =====================================================
  // TOP STRIP
  // =====================================================

  const configuredTopStripItems =
    Array.isArray(
      topStrip.items
    )
      ? topStrip.items.filter(
          (item) =>
            item?.active !==
              false &&
            item?.text
        )
      : [];

  const activeTopStripItems =
    configuredTopStripItems.length >
    0
      ? configuredTopStripItems.map(
          (item) =>
            `${item.icon || ""} ${
              item.text
            }`.trim()
        )
      : Array.isArray(
          offerText
        )
        ? offerText
        : [];

  const repeatedTopStripItems = [
    ...activeTopStripItems,
    ...activeTopStripItems,
    ...activeTopStripItems,
    ...activeTopStripItems,
  ];

  // =====================================================
  // DYNAMIC STYLE
  // =====================================================

  const navbarStyle = {
    "--navbar-bg":
      theme.navbarBackground ||
      "#ffffff",

    "--navbar-text":
      theme.navbarText ||
      "#313133",

    "--category-bg":
      theme.categoryBarBackground ||
      "#ffffff",

    "--category-text":
      theme.categoryBarText ||
      "#313133",

    "--accent":
      theme.accent ||
      "#f68b1e",

    "--primary":
      theme.primary ||
      "#f68b1e",

    "--secondary":
      theme.secondary ||
      "#ff9900",

    "--top-strip-bg":
      theme.topStripBackground ||
      "#f68b1e",

    "--top-strip-text":
      theme.topStripText ||
      "#ffffff",

    "--top-strip-height":
      `${Number(
        topStrip.height || 36
      )}px`,

    "--top-strip-font-size":
      `${Number(
        topStrip.fontSize || 13
      )}px`,

    "--top-strip-duration":
      `${Math.max(
        5,
        Number(
          topStrip.speed || 40
        )
      )}s`,

    "--top-strip-font-family":
      topStrip.fontFamily ||
      "Cairo",
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="store-navbar-theme jumia-navbar"
      style={navbarStyle}
      dir="rtl"
    >

      {/* =================================================
          TOP STRIP
      ================================================= */}

      {topStrip.enabled !==
        false && (
        <div
          className="top-offer-bar"
          style={{
            height: `${Number(
              topStrip.height ||
                36
            )}px`,

            background:
              theme.topStripBackground ||
              "#f68b1e",

            color:
              theme.topStripText ||
              "#ffffff",

            direction:
              topStrip.direction ||
              "rtl",

            fontSize: `${Number(
              topStrip.fontSize ||
                13
            )}px`,

            fontFamily:
              topStrip.fontFamily ||
              "Cairo",
          }}
        >
          <div
            className="offer-track"
            style={{
              direction:
                topStrip.direction ||
                "rtl",

              animationDuration:
                `${Math.max(
                  5,
                  Number(
                    topStrip.speed ||
                      40
                  )
                )}s`,

              animationDirection:
                topStrip.direction ===
                "ltr"
                  ? "reverse"
                  : "normal",

              color:
                theme.topStripText ||
                "#ffffff",

              fontFamily:
                topStrip.fontFamily ||
                "Cairo",
            }}
          >
            {repeatedTopStripItems.map(
              (
                text,
                index
              ) => (
                <span
                  key={`${text}-${index}`}
                >
                  {text}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* =================================================
          MAIN HEADER
      ================================================= */}

      <header
        className="store-header"
        style={{
          background:
            theme.navbarBackground ||
            "#ffffff",

          color:
            theme.navbarText ||
            "#313133",
        }}
      >

        {/* MOBILE MENU */}

        <button
          type="button"
          className="mobile-menu-button"
          aria-label="القائمة"
          onClick={() =>
            setMobileMenuOpen(
              (previous) =>
                !previous
            )
          }
        >
          ☰
        </button>

        {/* LOGO */}

        <div className="nav-logo">
          <img
            src="/logo/logo.png"
            alt={
              storeSettings.storeName ||
              "Elsafty Store"
            }
            onClick={(
              event
            ) => {
              event.stopPropagation();
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
            placeholder="البحث عن منتجات، والعلامات التجارية والأقسام"
            value={
              searchTerm || ""
            }
            onChange={
              handleSearchChange
            }
            onKeyDown={(
              event
            ) => {
              if (
                event.key ===
                "Enter"
              ) {
                event.preventDefault();
                handleSearch();
              }

              if (
                event.key ===
                "Escape"
              ) {
                setSuggestions([]);
              }
            }}
          />

          <button
            type="button"
            className="search-button"
            aria-label="البحث"
            onClick={
              handleSearch
            }
          >
            🔍
          </button>

          {/* SEARCH SUGGESTIONS */}

          {suggestions.length >
            0 && (
            <div className="search-suggestions">
              {suggestions.map(
                (
                  item,
                  index
                ) => {
                  const id =
                    item?.id ||
                    item?._id ||
                    `suggestion-${index}`;

                  const title =
                    item?.title ||
                    item?.name ||
                    item?.productName ||
                    "منتج";

                  const image =
                    item?.image ||
                    item?.images?.[0];

                  return (
                    <button
                      key={id}
                      type="button"
                      className="suggestion-item"
                      onClick={() =>
                        handleSuggestionClick(
                          item
                        )
                      }
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          className="suggestion-image"
                          loading="lazy"
                        />
                      ) : (
                        <span className="suggestion-image-placeholder">
                          📦
                        </span>
                      )}

                      <span>
                        {title}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          )}

          {/* NO RESULT */}

          {searchTerm?.trim() &&
            suggestions.length ===
              0 && (
              <div className="search-suggestions">
                <div className="search-no-result">
                  لا توجد منتجات مطابقة للبحث
                </div>
              </div>
            )}
        </div>

        {/* =================================================
            HEADER ACTIONS
        ================================================= */}

        <div className="nav-actions">

          {/* ACCOUNT */}

          <div
            className="account-menu"
            ref={menuRef}
          >
            <button
              type="button"
              className="nav-action-button"
              aria-label="تسجيل الدخول"
              aria-expanded={
                menuOpen
              }
              onClick={() =>
                setMenuOpen(
                  (previous) =>
                    !previous
                )
              }
            >
              <span className="action-icon">
                👤
              </span>

              <span className="action-content">
                <small>
                  {user
                    ? "أهلاً"
                    : "تسجيل الدخول"}
                </small>

                <strong>
                  {user
                    ? accountName ||
                      "حسابي"
                    : "حسابي"}
                </strong>
              </span>

              <span className="action-arrow">
                ▾
              </span>
            </button>

            {menuOpen && (
              <div
                className="account-dropdown"
                style={{
                  background:
                    theme.cardBackground ||
                    "#ffffff",

                  color:
                    theme.textPrimary ||
                    "#313133",

                  borderColor:
                    theme.accent ||
                    "#f68b1e",
                }}
              >
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
                      <span>
                        🔑
                      </span>

                      <span>
                        تسجيل الدخول
                      </span>
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
                      <span>
                        ➕
                      </span>

                      <span>
                        إنشاء حساب
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="account-user-info">
                      <strong>
                        {accountName ||
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
                      <span>
                        👤
                      </span>

                      <span>
                        حسابي
                      </span>
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
                      <span>
                        📦
                      </span>

                      <span>
                        طلباتي
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={
                        logout
                      }
                    >
                      <span>
                        🚪
                      </span>

                      <span>
                        تسجيل الخروج
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* HELP */}

          <div
            className="help-menu"
            ref={helpRef}
          >
            <button
              type="button"
              className="nav-action-button"
              aria-label="المساعدة"
              onClick={() =>
                setHelpOpen(
                  (previous) =>
                    !previous
                )
              }
            >
              <span className="action-icon">
                ❓
              </span>

              <span className="action-content">
                <small>
                  محتاج مساعدة؟
                </small>

                <strong>
                  المساعدة
                </strong>
              </span>

              <span className="action-arrow">
                ▾
              </span>
            </button>

            {helpOpen && (
              <div className="help-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(
                      false
                    );

                    navigate(
                      "/contact"
                    );
                  }}
                >
                  💬 تواصل معنا
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(
                      false
                    );

                    navigate(
                      "/orders"
                    );
                  }}
                >
                  📦 متابعة طلباتي
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setHelpOpen(
                      false
                    )
                  }
                >
                  ℹ️ مركز المساعدة
                </button>
              </div>
            )}
          </div>

          {/* WISHLIST */}

          <button
            type="button"
            className="nav-action-button wishlist-action"
            aria-label="المفضلة"
            onClick={() =>
              navigate(
                "/wishlist"
              )
            }
          >
            <span className="action-icon">
              ❤️
            </span>

            <span className="action-content">
              <small>
                منتجاتي
              </small>

              <strong>
                المفضلة
              </strong>
            </span>

            {wishlist.length >
              0 && (
              <span className="wishlist-badge">
                {wishlist.length >
                99
                  ? "99+"
                  : wishlist.length}
              </span>
            )}
          </button>

          {/* ADMIN */}

          {admin && (
            <button
              type="button"
              className="admin-btn"
              aria-label="الإدارة"
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
            aria-label="سلة التسوق"
            onClick={() =>
              navigate(
                "/cart"
              )
            }
          >
            <span className="cart-symbol">
              🛒
            </span>

            {cartCount >
              0 && (
              <span className="cart-badge">
                {cartCount >
                99
                  ? "99+"
                  : cartCount}
              </span>
            )}

            <span className="cart-text">
              سلة التسوق
            </span>
          </button>
        </div>
      </header>

      {/* =================================================
          CATEGORY NAVIGATION
      ================================================= */}

      <div
        className={`navbar-bottom-wrapper ${
          mobileMenuOpen
            ? "mobile-navigation-open"
            : ""
        }`}
        ref={categoryMenuRef}
        onMouseLeave={
          handleCategoryAreaLeave
        }
        style={{
          background:
            theme.categoryBarBackground ||
            "#ffffff",

          color:
            theme.categoryBarText ||
            "#313133",

          borderColor:
            theme.border ||
            "#e2e2e2",
        }}
      >

        {/* MOBILE CLOSE */}

        <button
          type="button"
          className="mobile-navigation-close"
          onClick={() =>
            setMobileMenuOpen(
              false
            )
          }
        >
          ✕ إغلاق
        </button>

        {/* LEFT ARROW */}

        <button
          type="button"
          className="category-arrow"
          aria-label="تحريك الأقسام لليسار"
          onClick={() =>
            moveCategories(-300)
          }
        >
          ❮
        </button>

        {/* NAV */}

        <nav
          className="navbar-bottom"
          ref={categoryBarRef}
        >

          {/* HOME */}

          <button
            type="button"
            className="nav-category-item home-item"
            onClick={() => {
              setOpenCategory(
                null
              );

              setMobileCategory(
                null
              );

              setOpenSubCategories(
                []
              );

              setMobileMenuOpen(
                false
              );

              navigate("/");
            }}
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
            onClick={() => {
              setOpenCategory(
                null
              );

              setMobileCategory(
                null
              );

              setOpenSubCategories(
                []
              );

              setMobileMenuOpen(
                false
              );

              scrollToSection(
                ".categories"
              );
            }}
          >
            <span>
              📱
            </span>

            <strong>
              الأقسام
            </strong>
          </button>

          {/* MAIN CATEGORIES */}

          {mainCategories.map(
            (category) => {
              const categoryId =
                normalizeId(
                  category.id
                );

              const children =
                getChildren(
                  category.id
                );

              const isOpen =
                openCategory ===
                categoryId;

              return (
                <div
                  key={
                    categoryId
                  }
                  className={`nav-category-wrapper ${
                    isOpen
                      ? "category-is-open"
                      : ""
                  }`}
                  onMouseEnter={() =>
                    handleCategoryMouseEnter(
                      category
                    )
                  }
                >
                  <button
                    type="button"
                    className={`nav-category-item main-category-item ${
                      isOpen
                        ? "active-category"
                        : ""
                    }`}
                    onClick={() =>
                      handleCategoryClick(
                        category
                      )
                    }
                  >
                    {category.image ? (
                      <img
                        src={
                          category.image
                        }
                        alt={
                          category.name
                        }
                        loading="lazy"
                      />
                    ) : (
                      <span>
                        {category.icon ||
                          "📦"}
                      </span>
                    )}

                    <strong>
                      {
                        category.name
                      }
                    </strong>

                    {children.length >
                      0 && (
                      <span className="category-down-arrow">
                        ▾
                      </span>
                    )}
                  </button>

                  {isOpen &&
                    renderMegaMenu(
                      category
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

          {/* NEW */}

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
          aria-label="تحريك الأقسام لليمين"
          onClick={() =>
            moveCategories(300)
          }
        >
          ❯
        </button>
      </div>

      {/* =================================================
          LOGO MODAL
      ================================================= */}

      {logoZoom && (
        <div
          className="logo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="شعار Elsafty Store"
          onClick={() =>
            setLogoZoom(false)
          }
        >
          <button
            type="button"
            className="close-logo"
            aria-label="إغلاق"
            onClick={() =>
              setLogoZoom(false)
            }
          >
            ✕
          </button>

          <img
            src="/logo/logo.png"
            alt={
              storeSettings.storeName ||
              "Elsafty Store"
            }
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          />
        </div>
      )}
    </div>
  );
}

export default Navbar;