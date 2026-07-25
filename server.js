const express = require('express');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;

const dbFile = path.join(__dirname, 'private', 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { appointments: [] });

async function initDb() {
  await db.read();
  db.data = db.data || { appointments: [] };
  await db.write();
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/appointments', async (req, res) => {
  const { name, phone, service, date, time, notes } = req.body;
  if (!name || !phone || !service || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  await db.read();
  db.data = db.data || { appointments: [] };

  const appointment = {
    id: nanoid(),
    name,
    phone,
    service,
    date,
    time,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.data.appointments.push(appointment);
  await db.write();

  res.json({ success: true, appointment });
});

app.get('/api/admin/appointments', async (req, res) => {
  const auth = req.headers.authorization;
  const ownerKey = process.env.ADMIN_KEY || 'owner-secret-key';

  if (!auth || auth !== `Bearer ${ownerKey}`) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await db.read();
  res.json({ appointments: db.data.appointments });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

(async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
