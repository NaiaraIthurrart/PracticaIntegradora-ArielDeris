const express = require("express");
const fs = require("fs");

const productRouter = express.Router();

class ProductManager {
  constructor(path, io) {
    this.path = path;
    this.products = [];
    this.nextId = 1;
    this.io = io;
    this.load();
  }

  addProduct(product) {
    if (!product.code || !product.title || !product.price) {
      return { error: "All fields are required" };
    }

    if (this.products.some((p) => p.code === product.code)) {
      return { error: `Product with code ${product.code} already exists` };
    }

    const newProduct = {
      id: this.nextId++,
      status: true,
      thumbnails: [],
      ...product,
    };

    this.products.push(newProduct);
    this.save();

    this.io.emit("newProduct", newProduct);

    return newProduct;
  }

  deleteProduct(id) {
    const index = this.products.findIndex((p) => p.id === id);

    if (index !== -1) {
      const deletedProduct = this.products[index];
      this.products.splice(index, 1);
      this.save();

      this.io.emit("deleteProduct", deletedProduct.id);

      return { message: "Product deleted successfully" };
    } else {
      return { error: `Product with id ${id} not found` };
    }
  }

  load() {
    try {
      const data = fs.readFileSync(this.path);
      this.products = JSON.parse(data);
      this.nextId = this.products.length + 1;
    } catch (error) {
      console.log(`Error loading file: ${error}`);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.products));
    } catch (error) {
      console.log(`Error saving file: ${error}`);
    }
  }
}

module.exports = (io) => {
  const productManager = new ProductManager("./data/productos.json", io);

  productRouter.get("/", (req, res) => {
    const products = productManager.getProducts();
    res.json(products);
  });

  productRouter.get("/:pid", (req, res) => {
    const { pid } = req.params;
    const product = productManager.getProductById(Number(pid));

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });


  productRouter.post("/", (req, res) => {
    const product = req.body;
    const newProduct = productManager.addProduct(product);

    if (newProduct.error) {
      res.status(400).json({ error: newProduct.error });
    } else {
      res.json(newProduct);
    }
  });

  productRouter.delete("/:pid", (req, res) => {
    const { pid } = req.params;
    const result = productManager.deleteProduct(Number(pid));

    if (result.error) {
      res.status(404).json({ error: result.error });
    } else {
      res.json({ message: result.message });
    }
  });

 

  return productRouter;
};
