/**
 * scripts/create-admin.mjs
 * ────────────────────────
 * One-time script to bootstrap the first admin account.
 *
 * Usage:
 *   node scripts/create-admin.mjs
 *
 * Or with custom credentials:
 *   ADMIN_EMAIL=admin@company.com ADMIN_PASSWORD=MySecret123 node scripts/create-admin.mjs
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sbts.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
const ADMIN_NAME = process.env.ADMIN_NAME || "مسؤول النظام";

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // Check if admin already exists
    const [rows] = await connection.execute(
      "SELECT id, email, role FROM users WHERE email = ? LIMIT 1",
      [ADMIN_EMAIL.toLowerCase().trim()]
    );

    if (rows.length > 0) {
      const existing = rows[0];
      if (existing.role === "admin") {
        console.log(`✅ Admin account already exists: ${ADMIN_EMAIL}`);
      } else {
        // Promote to admin
        await connection.execute(
          "UPDATE users SET role = 'admin', user_status = 'active', updated_at = NOW() WHERE email = ?",
          [ADMIN_EMAIL.toLowerCase().trim()]
        );
        console.log(`✅ Existing user promoted to admin: ${ADMIN_EMAIL}`);
      }
      return;
    }

    // Create new admin account
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const normalizedEmail = ADMIN_EMAIL.toLowerCase().trim();
    const openId = `local_${Buffer.from(normalizedEmail).toString("base64url").slice(0, 40)}`;
    const now = new Date();

    await connection.execute(
      `INSERT INTO users
        (openId, name, email, avatarUrl, loginMethod, role, userStatus,
         department, specialty, employeeNumber, passwordHash,
         createdAt, updatedAt, lastSignedIn)
       VALUES (?, ?, ?, NULL, 'email', 'admin', 'active',
               NULL, NULL, NULL, ?,
               ?, ?, ?)`,
      [openId, ADMIN_NAME, normalizedEmail, passwordHash, now, now, now]
    );

    console.log("✅ Admin account created successfully!");
    console.log("─────────────────────────────────────");
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   Name     : ${ADMIN_NAME}`);
    console.log("─────────────────────────────────────");
    console.log("⚠️  Please change the password after first login!");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("❌ Failed to create admin:", err.message);
  process.exit(1);
});
