// Personal Expense Tracker: all data stays in this browser's LocalStorage.
const STORAGE_KEY = "expenses";
const CATEGORIES = ["Food", "Travel", "Shopping", "Entertainment", "Education", "Bills", "Other"];

let expenses = [];
let toastTimer;

const expenseForm = document.querySelector("#expense-form");
const editForm = document.querySelector("#edit-form");
const editDialog = document.querySelector("#edit-dialog");
const searchInput = document.querySelector("#search-input");
const categoryFilter = document.querySelector("#category-filter");
const tableBody = document.querySelector("#expense-table-body");
const emptyState = document.querySelector("#empty-state");
const categorySummary = document.querySelector("#category-summary");
const toast = document.querySelector("#toast");

// Read and validate saved data so damaged or unexpected values cannot break rendering.
function loadExpenses() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return [];

    const parsedData = JSON.parse(savedData);
    if (!Array.isArray(parsedData)) return [];

    return parsedData.filter((expense) => {
      return expense && typeof expense.id === "string" &&
        typeof expense.name === "string" && expense.name.trim() !== "" &&
        Number.isFinite(Number(expense.amount)) && Number(expense.amount) > 0 &&
        CATEGORIES.includes(expense.category) && isValidDate(expense.date);
    }).map((expense) => ({
      id: expense.id,
      name: expense.name.trim(),
      amount: Number(expense.amount),
      category: expense.category,
      date: expense.date
    }));
  } catch (error) {
    console.error("Could not load expenses from LocalStorage:", error);
    showToast("Saved data could not be read. Starting with an empty list.", true);
    return [];
  }
}

function saveExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    return true;
  } catch (error) {
    console.error("Could not save expenses to LocalStorage:", error);
    showToast("Changes are visible, but could not be saved in this browser.", true);
    return false;
  }
}

function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function makeExpenseId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  let id;
  do {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  } while (expenses.some((expense) => expense.id === id));
  return id;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateValue) {
  if (!isValidDate(dateValue)) return dateValue;
  const [year, month, day] = dateValue.split("-");
  return `${day}-${month}-${year}`;
}

function getLocalDateString() {
  const now = new Date();
  const localOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - localOffset).toISOString().slice(0, 10);
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("toast-error", isError);
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function readExpenseFields(form, prefix = "") {
  const name = form.elements[`${prefix}name`].value.trim();
  const rawAmount = form.elements[`${prefix}amount`].value.trim();
  const category = form.elements[`${prefix}category`].value;
  const date = form.elements[`${prefix}date`].value;
  const amount = Number(rawAmount);

  if (!name) return { error: "Enter an expense name." };
  if (!rawAmount || !Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount greater than zero." };
  if (!CATEGORIES.includes(category)) return { error: "Choose a category from the list." };
  if (!isValidDate(date)) return { error: "Choose a valid date." };
  return { expense: { name, amount, category, date } };
}

// Add a new expense, persist it, and refresh all visible totals.
function addExpense(event) {
  event.preventDefault();
  const result = readExpenseFields(expenseForm);
  const errorMessage = document.querySelector("#form-error");
  errorMessage.textContent = result.error || "";
  if (result.error) return;

  expenses.unshift({ id: makeExpenseId(), ...result.expense });
  saveExpenses();
  clearForm();
  renderApp();
  showToast("Expense added successfully!");
}

function clearForm() {
  expenseForm.reset();
  expenseForm.elements.date.value = getLocalDateString();
  document.querySelector("#form-error").textContent = "";
}

function calculateTotal() {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

function calculateCategorySummary() {
  return expenses.reduce((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    return totals;
  }, {});
}

function updateDashboard() {
  document.querySelector("#total-spending").textContent = formatCurrency(calculateTotal());
  document.querySelector("#total-expenses").textContent = String(expenses.length);
  document.querySelector("#total-categories").textContent = String(new Set(expenses.map((expense) => expense.category)).size);
  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  }).format(new Date());
}

function displayCategorySummary() {
  const totals = calculateCategorySummary();
  categorySummary.replaceChildren();
  const categories = Object.entries(totals).sort((first, second) => second[1] - first[1]);

  if (categories.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-category";
    emptyMessage.textContent = "Your category totals will appear here.";
    categorySummary.append(emptyMessage);
    return;
  }

  categories.forEach(([category, amount]) => {
    const row = document.createElement("div");
    row.className = "category-row";
    const name = document.createElement("span");
    name.className = "category-name";
    const dot = document.createElement("span");
    dot.className = "category-dot";
    dot.setAttribute("aria-hidden", "true");
    name.append(dot, document.createTextNode(category));
    const value = document.createElement("span");
    value.className = "category-amount";
    value.textContent = formatCurrency(amount);
    row.append(name, value);
    categorySummary.append(row);
  });
}

