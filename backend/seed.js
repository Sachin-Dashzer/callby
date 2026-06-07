require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const CallLog = require('./models/CallLog');
const Lead = require('./models/Lead');

process.env.MONGO_URI = 'mongodb://clinicryanofficial_db_user:dashzer1503@ac-snwnffv-shard-00-00.b0wrbjy.mongodb.net:27017,ac-snwnffv-shard-00-01.b0wrbjy.mongodb.net:27017,ac-snwnffv-shard-00-02.b0wrbjy.mongodb.net:27017/?ssl=true&replicaSet=atlas-4x5es1-shard-0&authSource=admin&appName=Cluster0';


const CALL_TYPES = ['incoming', 'outgoing', 'missed', 'rejected'];
const CONTACT_NAMES = ['Raj Kumar', 'Priya Singh', 'Amit Sharma', 'Neha Patel', 'Vikram Joshi', 'Anita Verma', 'Suresh Reddy', 'Kavita Nair', 'Ravi Gupta', 'Sunita Rao'];
const LEAD_SOURCES = ['website', 'referral', 'cold_call', 'social_media', 'email_campaign'];
const LEAD_STATUSES = ['new', 'contacted', 'interested', 'not_interested', 'converted', 'lost'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return `+91${randomInt(7000000000, 9999999999)}`;
}

function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysBack));
  d.setHours(randomInt(8, 20), randomInt(0, 59), 0, 0);
  return d;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // clear existing data
  await Promise.all([User.deleteMany({}), CallLog.deleteMany({}), Lead.deleteMany({})]);
  console.log('Cleared existing data');

  // create manager
  const managerPassword = await bcrypt.hash('password123', 10);
  const manager = await User.create({
    name: 'Admin Manager',
    email: 'manager@calltrack.com',
    password: managerPassword,
    role: 'manager',
    phone: randomPhone(),
    isActive: true
  });
  console.log('Manager created:', manager.email);

  // create 5 employees
  const employees = [];
  for (let i = 1; i <= 5; i++) {
    const empPassword = await bcrypt.hash('password123', 10);
    const emp = await User.create({
      name: `Employee ${i}`,
      email: `employee${i}@calltrack.com`,
      password: empPassword,
      role: 'employee',
      phone: randomPhone(),
      deviceId: `device_${i}_${Date.now()}`,
      isActive: true
    });
    employees.push(emp);
    console.log(`Employee ${i} created:`, emp.email);
  }

  // create 100 call logs
  const callLogs = [];
  for (let i = 0; i < 100; i++) {
    const emp = randomItem(employees);
    const callType = randomItem(CALL_TYPES);
    callLogs.push({
      employeeId: emp._id,
      employeeName: emp.name,
      employeePhone: emp.phone,
      callType,
      contactNumber: randomPhone(),
      contactName: randomItem(CONTACT_NAMES),
      duration: callType === 'missed' || callType === 'rejected' ? 0 : randomInt(10, 1800),
      timestamp: randomDate(30),
      deviceId: emp.deviceId,
      synced: true
    });
  }
  await CallLog.insertMany(callLogs);
  console.log('100 call logs created');

  // create 10 sample leads
  const leads = [];
  for (let i = 0; i < 10; i++) {
    const assignedEmp = randomItem(employees);
    leads.push({
      name: randomItem(CONTACT_NAMES),
      phone: randomPhone(),
      email: `lead${i + 1}@example.com`,
      source: randomItem(LEAD_SOURCES),
      status: randomItem(LEAD_STATUSES),
      assignedTo: assignedEmp._id,
      notes: [
        { text: 'Initial contact made', addedBy: manager._id, addedAt: new Date() }
      ],
      lastCallAt: randomDate(7),
      followUpDate: randomDate(-7)
    });
  }
  await Lead.insertMany(leads);
  console.log('10 leads created');

  console.log('\n=== Seed complete ===');
  console.log('Manager:   manager@calltrack.com / password123');
  console.log('Employees: employee1@calltrack.com to employee5@calltrack.com / password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
