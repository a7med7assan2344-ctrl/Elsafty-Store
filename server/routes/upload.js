const express = require("express");
const router = express.Router();

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/", async (req, res) => {
  try {

    const { image } = req.body;

    const result = await cloudinary.uploader.upload(image, {
      folder: "elsafty-store",
    });

    res.json({
      url: result.secure_url,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Upload Failed",
    });

  }
});

module.exports = router;