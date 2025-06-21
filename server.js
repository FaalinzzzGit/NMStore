const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const productsFilePath = path.join(__dirname, "data", "products.json");

function getProducts() {
  try {
    const data = fs.readFileSync(productsFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading products file:", error);
    return [];
  }
}

function saveProducts(products) {
  try {
    fs.writeFileSync(
      productsFilePath,
      JSON.stringify(products, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error writing products file:", error);
  }
}

app.get("/api/products", (req, res) => {
  const products = getProducts();
  res.json(products);
});

app.post("/api/products", upload.array("productMedia", 10), (req, res) => {
  const products = getProducts();
  const { name, price, description } = req.body;

  const mediaUrls = req.files
    ? req.files.map((file) => `/images/${file.filename}`)
    : [];

  const newProduct = {
    id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
    name,
    price,
    description,
    mediaUrls,
  };
  products.push(newProduct);
  saveProducts(products);
  res.status(201).json(newProduct);
});

app.delete("/api/products/:id", (req, res) => {
  let products = getProducts();
  const productId = parseInt(req.params.id);
  const initialLength = products.length;

  const productToDelete = products.find((p) => p.id === productId);

  products = products.filter((p) => p.id !== productId);

  if (products.length < initialLength) {
    saveProducts(products);

    if (productToDelete && productToDelete.mediaUrls) {
      productToDelete.mediaUrls.forEach((url) => {
        const filePath = path.join(__dirname, "public", url);
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Error deleting file ${filePath}:`, err);
          else console.log(`Deleted file: ${filePath}`);
        });
      });
    }
    res.status(200).json({ message: "Produk berhasil dihapus." });
  } else {
    res.status(404).json({ message: "Produk tidak ditemukan." });
  }
});

const ADMIN_USERNAME = "adminnmstore";
const ADMIN_PASSWORD = "?2T9,]3j)4aE";

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.status(200).json({ success: true, message: "Login berhasil!" });
  } else {
    res
      .status(401)
      .json({ success: false, message: "Username atau password salah." });
  }
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/admin-panel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-panel.html"));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`Halaman admin: http://localhost:${PORT}/admin`);
});
