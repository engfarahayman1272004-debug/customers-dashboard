const API_URL = "https://jsonplaceholder.typicode.com/users";
const PAGE_SIZE = 5;

const customersBody = document.getElementById("customersBody");
const tableWrap = document.getElementById("tableWrap");
const statusMessage = document.getElementById("statusMessage");

const searchInput = document.getElementById("searchInput");
const cityFilter = document.getElementById("cityFilter");
const sortSelect = document.getElementById("sortSelect");

const refreshBtn = document.getElementById("refreshBtn");
const refreshText = document.getElementById("refreshText");

const totalCustomers = document.getElementById("totalCustomers");
const totalCities = document.getElementById("totalCities");
const totalCompanies = document.getElementById("totalCompanies");
const visibleCustomers = document.getElementById("visibleCustomers");

const navCount = document.getElementById("navCount");
const tableSummary = document.getElementById("tableSummary");
const pageSummary = document.getElementById("pageSummary");
const pageNumbers = document.getElementById("pageNumbers");

const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalDone = document.getElementById("modalDone");

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");


let customers = [];
let currentPage = 1;
let loading = false;
let loadFailed = false;



function initials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0] || "")
        .join("")
        .toUpperCase();
}



function setStatus(message, type = "loading", withRetry = false) {
    statusMessage.className =
        `status-message${type === "error" ? " error" : ""}`;

    statusMessage.replaceChildren();

    if (type === "loading") {
        const loader = document.createElement("span");

        loader.className = "loader";
        loader.setAttribute("aria-hidden", "true");

        statusMessage.append(loader);
    }

    const text = document.createElement("span");
    text.textContent = message;

    statusMessage.append(text);

    if (withRetry) {
        statusMessage.append(document.createElement("br"));

        const retryButton = document.createElement("button");

        retryButton.type = "button";
        retryButton.textContent = "Try again";

        retryButton.addEventListener("click", loadCustomers);

        statusMessage.append(retryButton);
    }

    statusMessage.hidden = false;
    tableWrap.hidden = true;
}



