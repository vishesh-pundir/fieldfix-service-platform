const storage = require("./storage");

// This rule based recommendation prefers matching skills, then balances active workload.
async function recommendTechnician(service) {
  const technicians = await storage.listTechnicians();
  const candidates = [];

  for (const technician of technicians) {
    if (!technician.available || !technician.skills.includes(service)) continue;

    const activeBookings = await storage.countOpenAssignments(technician._id);
    candidates.push({ technician, activeBookings });
  }

  candidates.sort((first, second) => first.activeBookings - second.activeBookings);
  return candidates.length ? candidates[0] : null;
}

module.exports = { recommendTechnician };
