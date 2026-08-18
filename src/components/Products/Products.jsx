import React from "react";
import "./Products.css";

import ProductCard from "../ProductCard/ProductCard";

function Products({ products = [] }) {

  // =====================================================
  // NO PRODUCTS
  // =====================================================

  if (!products || products.length === 0) {
    return (
      <div className="no-products">

        <div className="no-products-icon">
          🛍️
        </div>

        <h3>
          لا توجد منتجات
        </h3>

        <p>
          لا توجد منتجات مطابقة للبحث.
        </p>

      </div>
    );
  }


  // =====================================================
  // PRODUCTS
  // =====================================================

  return (
    <div className="products-grid">

      {products.map((product) => (

        <ProductCard
          key={product.id || product._id}
          product={product}
        />

      ))}

    </div>
  );
}

export default Products;