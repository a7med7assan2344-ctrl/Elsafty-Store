const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ======================
// CORS
// ======================

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

// ======================
// MIDDLEWARE
// ======================

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/uploads", express.static("uploads"));

// ======================
// MongoDB
// ======================

mongoose.connect(process.env.MONGO_URI)

.then(() => {
  console.log("MongoDB Connected");
})

.catch((err) => {
  console.log("Mongo Error:", err.message);
});

// ======================
// ROUTES
// ======================

app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/upload", require("./routes/upload"));

// ======================

app.get("/", (req, res) => {
  res.send("Elsafty Store API Running");
});

// ======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Running On ${PORT}`);
});