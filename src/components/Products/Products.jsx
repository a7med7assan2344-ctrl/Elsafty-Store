import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import "./Products.css";

import ProductCard from "../ProductCard/ProductCard";

const safeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const getNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

/* =========================================================
   CATEGORY HELPERS
========================================================= */

const getProductCategoryId = (product) => {
  if (!product) return "";

  return safeString(
    product.categoryId ??
      product.categoryID ??
      product.category_id ??
      product.category?.id ??
      product.category?.categoryId
  );
};

const getProductCategoryName = (product) => {
  if (!product) return "";

  return safeString(
    product.categoryName ??
      product.category?.name ??
      product.categoryTitle ??
      product.category
  );
};

function Products({
  products = [],
  storeSettings = {},
  onProductClick,
}) {
  const [searchParams] = useSearchParams();

  /* =====================================================
     PRODUCTS SAFETY
  ===================================================== */

  const safeProducts = Array.isArray(products)
    ? products.filter(Boolean)
    : [];

  /* =====================================================
     URL CATEGORY
  ===================================================== */

  const requestedCategory = safeString(
    searchParams.get("category")
  );

  /* =====================================================
     FILTER PRODUCTS BY CATEGORY
  ===================================================== */

  const filteredProducts = useMemo(() => {
    /*
      لو مفيش category في الـURL
      نعرض كل المنتجات زي ما كانت الصفحة بتعمل قبل كده.
    */

    if (!requestedCategory) {
      return safeProducts;
    }

    const normalizedRequestedCategory =
      requestedCategory.toLowerCase();

    return safeProducts.filter((product) => {
      const categoryId =
        getProductCategoryId(product);

      const categoryName =
        getProductCategoryName(product);

      /*
        مطابقة بالـID
      */

      if (
        categoryId &&
        categoryId.toLowerCase() ===
          normalizedRequestedCategory
      ) {
        return true;
      }

      /*
        مطابقة باسم القسم
        كـ fallback لو الـProduct عنده categoryName
      */

      if (
        categoryName &&
        categoryName.toLowerCase() ===
          normalizedRequestedCategory
      ) {
        return true;
      }

      return false;
    });
  }, [
    safeProducts,
    requestedCategory,
  ]);

  /* =====================================================
     ADMIN PRODUCT GRID SETTINGS
  ===================================================== */

  const productSettings =
    storeSettings?.products ||
    storeSettings?.productGrid ||
    storeSettings?.productGridSettings ||
    {};

  const emptyStateSettings =
    productSettings?.emptyState ||
    storeSettings?.emptyProducts ||
    {};

  const showEmptyIcon =
    emptyStateSettings.showIcon !== false;

  const emptyIcon =
    safeString(
      emptyStateSettings.icon
    ) || "🛍️";

  const emptyTitle =
    safeString(
      emptyStateSettings.title
    ) || "لا توجد منتجات";

  const defaultEmptyDescription =
    requestedCategory
      ? "لا توجد منتجات داخل هذا القسم حالياً."
      : "لا توجد منتجات مطابقة للبحث.";

  const emptyDescription =
    safeString(
      emptyStateSettings.description
    ) || defaultEmptyDescription;

  /* =====================================================
     GRID SETTINGS
  ===================================================== */

  const columnsDesktop = getNumber(
    productSettings.columnsDesktop ??
      productSettings.desktopColumns,
    5
  );

  const columnsTablet = getNumber(
    productSettings.columnsTablet ??
      productSettings.tabletColumns,
    3
  );

  const columnsMobile = getNumber(
    productSettings.columnsMobile ??
      productSettings.mobileColumns,
    2
  );

  const gap = getNumber(
    productSettings.gap,
    14
  );

  const cardMinWidth = getNumber(
    productSettings.cardMinWidth,
    0
  );

  /* =====================================================
     CSS VARIABLES
  ===================================================== */

  const gridStyle = useMemo(() => {
    const style = {
      "--products-columns-desktop":
        Math.max(
          1,
          Math.min(8, columnsDesktop)
        ),

      "--products-columns-tablet":
        Math.max(
          1,
          Math.min(6, columnsTablet)
        ),

      "--products-columns-mobile":
        Math.max(
          1,
          Math.min(4, columnsMobile)
        ),

      "--products-grid-gap":
        `${Math.max(0, gap)}px`,
    };

    if (cardMinWidth > 0) {
      style["--product-card-min-width"] =
        `${cardMinWidth}px`;
    }

    return style;
  }, [
    columnsDesktop,
    columnsTablet,
    columnsMobile,
    gap,
    cardMinWidth,
  ]);

  /* =====================================================
     NO PRODUCTS
  ===================================================== */

  if (filteredProducts.length === 0) {
    return (
      <section
        className="no-products"
        dir="rtl"
        aria-live="polite"
      >
        {showEmptyIcon && (
          <div
            className="no-products-icon"
            aria-hidden="true"
          >
            {emptyIcon}
          </div>
        )}

        <h3>
          {emptyTitle}
        </h3>

        {emptyDescription && (
          <p>
            {emptyDescription}
          </p>
        )}
      </section>
    );
  }

  /* =====================================================
     PRODUCTS
  ===================================================== */

  return (
    <section
      className="products-section"
      dir="rtl"
      aria-label={
        safeString(
          productSettings.title
        ) || "المنتجات"
      }
    >
      {productSettings.showTitle === true &&
        productSettings.title && (
          <div className="products-section-header">
            <h2>
              {productSettings.title}
            </h2>

            {productSettings.description && (
              <p>
                {productSettings.description}
              </p>
            )}
          </div>
        )}

      <div
        className="products-grid"
        style={gridStyle}
      >
        {filteredProducts.map(
          (product, index) => {
            const productId =
              product?.id ||
              product?._id ||
              product?.productId ||
              `product-${index}`;

            return (
              <ProductCard
                key={productId}
                product={product}
                storeSettings={
                  storeSettings
                }
                onProductClick={
                  onProductClick
                }
              />
            );
          }
        )}
      </div>
    </section>
  );
}

export default Products;