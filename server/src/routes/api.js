const express = require("express");
const mongoose = require("mongoose");
const auth = require("../controllers/auth");
const bookings = require("../controllers/bookings");
const technicians = require("../controllers/technicians");
const { requireTeam, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/health", function (request, response) {
  const mongoReady = mongoose.connection.readyState === 1;
  response.json({
    status: "ok",
    storageMode: process.env.STORAGE_MODE === "mongo" ? "mongo" : "memory",
    databaseReady: process.env.STORAGE_MODE === "mongo" ? mongoReady : false
  });
});

router.post("/auth/login", auth.login);
router.get("/auth/me", requireTeam, auth.currentUser);
router.post("/auth/logout", auth.logout);

// Customers can create a request and check it with its reference and email.
router.get("/bookings/track", bookings.track);
router.post("/bookings", bookings.create);

// Signed-in admins and dispatchers can manage bookings.
router.use("/bookings", requireTeam);
router.get("/bookings", bookings.list);
router.get("/bookings/:id/recommendation", bookings.recommend);
router.patch("/bookings/:id/assign", bookings.assign);
router.get("/bookings/:id", bookings.getOne);
router.put("/bookings/:id", bookings.update);
router.patch("/bookings/:id", bookings.update);
router.delete("/bookings/:id", requireAdmin, bookings.remove);

// Dispatchers can view the roster. Only admins can change it.
router.use("/technicians", requireTeam);
router.get("/technicians", technicians.list);
router.post("/technicians", requireAdmin, technicians.create);
router.patch("/technicians/:id", requireAdmin, technicians.update);
router.put("/technicians/:id", requireAdmin, technicians.update);

module.exports = router;