async function loadCustomers() {
    if (loading) {
        return;
    }

    loading = true;
    loadFailed = false;

    refreshBtn.disabled = true;
    refreshText.textContent = "Loading…";

    setStatus("Connecting to the customer API...", "loading");

    tableSummary.textContent = "Loading customer records...";

    try {
        const response = await fetch(API_URL);

    
        if (!response.ok) {
            throw new Error(
                `Request failed with status ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Unexpected API response.");
        }

        customers = data;

        populateCityFilter();
        updateStats();

        currentPage = 1;

        renderCustomers();

    } catch (error) {
        console.error("Customer API error:", error);

        customers = [];

        updateStats();

        customersBody.replaceChildren();
        pageNumbers.replaceChildren();

        loadFailed = true;

        setStatus(
            "We couldn't load customer data. Check your connection and try again.",
            "error",
            true
        );

        tableSummary.textContent = "Unable to load records";
        pageSummary.textContent = "Page 0 of 0";

        prevPage.disabled = true;
        nextPage.disabled = true;

    } finally {
        loading = false;

        refreshBtn.disabled = false;
        refreshText.textContent = "Refresh data";
    }
}



function populateCityFilter() {
    const previousValue = cityFilter.value;

    const cities = [
        ...new Set(
            customers
                .map(customer => customer.address?.city)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    cityFilter.replaceChildren(
        new Option("All cities", "")
    );

    cities.forEach(city => {
        cityFilter.add(new Option(city, city));
    });

    if (cities.includes(previousValue)) {
        cityFilter.value = previousValue;
    }
}


function updateStats() {
    totalCustomers.textContent = customers.length;

    totalCities.textContent = new Set(
        customers
            .map(customer => customer.address?.city)
            .filter(Boolean)
    ).size;

    totalCompanies.textContent = new Set(
        customers
            .map(customer => customer.company?.name)
            .filter(Boolean)
    ).size;

    navCount.textContent = customers.length;

    visibleCustomers.textContent = 0;
}



function getFilteredCustomers() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedCity = cityFilter.value;

    const filtered = customers.filter(customer => {
        const matchesName = (customer.name || "")
            .toLowerCase()
            .includes(query);

        const matchesCity =
            !selectedCity ||
            customer.address?.city === selectedCity;

        return matchesName && matchesCity;
    });

    const sortMode = sortSelect.value;

    filtered.sort((a, b) => {
        switch (sortMode) {
            case "id-desc":
                return b.id - a.id;

            case "name-asc":
                return (a.name || "").localeCompare(b.name || "");

            case "name-desc":
                return (b.name || "").localeCompare(a.name || "");

            default:
                return a.id - b.id;
        }
    });

    return filtered;
}




function renderCustomers() {
    
    if (loadFailed) {
        return;
    }

    const filtered = getFilteredCustomers();

    const pageCount = Math.max(
        1,
        Math.ceil(filtered.length / PAGE_SIZE)
    );

    currentPage = Math.min(currentPage, pageCount);

    const start = (currentPage - 1) * PAGE_SIZE;

    const pageItems = filtered.slice(
        start,
        start + PAGE_SIZE
    );

    visibleCustomers.textContent = filtered.length;

    if (filtered.length > 0) {
        tableSummary.textContent =
            `Showing ${start + 1}–${Math.min(
                start + PAGE_SIZE,
                filtered.length
            )} of ${filtered.length} matching customers`;
    } else {
        tableSummary.textContent = "No matching customers";
    }

    customersBody.replaceChildren();

    
    if (filtered.length === 0) {
        tableWrap.hidden = true;

        const message = customers.length === 0
            ? "No customer data is available yet."
            : "No customers found. Try another search or clear your filters.";

        setStatus(message, "empty");

        tableSummary.textContent = "No matching customers";

        renderPagination(0, 0);

        return;
    }

    statusMessage.hidden = true;
    tableWrap.hidden = false;

    // Create a row for each customer
    pageItems.forEach(customer => {
        const row = document.createElement("tr");

        // Customer ID
        const idCell = document.createElement("td");

        const id = document.createElement("span");
        id.className = "customer-id";

        id.textContent =
            `#${String(customer.id).padStart(3, "0")}`;

        idCell.append(id);

        // Customer name and avatar
        const nameCell = document.createElement("td");

        const customerCell = document.createElement("div");
        customerCell.className = "customer-cell";

        const avatar = document.createElement("span");
        avatar.className = "customer-avatar";
        avatar.textContent = initials(customer.name);

        const nameWrap = document.createElement("span");

        const name = document.createElement("span");
        name.className = "customer-name";
        name.textContent = customer.name || "Unknown customer";

        const subtitle = document.createElement("span");
        subtitle.className = "customer-subtitle";
        subtitle.textContent = `Customer ID ${customer.id}`;

        nameWrap.append(name, subtitle);
        customerCell.append(avatar, nameWrap);
        nameCell.append(customerCell);

        // Email
        const emailCell = document.createElement("td");
        emailCell.className = "email-cell";
        emailCell.textContent = customer.email || "—";

        // City
        const cityCell = document.createElement("td");

        const city = document.createElement("span");
        city.className = "city-pill";
        city.textContent = customer.address?.city || "—";

        cityCell.append(city);

        // Company
        const companyCell = document.createElement("td");
        companyCell.className = "company-cell";
        companyCell.textContent = customer.company?.name || "—";
        companyCell.title = customer.company?.name || "";

        // Details button
        const actionCell = document.createElement("td");

        const detailsButton = document.createElement("button");
        detailsButton.type = "button";
        detailsButton.className = "details-button";
        detailsButton.textContent = "View details";

        detailsButton.addEventListener("click", () => {
            openCustomerDetails(customer);
        });

        actionCell.append(detailsButton);

        row.append(
            idCell,
            nameCell,
            emailCell,
            cityCell,
            companyCell,
            actionCell
        );

        customersBody.append(row);
    });

    renderPagination(filtered.length, pageCount);
}


function renderPagination(total, pageCount) {
    pageSummary.textContent = total
        ? `Page ${currentPage} of ${pageCount}`
        : "Page 0 of 0";

    prevPage.disabled = currentPage <= 1 || total === 0;
    nextPage.disabled = currentPage >= pageCount || total === 0;

    pageNumbers.replaceChildren();

    if (total === 0) {
        return;
    }

    for (let page = 1; page <= pageCount; page++) {
        const button = document.createElement("button");

        button.type = "button";

        button.className =
            `page-number${page === currentPage ? " active" : ""}`;

        button.textContent = page;
        button.setAttribute("aria-label", `Go to page ${page}`);

        if (page === currentPage) {
            button.setAttribute("aria-current", "page");
        }

        button.addEventListener("click", () => {
            currentPage = page;
            renderCustomers();
        });

        pageNumbers.append(button);
    }
}



function openCustomerDetails(customer) {
    document.getElementById("modalAvatar").textContent =
        initials(customer.name);

    document.getElementById("modalName").textContent =
        customer.name || "Unknown customer";

    document.getElementById("modalCompany").textContent =
        customer.company?.name || "No company listed";

    document.getElementById("modalEmail").textContent =
        customer.email || "—";

    document.getElementById("modalPhone").textContent =
        customer.phone || "—";

    document.getElementById("modalCity").textContent =
        customer.address?.city || "—";

    document.getElementById("modalWebsite").textContent =
        customer.website || "—";

    const address = customer.address;

    document.getElementById("modalAddress").textContent = address
        ? [
            address.street,
            address.suite,
            address.city,
            address.zipcode
        ].filter(Boolean).join(", ")
        : "—";

    document.getElementById("modalCatchphrase").textContent =
        customer.company?.catchPhrase || "—";

    modalBackdrop.hidden = false;
    modalClose.focus();
}

function closeModal() {
    modalBackdrop.hidden = true;
}



searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderCustomers();
});



cityFilter.addEventListener("change", () => {
    currentPage = 1;
    renderCustomers();
});

sortSelect.addEventListener("change", () => {
    currentPage = 1;
    renderCustomers();
});



refreshBtn.addEventListener("click", loadCustomers);




prevPage.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderCustomers();
    }
});

nextPage.addEventListener("click", () => {
    const pageCount = Math.max(
        1,
        Math.ceil(getFilteredCustomers().length / PAGE_SIZE)
    );

    if (currentPage < pageCount) {
        currentPage++;
        renderCustomers();
    }
});



clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    cityFilter.value = "";
    sortSelect.value = "id-asc";

    currentPage = 1;

    if (!loadFailed) {
        renderCustomers();
    }
});



modalClose.addEventListener("click", closeModal);
modalDone.addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", event => {
    if (event.target === modalBackdrop) {
        closeModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modalBackdrop.hidden) {
        closeModal();
    }


    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
    ) {
        event.preventDefault();
        searchInput.focus();
    }
});



mobileMenu.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});



document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(link => {
            link.classList.remove("active");
        });

        item.classList.add("active");

        if (window.innerWidth <= 620) {
            sidebar.classList.remove("open");
        }
    });
});
loadCustomers();
