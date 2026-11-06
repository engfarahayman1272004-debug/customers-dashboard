
const $ = (id) => document.getElementById(id);

const KEY = "table-bookings-v1";

function loadBookings() {
    try {
        const data = JSON.parse(localStorage.getItem(KEY));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

let bookings = loadBookings();
let editingId = null;

function saveBookings() {
    localStorage.setItem(KEY, JSON.stringify(bookings));
}

function showNotice(message, error = false) {
    $("notice").textContent = message;
    $("notice").style.color = error ? "red" : "green";
}


function clearErrors() {
    ["customer", "phone", "date", "time", "guests"]
        .forEach(id => {
            $(id + "-error").textContent = "";
        });
}


function validateForm() {
    clearErrors();

    let valid = true;

    const name = $("customer").value.trim();
    const phone = $("phone").value.trim();
    const date = $("date").value;
    const time = $("time").value;
    const guests = Number($("guests").value);

    if (!name) {
        $("customer-error").textContent =
            "Please enter customer name.";
        valid = false;
    }

    if (!phone) {
        $("phone-error").textContent =
            "Please enter phone number.";
        valid = false;
    } else if (!/^\+?[\d\s()-]{7,18}$/.test(phone)) {
        $("phone-error").textContent =
            "Please enter a valid phone number.";
        valid = false;
    }

    if (!date) {
        $("date-error").textContent =
            "Please select a date.";
        valid = false;
    }

    if (!time) {
        $("time-error").textContent =
            "Please select a time.";
        valid = false;
    }

    if (
        !Number.isInteger(guests) ||
        guests < 1 ||
        !$("guests").value
    ) {
        $("guests-error").textContent =
            "Guests must be at least 1.";
        valid = false;
    }

    return valid;
}

function getFormData() {
    return {
        customer: $("customer").value.trim(),
        phone: $("phone").value.trim(),
        date: $("date").value,
        time: $("time").value,
        guests: Number($("guests").value),
        status: $("status").value
    };
}


function resetForm() {
    $("reservation-form").reset();

    $("guests").value = 2;

    editingId = null;

    clearErrors();

    $("submit-button").textContent = "ADD BOOKING ↗";

    $("form-heading").innerHTML =
        'A NEW<br><em>GUEST</em><span>.</span>';

    $("form-mode").textContent = "NEW RESERVATION";

    $("cancel-edit").hidden = true;
}


function updateStats() {
    $("total-count").textContent =
        String(bookings.length).padStart(2, "0");

    $("pending-count").textContent =
        String(bookings.filter(b => b.status === "Pending").length)
        .padStart(2, "0");

    $("confirmed-count").textContent =
        String(bookings.filter(b => b.status === "Confirmed").length)
        .padStart(2, "0");

    $("cancelled-count").textContent =
        String(bookings.filter(b => b.status === "Cancelled").length)
        .padStart(2, "0");
}


function renderBookings() {

    const tbody = $("booking-table-body");

    tbody.replaceChildren();

    const search =
        $("search-input").value.trim().toLowerCase();

    const filter =
        $("status-filter").value;

    const results = bookings.filter(booking => {

        const matchesSearch =
            booking.customer.toLowerCase().includes(search) ||
            booking.phone.toLowerCase().includes(search);

        const matchesStatus =
            filter === "All" || booking.status === filter;

        return matchesSearch && matchesStatus;

    }).sort((a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time)
    );

    $("result-count").textContent =
        results.length + " RESULTS";

    $("table-container").hidden = results.length === 0;

    $("empty-state").hidden = results.length !== 0;

    if (results.length === 0) {

        const noBookings = bookings.length === 0;

        $("empty-title").textContent =
            noBookings ? "YOUR TABLE IS CLEAR." : "NO MATCHES FOUND.";

        $("empty-message").textContent =
            noBookings
                ? "Your reservations will appear here."
                : "Try another name, phone number, or status.";

        $("clear-filters").hidden =
            !search && filter === "All";
    }

    results.forEach(booking => {

        const tr = document.createElement("tr");

        
        const guest = document.createElement("td");

        const guestDiv = document.createElement("div");
        guestDiv.className = "guest-cell";

        const avatar = document.createElement("span");
        avatar.className = "avatar";
        avatar.textContent =
            booking.customer.charAt(0).toUpperCase();

        const info = document.createElement("span");

        const name = document.createElement("strong");
        name.textContent = booking.customer;

        const phone = document.createElement("small");
        phone.textContent = booking.phone;

        info.append(name, phone);
        guestDiv.append(avatar, info);
        guest.append(guestDiv);

        
        const date = document.createElement("td");

        const dateText = document.createElement("strong");

        dateText.textContent =
            new Date(booking.date + "T00:00:00")
            .toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });

        const timeText = document.createElement("small");
        timeText.textContent = booking.time;

        date.append(dateText, timeText);

                const guests = document.createElement("td");

        const guestCount = document.createElement("strong");
        guestCount.textContent = booking.guests;

        const people = document.createElement("small");
        people.textContent =
            booking.guests === 1 ? "PERSON" : "PEOPLE";

        guests.append(guestCount, people);

        
        const status = document.createElement("td");

        const badge = document.createElement("span");

        badge.className =
            "status status-" + booking.status.toLowerCase();

        badge.textContent = booking.status;

        status.append(badge);

        
        const actionsCell = document.createElement("td");

        const actions = document.createElement("div");
        actions.className = "row-actions";

        
        const statusSelect = document.createElement("select");

        ["Pending", "Confirmed", "Cancelled"].forEach(s => {
            const option = document.createElement("option");
            option.value = s;
            option.textContent = s;
            statusSelect.append(option);
        });

        statusSelect.value = booking.status;

        statusSelect.addEventListener("change", () => {

            bookings = bookings.map(b =>
                b.id === booking.id
                    ? { ...b, status: statusSelect.value }
                    : b
            );

            refresh();

            showNotice("Booking status updated!");
        });

        
        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className = "icon-btn";
        editButton.textContent = "↗";
        editButton.title = "Edit booking";

        editButton.addEventListener("click", () => {
            editBooking(booking.id);
        });

        // Delete button
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "icon-btn delete-btn";
        deleteButton.textContent = "×";
        deleteButton.title = "Delete booking";

        deleteButton.addEventListener("click", () => {
            deleteBooking(booking.id);
        });

        actions.append(
            statusSelect,
            editButton,
            deleteButton
        );

        actionsCell.append(actions);

        tr.append(
            guest,
            date,
            guests,
            status,
            actionsCell
        );

        tbody.append(tr);

    });
}


