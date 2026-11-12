const storage = require("../services/storage");
const { recommendTechnician } = require("../services/dispatch");

const allowedServices = ["ac", "plumbing", "electrical", "appliance"];
const allowedStatuses = ["Pending", "Assigned", "In Progress", "Completed", "Cancelled"];
const bookingFields = ["customerName", "email", "phone", "service", "problem", "address", "preferredDate", "preferredTime"];
const fieldLimits = { customerName: 100, email: 160, phone: 30, problem: 1500, address: 300, preferredTime: 100 };

function checkBooking(values, partial) {
  const cleaned = {};
  for (const field of bookingFields) {
    if (values[field] !== undefined) cleaned[field] = values[field];
  }

  if (!partial) {
    for (const field of bookingFields) {
      if (cleaned[field] === undefined || cleaned[field] === "") {
        const error = new Error("Please complete every booking field.");
        error.statusCode = 400;
        throw error;
      }
    }
  }

  if (cleaned.customerName !== undefined) cleaned.customerName = String(cleaned.customerName).trim();
  if (cleaned.email !== undefined) cleaned.email = String(cleaned.email).trim().toLowerCase();
  if (cleaned.phone !== undefined) cleaned.phone = String(cleaned.phone).trim();
  if (cleaned.problem !== undefined) cleaned.problem = String(cleaned.problem).trim();
  if (cleaned.address !== undefined) cleaned.address = String(cleaned.address).trim();
  if (cleaned.preferredTime !== undefined) cleaned.preferredTime = String(cleaned.preferredTime).trim();

  // Repeat required checks after trimming so a string of spaces is not accepted as data.
  if (!partial) {
    for (const field of bookingFields) {
      if (cleaned[field] === undefined || cleaned[field] === "") {
        const error = new Error("Please complete every booking field.");
        error.statusCode = 400;
        throw error;
      }
    }
  }

  for (const [field, limit] of Object.entries(fieldLimits)) {
    if (cleaned[field] && cleaned[field].length > limit) {
      const error = new Error(field + " is too long.");
      error.statusCode = 400;
      throw error;
    }
  }

  if (cleaned.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
    const error = new Error("Enter a valid email address.");
    error.statusCode = 400;
    throw error;
  }
  if (cleaned.service && !allowedServices.includes(cleaned.service)) {
    const error = new Error("Choose a valid service category.");
    error.statusCode = 400;
    throw error;
  }
  if (cleaned.preferredDate && Number.isNaN(new Date(cleaned.preferredDate).getTime())) {
    const error = new Error("Choose a valid preferred date.");
    error.statusCode = 400;
    throw error;
  }
  return cleaned;
}

function asyncRoute(handler) {
  return function (request, response, next) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

const list = asyncRoute(async function (request, response) {
  const filters = {
    status: allowedStatuses.includes(request.query.status) ? request.query.status : "",
    service: allowedServices.includes(request.query.service) ? request.query.service : "",
    search: String(request.query.search || "").slice(0, 100)
  };
  response.json(await storage.listBookings(filters));
});

const getOne = asyncRoute(async function (request, response) {
  const booking = await storage.getBooking(request.params.id);
  if (!booking) return response.status(404).json({ message: "Booking not found." });
  response.json(booking);
});

const create = asyncRoute(async function (request, response) {
  const values = checkBooking(request.body, false);
  const booking = await storage.createBooking(values);
  response.status(201).json(booking);
});

const update = asyncRoute(async function (request, response) {
  const values = checkBooking(request.body, true);
  if (request.body.status !== undefined) {
    if (!allowedStatuses.includes(request.body.status)) {
      return response.status(400).json({ message: "Choose a valid booking status." });
    }
    values.status = request.body.status;
  }
  const booking = await storage.updateBooking(request.params.id, values);
  if (!booking) return response.status(404).json({ message: "Booking not found." });
  response.json(booking);
});

const remove = asyncRoute(async function (request, response) {
  const booking = await storage.deleteBooking(request.params.id);
  if (!booking) return response.status(404).json({ message: "Booking not found." });
  response.status(204).end();
});

const recommend = asyncRoute(async function (request, response) {
  const booking = await storage.getBooking(request.params.id);
  if (!booking) return response.status(404).json({ message: "Booking not found." });
  const match = await recommendTechnician(booking.service);
  if (!match) return response.status(404).json({ message: "No available technician has this service skill." });
  response.json({
    technician: match.technician,
    activeBookings: match.activeBookings,
    explanation: "Matched service skill and selected the technician with the fewest active jobs."
  });
});

const assign = asyncRoute(async function (request, response) {
  const booking = await storage.getBooking(request.params.id);
  if (!booking) return response.status(404).json({ message: "Booking not found." });

  const match = request.body.technicianId
    ? { technician: await storage.getTechnician(request.body.technicianId) }
    : await recommendTechnician(booking.service);

  if (!match || !match.technician) {
    return response.status(404).json({ message: "No suitable available technician was found." });
  }
  if (!match.technician.available || !match.technician.skills.includes(booking.service)) {
    return response.status(400).json({ message: "This technician is unavailable or does not have the required skill." });
  }

  const updated = await storage.updateBooking(request.params.id, {
    technician: match.technician._id,
    status: booking.status === "Pending" ? "Assigned" : booking.status
  });

  // In demo mode the booking stores a technician object so the UI can show the assignment.
  if (!storage.usesMongo()) updated.technician = match.technician;
  response.json(updated);
});

const track = asyncRoute(async function (request, response) {
  const reference = String(request.query.reference || "").trim();
  const email = String(request.query.email || "").trim();
  if (!reference || !email) return response.status(400).json({ message: "Enter the booking reference and email." });

  const booking = await storage.findBookingByReferenceAndEmail(reference, email);
  if (!booking) return response.status(404).json({ message: "No booking matched that reference and email." });
  response.json(booking);
});

module.exports = { list, getOne, create, update, remove, recommend, assign, track };
