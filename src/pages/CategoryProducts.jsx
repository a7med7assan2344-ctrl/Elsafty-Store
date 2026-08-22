import React, {
  useMemo,
  useState,
  useContext,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  CartContext,
} from "../context/CartContext";

import "./CategoryProducts.css";


function CategoryProducts({
  products = [],
  categories = [],
}) {

  const navigate =
    useNavigate();

  const {
    categoryName,
  } = useParams();

  const {
    addToCart,
  } = useContext(
    CartContext
  );


  // ==================================================
  // STATES
  // ==================================================

  const [
    sortBy,
    setSortBy,
  ] = useState(
    "default"
  );

  const [
    searchTerm,
    setSearchTerm,
  ] = useState(
    ""
  );

  const [
    minPrice,
    setMinPrice,
  ] = useState(
    ""
  );

  const [
    maxPrice,
    setMaxPrice,
  ] = useState(
    ""
  );


  // ==================================================
  // DECODE CATEGORY NAME
  // ==================================================

  const decodedCategory =
    decodeURIComponent(
      categoryName || ""
    ).trim();


  // ==================================================
  // FIND CURRENT CATEGORY
  // ==================================================

  const currentCategory =
    useMemo(() => {

      if (
        !Array.isArray(
          categories
        )
      ) {
        return null;
      }


      return categories.find(
        (category) => {

          const name =
            String(
              category?.name ||
              category?.title ||
              category?.categoryName ||
              ""
            ).trim();


          const number =
            String(
              category?.categoryNumber ||
              ""
            ).trim();


          const id =
            String(
              category?.id ||
              ""
            ).trim();


          return (
            name ===
              decodedCategory ||
            number ===
              decodedCategory ||
            id ===
              decodedCategory
          );

        }
      ) || null;

    }, [
      categories,
      decodedCategory,
    ]);


  // ==================================================
  // CATEGORY PRODUCTS
  // ==================================================

  const categoryProducts =
    useMemo(() => {

      if (
        !Array.isArray(
          products
        )
      ) {
        return [];
      }


      return products.filter(
        (product) => {

          if (!product) {
            return false;
          }


          // ==========================================
          // PRODUCT CATEGORY ID
          // ==========================================

          const productCategoryId =
            String(
              product?.categoryId ||
              product?.categoryID ||
              product?.category_id ||
              product?.category?.id ||
              product?.category?.categoryId ||
              ""
            ).trim();


          // ==========================================
          // PRODUCT CATEGORY NAME
          // ==========================================

          const productCategoryName =
            String(
              product?.categoryName ||
              product?.category?.name ||
              product?.category ||
              ""
            ).trim();


          // ==========================================
          // PRODUCT CATEGORY NUMBER
          // ==========================================

          const productCategoryNumber =
            String(
              product?.categoryNumber ||
              product?.categoryNo ||
              product?.departmentNumber ||
              ""
            ).trim();


          // ==========================================
          // CURRENT CATEGORY ID
          // ==========================================

          const currentCategoryId =
            String(
              currentCategory?.id ||
              ""
            ).trim();


          // ==========================================
          // CURRENT CATEGORY NAME
          // ==========================================

          const currentCategoryName =
            String(
              currentCategory?.name ||
              currentCategory?.title ||
              currentCategory?.categoryName ||
              ""
            ).trim();


          // ==========================================
          // CURRENT CATEGORY NUMBER
          // ==========================================

          const currentCategoryNumber =
            String(
              currentCategory?.categoryNumber ||
              ""
            ).trim();


          // ==========================================
          // MATCH BY CATEGORY ID
          // ==========================================

          if (
            currentCategoryId &&
            productCategoryId ===
              currentCategoryId
          ) {
            return true;
          }


          // ==========================================
          // MATCH BY CATEGORY NAME
          // ==========================================

          if (
            productCategoryName &&
            (
              productCategoryName ===
                decodedCategory ||
              (
                currentCategoryName &&
                productCategoryName ===
                  currentCategoryName
              )
            )
          ) {
            return true;
          }


          // ==========================================
          // MATCH BY CATEGORY NUMBER
          // ==========================================

          if (
            currentCategoryNumber &&
            productCategoryNumber ===
              currentCategoryNumber
          ) {
            return true;
          }


          // ==========================================
          // FALLBACK
          // ==========================================

          if (
            productCategoryName ===
            decodedCategory
          ) {
            return true;
          }


          return false;

        }
      );

    }, [
      products,
      currentCategory,
      decodedCategory,
    ]);


  // ==================================================
  // FILTER + SORT
  // ==================================================

  const filteredProducts =
    useMemo(() => {

      const search =
        searchTerm
          .toLowerCase()
          .trim();


      return [
        ...categoryProducts,
      ]

        .filter(
          (product) => {

            const title =
              String(
                product?.title ||
                product?.name ||
                product?.productName ||
                ""
              ).toLowerCase();


            const description =
              String(
                product?.description ||
                ""
              ).toLowerCase();


            const price =
              Number(
                product?.price || 0
              );


            const matchesSearch =
              !search ||
              title.includes(
                search
              ) ||
              description.includes(
                search
              );


            const matchesMinPrice =
              minPrice === "" ||
              price >=
                Number(
                  minPrice
                );


            const matchesMaxPrice =
              maxPrice === "" ||
              price <=
                Number(
                  maxPrice
                );


            return (
              matchesSearch &&
              matchesMinPrice &&
              matchesMaxPrice
            );

          }
        )

        .sort(
          (a, b) => {

            switch (
              sortBy
            ) {

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

          }
        );

    }, [
      categoryProducts,
      searchTerm,
      minPrice,
      maxPrice,
      sortBy,
    ]);


  // ==================================================
  // ADD TO CART
  // ==================================================

  const handleAddToCart =
    (
      event,
      product
    ) => {

      event.stopPropagation();


      if (
        !addToCart ||
        !product
      ) {
        return;
      }


      // ============================================
      // IMPORTANT:
      // نحافظ على categoryId
      // ============================================

      const cartProduct = {

        ...product,


        id:
          product?.id ||
          product?._id ||
          null,


        productId:
          product?.id ||
          product?._id ||
          product?.productId ||
          null,


        categoryId:
          product?.categoryId ||
          product?.categoryID ||
          product?.category_id ||
          product?.category?.id ||
          currentCategory?.id ||
          null,


        categoryName:
          product?.categoryName ||
          product?.category?.name ||
          currentCategory?.name ||
          decodedCategory ||
          "",


        categoryNumber:
          product?.categoryNumber ||
          product?.categoryNo ||
          product?.departmentNumber ||
          currentCategory?.categoryNumber ||
          "",


        quantity:
          Number(
            product?.quantity || 1
          ),

      };


      console.log(
        "🛒 إضافة المنتج للسلة:",
        cartProduct
      );


      addToCart(
        cartProduct
      );

    };


  // ==================================================
  // RESET FILTERS
  // ==================================================

  const resetFilters =
    () => {

      setSearchTerm(
        ""
      );

      setMinPrice(
        ""
      );

      setMaxPrice(
        ""
      );

      setSortBy(
        "default"
      );

    };


  // ==================================================
  // PAGE
  // ==================================================

  return (

    <div
      className="category-products-page"
      dir="rtl"
    >


      {/* ============================================
          HEADER
      ============================================ */}

      <header
        className="category-products-header"
      >

        <button
          type="button"
          className="back-btn"
          onClick={() =>
            navigate("/")
          }
        >

          ❮ الرئيسية

        </button>


        <div
          className="category-title-box"
        >

          <h1>
            {currentCategory?.name ||
              decodedCategory ||
              "القسم"}
          </h1>


          <p>
            {
              filteredProducts.length
            }{" "}
            منتج
          </p>

        </div>


        <button
          type="button"
          className="home-btn"
          onClick={() =>
            navigate("/")
          }
        >

          🏠

        </button>

      </header>


      {/* ============================================
          FILTERS
      ============================================ */}

      <section
        className="category-filters"
      >


        {/* SEARCH */}

        <div
          className="category-search"
        >

          <input
            type="text"
            placeholder="ابحث داخل القسم..."
            value={
              searchTerm
            }
            onChange={(
              event
            ) =>
              setSearchTerm(
                event.target.value
              )
            }
          />


          {searchTerm && (

            <button
              type="button"
              onClick={() =>
                setSearchTerm(
                  ""
                )
              }
            >

              ✕

            </button>

          )}

        </div>


        {/* SORT */}

        <select
          value={
            sortBy
          }
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


        {/* MIN PRICE */}

        <input
          type="number"
          min="0"
          placeholder="من سعر"
          value={
            minPrice
          }
          onChange={(
            event
          ) =>
            setMinPrice(
              event.target.value
            )
          }
        />


        {/* MAX PRICE */}

        <input
          type="number"
          min="0"
          placeholder="إلى سعر"
          value={
            maxPrice
          }
          onChange={(
            event
          ) =>
            setMaxPrice(
              event.target.value
            )
          }
        />

      </section>


      {/* ============================================
          PRODUCTS
      ============================================ */}

      <main
        className="category-products-container"
      >

        {filteredProducts.length >
        0 ? (

          <div
            className="category-products-grid"
          >

            {filteredProducts.map(
              (
                product
              ) => {

                const id =
                  product?.id ||
                  product?._id;


                const title =
                  product?.title ||
                  product?.name ||
                  product?.productName ||
                  "منتج";


                const image =
                  product?.image ||
                  product?.images?.[0] ||
                  "/default-product.png";


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


                const rating =
                  Math.min(
                    5,
                    Math.max(
                      0,
                      Math.floor(
                        Number(
                          product?.rating ||
                          0
                        )
                      )
                    )
                  );


                const discount =
                  oldPrice >
                    price &&
                  oldPrice >
                    0
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
                      id
                    }
                    className="category-product-card"
                    onClick={() =>
                      navigate(
                        `/product/${id}`
                      )
                    }
                  >


                    {/* ==================================
                        BADGES
                    ================================== */}

                    <div
                      className="category-product-badges"
                    >

                      {discount >
                        0 && (

                        <span
                          className="discount-badge"
                        >

                          -
                          {
                            discount
                          }%

                        </span>

                      )}


                      {product?.newArrival && (

                        <span
                          className="new-badge"
                        >

                          جديد

                        </span>

                      )}


                      {product?.bestSeller && (

                        <span
                          className="best-badge"
                        >

                          ⭐ الأكثر مبيعًا

                        </span>

                      )}

                    </div>


                    {/* ==================================
                        IMAGE
                    ================================== */}

                    <div
                      className="category-product-image"
                    >

                      <img
                        src={
                          image
                        }
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


                    {/* ==================================
                        INFO
                    ================================== */}

                    <div
                      className="category-product-info"
                    >

                      <h2>
                        {
                          title
                        }
                      </h2>


                      {/* RATING */}

                      <div
                        className="category-product-rating"
                      >

                        {
                          rating >
                          0
                            ? "⭐".repeat(
                                rating
                              )
                            : "☆☆☆☆☆"
                        }


                        <span>

                          {Number(
                            product?.rating ||
                            0
                          ).toFixed(
                            1
                          )}

                        </span>

                      </div>


                      {/* PRICE */}

                      <div
                        className="category-product-price"
                      >

                        <strong>

                          {
                            price.toLocaleString(
                              "ar-EG"
                            )
                          }

                          {" "}
                          ج.م

                        </strong>


                        {oldPrice >
                          price && (

                          <del>

                            {
                              oldPrice.toLocaleString(
                                "ar-EG"
                              )
                            }

                            {" "}
                            ج.م

                          </del>

                        )}

                      </div>


                      {/* ADD TO CART */}

                      <button
                        type="button"
                        className="category-add-cart"
                        onClick={(
                          event
                        ) =>
                          handleAddToCart(
                            event,
                            product
                          )
                        }
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

          /* ==========================================
             EMPTY
          ========================================== */

          <div
            className="category-empty"
          >

            <div>
              📦
            </div>


            <h2>
              لا توجد منتجات
            </h2>


            <p>
              لا توجد منتجات مطابقة
              للبحث أو الفلاتر الحالية.
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

      </main>

    </div>

  );

}


export default CategoryProducts;