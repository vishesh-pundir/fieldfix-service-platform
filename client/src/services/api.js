// Every page uses this helper so API errors are shown as normal messages.
async function request(path, options) {
  const response = await fetch("/api" + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.message || "The request could not be completed.");
    error.status = response.status;
    throw error;
  }
  return result;
}

async function currentUser() {
  try {
    const result = await request("/auth/me");
    return result.user;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export const api = {
  health: function () {
    return request("/health");
  },
  currentUser: currentUser,
  login: function (email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email, password: password })
    });
  },
  logout: function () {
    return request("/auth/logout", { method: "POST" });
  },
  bookings: function (filters) {
    const query = new URLSearchParams(filters);
    return request("/bookings?" + query.toString());
  },
  createBooking: function (values) {
    return request("/bookings", { method: "POST", body: JSON.stringify(values) });
  },
  updateBooking: function (id, values) {
    return request("/bookings/" + encodeURIComponent(id), {
      method: "PATCH",
      body: JSON.stringify(values)
    });
  },
  deleteBooking: function (id) {
    return request("/bookings/" + encodeURIComponent(id), { method: "DELETE" });
  },
  assignBooking: function (id, technicianId) {
    const body = technicianId ? { technicianId: technicianId } : {};
    return request("/bookings/" + encodeURIComponent(id) + "/assign", {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  },
  technicians: function () {
    return request("/technicians");
  },
  createTechnician: function (values) {
    return request("/technicians", { method: "POST", body: JSON.stringify(values) });
  },
  updateTechnician: function (id, values) {
    return request("/technicians/" + encodeURIComponent(id), {
      method: "PATCH",
      body: JSON.stringify(values)
    });
  },
  trackBooking: function (reference, email) {
    const query = new URLSearchParams({ reference: reference, email: email });
    return request("/bookings/track?" + query.toString());
  }
};
