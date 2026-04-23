// filters/filter3-botguard.js
// =============================================
// FILTER 3: BOTGUARD
// Server-side validation of client-side signals
// Validates: PoW tokens, fingerprint data,
// behavioral scores, honeypot traps
// =============================================

const crypto = require("crypto");

// Store for client-side detection reports
const clientReports = new Map();
const REPORT_TTL = 10 * 60 * 1000; // 10 minutes

// Track request patterns per IP
const requestTracker = new Map();

// ─────────────────────────────────────────────
// Proof-of-Work Verification
// ─────────────────────────────────────────────
function verifyProofOfWork(token) {
if (!token || typeof token !== "string") return false;
try {
const lastColon = token.lastIndexOf(":");
if (lastColon === -1) return false;
const challenge = token.substring(0, lastColon);
const nonce = token.substring(lastColon + 1);

// Verify the hash has required leading zeros
const hash = crypto
.createHash("sha256")
.update(challenge + ":" + nonce)
.digest("hex");

if (!hash.startsWith("0000")) return false;

// Verify the challenge timestamp is recent (within 5 minutes)
const parts = challenge.split(".");
if (parts.length > 0) {
const timestamp = parseInt(parts[0], 36);
const age = Date.now() - timestamp;
if (age > 5 * 60 * 1000 || age < 0) return false;
}

return true;
} catch {
return false;
}
}

// ─────────────────────────────────────────────
// Request Pattern Analysis
// ─────────────────────────────────────────────
function analyzeRequestPattern(ip) {
const now = Date.now();
const windowMs = 60 * 1000; // 1 minute window

if (!requestTracker.has(ip)) {
requestTracker.set(ip, []);
}

const timestamps = requestTracker.get(ip);
timestamps.push(now);

// Remove old entries
while (timestamps.length > 0 && now - timestamps[0] > windowMs) {
timestamps.shift();
}

const count = timestamps.length;

// Check for suspicious patterns
const result = { suspicious: false, reason: "" };

// Too many requests in 1 minute
if (count > 60) {
result.suspicious = true;
result.reason = `High request rate: ${count} requests/minute`;
return result;
}

// Check for perfectly timed requests (bot behavior)
if (count >= 5) {
const intervals = [];
for (let i = 1; i < timestamps.length; i++) {
intervals.push(timestamps[i] - timestamps[i - 1]);
}
const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
const variance =
intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) /
intervals.length;
const stdDev = Math.sqrt(variance);

// Very low variance = perfectly timed = bot
if (stdDev < 50 && count > 10) {
result.suspicious = true;
result.reason = `Machine-like request timing (stdDev: ${stdDev.toFixed(1)}ms)`;
}
}

return result;
}

// ─────────────────────────────────────────────
// Store client-side detection report
// ─────────────────────────────────────────────
function storeClientReport(ip, report) {
clientReports.set(ip, {
data: report,
timestamp: Date.now(),
});

// Auto-expire
setTimeout(() => clientReports.delete(ip), REPORT_TTL);
}

// ─────────────────────────────────────────────
// MAIN FILTER FUNCTION
// ─────────────────────────────────────────────
function filter3_BotGuard(req) {
const ip = req.ip || req.connection.remoteAddress || "";
const cleanIP = ip.replace(/^::ffff:/, "");

const result = {
filterName: "FILTER_3_BOTGUARD",
passed: true,
reason: null,
details: { ip: cleanIP },
};

// ── CHECK 3A: Proof-of-Work token (for API routes) ──
if (req.path.startsWith("/api/") && req.path !== "/api/bot-report") {
const powToken = req.headers["x-pow-token"];
if (!verifyProofOfWork(powToken)) {
result.passed = false;
result.reason = "Invalid or missing Proof-of-Work token";
result.details.powToken = powToken ? "(invalid)" : "(missing)";
return result;
}
}

// ── CHECK 3B: Client-side bot report ──
if (clientReports.has(cleanIP)) {
const report = clientReports.get(cleanIP).data;
if (report && report.isBot === true) {
result.passed = false;
result.reason = `Client-side detection: ${report.reason || "bot detected"}`;
result.details.clientReport = report;
return result;
}
}

// ── CHECK 3C: Request pattern analysis ──
const patternResult = analyzeRequestPattern(cleanIP);
if (patternResult.suspicious) {
result.passed = false;
result.reason = patternResult.reason;
return result;
}

// ── CHECK 3D: Honeypot trap check ──
if (req.path === "/trap-endpoint-do-not-follow" ||
req.path === "/admin-login" ||
req.path === "/wp-admin" ||
req.path === "/xmlrpc.php" ||
req.path === "/.env" ||
req.path === "/config.php") {
result.passed = false;
result.reason = `Honeypot/trap URL accessed: ${req.path}`;
return result;
}

// ── CHECK 3E: Honeypot form fields ──
if (req.method === "POST" && req.body) {
const honeypotFields = [
"website_url_hp", "fax_number_hp", "middle_name_hp",
"phone2_hp", "address2_hp", "company_hp"
];
for (const field of honeypotFields) {
if (req.body[field] && req.body[field].trim() !== "") {
result.passed = false;
result.reason = `Honeypot form field filled: ${field}`;
return result;
}
}
}

// ── CHECK 3F: TLS fingerprint check (if available via proxy header) ──
const ja3 = req.headers["x-ja3-hash"] || "";
const knownBotJA3 = [
"e7d705a3286e19ea42f587b344ee6865", // Python requests
"b32309a26951912be7dba376398abc3b", // Go default
"3b5074b1b5d032e5620f69f9f700ff0e", // Node.js default
];
if (ja3 && knownBotJA3.includes(ja3)) {
result.passed = false;
result.reason = `Known bot TLS fingerprint (JA3): ${ja3}`;
return result;
}

return result;
}

// Export both the filter and the report storage function
module.exports = filter3_BotGuard;
module.exports.storeClientReport = storeClientReport;
