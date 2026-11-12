import { useState } from "react";

// This form exchanges credentials for an HttpOnly session cookie; JavaScript cannot read that cookie.
export default function AdminLogin({ onLogin }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const values = new FormData(event.currentTarget);

    try {
      await onLogin(values.get("email"), values.get("password"));
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="login-layout">
      <div className="login-copy">
        <div className="section-kicker">A secure team space</div>
        <h2>Welcome to the<br /><em>field desk.</em></h2>
        <p>Sign in with your team account to manage bookings and dispatch technicians.</p>
      </div>
      <form className="form-card login-card" onSubmit={submit}>
        <div className="login-lock" aria-hidden="true">⌑</div>
        <h3>Team sign in</h3>
        <p>Use the admin account configured in the project environment.</p>
        <label>Email address<input name="email" type="email" autoComplete="username" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={saving}>
          {saving ? "Signing in…" : "Sign in to the team desk"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>
    </div>
  );
}
