    import React from "react";
import "./Category.css";

function Category({
  categories = [],
  setSelectedCategory
}) {

  return (
    <section className="categories">

      <h2>
        🗂️ الأقسام
      </h2>


      <div className="category-grid">


        {
          categories
          .filter(cat => cat.active)
          .map((cat)=>(


            <div
              key={cat.id}
              className="category-card"
              onClick={()=>setSelectedCategory(cat.name)}
            >


              {
                cat.image ?

                <img
                  src={cat.image}
                  alt={cat.name}
                />

                :

                <div className="category-icon">
                  {cat.icon || "📦"}
                </div>

              }


              <h3>
                {cat.name}
              </h3>


            </div>


          ))
        }


      </div>


    </section>
  );

}


export default Category;