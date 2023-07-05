const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const port = 8080;

app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const productRouter = require("./routes/products")(io);
const cartRouter = require("./routes/carts");

app.use(express.json());

app.use("/api/products", productRouter);
app.use("/api/carts", cartRouter);

app.get("/realtimeproducts", (req, res) => {
  res.render("realTimeProducts", { products: productRouter.getProducts() });
});

http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
