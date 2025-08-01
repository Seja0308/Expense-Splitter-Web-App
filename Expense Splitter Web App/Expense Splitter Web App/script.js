let participants = [];
let expenses = [];
let balances = {};
let selectedCurrency = "₹";
let expenseChartInstance = null;
let categoryChartInstance = null;

// ➤ Add Participant
function addParticipant() {
    const name = document.getElementById("participantName").value.trim();
    if (!name) {
        alert("Please enter a name");
        return;
    }
    if (participants.includes(name)) {
        alert("Participant already added");
        return;
    }
    participants.push(name);
    document.getElementById("participantName").value = "";
    updateParticipantList();
    updatePayerDropdown();
}

// ➤ Update Participants list
function updateParticipantList() {
    const list = document.getElementById("participantList");
    list.innerHTML = "";
    participants.forEach(p => {
        const li = document.createElement("li");
        li.textContent = p;
        list.appendChild(li);
    });
}

// ➤ Update Dropdown
function updatePayerDropdown() {
    const select = document.getElementById("payerSelect");
    select.innerHTML = "";
    participants.forEach(p => {
        const option = document.createElement("option");
        option.value = p;
        option.textContent = p;
        select.appendChild(option);
    });
}

// ➤ Currency Change
document.getElementById("currencySelect").addEventListener("change", function () {
    selectedCurrency = this.value;
    calculateBalances();
});

// ➤ Add Expense
function addExpense() {
    const payer = document.getElementById("payerSelect").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const description = document.getElementById("description").value;
    const category = document.getElementById("categorySelect").value;

    if (!payer || isNaN(amount) || !description || !category) {
        alert("Please fill all fields correctly");
        return;
    }

    expenses.push({ payer, amount, description, category });
    displayExpenses();
    calculateBalances();
    updateChart();
    updateCategoryChart();

    document.getElementById("amount").value = "";
    document.getElementById("description").selectedIndex = 0;
    document.getElementById("categorySelect").selectedIndex = 0;
}

// ➤ Display Expenses
function displayExpenses() {
    const list = document.getElementById("expenseList");
    list.innerHTML = "";
    expenses.forEach(exp => {
        const li = document.createElement("li");
        li.innerHTML = `${exp.payer} paid ${selectedCurrency}${exp.amount} for ${exp.description} 
        <span class="tag ${exp.category.toLowerCase()}">${exp.category}</span>`;
        list.appendChild(li);
    });
}

// ➤ Calculate Balances
function calculateBalances() {
    balances = {};
    participants.forEach(p => balances[p] = 0);

    expenses.forEach(exp => {
        balances[exp.payer] += exp.amount;
    });

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const share = participants.length ? totalAmount / participants.length : 0;

    document.getElementById("totalSpent").textContent = `Total Spent: ${selectedCurrency}${totalAmount.toFixed(2)}`;
    document.getElementById("perPersonShare").textContent = `Per Person Share: ${selectedCurrency}${share.toFixed(2)}`;

    const balanceDiv = document.getElementById("balances");
    balanceDiv.innerHTML = "";

    participants.forEach(p => {
        const diff = balances[p] - share;
        const pElement = document.createElement("p");
        pElement.textContent = diff >= 0
            ? `${p} should receive ${selectedCurrency}${diff.toFixed(2)}`
            : `${p} should pay ${selectedCurrency}${Math.abs(diff).toFixed(2)}`;
        balanceDiv.appendChild(pElement);
    });

    updateSettlement(share);
}

// ➤ Settlement Logic
function updateSettlement(share) {
    const settlementDiv = document.getElementById("settlement");
    settlementDiv.innerHTML = "";

    let payers = [];
    let receivers = [];

    participants.forEach(p => {
        const diff = balances[p] - share;
        if (diff < 0) payers.push({ name: p, amount: Math.abs(diff) });
        if (diff > 0) receivers.push({ name: p, amount: diff });
    });

    payers.forEach(payer => {
        receivers.forEach(receiver => {
            if (payer.amount > 0 && receiver.amount > 0) {
                let payment = Math.min(payer.amount, receiver.amount);
                const pElement = document.createElement("p");
                pElement.textContent = `${payer.name} ➡ ${receiver.name} : ${selectedCurrency}${payment.toFixed(2)}`;
                settlementDiv.appendChild(pElement);
                payer.amount -= payment;
                receiver.amount -= payment;
            }
        });
    });

    if (settlementDiv.innerHTML === "") {
        settlementDiv.textContent = "All expenses are already settled!";
    }
}

// ➤ Expense Chart
// ➤ Expense Chart
function updateChart() {
    if (!participants.length || !expenses.length) return;
    const ctx = document.getElementById("expenseChart").getContext("2d");
    const data = participants.map(p => balances[p] || 0);

    // Define multiple colors
    const colors = ["#007bff", "#ff7f50", "#28a745", "#ffc107", "#6f42c1", "#17a2b8"];

    if (expenseChartInstance) expenseChartInstance.destroy();

    expenseChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: participants,
            datasets: [{
                label: "Total Paid",
                data: data,
                backgroundColor: participants.map((_, i) => colors[i % colors.length])
            }]
        },
        options: {
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}


// ➤ Category Chart
function updateCategoryChart() {
    if (!expenses.length) return;
    const ctx = document.getElementById("categoryChart").getContext("2d");
    const categories = {};
    expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ["#ff7f50", "#1e90ff", "#28a745", "#6c757d"]
            }]
        },
        options: { plugins: { legend: { position: "bottom" } } }
    });
}

// ➤ Download PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Expense Report", 10, 10);

    let y = 20;
    expenses.forEach(exp => {
        doc.text(`${exp.payer} paid ${selectedCurrency}${exp.amount} for ${exp.description}`, 10, y);
        y += 10;
    });

    doc.save("Expense_Report.pdf");
}

// ➤ Reset All Data
function resetData() {
    participants = [];
    expenses = [];
    balances = {};
    document.getElementById("participantList").innerHTML = "";
    document.getElementById("payerSelect").innerHTML = "";
    document.getElementById("expenseList").innerHTML = "";
    document.getElementById("balances").innerHTML = "";
    document.getElementById("settlement").innerHTML = "";
    document.getElementById("totalSpent").textContent = "Total Spent: ₹0";
    document.getElementById("perPersonShare").textContent = "Per Person Share: ₹0";
    if (expenseChartInstance) expenseChartInstance.destroy();
    if (categoryChartInstance) categoryChartInstance.destroy();
}

// ➤ Settle Up (✅ FIXED)
function settleUp() {
    alert("Settlement completed! Balances cleared.");
    expenses = [];
    balances = {};
    document.getElementById("expenseList").innerHTML = "";
    document.getElementById("balances").innerHTML = "";
    document.getElementById("settlement").innerHTML = "";
    document.getElementById("totalSpent").textContent = "Total Spent: ₹0";
    document.getElementById("perPersonShare").textContent = "Per Person Share: ₹0";
    if (expenseChartInstance) expenseChartInstance.destroy();
    if (categoryChartInstance) categoryChartInstance.destroy();
}