function refresh() {
    saveBookings();
    updateStats();
    renderBookings();
}


$("reservation-form").addEventListener("submit", function(event) {

    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const data = getFormData();

    if (editingId !== null) {

        bookings = bookings.map(booking =>
            booking.id === editingId
                ? { ...data, id: editingId }
                : booking
        );

        showNotice("Booking updated successfully!");

    } else {

        const newBooking = {
            ...data,
            id: Date.now().toString()
        };

        bookings.push(newBooking);

        showNotice("Booking added successfully!");
    }

    resetForm();

    refresh();

});

function editBooking(id) {

    const booking = bookings.find(b => b.id === id);

    if (!booking) return;

    editingId = id;

    $("customer").value = booking.customer;
    $("phone").value = booking.phone;
    $("date").value = booking.date;
    $("time").value = booking.time;
    $("guests").value = booking.guests;
    $("status").value = booking.status;

    clearErrors();

    $("submit-button").textContent = "SAVE CHANGES ↗";

    $("form-heading").innerHTML =
        'EDIT<br><em>BOOKING</em><span>.</span>';

    $("form-mode").textContent = "UPDATE RESERVATION";

    $("cancel-edit").hidden = false;

    $("booking-form").scrollIntoView({
        behavior: "smooth"
    });
}

function deleteBooking(id) {

    const booking = bookings.find(b => b.id === id);

    if (!booking) return;

    const confirmed = confirm(
        "Are you sure you want to delete the booking for " +
        booking.customer + "?"
    );

    if (!confirmed) return;

    bookings = bookings.filter(b => b.id !== id);

    if (editingId === id) {
        resetForm();
    }

    refresh();

    showNotice("Booking deleted successfully!");
}

$("cancel-edit").addEventListener("click", resetForm);
$("search-input").addEventListener("input", renderBookings);

$("status-filter").addEventListener("change", renderBookings);

$("clear-filters").addEventListener("click", function() {

    $("search-input").value = "";

    $("status-filter").value = "All";

    renderBookings();

});

refresh();
