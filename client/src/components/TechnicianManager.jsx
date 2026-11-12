import { useState } from "react";

const skillLabels = {
  ac: "Heating & air",
  plumbing: "Plumbing",
  electrical: "Electrical",
  appliance: "Appliance"
};

export default function TechnicianManager({ technicians, onCreate, onToggle }) {
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function addTechnician(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const skills = formData.getAll("skills");

    if (!skills.length) {
      setNotice("Select at least one service skill.");
      return;
    }

    setSaving(true);
    try {
      await onCreate({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        skills: skills
      });
      form.reset();
      setNotice("Technician added to the team.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="team-layout">
      <form className="form-card technician-form" onSubmit={addTechnician}>
        <div className="section-kicker">Team directory</div>
        <h3>Add a technician</h3>
        <label>Name<input name="name" maxLength="100" required /></label>
        <label>Email<input name="email" type="email" maxLength="160" required /></label>
        <label>Phone<input name="phone" type="tel" maxLength="30" required /></label>
        <fieldset>
          <legend>Service skills</legend>
          {Object.entries(skillLabels).map(([key, label]) => (
            <label className="check-label" key={key}>
              <input name="skills" type="checkbox" value={key} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <button className="button button-dark" disabled={saving} type="submit">{saving ? "Adding…" : "Add to team"} <span aria-hidden="true">+</span></button>
        <p className="inline-notice" role="status">{notice}</p>
      </form>
      <div className="technician-list">
        {technicians.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">♙</span><strong>Your team starts here.</strong><span>Add technicians and their skills to make smart dispatch available.</span></div>
        ) : technicians.map((technician) => (
          <article className="technician-card" key={technician._id}>
            <div className="avatar">{technician.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>
            <div className="technician-info">
              <div className="technician-heading">
                <h3>{technician.name}</h3>
                <span className={technician.available ? "availability available" : "availability unavailable"}>
                  {technician.available ? "Available" : "Off duty"}
                </span>
              </div>
              <p>{technician.email} <span>·</span> {technician.phone}</p>
              <div className="skill-tags">{technician.skills.map((skill) => <span key={skill}>{skillLabels[skill]}</span>)}</div>
            </div>
            <button className="button button-quiet button-small" onClick={() => onToggle(technician)} type="button">
              {technician.available ? "Set off duty" : "Set available"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
