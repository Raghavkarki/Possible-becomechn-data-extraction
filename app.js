require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const reportRoutes = require("./src/routes/reports");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", reportRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
