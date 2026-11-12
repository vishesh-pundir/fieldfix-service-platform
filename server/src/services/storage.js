const Booking = require("../models/Booking");
const Technician = require("../models/Technician");

// One storage module keeps route code readable while supporting a clearly labeled demo mode.
const memory = { bookings: [], technicians: [] };
const usesMongo = function () {
  return process.env.STORAGE_MODE === "mongo";
};

function createReference() {
  return "FF-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 900 + 100);
}

async function listBookings(filters) {
  if (!usesMongo()) {
    let results = memory.bookings.slice();
    if (filters.status) results = results.filter((item) => item.status === filters.status);
    if (filters.service) results = results.filter((item) => item.service === filters.service);
    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter((item) =>
        [item.customerName, item.email, item.reference, item.problem].some((value) =>
          String(value || "").toLowerCase().includes(term)
        )
      );
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.service) query.service = filters.service;
  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
    const expression = new RegExp(escaped, "i");
    query.$or = [{ customerName: expression }, { email: expression }, { reference: expression }, { problem: expression }];
  }
  return Booking.find(query).populate("technician").sort({ createdAt: -1 });
}

async function getBooking(id) {
  if (!usesMongo()) return memory.bookings.find((item) => item._id === id) || null;
  return Booking.findById(id).populate("technician");
}

async function createBooking(values) {
  if (!usesMongo()) {
    const booking = {
      ...values,
      _id: "demo-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
      reference: createReference(),
      status: "Pending",
      technician: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memory.bookings.unshift(booking);
    return booking;
  }
  return new Booking(values).save();
}

async function updateBooking(id, values) {
  if (!usesMongo()) {
    const booking = memory.bookings.find((item) => item._id === id);
    if (!booking) return null;
    Object.assign(booking, values, { updatedAt: new Date().toISOString() });
    return booking;
  }
  return Booking.findByIdAndUpdate(id, values, { new: true, runValidators: true }).populate("technician");
}

async function deleteBooking(id) {
  if (!usesMongo()) {
    const index = memory.bookings.findIndex((item) => item._id === id);
    if (index < 0) return null;
    return memory.bookings.splice(index, 1)[0];
  }
  return Booking.findByIdAndDelete(id);
}

async function listTechnicians() {
  if (!usesMongo()) return memory.technicians.slice().sort((a, b) => a.name.localeCompare(b.name));
  return Technician.find().sort({ name: 1 });
}

async function getTechnician(id) {
  if (!usesMongo()) return memory.technicians.find((item) => item._id === id) || null;
  return Technician.findById(id);
}

async function createTechnician(values) {
  if (!usesMongo()) {
    const duplicate = memory.technicians.some((item) => item.email === values.email.toLowerCase());
    if (duplicate) {
      const error = new Error("A technician with this email already exists.");
      error.statusCode = 409;
      throw error;
    }
    const technician = {
      ...values,
      email: values.email.toLowerCase(),
      _id: "demo-tech-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
      available: true,
      createdAt: new Date().toISOString()
    };
    memory.technicians.push(technician);
    return technician;
  }
  return new Technician(values).save();
}

async function updateTechnician(id, values) {
  if (!usesMongo()) {
    const technician = memory.technicians.find((item) => item._id === id);
    if (!technician) return null;
    Object.assign(technician, values);
    return technician;
  }
  return Technician.findByIdAndUpdate(id, values, { new: true, runValidators: true });
}

async function countOpenAssignments(technicianId) {
  if (!usesMongo()) {
    return memory.bookings.filter((item) =>
      item.technician && item.technician._id === technicianId &&
      !["Completed", "Cancelled"].includes(item.status)
    ).length;
  }
  return Booking.countDocuments({
    technician: technicianId,
    status: { $nin: ["Completed", "Cancelled"] }
  });
}

async function findBookingByReferenceAndEmail(reference, email) {
  if (!usesMongo()) {
    return memory.bookings.find((item) =>
      item.reference.toLowerCase() === reference.toLowerCase() &&
      item.email.toLowerCase() === email.toLowerCase()
    ) || null;
  }
  return Booking.findOne({
    reference: reference.toUpperCase(),
    email: email.toLowerCase()
  }).populate("technician");
}

module.exports = {
  usesMongo,
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  listTechnicians,
  getTechnician,
  createTechnician,
  updateTechnician,
  countOpenAssignments,
  findBookingByReferenceAndEmail
};
