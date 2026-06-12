// One-time password reset utility
// Run: node server/db/reset-password.js
import bcrypt from 'bcrypt';
import db from './database.js';

const resetAdminPassword = async () => {
  const newPassword = 'admin123';
  const hash = await bcrypt.hash(newPassword, 10);

  // Check if admin user exists
  const admin = db.prepare("SELECT id, username FROM users WHERE username = 'admin'").get();

  if (admin) {
    db.prepare("UPDATE users SET password_hash = ?, status = 'active' WHERE username = 'admin'").run(hash);
    console.log(`✅ Admin password reset successfully.`);
    console.log(`   Username: admin`);
    console.log(`   Password: ${newPassword}`);
  } else {
    // Create admin if doesn't exist
    db.prepare(`
      INSERT INTO users (name, email, username, password_hash, role, status)
      VALUES ('Administrator', 'admin@example.com', 'admin', ?, 'admin', 'active')
    `).run(hash);
    console.log(`✅ Admin user created.`);
    console.log(`   Username: admin`);
    console.log(`   Password: ${newPassword}`);
  }

  // Also show all users
  const users = db.prepare("SELECT id, username, role, status FROM users").all();
  console.log('\n📋 All users in database:');
  users.forEach(u => console.log(`   [${u.id}] ${u.username} — ${u.role} — ${u.status}`));
};

resetAdminPassword().catch(console.error);
