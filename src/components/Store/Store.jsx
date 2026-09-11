import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../../firebase";

import Hero from "../Hero/Hero";
import Products from "../Products/Products";

import "./Store.css";


/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_STORE_SETTINGS = {
  storeName: "ســـــَــــــــوا",

  theme: {
    primary: "#071A36",
    secondary: "#0B1F3A",
    accent: "#D4AF37",
    textColor: "#172033",
    fontFamily: "Cairo",
  },

  storeSections: {
    categoriesTitle: "تصفح حسب القسم",
    productsTitle: "أحدث المنتجات",
  },
};


/* =========================================================
   DEFAULT CATEGORIES
   تستخدم فقط لو Firebase لا يحتوي على أقسام
========================================================= */

const DEFAULT_CATEGORIES = [
  {
    id: "all",
    name: "كل المنتجات",
    active: true,
    order: 0,
  },
];


/* =========================================================
   STORE
========================================================= */

function Store({
  products = [],
  searchTerm = "",
  selectedCategory,
  setSelectedCategory,
  addToCart,
}) {
  const [storeSettings, setStoreSettings] = useState(
    DEFAULT_STORE_SETTINGS
  );

  const [categories, setCategories] = useState([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);


  /* =======================================================
     LOAD STORE SETTINGS
  ======================================================= */

  useEffect(() => {
    const storeRef = doc(
      db,
      "settings",
      "store"
    );

    const unsubscribe = onSnapshot(
      storeRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setStoreSettings(
            DEFAULT_STORE_SETTINGS
          );
          return;
        }

        const data = snapshot.data() || {};

        setStoreSettings({
          ...DEFAULT_STORE_SETTINGS,

          ...data,

          theme: {
            ...DEFAULT_STORE_SETTINGS.theme,
            ...(data.theme || {}),
          },

          storeSections: {
            ...DEFAULT_STORE_SETTINGS.storeSections,
            ...(data.storeSections || {}),
            ...(data.sections || {}),
          },
        });
      },
      () => {
        setStoreSettings(
          DEFAULT_STORE_SETTINGS
        );
      }
    );

    return () => unsubscribe();
  }, []);


  /* =======================================================
     LOAD CATEGORIES FROM ADMIN
  ======================================================= */

  useEffect(() => {
    const categoriesRef =
      collection(db, "categories");

    const unsubscribe = onSnapshot(
      categoriesRef,
      (snapshot) => {
        const data = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .filter(
            (category) =>
              category.active !== false
          )
          .sort(
            (a, b) =>
              Number(
                a.sortOrder ??
                  a.order ??
                  9999
              ) -
              Number(
                b.sortOrder ??
                  b.order ??
                  9999
              )
          );

        setCategories(data);

        setLoadingCategories(false);
      },
      () => {
        setCategories([]);

        setLoadingCategories(false);
      }
    );

    return () => unsubscribe();
  }, []);


  /* =======================================================
     SETTINGS
  ======================================================= */

  const theme =
    storeSettings.theme ||
    DEFAULT_STORE_SETTINGS.theme;

  const primary =
    theme.primary ||
    DEFAULT_STORE_SETTINGS.theme.primary;

  const secondary =
    theme.secondary ||
    DEFAULT_STORE_SETTINGS.theme.secondary;

  const accent =
    theme.accent ||
    DEFAULT_STORE_SETTINGS.theme.accent;

  const textColor =
    theme.textColor ||
    DEFAULT_STORE_SETTINGS.theme.textColor;

  const fontFamily =
    theme.fontFamily ||
    DEFAULT_STORE_SETTINGS.theme.fontFamily;


  /* =======================================================
     SECTION SETTINGS
  ======================================================= */

  const sectionSettings =
    storeSettings.storeSections ||
    storeSettings.sections ||
    {};


  const categoriesTitle =
    sectionSettings.categoriesTitle ||
    sectionSettings.categoryTitle ||
    "تصفح حسب القسم";


  const productsTitle =
    sectionSettings.productsTitle ||
    sectionSettings.productTitle ||
    "أحدث المنتجات";


  /* =======================================================
     STORE CATEGORIES
  ======================================================= */

  const finalCategories = useMemo(() => {
    const normalized = categories.map(
      (category) => ({
        ...category,

        displayName:
          category.name ||
          category.title ||
          category.label ||
          "قسم",

        categoryValue:
          category.id,

        color:
          category.color ||
          accent,
      })
    );

    return [
      {
        id: "all",
        name: "كل المنتجات",
        displayName: "كل المنتجات",
        categoryValue: "all",
        active: true,
        order: 0,
      },

      ...normalized.filter(
        (category) =>
          category.id !== "all"
      ),
    ];
  }, [categories, accent]);


  /* =======================================================
     CATEGORY MATCH
  ======================================================= */

  const productMatchesCategory = (
    product,
    selected
  ) => {
    if (
      !selected ||
      selected === "all" ||
      selected === "All"
    ) {
      return true;
    }

    const selectedCategoryObject =
      finalCategories.find(
        (category) =>
          category.id === selected
      );

    const selectedName =
      selectedCategoryObject?.displayName ||
      selectedCategoryObject?.name ||
      selected;

    const productCategoryId =
      product.categoryId ||
      product.categoryID ||
      product.category_id ||
      "";

    const productCategory =
      product.category ||
      product.categoryName ||
      product.categoryTitle ||
      "";

    if (
      productCategoryId &&
      String(productCategoryId) ===
        String(selected)
    ) {
      return true;
    }

    if (
      productCategory &&
      String(productCategory).trim() ===
        String(selectedName).trim()
    ) {
      return true;
    }

    if (
      productCategory &&
      String(productCategory).trim() ===
        String(selected).trim()
    ) {
      return true;
    }

    return false;
  };


  /* =======================================================
     SEARCH + FILTER
  ======================================================= */

  const filteredProducts = useMemo(() => {
    const search =
      String(searchTerm || "")
        .trim()
        .toLowerCase();

    return products.filter((product) => {
      const title =
        String(
          product.title ||
            product.name ||
            ""
        ).toLowerCase();

      const description =
        String(
          product.description ||
            ""
        ).toLowerCase();

      const sku =
        String(
          product.sku ||
            product.code ||
            ""
        ).toLowerCase();

      const matchesSearch =
        !search ||
        title.includes(search) ||
        description.includes(search) ||
        sku.includes(search);

      const matchesCategory =
        productMatchesCategory(
          product,
          selectedCategory
        );

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    products,
    searchTerm,
    selectedCategory,
    finalCategories,
  ]);


  /* =======================================================
     HANDLE CATEGORY
  ======================================================= */

  const handleCategoryChange = (
    categoryId
  ) => {
    if (
      typeof setSelectedCategory !==
      "function"
    ) {
      return;
    }

    setSelectedCategory(categoryId);
  };


  /* =======================================================
     CSS VARIABLES
  ======================================================= */

  const storeStyle = {
    "--store-primary": primary,
    "--store-secondary": secondary,
    "--store-accent": accent,
    "--store-text": textColor,
    "--store-font": fontFamily,
  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      className="store-container"
      style={storeStyle}
      dir="rtl"
    >

      {/* =================================================
          HERO
      ================================================= */}

      <section className="store-hero">
        <Hero />
      </section>


      {/* =================================================
          CATEGORIES
      ================================================= */}

      <section className="store-categories-section">

        <div className="store-section-heading">

          <div>
            <span className="store-section-kicker">
              الأقسام
            </span>

            <h2>
              {categoriesTitle}
            </h2>
          </div>

          <span className="store-section-line" />
        </div>


        {loadingCategories ? (
          <div className="store-categories-loading">

            <span className="store-loading-dot" />

            <span>
              جاري تحميل الأقسام...
            </span>

          </div>
        ) : (
          <div className="categories-bar">

            {finalCategories.map(
              (category) => {
                const categoryId =
                  category.id;

                const active =
                  selectedCategory ===
                    categoryId ||
                  (
                    categoryId ===
                      "all" &&
                    (
                      selectedCategory ===
                        "All" ||
                      !selectedCategory
                    )
                  );

                return (
                  <button
                    key={categoryId}
                    type="button"
                    className={
                      `category-btn ${
                        active
                          ? "active"
                          : ""
                      }`
                    }
                    onClick={() =>
                      handleCategoryChange(
                        categoryId
                      )
                    }
                    style={{
                      "--category-color":
                        category.color ||
                        accent,
                    }}
                  >

                    {category.icon && (
                      <span className="category-icon">
                        {category.icon}
                      </span>
                    )}

                    <span>
                      {
                        category.displayName
                      }
                    </span>

                  </button>
                );
              }
            )}

          </div>
        )}

      </section>


      {/* =================================================
          PRODUCTS
      ================================================= */}

      <section
        className="products-section"
      >

        <div className="store-section-heading products-heading">

          <div>
            <span className="store-section-kicker">
              {storeSettings.storeName ||
                "ســـــَــــــــوا"}
            </span>

            <h2>
              {productsTitle}
            </h2>
          </div>

          <div className="products-result-count">
            {filteredProducts.length}
            <span>
              منتج
            </span>
          </div>

        </div>


        {filteredProducts.length > 0 ? (
          <Products
            products={
              filteredProducts
            }
            addToCart={
              addToCart
            }
          />
        ) : (
          <div className="store-empty">

            <div className="store-empty-icon">
              🔍
            </div>

            <h3>
              مفيش منتجات مطابقة
            </h3>

            <p>
              جرّب تغير البحث أو تختار قسم تاني
            </p>

            <button
              type="button"
              onClick={() =>
                handleCategoryChange(
                  "all"
                )
              }
            >
              عرض كل المنتجات
            </button>

          </div>
        )}

      </section>

    </main>
  );
}


export default Store;
