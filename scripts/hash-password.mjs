import crypto from "node:crypto";

const password = process.argv.slice(2).join(" ");
if (!password || password.length < 12) {
  console.error("Usage: npm run admin:hash -- \"a-strong-password-at-least-12-chars\"");
  process.exit(1);
}
const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(password, salt, 64).toString("hex");
console.log(`${salt}:${hash}`);
