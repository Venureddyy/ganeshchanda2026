// ---- Admin passcode -------------------------------------------------
// Change this to your own passcode before publishing the site.
// This only hides the "Add donation" controls in the browser — see
// README.md for how the matching Firestore rule keeps it enforced
// on the server side too.
const ADMIN_PASSCODE = "ganpati2026";

// ---- Firebase setup ---------------------------------------------------
const db = firebase.initializeApp(firebaseConfig) && firebase.firestore();
const donationsRef = db.collection("donations");
const expensesRef = db.collection("expenses");

const fmt = (n) => "£" + Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---- State --------------------------------------------------------
let isAdmin = sessionStorage.getItem("chanda_admin") === "true";
let donationTotal = 0;
let expenseTotal = 0;

// ---- Elements -----------------------------------------------------
const el = (id) => document.getElementById(id);
const donationList = el("donationList");
const expenseList = el("expenseList");
const adminBtn = el("adminBtn");
const adminModal = el("adminModal");
const adminHint = el("adminHint");
const donationForm = el("donationForm");
const expenseForm = el("expenseForm");

function applyAdminUI() {
  adminBtn.classList.toggle("active", isAdmin);
  adminBtn.textContent = isAdmin ? "Admin ✓" : "Admin";
  donationForm.classList.toggle("hidden", !isAdmin);
  adminHint.classList.toggle("hidden", !isAdmin);
  renderDonations(lastDonations);
}

// ---- Admin unlock flow ---------------------------------------------
adminBtn.addEventListener("click", () => {
  if (isAdmin) {
    isAdmin = false;
    sessionStorage.removeItem("chanda_admin");
    applyAdminUI();
  } else {
    el("adminPassword").value = "";
    el("adminError").classList.add("hidden");
    adminModal.classList.remove("hidden");
    el("adminPassword").focus();
  }
});

el("adminCancel").addEventListener("click", () => adminModal.classList.add("hidden"));

function trySubmitAdmin() {
  if (el("adminPassword").value === ADMIN_PASSCODE) {
    isAdmin = true;
    sessionStorage.setItem("chanda_admin", "true");
    adminModal.classList.add("hidden");
    applyAdminUI();
  } else {
    el("adminError").classList.remove("hidden");
  }
}
el("adminSubmit").addEventListener("click", trySubmitAdmin);
el("adminPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") trySubmitAdmin();
});
adminModal.addEventListener("click", (e) => {
  if (e.target === adminModal) adminModal.classList.add("hidden");
});

// ---- Rendering ------------------------------------------------------
let lastDonations = [];

function renderDonations(docs) {
  lastDonations = docs;
  if (!docs.length) {
    donationList.innerHTML = '<li class="empty-state">No donations recorded yet. Be the first!</li>';
    return;
  }
  donationList.innerHTML = docs.map((d) => `
    <li>
      <span class="entry-name">${escapeHtml(d.name)}</span>
      <span class="entry-meta">
        <span class="entry-amount">${fmt(d.amount)}</span>
      </span>
    </li>
  `).join("");
}

function renderExpenses(docs) {
  if (!docs.length) {
    expenseList.innerHTML = '<li class="empty-state">No expenses logged yet.</li>';
    return;
  }
  expenseList.innerHTML = docs.map((d) => `
    <li>
      <span class="entry-name">${escapeHtml(d.description)}</span>
      <span class="entry-meta">
        <span class="entry-amount">${fmt(d.amount)}</span>
        ${isAdmin ? `<button class="entry-delete" title="Remove" data-id="${d.id}" data-type="expense">✕</button>` : ""}
      </span>
    </li>
  `).join("");
}

function updateTotals() {
  el("totalFunds").textContent = fmt(donationTotal);
  el("bTotal").textContent = fmt(donationTotal);
  el("bSpent").textContent = fmt(expenseTotal);
  const remaining = donationTotal - expenseTotal;
  el("bRemaining").textContent = fmt(remaining);
  el("balanceBanner").classList.toggle("negative", remaining < 0);
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ---- Live listeners ---------------------------------------------------
donationsRef.orderBy("createdAt", "desc").onSnapshot((snap) => {
  const docs = [];
  let total = 0;
  snap.forEach((doc) => {
    const data = doc.data();
    docs.push({ id: doc.id, name: data.name, amount: data.amount });
    total += Number(data.amount || 0);
  });
  donationTotal = total;
  el("donorCount").textContent = docs.length;
  renderDonations(docs);
  updateTotals();
}, (err) => console.error("donations listener:", err));

expensesRef.orderBy("createdAt", "desc").onSnapshot((snap) => {
  const docs = [];
  let total = 0;
  snap.forEach((doc) => {
    const data = doc.data();
    docs.push({ id: doc.id, description: data.description, amount: data.amount });
    total += Number(data.amount || 0);
  });
  expenseTotal = total;
  renderExpenses(docs);
  updateTotals();
}, (err) => console.error("expenses listener:", err));

// ---- Forms ------------------------------------------------------------
donationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = el("donorName").value.trim();
  const amount = Number(el("donorAmount").value);
  if (!name || !amount || amount <= 0) return;
  donationsRef.add({
    name,
    amount,
    adminKey: ADMIN_PASSCODE,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => donationForm.reset());
});

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const description = el("expenseDesc").value.trim();
  const amount = Number(el("expenseAmount").value);
  if (!description || !amount || amount <= 0) return;
  expensesRef.add({
    description,
    amount,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => expenseForm.reset());
});

// ---- Delete (admin only, both lists) -----------------------------------
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".entry-delete");
  if (!btn || !isAdmin) return;
  const { id, type } = btn.dataset;
  const ref = type === "donation" ? donationsRef.doc(id) : expensesRef.doc(id);
  ref.delete().catch((err) => console.error("delete failed:", err));
});

applyAdminUI();
