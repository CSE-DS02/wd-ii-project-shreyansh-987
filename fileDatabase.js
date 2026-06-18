const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');
let users = [];
let projects = [];

async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    users = db.users || [];
    projects = db.projects || [];
    console.log('Database loaded from file');
  } catch (error) {
    console.log('Creating new database file');
    await saveDatabase();
  }
}

async function saveDatabase() {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify({ users, projects }, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

module.exports = {
  users,
  projects,
  loadDatabase,
  saveDatabase
};