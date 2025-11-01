import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname, { extensions: ["html", "htm"] }));

// === USERS ===
const USERS_FILE = path.join(__dirname, "users.json");

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// === COMPLAINTS ===
const DATA_FILE = path.join(__dirname, "data.json");
function loadComplaints() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function saveComplaints(complaints) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(complaints, null, 2));
}

// --- Signup ---
app.post("/signup", (req, res) => {
  const { username, password, role, officerCode } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ message: "Missing fields" });

  if (role === "officer" && officerCode !== process.env.OFFICER_SECRET) {
    return res.status(401).json({ message: "Invalid officer code" });
  }

  const users = loadUsers();
  if (users.find((u) => u.username === username && u.role === role)) {
    return res.status(400).json({ message: "User already exists" });
  }

  users.push({ username, password, role });
  saveUsers(users);
  console.log("✅ Registered:", username);
  res.json({ message: "Signup successful" });
});

// --- Login ---
app.post("/login", (req, res) => {
  const { username, password, role, officerCode } = req.body;

  // Officer code check
  if (role === "officer" && officerCode !== process.env.OFFICER_SECRET) {
    return res.status(401).json({ message: "Invalid officer code" });
  }

  const users = loadUsers();
  const found = users.find(
    (u) => u.username === username && u.password === password && u.role === role
  );

  if (!found) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  console.log("✅ Login:", username);
  res.json({ message: "Login successful" });
});

// --- Add Complaint ---
app.post("/complaint", (req, res) => {
  const { name, type, desc } = req.body;
  if (!name || !type || !desc)
    return res.status(400).json({ message: "Please fill all fields." });

  const complaints = loadComplaints();
  const newComplaint = {
    id: complaints.length + 1,
    name,
    type,
    desc,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  complaints.push(newComplaint);
  saveComplaints(complaints);
  console.log("📝 New Complaint:", newComplaint);
  res.json({ message: "✅ Complaint submitted successfully!" });
});

// --- View Complaints ---
app.get("/complaints", (req, res) => {
  res.json(loadComplaints());
});

// --- Mark Complaint as Completed ---
app.put("/complaint/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const complaints = loadComplaints();
  const index = complaints.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ message: "Not found" });
  complaints[index].status = "Completed";
  saveComplaints(complaints);
  res.json({ message: "✅ Complaint marked as completed" });
});

// --- Delete Complaint ---
app.delete("/complaint/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let complaints = loadComplaints();
  complaints = complaints.filter((c) => c.id !== id);
  saveComplaints(complaints);
  res.json({ message: "🗑️ Complaint deleted" });
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 NirmalGrama server running on port ${PORT}`);
  console.log(`🔐 Officer Secret Code: ${process.env.OFFICER_SECRET}`);
  console.log(`🌐 Open: http://localhost:${PORT}/login.html`);
});
