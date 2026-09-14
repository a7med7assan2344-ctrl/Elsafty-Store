import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from "../../firebase";
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
  // GET PARENT CATEGORY
  // =====================================================

  const getParentCategory =
    (category) => {

      if (!category?.parentId) {
        return null;
      }

      return (
        activeCategories.find(
          (parent) =>
            String(parent?.id || "") ===
            String(category.parentId || "")
        ) || null
      );

    };


  // =====================================================
  // TRACK CATEGORY VISIT
  // =====================================================

  const trackCategoryVisit =
    async (category) => {

      if (!category) {
        return;
      }

      try {

        /*
         * بنجيب المستخدم الحالي من Firebase Auth.
         *
         * لو العميل مش مسجل دخول:
         * مش هنسجل الزيارة باسم مستخدم،
         * لكن التنقل للقسم هيكمل طبيعي.
         */

        const currentUser =
          await new Promise((resolve) => {

            let unsubscribe = null;

            unsubscribe =
              onAuthStateChanged(
                auth,
                (user) => {

                  if (unsubscribe) {
                    unsubscribe();
                  }

                  resolve(user || null);

                }
              );

          });


        /*
         * لو مفيش مستخدم مسجل دخول،
         * منسجلش زيارة مرتبطة بحساب.
         */

        if (!currentUser) {
          return;
        }


        const parentCategory =
          getParentCategory(category);


        const categoryId =
          category?.id ||
          null;


        const categoryName =
          category?.name ||
          "قسم غير معروف";


        const parentId =
          category?.parentId ||
          null;


        const parentName =
          parentCategory?.name ||
          null;


        /*
         * المسار الكامل للقسم.
         *
         * مثال:
         * الموضة > ملابس رجالي
         */

        const categoryPath =
          parentName
            ? `${parentName} > ${categoryName}`
            : categoryName;


        await addDoc(
          collection(
            db,
            "categoryVisits"
          ),
          {

            // =============================================
            // USER
            // =============================================

            userId:
              currentUser.uid,

            uid:
              currentUser.uid,

            customerId:
              currentUser.uid,

            customerEmail:
              currentUser.email ||
              "",


            customerName:
              currentUser.displayName ||
              "",


            // =============================================
            // CATEGORY
            // =============================================

            categoryId,

            categoryName,

            parentId,

            parentName,

            categoryPath,


            // =============================================
            // VISIT
            // =============================================

            type:
              "category_view",

            source:
              "category_grid",

            route:
              categoryId
                ? `/category/${encodeURIComponent(
                    categoryId
                  )}`
                : `/category/${encodeURIComponent(
                    categoryName
                  )}`,


            // =============================================
            // TIMESTAMP
            // =============================================

            visitedAt:
              serverTimestamp(),

            createdAt:
              serverTimestamp(),

          }
        );

      } catch (error) {

        /*
         * مهم:
         * لو حصل خطأ في تسجيل الزيارة،
         * ما نوقفش العميل عن تصفح الموقع.
         */

        console.error(
          "Category visit tracking error:",
          error
        );

      }

    };


  // =====================================================
  // OPEN CATEGORY
  // =====================================================

  const openCategory =
    async (category) => {

      if (!category) {
        return;
      }

      const categoryId =
        category?.id;

      const categoryName =
        category?.name;


      // =================================================
      // SAVE SELECTED CATEGORY
      // =================================================

      try {

        if (
          typeof setSelectedCategory ===
          "function"
        ) {

          setSelectedCategory(
            category
          );

        }

      } catch (error) {

        console.error(
          "setSelectedCategory error:",
          error
        );

      }


      // =================================================
      // TRACK VISIT
      // =================================================

      /*
       * بنبدأ التسجيل،
       * لكن مش بنستنى Firestore قبل التنقل.
       *
       * كده الموقع يفضل سريع حتى لو الشبكة بطيئة.
       */

      trackCategoryVisit(
        category
      );


      // =================================================
      // NAVIGATE BY ID
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