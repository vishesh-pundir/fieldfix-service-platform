import { useCallback, useEffect, useState } from "react";
import BookingForm from "./components/BookingForm";
import BookingBoard from "./components/BookingBoard";
import TechnicianManager from "./components/TechnicianManager";
import BookingTracker from "./components/BookingTracker";
import AdminLogin from "./components/AdminLogin";
import { api } from "./services/api";

const emptyFilters = { search: "", status: "", service: "" };

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [appError, setAppError] = useState("");
  const [storageMode, setStorageMode] = useState("checking");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const loadBookings = useCallback(async function () {
    setLoadingBookings(true);
    try {
      setBookings(await api.bookings(filters));
      setAppError("");
    } catch (error) {
      setAppError(error.message);
    } finally {
      setLoadingBookings(false);
    }
  }, [filters]);

  const loadTechnicians = useCallback(async function () {
    try {
      setTechnicians(await api.technicians());
    } catch (error) {
      setAppError(error.message);
    }
  }, []);

  useEffect(function () {
    api.health()
      .then((health) => setStorageMode(health.storageMode))
      .catch(() => setAppError("The FieldFix API is not reachable. Start the server and refresh."));
    api.currentUser()
      .then((account) => setUser(account))
      .catch((error) => setAppError(error.message))
      .finally(() => setAuthLoading(false));
  }, []);

  // Team records are only requested after the server confirms an admin session.
  useEffect(function () {
    if (user) {
      loadTechnicians();
    } else {
      setTechnicians([]);
    }
  }, [user, loadTechnicians]);

  useEffect(function () {
    if (!user) {
      setBookings([]);
      setLoadingBookings(false);
      return;
    }
    const timer = window.setTimeout(loadBookings, 180);
    return function () { window.clearTimeout(timer); };
  }, [loadBookings, user]);

  // A successful form post refreshes the shared booking list and returns its tracking reference.
  async function createBooking(values) {
    const saved = await api.createBooking(values);
    if (user) await loadBookings();
    return saved;
  }

  async function updateBooking(id, values) {
    const updated = await api.updateBooking(id, values);
    await Promise.all([loadBookings(), loadTechnicians()]);
    return updated;
  }

  async function deleteBooking(id) {
    await api.deleteBooking(id);
    await loadBookings();
  }

  async function assignBooking(id) {
    const assigned = await api.assignBooking(id);
    await loadBookings();
    return assigned;
  }

  async function createTechnician(values) {
    await api.createTechnician(values);
    await loadTechnicians();
  }

  async function toggleAvailability(technician) {
    try {
      await api.updateTechnician(technician._id, { available: !technician.available });
      await loadTechnicians();
    } catch (error) {
      setAppError(error.message);
    }
  }

  function changeFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function trackBooking(reference, email) {
    return api.trackBooking(reference, email);
  }

  async function signIn(email, password) {
    const result = await api.login(email, password);
    setUser(result.user);
    setAppError("");
  }

  async function signOut() {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setBookings([]);
      setTechnicians([]);
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="FieldFix home">
          <span className="brand-mark">F<span>+</span></span>
          <span>fieldfix</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#how-it-works">How it works</a>
          <a href="#booking">Book a service</a>
          <a href="#dashboard">{user ? "Team dashboard" : "Team sign in"}</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="button button-dark nav-cta" href="#booking">Book a visit <span aria-hidden="true">↗</span></a>
      </header>

      <main id="home">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Home service, handled.</div>
            <h1>Good help.<br /><em>Right on time.</em></h1>
            <p>Repairs shouldn’t take over your day. Tell us what’s wrong and we’ll match your request with a skilled local technician.</p>
            <div className="hero-actions">
              <a className="button button-dark button-large" href="#booking">Book a service <span aria-hidden="true">↗</span></a>
              <a className="text-link" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-trust"><div className="trust-avatars"><span>R</span><span>M</span><span>A</span></div><p><strong>Care you can count on</strong><br />Thoughtful service, from request to repair.</p></div>
          </div>
          <div className="hero-art" aria-label="Illustration of a field technician with tools">
            <div className="art-sun" />
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="art-house"><div className="house-roof" /><div className="house-body"><div className="house-window" /><div className="house-door" /></div></div>
            <div className="art-toolbox"><span>✚</span></div>
            <div className="art-person"><div className="person-head" /><div className="person-body"><span className="person-pocket" /></div><div className="person-leg left-leg" /><div className="person-leg right-leg" /><div className="person-arm" /></div>
            <div className="art-label label-top"><span className="label-icon">✓</span><span><b>Request received</b><small>We’ll take it from here</small></span></div>
            <div className="art-label label-bottom"><span className="label-pulse" /><span><b>Local pros</b><small>Matched by skill & availability</small></span></div>
            <div className="art-caption">One less thing on your list.</div>
          </div>
          <div className="hero-bottomline"><span>REPAIRS MADE SIMPLE</span><span className="hero-bottom-rule" /><span>EST. FOR BETTER DAYS</span></div>
        </section>

        {appError && <div className="global-alert" role="alert"><span>{appError}</span><button onClick={() => setAppError("")} aria-label="Dismiss message">×</button></div>}
        {storageMode === "memory" && <div className="mode-notice"><span className="mode-dot" /> Demo mode · records reset when the server restarts. Connect MongoDB for persistent storage.</div>}
        {storageMode === "mongo" && <div className="mode-notice mode-connected"><span className="mode-dot" /> Connected to MongoDB · requests are stored persistently.</div>}

        <section className="section services-section" id="services">
          <div className="section-heading">
            <div><div className="section-kicker">What can we fix?</div><h2>One call for the<br /><em>whole home.</em></h2></div>
            <p>From the little leak to the loud appliance, get the right person on the job without the runaround.</p>
          </div>
          <div className="service-grid">
            <article className="service-tile service-mint"><div className="service-symbol">↯</div><div><span className="tile-number">01 / CLIMATE</span><h3>Heating & air</h3><p>AC repair, seasonal tune-ups and the comfort fixes in between.</p></div><a href="#booking" aria-label="Book heating and air service">↗</a></article>
            <article className="service-tile service-peach"><div className="service-symbol">⌁</div><div><span className="tile-number">02 / WATER</span><h3>Plumbing</h3><p>Leaks, clogs and fixtures taken care of with a careful touch.</p></div><a href="#booking" aria-label="Book plumbing service">↗</a></article>
            <article className="service-tile service-yellow"><div className="service-symbol">ϟ</div><div><span className="tile-number">03 / POWER</span><h3>Electrical</h3><p>Safe repairs, installations and troubleshooting at home.</p></div><a href="#booking" aria-label="Book electrical service">↗</a></article>
            <article className="service-tile service-lilac"><div className="service-symbol">⌗</div><div><span className="tile-number">04 / APPLIANCES</span><h3>Appliance repair</h3><p>Get everyday essentials back to doing what they do best.</p></div><a href="#booking" aria-label="Book appliance repair">↗</a></article>
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-intro"><div className="section-kicker">A little less hassle</div><h2>From “oh no”<br />to <em>all sorted.</em></h2><p>Simple from the first hello. We keep you in the loop all the way through.</p><a className="text-link" href="#booking">Start with a service request <span aria-hidden="true">↗</span></a></div>
          <div className="steps-list">
            <article><span className="step-number">01</span><div><h3>Tell us what’s up</h3><p>Choose a service, describe the issue and pick a time that works for you.</p></div><span className="step-check">↗</span></article>
            <article><span className="step-number">02</span><div><h3>We find the right fit</h3><p>Your request is matched with an available technician who has the right skills.</p></div><span className="step-check">↗</span></article>
            <article><span className="step-number">03</span><div><h3>Follow along</h3><p>Check your booking status and technician details with your reference number.</p></div><span className="step-check">↗</span></article>
          </div>
        </section>

        <section className="why-section">
          <div className="why-visual"><div className="why-shape shape-back" /><div className="why-shape shape-front"><span>good<br />to go.</span></div><div className="why-sticker">LESS STRESS<br />MORE LIVING</div><span className="why-spark">✳</span></div>
          <div className="why-copy"><div className="section-kicker">The FieldFix feeling</div><h2>Skilled hands.<br /><em>Clear updates.</em></h2><p>Your home deserves people who treat it with care. FieldFix keeps requests organised, dispatch recommendations understandable, and appointment progress easy to check.</p><div className="why-points"><div><span>01</span><p><b>The right skill for the job</b><br />Dispatch suggestions are based on service skills.</p></div><div><span>02</span><p><b>A real person, kept in the loop</b><br />Status updates help you know what’s next.</p></div><div><span>03</span><p><b>Details in one place</b><br />Your request, appointment and technician details together.</p></div></div></div>
        </section>

        <section className="booking-section section" id="booking">
          <div className="section-heading booking-heading">
            <div><div className="section-kicker">Tell us how we can help</div><h2>Let’s get it<br /><em>taken care of.</em></h2></div>
            <p>Share a few details and our team will be ready to take a look. Fields marked with an asterisk are required.</p>
          </div>
          <BookingForm onCreated={createBooking} />
        </section>

        <section className="tracking-section section" id="track">
          <div className="tracking-title"><div className="section-kicker">Already booked?</div><h2>See where things<br /><em>stand.</em></h2></div>
          <BookingTracker onTrack={trackBooking} />
        </section>

        <section className="dashboard-section section" id="dashboard">
          {authLoading ? (
            <div className="auth-loading" role="status"><span className="spinner" /> Checking secure team access…</div>
          ) : user ? (
          <>
          <div className="dashboard-heading">
            <div><div className="section-kicker">For the people who get it done</div><h2>Field team <em>desk.</em></h2><p>Manage requests, keep the team up to date and find the best available match.</p></div>
            <div className="team-account"><span className="dispatch-note"><span>✳</span> Skill + workload dispatch</span><span className="signed-in-label">{user.email}</span><button className="button button-quiet button-small" onClick={signOut} type="button">Sign out</button></div>
          </div>
          <div className="dashboard-tabs"><a className="tab-active" href="#requests">Service requests <span>{bookings.length}</span></a><a href="#technicians">Technician team <span>{technicians.length}</span></a></div>
          <div id="requests" className="dashboard-subsection">
            <div className="subsection-heading"><h3>Service requests</h3><span>Search, update, assign or close a request.</span></div>
            <BookingBoard bookings={bookings} technicians={technicians} filters={filters} onFilter={changeFilter} onUpdate={updateBooking} onDelete={deleteBooking} onAssign={assignBooking} loading={loadingBookings} isAdmin={user.role === "admin"} />
          </div>
          <div id="technicians" className="dashboard-subsection technician-subsection">
            <div className="subsection-heading"><h3>Technician team</h3><span>Add skills and update availability.</span></div>
            {user.role === "admin" ? (
              <TechnicianManager technicians={technicians} onCreate={createTechnician} onToggle={toggleAvailability} />
            ) : (
              <div className="role-notice">Dispatcher access can view technicians and assign jobs. An admin manages technician profiles and availability.</div>
            )}
          </div>
          </>
          ) : <AdminLogin onLogin={signIn} />}
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div className="footer-top"><a className="brand footer-brand" href="#home"><span className="brand-mark">F<span>+</span></span><span>fieldfix</span></a><p>Good help for the things<br />that make a home.</p><a href="#booking">Need a hand? <b>Book a service ↗</b></a></div>
        <div className="footer-bottom"><span>© 2026 FieldFix. Made for better days.</span><div><a href="#services">Services</a><a href="#booking">Book a visit</a><a href="#dashboard">Team desk</a></div><span>SKILLFULLY SORTED.</span></div>
      </footer>
    </div>
  );
}
