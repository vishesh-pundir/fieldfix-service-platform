import { useState } from "react";

const today = new Date().toLocaleDateString("en-CA");

export default function BookingForm({ onCreated }) {
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function submitBooking(event) {
    event.preventDefault();
    setMessage("");
    setHasError(false);
    setIsSaving(true);

    const form = event.currentTarget;
    const formValues = new FormData(form);
    const booking = Object.fromEntries(formValues.entries());

    try {
      // The form posts JSON to Express; Express validates it before saving the record.
      const savedBooking = await onCreated(booking);
      setMessage("Request received. Your reference is " + savedBooking.reference + ".");
      form.reset();
    } catch (error) {
      setHasError(true);
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="form-card booking-form" onSubmit={submitBooking}>
      <div className="form-grid">
        <label>
          Full name
          <input name="customerName" autoComplete="name" maxLength="100" required />
        </label>
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" maxLength="160" required />
        </label>
        <label>
          Phone number
          <input name="phone" type="tel" autoComplete="tel" maxLength="30" required />
        </label>
        <label>
          Service needed
          <select name="service" defaultValue="" required>
            <option value="" disabled>Select a service</option>
            <option value="ac">Heating & air</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="appliance">Appliance repair</option>
          </select>
        </label>
        <label className="field-span">
          Service address
          <input name="address" autoComplete="street-address" maxLength="300" required />
        </label>
        <label>
          Preferred date
          <input name="preferredDate" type="date" min={today} required />
        </label>
        <label>
          Preferred time
          <select name="preferredTime" defaultValue="" required>
            <option value="" disabled>Choose a time window</option>
            <option>8 am – 11 am</option>
            <option>11 am – 2 pm</option>
            <option>2 pm – 5 pm</option>
          </select>
        </label>
        <label className="field-span">
          What needs attention?
          <textarea name="problem" rows="4" maxLength="1500" placeholder="Tell us what is happening and anything the technician should know." required />
        </label>
      </div>
      <div className="form-actions">
        <button className="button button-dark" disabled={isSaving} type="submit">
          {isSaving ? "Sending request…" : "Request a visit"}
          <span aria-hidden="true">↗</span>
        </button>
        <p className={hasError ? "form-message error-text" : "form-message success-text"} role="status" aria-live="polite">
          {message}
        </p>
      </div>
      <p className="small-note">No payment required to request a visit. We’ll confirm your appointment details.</p>
    </form>
  );
}
