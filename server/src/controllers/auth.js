const bcrypt = require("bcryptjs");
const { createSessionCookie, revokeSession } = require("../middleware/auth");

function login(request, response) {
  const body = request.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const secret = process.env.AUTH_SECRET;
  const accounts = [
    {
      email: String(process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      role: "admin"
    },
    {
      email: String(process.env.DISPATCHER_EMAIL || "").trim().toLowerCase(),
      passwordHash: process.env.DISPATCHER_PASSWORD_HASH,
      role: "dispatcher"
    }
  ].filter(function (account) {
    return account.email && account.passwordHash;
  });

  if (!accounts.length || !secret) {
    return response.status(503).json({
      message: "Set AUTH_SECRET and at least one team email and password hash in .env."
    });
  }
  if (!email || !password) {
    return response.status(400).json({ message: "Enter your team email and password." });
  }

  const account = accounts.find((item) => item.email === email);
  let passwordMatches = false;
  if (account) {
    try {
      passwordMatches = bcrypt.compareSync(password, account.passwordHash);
    } catch {
      return response.status(500).json({ message: "A configured team password hash is invalid." });
    }
  }

  if (!account || !passwordMatches) {
    return response.status(401).json({ message: "Email or password was not recognized." });
  }

  const cookie = createSessionCookie(email, account.role);
  response.cookie(cookie.name, cookie.token, {
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    path: cookie.path,
    maxAge: cookie.maxAge
  });
  response.json({ user: { email: email, role: account.role } });
}

function logout(request, response) {
  revokeSession(request);
  response.clearCookie("fieldfix_session", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  response.json({ message: "Signed out." });
}

function currentUser(request, response) {
  response.json({ user: request.user });
}

module.exports = { login, logout, currentUser };
