const jwt = require("jsonwebtoken");

const COOKIE_NAME = "fieldfix_session";
const SESSION_HOURS = 12;
const revokedSessions = new Map();

function readCookie(request, name) {
  const cookieHeader = request.headers.cookie || "";

  for (const part of cookieHeader.split(";")) {
    const [cookieName, ...cookieValue] = part.trim().split("=");
    if (cookieName === name) return cookieValue.join("=");
  }
  return "";
}

function removeExpiredSessions() {
  const now = Math.floor(Date.now() / 1000);
  for (const [token, expiresAt] of revokedSessions) {
    if (expiresAt <= now) revokedSessions.delete(token);
  }
}

function revokeSession(request) {
  const token = readCookie(request, COOKIE_NAME);
  const session = token ? jwt.decode(token) : null;
  if (session && session.exp) revokedSessions.set(token, session.exp);
}

function findTeamUser(request, response) {
  const token = readCookie(request, COOKIE_NAME);
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    response.status(503).json({ message: "AUTH_SECRET is not configured." });
    return null;
  }
  if (!token) {
    response.status(401).json({ message: "Sign in to access the team dashboard." });
    return null;
  }

  removeExpiredSessions();
  if (revokedSessions.has(token)) {
    response.status(401).json({ message: "This team session has been signed out." });
    return null;
  }

  try {
    const user = jwt.verify(token, secret);
    if (!["admin", "dispatcher"].includes(user.role)) {
      response.status(403).json({ message: "This account cannot access the team dashboard." });
      return null;
    }
    request.user = { email: user.email, role: user.role };
    return request.user;
  } catch {
    response.status(401).json({ message: "Your team session has expired. Please sign in again." });
    return null;
  }
}

// Both team roles can work with booking requests.
function requireTeam(request, response, next) {
  if (!findTeamUser(request, response)) return;
  next();
}

// Only an admin can change the technician roster or remove booking records.
function requireAdmin(request, response, next) {
  const user = findTeamUser(request, response);
  if (!user) return;
  if (user.role !== "admin") {
    return response.status(403).json({ message: "This action requires the admin role." });
  }
  next();
}

function createSessionCookie(email, role) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required.");

  const token = jwt.sign(
    { email: email, role: role },
    secret,
    { expiresIn: SESSION_HOURS * 60 * 60, jwtid: require("node:crypto").randomUUID() }
  );

  return {
    name: COOKIE_NAME,
    token: token,
    maxAge: SESSION_HOURS * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}

module.exports = { requireTeam, requireAdmin, createSessionCookie, revokeSession };
