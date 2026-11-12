const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");
const { handleErrors } = require("./middleware/errors");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "32kb" }));
app.use("/api", apiRoutes);

app.use(function (request, response) {
  response.status(404).json({ message: "API route not found." });
});
app.use(handleErrors);

module.exports = app;
