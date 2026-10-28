/* ========================================
   PERSONAL EXPENSE TRACKER
======================================== */

// Get HTML elements
const transactionForm = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const filterType = document.getElementById("filterType");

const transactionTable = document.getElementById("transactionTable");
const emptyMessage = document.getElementById("emptyMessage");

const totalIncomeElement = document.getElementById("totalIncome");
const totalExpensesElement = document.getElementById("totalExpenses");
const currentBalanceElement = document.getElementById("currentBalance");

// Load saved transactions from localStorage
let transactions = [];

try {
    const savedTransactions = localStorage.getItem("expenseTrackerTransactions");

    if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);

        if (Array.isArray(parsedTransactions)) {
            transactions = parsedTransactions.filter(transaction =>
                transaction &&
                typeof transaction.id === "string" &&
                ["income", "expense"].includes(transaction.type) &&
                typeof transaction.description === "string" &&
                transaction.description.trim() !== "" &&
                Number.isFinite(transaction.amount) &&
                transaction.amount > 0 &&
                typeof transaction.category === "string" &&
                typeof transaction.date === "string"
            );
        }
    }
} catch (error) {
    console.error("Could not load saved transactions:", error);
}

// Set today's date as the default date
dateInput.value = getLocalDate();

// Format date using the local calendar date
function getLocalDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Format currency in Sri Lankan Rupees
function formatCurrency(amount) {
    return "LKR " + amount.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Save transactions to localStorage
function saveTransactions() {
    try {
        localStorage.setItem(
            "expenseTrackerTransactions",
            JSON.stringify(transactions)
        );
        return true;
    } catch (error) {
        console.error("Could not save transactions:", error);

        alert(
            "Unable to save data in this browser. " +
            "Please check your browser storage settings."
        );

        return false;
    }
}

// Add a new transaction
transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const type = typeInput.value;
    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    // Validate required fields
    if (!type || !description || !category || !date) {
        alert("Please complete all required fields.");
        return;
    }

    // Validate transaction type
    if (!["income", "expense"].includes(type)) {
        alert("Please select a valid transaction type.");
        return;
    }

    // Validate amount
    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Amount must be greater than zero.");
        amountInput.focus();
        return;
    }

    // Validate date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        alert("Please enter a valid date.");
        return;
    }

    const transaction = {
        id: crypto.randomUUID(),
        type: type,
        description: description,
        amount: amount,
        category: category,
        date: date
    };

    // Add the transaction
    transactions.push(transaction);

    // Save data; roll back the addition if saving fails
    if (!saveTransactions()) {
        transactions.pop();
        return;
    }

    // Update the interface
updateDashboard();

// Show success message
alert("Transaction added successfully!");

// Reset the form
transactionForm.reset();
dateInput.value = getLocalDate();
typeInput.focus();
});

// Calculate and display totals
function updateSummary() {
    const totalIncome = transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const totalExpenses = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

    const currentBalance = totalIncome - totalExpenses;

    totalIncomeElement.textContent = formatCurrency(totalIncome);
    totalExpensesElement.textContent = formatCurrency(totalExpenses);
    currentBalanceElement.textContent = formatCurrency(currentBalance);

    currentBalanceElement.style.color =
        currentBalance < 0 ? "#ef4444" : "#2563eb";
}

// Display transactions in the table
function displayTransactions() {
    transactionTable.replaceChildren();

    const selectedFilter = filterType.value;

    const filteredTransactions = transactions
        .filter(transaction => {
            return selectedFilter === "all" ||
                transaction.type === selectedFilter;
        })
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date));

    // Display empty message when there are no matching transactions
    emptyMessage.style.display =
        filteredTransactions.length === 0 ? "block" : "none";

    filteredTransactions.forEach(transaction => {
        const row = document.createElement("tr");

        // Date
        const dateCell = document.createElement("td");
        dateCell.textContent = transaction.date;
        row.appendChild(dateCell);

        // Description
        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = transaction.description;
        row.appendChild(descriptionCell);

        // Type
        const typeCell = document.createElement("td");
        typeCell.textContent =
            transaction.type === "income" ? "Income" : "Expense";

        typeCell.style.color =
            transaction.type === "income" ? "#16a34a" : "#ef4444";

        row.appendChild(typeCell);

        // Category
        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category;
        row.appendChild(categoryCell);

        // Amount
        const amountCell = document.createElement("td");

        const signedAmount =
            transaction.type === "income"
                ? transaction.amount
                : -transaction.amount;

        amountCell.textContent =
            (signedAmount > 0 ? "+" : "-") +
            " " +
            formatCurrency(Math.abs(signedAmount));

        amountCell.style.color =
            transaction.type === "income" ? "#16a34a" : "#ef4444";

        row.appendChild(amountCell);

        // Action button
        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "btn btn-secondary";
        deleteButton.style.color = "#dc2626";

        deleteButton.addEventListener("click", function () {
            deleteTransaction(transaction.id);
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        transactionTable.appendChild(row);
    });
}

// Delete a transaction
function deleteTransaction(id) {
    const transaction = transactions.find(item => item.id === id);

    if (!transaction) {
        return;
    }

    const confirmed = confirm(
        `Delete "${transaction.description}"?`
    );

    if (!confirmed) {
        return;
    }

    const previousTransactions = transactions;

    transactions = transactions.filter(item => item.id !== id);

    if (!saveTransactions()) {
        transactions = previousTransactions;
        return;
    }

    updateDashboard();
}

// Update the complete dashboard
function updateDashboard() {
    updateSummary();
    displayTransactions();
}

// Filter transactions
filterType.addEventListener("change", function () {
    displayTransactions();
});

// Clear form
transactionForm.addEventListener("reset", function () {
    setTimeout(function () {
        dateInput.value = getLocalDate();
    }, 0);
});

// Initial display when the page loads
updateDashboard();