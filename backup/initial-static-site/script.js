const bookButton = document.querySelector("#book-button");
const bookingForm = document.querySelector(".booking-form");
const serviceInput = document.querySelector("#service");
const bookingList = document.querySelector("#booking-list");
const successMessage = document.querySelector("#success-message");

const serviceNames = {
    ac: "AC Repair",
    plumbing: "Plumbing",
    electrical: "Electrical",
    appliance: "Appliance Repair"
};

let bookings = [];

try {
    const savedBookings = localStorage.getItem("bookings");
    bookings = savedBookings ? JSON.parse(savedBookings) : [];

    if (!Array.isArray(bookings)) {
        bookings = [];
    } else {
        bookings = bookings.filter(function (booking) {
            return booking && typeof booking.name === "string" && typeof booking.service === "string";
        });
    }
} catch {
    bookings = [];
}

function showBookings() {
    bookingList.textContent = "";

    if (bookings.length === 0) {
        bookingList.textContent = "No service requests yet.";
        return;
    }

    for (const booking of bookings) {
        const bookingItem = document.createElement("p");
        const serviceName = serviceNames[booking.service] || booking.service;

        bookingItem.textContent = `${booking.name} — ${serviceName}`;
        bookingList.appendChild(bookingItem);
    }
}

bookButton.addEventListener("click", function () {
    bookingForm.scrollIntoView({ behavior: "smooth" });
});

bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(bookingForm);
    const name = formData.get("name").trim();
    const problem = formData.get("problem").trim();

    if (name === "" || problem === "") {
        successMessage.textContent = "Please enter your name and describe your problem.";
        return;
    }

    const booking = {
        name: name,
        email: formData.get("email").trim(),
        service: serviceInput.value,
        problem: problem
    };

    bookings.push(booking);
    showBookings();
    bookingForm.reset();

    try {
        localStorage.setItem("bookings", JSON.stringify(bookings));
        successMessage.textContent = "Request saved in this browser.";
    } catch {
        successMessage.textContent = "Request added for this visit, but your browser could not save it.";
    }
});

showBookings();
