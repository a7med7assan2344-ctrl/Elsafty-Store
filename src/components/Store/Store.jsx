import React from "react";
import Hero from "../Hero/Hero";
import Products from "../Products/Products";
import "./Store.css";

function Store({
  products,
  searchTerm,
  selectedCategory,
  setSelectedCategory,
  addToCart,
}) {
  const categories = [
    "All",
    "الإلكترونيات",
    "الموبايلات",
    "اللابتوبات",
    "الأجهزة المنزلية",
    "الأزياء",
    "الأحذية",
    "السوبر ماركت",
    "العروض",
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="store-container">

      {/* Hero Slider */}
      <Hero />

      {/* Categories */}
      <section className="categories">

        <h2>تصفح حسب القسم</h2>

        <div className="categories-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              className={
                selectedCategory === cat
                  ? "category-btn active"
                  : "category-btn"
              }
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "All" ? "كل المنتجات" : cat}
            </button>
          ))}
        </div>

      </section>

      {/* Products */}

      <section className="products-section">

        <h2>أحدث المنتجات</h2>

        <Products
          products={filteredProducts}
          addToCart={addToCart}
        />

      </section>

    </div>
  );
}

export default Store;