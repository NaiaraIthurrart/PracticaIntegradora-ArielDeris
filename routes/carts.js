const express = require("express");
const fs = require("fs");

const cartRouter = express.Router();

class CartManager {
  constructor(path) {
    this.path = path;
    this.carts = [];
    this.nextId = 1;
    this.load();
  }

  createCart() {
    const newCart = { id: this.nextId++, products: [] };
    this.carts.push(newCart);
    this.save();
    return newCart;
  }

  addProductToCart(cartId, productId, quantity = 1) {
    const cart = this.getCartById(cartId);
    if (cart) {
      const product = { productId, quantity };
      const existingProductIndex = cart.products.findIndex((p) => p.productId === productId);
      if (existingProductIndex !== -1) {
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        cart.products.push(product);
      }
      this.save();
      console.log(`Product with id ${productId} added to cart ${cartId}`);
    }
  }

  getCartById(id) {
    const cart = this.carts.find((c) => c.id === id);
    if (cart) {
      return cart;
    } else {
      console.log("Error: Cart not found");
      return null;
    }
  }

  load() {
    try {
      const data = fs.readFileSync(this.path);
      this.carts = JSON.parse(data);
      this.nextId = this.carts.length + 1;
    } catch (error) {
      console.log(`Error loading file: ${error}`);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.carts));
    } catch (error) {
      console.log(`Error saving file: ${error}`);
    }
  }
}

const cartManager = new CartManager("./carts.json");

cartRouter.post("/", (req, res) => {
  const newCart = cartManager.createCart();
  res.json(newCart);
});

cartRouter.post("/:cid/product/:pid", (req, res) => {
  const { cid, pid } = req.params;
  const quantity = req.body.quantity || 1;
  cartManager.addProductToCart(Number(cid), Number(pid), quantity);
  res.json({ message: "Product added to cart successfully" });
});

module.exports = cartRouter;
