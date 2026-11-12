import { useState } from "react";

const serviceNames = { ac: "Heating & air", plumbing: "Plumbing", electrical: "Electrical", appliance: "Appliance repair" };
const progressSteps = ["Pending", "Assigned", "In Progress", "Completed"];

export default function BookingTracker({ onTrack }) {
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function findBooking(event) {
    event.preventDefault();
    setBooking(null);
    setMessage("");
    setLoading(true);
    const values = new FormData(event.currentTarget);
    try {
      setBooking(await onTrack(values.get("reference"), values.get("email")));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const currentStep = booking ? progressSteps.indexOf(booking.status) : -1;

  return (
    <div className="tracker-layout">
      <form className="tracker-form" onSubmit={findBooking}>
        <div className="section-kicker">Stay in the know</div>
        <h3>Your service, in view.</h3>
        <p>Enter the reference from your confirmation and the email used to make the request.</p>
        <label>Booking reference<input name="reference" placeholder="FF-123456ABC" required /></label>
        <label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label>
        <button className="button button-dark" disabled={loading} type="submit">{loading ? "Looking up…" : "Check status"} <span aria-hidden="true">↗</span></button>
        {message && <p className="inline-notice error-text" role="status">{message}</p>}
      </form>
      <div className="tracker-result" aria-live="polite">
        {!booking ? (
          <div className="empty-state"><span className="empty-icon">◎</span><strong>Follow the progress</strong><span>Your appointment details will appear after a successful lookup.</span></div>
        ) : (
          <div className="tracking-card">
            <div className="tracking-top">
              <div><span className="booking-reference">{booking.reference}</span><h3>{serviceNames[booking.service] || booking.service} visit</h3></div>
              <span className={"status-pill status-" + booking.status.toLowerCase().replaceAll(" ", "-")}>{booking.status}</span>
            </div>
            {booking.status === "Cancelled" ? (
              <p className="tracking-cancelled">This request was cancelled. Contact us if you need help arranging another visit.</p>
            ) : (
              <div className="progress-track">
                {progressSteps.map((step, index) => (
                  <div className={"progress-step " + (currentStep >= index ? "is-done" : "")} key={step}>
                    <span className="progress-dot">{currentStep > index ? "✓" : index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="tracking-detail-grid">
              <div><span>Appointment</span><strong>{String(booking.preferredDate).slice(0, 10)} · {booking.preferredTime}</strong></div>
              <div><span>Address</span><strong>{booking.address}</strong></div>
              <div><span>Technician</span><strong>{booking.technician ? booking.technician.name : "Being matched to your request"}</strong></div>
              {booking.technician && <div><span>Technician contact</span><strong>{booking.technician.phone}</strong></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