// Search and category filtering work together on the same expense list.
function searchExpenses(expenseList, searchTerm) {
  const query = searchTerm.trim().toLocaleLowerCase();
  if (!query) return expenseList;
  return expenseList.filter((expense) => {
    return expense.name.toLocaleLowerCase().includes(query) ||
      expense.category.toLocaleLowerCase().includes(query);
  });
}

function filterExpenses(expenseList, selectedCategory) {
  if (!selectedCategory) return expenseList;
  return expenseList.filter((expense) => expense.category === selectedCategory);
}

function getVisibleExpenses() {
  const searchedExpenses = searchExpenses(expenses, searchInput.value);
  return filterExpenses(searchedExpenses, categoryFilter.value);
}

function createTableCell(className, text) {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = text;
  return cell;
}

function displayExpenses() {
  const visibleExpenses = getVisibleExpenses();
  tableBody.replaceChildren();
  emptyState.classList.toggle("is-visible", visibleExpenses.length === 0);
  document.querySelector("#visible-count").textContent = `${visibleExpenses.length} ${visibleExpenses.length === 1 ? "item" : "items"}`;

  visibleExpenses.forEach((expense) => {
    const row = document.createElement("tr");
    row.append(createTableCell("id-cell", expense.id.slice(0, 8).toUpperCase()));
    row.append(createTableCell("name-cell", expense.name));
    row.append(createTableCell("amount-cell", formatCurrency(expense.amount)));

    const categoryCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "category-badge";
    badge.textContent = expense.category;
    categoryCell.append(badge);
    row.append(categoryCell);
    row.append(createTableCell("", formatDate(expense.date)));

    const actions = document.createElement("td");
    actions.className = "action-cell";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "row-action";
    editButton.dataset.action = "edit";
    editButton.dataset.id = expense.id;
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${expense.name}`);
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "row-action delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = expense.id;
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${expense.name}`);
    actions.append(editButton, deleteButton);
    row.append(actions);
    tableBody.append(row);
  });
}

function updateDashboardAndLists() {
  updateDashboard();
  displayCategorySummary();
  displayExpenses();
}

function renderApp() {
  updateDashboardAndLists();
}

// Fill and open the edit dialog for the selected item.
function editExpense(id) {
  const expense = expenses.find((item) => item.id === id);
  if (!expense) return;
  editForm.elements.id.value = expense.id;
  editForm.elements.name.value = expense.name;
  editForm.elements.amount.value = String(expense.amount);
  editForm.elements.category.value = expense.category;
  editForm.elements.date.value = expense.date;
  document.querySelector("#edit-error").textContent = "";
  editDialog.showModal();
  editForm.elements.name.focus();
}

function saveEditedExpense(event) {
  event.preventDefault();
  const result = readExpenseFields(editForm);
  const errorMessage = document.querySelector("#edit-error");
  errorMessage.textContent = result.error || "";
  if (result.error) return;

  const id = editForm.elements.id.value;
  const expenseIndex = expenses.findIndex((expense) => expense.id === id);
  if (expenseIndex === -1) {
    errorMessage.textContent = "This expense is no longer available.";
    return;
  }

  expenses[expenseIndex] = { id, ...result.expense };
  saveExpenses();
  editDialog.close();
  renderApp();
  showToast("Expense updated successfully!");
}

function deleteExpense(id) {
  const expense = expenses.find((item) => item.id === id);
  if (!expense || !window.confirm("Are you sure you want to delete this expense?")) return;
  expenses = expenses.filter((item) => item.id !== id);
  saveExpenses();
  renderApp();
  showToast("Expense deleted successfully!");
}

// Connect browser events and paint the initial page.
expenseForm.addEventListener("submit", addExpense);
editForm.addEventListener("submit", saveEditedExpense);
searchInput.addEventListener("input", displayExpenses);
categoryFilter.addEventListener("change", displayExpenses);
tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") editExpense(button.dataset.id);
  if (button.dataset.action === "delete") deleteExpense(button.dataset.id);
});
document.querySelector("#cancel-edit").addEventListener("click", () => editDialog.close());
document.querySelector("#close-dialog").addEventListener("click", () => editDialog.close());
editDialog.addEventListener("click", (event) => {
  if (event.target === editDialog) editDialog.close();
});

expenses = loadExpenses();
expenseForm.elements.date.value = getLocalDateString();
renderApp();
