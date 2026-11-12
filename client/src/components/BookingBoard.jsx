import { useState } from "react";

const serviceNames = {
  ac: "Heating & air",
  plumbing: "Plumbing",
  electrical: "Electrical",
  appliance: "Appliance repair"
};
const statuses = ["Pending", "Assigned", "In Progress", "Completed", "Cancelled"];

function technicianName(technician) {
  if (!technician) return "Not assigned";
  return typeof technician === "string" ? "Assigned technician" : technician.name;
}

export default function BookingBoard({ bookings, technicians, filters, onFilter, onUpdate, onDelete, onAssign, loading, isAdmin }) {
  const [editing, setEditing] = useState("");
  const [notice, setNotice] = useState("");

  async function saveEdit(event, booking) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await onUpdate(booking._id, values);
      setEditing("");
      setNotice("Booking details updated.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function changeStatus(id, status) {
    try {
      await onUpdate(id, { status: status });
      setNotice("Status updated.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function assign(id) {
    try {
      const result = await onAssign(id);
      setNotice(result.technician.name + " assigned using the skill and workload rules.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function remove(booking) {
    if (!window.confirm("Delete booking " + booking.reference + "? This cannot be undone.")) return;
    try {
      await onDelete(booking._id);
      setNotice("Booking deleted.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  return (
    <div className="dashboard-card">
      <div className="dashboard-tools">
        <label className="search-field">
          <span className="sr-only">Search bookings</span>
          <span aria-hidden="true">⌕</span>
          <input
            value={filters.search}
            onChange={(event) => onFilter("search", event.target.value)}
            placeholder="Search name, reference, email…"
          />
        </label>
        <select aria-label="Filter by status" value={filters.status} onChange={(event) => onFilter("status", event.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <select aria-label="Filter by service" value={filters.service} onChange={(event) => onFilter("service", event.target.value)}>
          <option value="">All services</option>
          {Object.entries(serviceNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>
      {notice && <p className="inline-notice" role="status">{notice}</p>}
      {loading ? (
        <div className="empty-state"><span className="spinner" /> Loading service requests…</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">⌂</span><strong>No requests match.</strong><span>New service bookings will appear here.</span></div>
      ) : (
        <div className="booking-stack">
          {bookings.map((booking) => (
            <article className="booking-row" key={booking._id}>
              <div className="booking-row-top">
                <div>
                  <span className="booking-reference">{booking.reference}</span>
                  <h3>{booking.customerName}</h3>
                  <p>{serviceNames[booking.service] || booking.service} <span aria-hidden="true">·</span> {booking.email}</p>
                </div>
                <span className={"status-pill status-" + booking.status.toLowerCase().replaceAll(" ", "-")}>{booking.status}</span>
              </div>
              <div className="booking-meta">
                <span>⌖ {booking.address}</span>
                <span>◷ {String(booking.preferredDate).slice(0, 10)} · {booking.preferredTime}</span>
                <span>⚒ {technicianName(booking.technician)}</span>
              </div>
              <p className="booking-problem">{booking.problem}</p>
              {editing === booking._id ? (
                <form className="edit-grid" onSubmit={(event) => saveEdit(event, booking)}>
                  <label>Customer<input name="customerName" defaultValue={booking.customerName} required /></label>
                  <label>Email<input name="email" type="email" defaultValue={booking.email} required /></label>
                  <label>Phone<input name="phone" defaultValue={booking.phone} required /></label>
                  <label>Service<select name="service" defaultValue={booking.service} required><option value="ac">Heating & air</option><option value="plumbing">Plumbing</option><option value="electrical">Electrical</option><option value="appliance">Appliance repair</option></select></label>
                  <label>Address<input name="address" defaultValue={booking.address} required /></label>
                  <label>Preferred date<input name="preferredDate" type="date" defaultValue={String(booking.preferredDate).slice(0, 10)} required /></label>
                  <label className="field-span">Preferred time<input name="preferredTime" defaultValue={booking.preferredTime} required /></label>
                  <label className="field-span">Problem<textarea name="problem" defaultValue={booking.problem} rows="2" required /></label>
                  <div className="row-actions field-span">
                    <button className="button button-dark button-small" type="submit">Save changes</button>
                    <button className="button button-quiet button-small" onClick={() => setEditing("")} type="button">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="row-actions">
                  <label className="status-control">
                    <span className="sr-only">Update status for {booking.reference}</span>
                    <select value={booking.status} onChange={(event) => changeStatus(booking._id, event.target.value)}>
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                  <button className="button button-quiet button-small" onClick={() => setEditing(booking._id)} type="button">Edit details</button>
                  <button className="button button-quiet button-small" onClick={() => assign(booking._id)} type="button">
                    {booking.technician ? "Reassign" : "Find technician"}
                  </button>
                  {isAdmin && <button className="button button-danger button-small" onClick={() => remove(booking)} type="button">Delete</button>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {technicians.length === 0 && <p className="small-note">Add a technician with a matching skill to enable dispatch recommendations.</p>}
    </div>
  );
}
