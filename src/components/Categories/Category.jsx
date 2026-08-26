import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Category.css";

function Category({
  categories = [],
  setSelectedCategory,
}) {

  const navigate = useNavigate();

  // =====================================================
  // ACTIVE CATEGORIES
  // =====================================================

  const activeCategories =
    useMemo(() => {

      return (categories || []).filter(
        (category) =>
          category?.active === true
      );

    }, [categories]);


  // =====================================================
  // MAIN / ROOT CATEGORIES
  // =====================================================

  const rootCategories =
    useMemo(() => {

      return activeCategories
        .filter(
          (category) =>
            !category?.parentId ||
            category.parentId === null ||
            category.parentId === ""
        )
        .sort(
          (a, b) =>
            Number(a?.sortOrder || 0) -
            Number(b?.sortOrder || 0)
        );

    }, [activeCategories]);


  // =====================================================
  // OPEN CATEGORY
  // =====================================================

  const openCategory =
    (category) => {

      if (!category) {
        return;
      }

      const categoryId =
        category?.id;

      const categoryName =
        category?.name;


      // =================================================
      // ID
      // =================================================

      if (categoryId) {

        navigate(
          `/category/${encodeURIComponent(
            categoryId
          )}`
        );

        return;
      }


      // =================================================
      // FALLBACK NAME
      // =================================================

      if (categoryName) {

        navigate(
          `/category/${encodeURIComponent(
            categoryName
          )}`
        );

      }

    };


  // =====================================================
  // EMPTY
  // =====================================================

  if (rootCategories.length === 0) {

    return (
      <section className="categories">

        <h2>
          🗂️ الأقسام
        </h2>


        <div className="category-empty">

          <div>
            📂
          </div>

          <h3>
            لا توجد أقسام حاليًا
          </h3>

          <p>
            سيتم إضافة الأقسام قريبًا
          </p>

        </div>

      </section>
    );

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <section className="categories">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="category-section-header">

        <div>

          <h2>
            🗂️ الأقسام
          </h2>

          <p>
            اختار القسم اللي عايز تتصفحه
          </p>

        </div>

      </div>


      {/* =================================================
          CATEGORY GRID
      ================================================= */}

      <div className="category-grid">

        {rootCategories.map(
          (category) => {

            // =================================================
            // CHILDREN COUNT
            // =================================================

            const childrenCount =
              activeCategories.filter(
                (child) =>
                  String(
                    child?.parentId || ""
                  ) ===
                  String(
                    category?.id || ""
                  )
              ).length;


            // =================================================
            // CARD COLOR
            // =================================================

            const categoryColor =
              category?.color ||
              "#071a36";


            // =================================================
            // CARD SIZE
            // =================================================

            const categorySize =
              category?.cardSize ||
              "medium";


            return (

              <button
                type="button"

                key={
                  category?.id ||
                  category?.name
                }

                className={
                  `category-card category-size-${categorySize}`
                }

                style={{
                  "--category-color":
                    categoryColor,
                }}

                onClick={() =>
                  openCategory(
                    category
                  )
                }
              >

                {/* =================================================
                    COLOR TOP LINE
                ================================================= */}

                <span
                  className="category-color-line"
                />


                {/* =================================================
                    IMAGE / ICON
                ================================================= */}

                <div className="category-image">

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

                        const parent =
                          event.currentTarget
                            .parentElement;

                        if (
                          parent &&
                          !parent.querySelector(
                            ".category-icon"
                          )
                        ) {

                          const icon =
                            document.createElement(
                              "div"
                            );

                          icon.className =
                            "category-icon";

                          icon.textContent =
                            category?.icon ||
                            "📦";

                          parent.appendChild(
                            icon
                          );

                        }

                      }}
                    />

                  ) : (

                    <div className="category-icon">

                      {
                        category?.icon ||
                        "📦"
                      }

                    </div>

                  )}

                </div>


                {/* =================================================
                    NAME
                ================================================= */}

                <h3>

                  {
                    category?.name ||
                    "قسم"
                  }

                </h3>


                {/* =================================================
                    SUB CATEGORIES
                ================================================= */}

                {childrenCount > 0 ? (

                  <span className="category-count">

                    {childrenCount} قسم فرعي

                  </span>

                ) : (

                  <span className="category-count">

                    تصفح القسم

                  </span>

                )}


                {/* =================================================
                    ARROW
                ================================================= */}

                <span className="category-arrow">

                  ❯

                </span>

              </button>

            );

          }
        )}

      </div>

    </section>

  );

}


export default Category;