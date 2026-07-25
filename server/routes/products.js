const express = require("express");
const router = express.Router();

const Product = require("../models/Product");


// ======================
// GET ALL PRODUCTS
// ======================
router.get("/", async (req, res) => {
  try {

    const products = await Product.find()
      .sort({ createdAt: -1 });

    res.json(products);

  } catch (error) {

    console.log("GET PRODUCTS ERROR:", error.message);

    res.status(500).json({
      message: error.message,
    });

  }
});




// ======================
// ADD PRODUCT
// ======================
router.post("/", async (req, res) => {

  try {


    console.log("NEW PRODUCT DATA:");
    console.log(req.body);



    const product = new Product(req.body);



    await product.save();



    console.log("PRODUCT SAVED:");
    console.log(product);



    res.status(201).json(product);



  } catch (error) {


    console.log("SAVE PRODUCT ERROR:");
    console.log(error.message);



    res.status(500).json({

      message: error.message,

    });



  }

});





// ======================
// UPDATE PRODUCT
// ======================
router.put("/:id", async (req, res) => {

  try {


    const product = await Product.findByIdAndUpdate(

      req.params.id,

      req.body,

      {
        new: true,
      }

    );



    if (!product) {

      return res.status(404).json({

        message: "Product not found",

      });

    }



    res.json(product);



  } catch (error) {


    console.log("UPDATE ERROR:", error.message);


    res.status(500).json({

      message: error.message,

    });


  }

});







// ======================
// DELETE PRODUCT
// ======================
router.delete("/:id", async (req, res) => {

  try {


    const product = await Product.findByIdAndDelete(

      req.params.id

    );



    if (!product) {

      return res.status(404).json({

        message: "Product not found",

      });

    }



    res.json({

      message: "Product deleted successfully",

    });



  } catch (error) {


    console.log("DELETE ERROR:", error.message);


    res.status(500).json({

      message: error.message,

    });


  }

});





module.exports = router;