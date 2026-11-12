const storage = require("../services/storage");
const allowedSkills = ["ac", "plumbing", "electrical", "appliance"];

function asyncRoute(handler) {
  return function (request, response, next) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function validateTechnician(body, partial) {
  const values = {};
  ["name", "email", "phone", "skills", "available"].forEach(function (field) {
    if (body[field] !== undefined) values[field] = body[field];
  });

  if (!partial && (!values.name || !values.email || !values.phone || !Array.isArray(values.skills))) {
    const error = new Error("Name, email, phone, and at least one skill are required.");
    error.statusCode = 400;
    throw error;
  }
  if (values.email) values.email = String(values.email).trim().toLowerCase();
  if (values.name) values.name = String(values.name).trim();
  if (values.phone) values.phone = String(values.phone).trim();
  if (values.skills) {
    if (!Array.isArray(values.skills) || values.skills.length === 0 ||
      values.skills.some((skill) => !allowedSkills.includes(skill))) {
      const error = new Error("Choose at least one valid service skill.");
      error.statusCode = 400;
      throw error;
    }
  }
  if (values.available !== undefined && typeof values.available !== "boolean") {
    const error = new Error("Technician availability must be true or false.");
    error.statusCode = 400;
    throw error;
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    const error = new Error("Enter a valid technician email address.");
    error.statusCode = 400;
    throw error;
  }
  return values;
}

const list = asyncRoute(async function (request, response) {
  response.json(await storage.listTechnicians());
});

const create = asyncRoute(async function (request, response) {
  const technician = await storage.createTechnician(validateTechnician(request.body, false));
  response.status(201).json(technician);
});

const update = asyncRoute(async function (request, response) {
  const technician = await storage.updateTechnician(
    request.params.id,
    validateTechnician(request.body, true)
  );
  if (!technician) return response.status(404).json({ message: "Technician not found." });
  response.json(technician);
});

module.exports = { list, create, update };
