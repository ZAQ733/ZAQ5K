const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;   // Render-д тохируулсан
const USERS_FILE = path.join(__dirname, 'users.json');

// JSON body унших
app.use(express.json());

// HTML public folder дотор байх ёстой
app.use(express.static(path.join(__dirname, "public")));


// =========================
// HELPER FUNCTIONS
// =========================
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  const raw = fs.readFileSync(USERS_FILE, 'utf8');
  try {
    const data = JSON.parse(raw);
    return data || {};
  } catch (e) {
    console.error("users.json parsing error:", e);
    return {};
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}


// =========================
// SIGN UP
// =========================
app.post('/addUser', (req, res) => {
  const { name, email, pass } = req.body;
  if (!name || !email || !pass)
    return res.status(400).send("Мэдээлэл дутуу байна");

  const users = readUsers();

  if (users[email])
    return res.status(400).send("Энэ email аль хэдийн бүртгэлтэй");

  const nameExists = Object.values(users).some(
    u => u && u.name && u.name.toLowerCase() === name.toLowerCase()
  );
  if (nameExists) return res.status(400).send("Энэ нэр аль хэдийн байна");

  users[email] = {
    name,
    pass,
    wallet: 0,
    loan: null
  };

  writeUsers(users);
  res.send("Амжилттай бүртгэгдлээ");
});


// =========================
// LOGIN
// =========================
app.post('/login', (req, res) => {
  const { email, pass } = req.body;
  const users = readUsers();

  if (users[email] && users[email].pass === pass) {
    res.json({
      success: true,
      email,
      name: users[email].name,
      wallet: users[email].wallet,
      loan: users[email].loan || null
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Email эсвэл password буруу"
    });
  }
});


// =========================
// GET ALL USERS
// =========================
app.get('/users', (req, res) => {
  res.json(readUsers());
});


// =========================
// UPDATE USER
// =========================
app.post('/updateUser', (req, res) => {
  const { email, name, pass, wallet, loan } = req.body;
  const users = readUsers();

  if (!users[email]) return res.status(400).send("User олдсонгүй");

  users[email] = {
    ...users[email],
    name,
    pass,
    wallet: Number(wallet) || 0,
    loan: loan ?? users[email].loan
  };

  writeUsers(users);
  res.send("UPDATED");
});


// =========================
// DELETE USER
// =========================
app.post('/deleteUser', (req, res) => {
  const { email } = req.body;
  const users = readUsers();

  if (!users[email]) return res.status(400).send("User олдсонгүй");

  delete users[email];
  writeUsers(users);
  res.send("DELETED");
});


// =========================
// TRANSFER
// =========================
app.post('/transfer', (req, res) => {
  const { fromEmail, toName, amount } = req.body;
  const users = readUsers();
  const money = Number(amount);

  if (!fromEmail || !toName || money <= 0)
    return res.status(400).send("Мэдээлэл дутуу байна");

  const fromUser = users[fromEmail];
  if (!fromUser)
    return res.status(400).send("Илгээж буй хэрэглэгч олдсонгүй");

  const toUserEntry = Object.entries(users).find(
    ([, u]) => u && u.name.toLowerCase() === toName.toLowerCase()
  );

  if (!toUserEntry)
    return res.status(400).send("Хүлээн авагч олдсонгүй");

  const [, toUser] = toUserEntry;

  if (fromUser.wallet < money)
    return res.status(400).send("Wallet хүрэлцэхгүй");

  fromUser.wallet -= money;
  toUser.wallet += money;

  writeUsers(users);
  res.send("OK");
});


// =========================
// LOAN
// =========================
app.post('/loan', (req, res) => {
  const { email, amount } = req.body;
  const users = readUsers();
  const loanAmount = Number(amount);
  const now = Date.now();

  const allowed = [5000, 10000, 20000, 50000, 500000, 1000000, 5000000];
  if (!allowed.includes(loanAmount))
    return res.status(400).send("Зээлийн дүн буруу");

  const user = users[email];
  if (!user) return res.status(400).send("User олдсонгүй");

  if (user.loan && now - user.loan.takenAt < 3600000)
    return res.status(400).send("Та 1 цагийн дараа дахин зээл авч болно");

  user.wallet += loanAmount;
  user.loan = { amount: loanAmount, takenAt: now };

  writeUsers(users);
  res.json({ success: true, wallet: user.wallet, loan: user.loan });
});


// =========================
// REPAY LOAN
// =========================
app.post('/repay-loan', (req, res) => {
  const { email } = req.body;
  const users = readUsers();
  const user = users[email];

  if (!user) return res.status(400).send("User олдсонгүй");
  if (!user.loan) return res.status(400).send("Зээл байхгүй байна");
  if (user.wallet < user.loan.amount)
    return res.status(400).send("Wallet хүрэлцэхгүй");

  user.wallet -= user.loan.amount;
  user.loan = null;

  writeUsers(users);
  res.json({ success: true, wallet: user.wallet, loan: null });
});


// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log("ZAQ Pay");
  console.log("Server running on port " + PORT);
});