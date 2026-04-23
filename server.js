// server.js
// =============================================
// BOTGUARD SHIELD — 5-LAYER PIPELINE SERVER
// =============================================
// Architecture:
// VISITOR → [F1] → [F2] → [F3] → [F4] → [F5] → WEBSITE
// ↓ ↓ ↓ ↓ ↓
// google google google google google
// =============================================

require("dotenv").config();

const express = require("express");
const path = require("path");
const UAParser = require("ua-parser-js");

// Import filters
const filter1_BrowserAutomation = require("./filters/filter1-browser-automation");
const filter2_HostingProvider = require("./filters/filter2-hosting-provider");
const filter3_BotGuard = require("./filters/filter3-botguard");
const filter4_SearchEngineRobots = require("./filters/filter4-search-engine-robots");
const filter5_HardwareVirtualization = require("./filters/filter5-hardware-virtualization");

const { storeClientReport } = require("./filters/filter3-botguard");
const { storeVMReport } = require("./filters/filter5-hardware-virtualization");

const app = express();
const PORT = process.env.PORT || 3000;
const REDIRECT_URL = process.env.REDIRECT_URL || "https://www.google.com";
const LOG_BLOCKED = process.env.LOG_BLOCKED === "true";
const BYPASS_KEY = process.env.BYPASS_KEY || "";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy (for correct IP behind reverse proxy)
app.set("trust proxy", true);

// =============================================
// BYPASS KEY (for testing/admin access)
// =============================================
app.use((req, res, next) => {
if (BYPASS_KEY && req.headers["x-bypass-key"] === BYPASS_KEY) {
console.log(`🔑 Bypass key accepted for ${req.ip}`);
return next();
}
next();
});

// =============================================
// CLIENT-SIDE REPORT ENDPOINTS
// (These are EXCLUDED from the filter pipeline)
// =============================================
app.post("/api/bot-report", (req, res) => {
const ip = (req.ip || "").replace(/^::ffff:/, "");
storeClientReport(ip, req.body);
console.log(`📡 Client bot report from ${ip}:`, JSON.stringify(req.body));
res.status(204).end();
});

app.post("/api/vm-report", (req, res) => {
const ip = (req.ip || "").replace(/^::ffff:/, "");
storeVMReport(ip, req.body);
console.log(`📡 Client VM report from ${ip}:`, JSON.stringify(req.body));
res.status(204).end();
});

app.post("/api/bot-log", (req, res) => {
const ip = (req.ip || "").replace(/^::ffff:/, "");
console.log(`📡 Client-side block from ${ip}:`, JSON.stringify(req.body));
res.status(204).end();
});

// =============================================
// 🛡️ MAIN FILTER PIPELINE MIDDLEWARE
// =============================================
// Pipeline: F1 → F2 → F3 → F4 → F5
// If ANY filter fails → redirect to google.com
// =============================================
async function botGuardPipeline(req, res, next) {
// Skip report endpoints
const skipPaths = ["/api/bot-report", "/api/vm-report", "/api/bot-log"];
if (skipPaths.includes(req.path)) return next();

// Skip bypass key holders
if (BYPASS_KEY && req.headers["x-bypass-key"] === BYPASS_KEY) return next();

const ip = (req.ip || req.connection.remoteAddress || "").replace(/^::ffff:/, "");
const ua = req.headers["user-agent"] || "";
const startTime = Date.now();

console.log(`\n${"═".repeat(60)}`);
console.log(`🔍 BOTGUARD PIPELINE START`);
console.log(` IP: ${ip}`);
console.log(` UA: ${ua.substring(0, 80)}${ua.length > 80 ? "..." : ""}`);
console.log(` Path: ${req.method} ${req.path}`);
console.log(`${"─".repeat(60)}`);

// ─── FILTER 1: Browser Automation ───
console.log(` [1/5] Browser Automation...`);
const f1 = filter1_BrowserAutomation(req);
if (!f1.passed) {
return blockAndRedirect(res, f1, ip, startTime);
}
console.log(` [1/5] ✅ PASSED`);

// ─── FILTER 2: Hosting Provider ───
console.log(` [2/5] Hosting Provider...`);
const f2 = await filter2_HostingProvider(req);
if (!f2.passed) {
return blockAndRedirect(res, f2, ip, startTime);
}
console.log(` [2/5] ✅ PASSED`);

// ─── FILTER 3: BotGuard ───
console.log(` [3/5] BotGuard...`);
const f3 = filter3_BotGuard(req);
if (!f3.passed) {
return blockAndRedirect(res, f3, ip, startTime);
}
console.log(` [3/5] ✅ PASSED`);

// ─── FILTER 4: Search Engine Robots ───
console.log(` [4/5] Search Engine Robots...`);
const f4 = await filter4_SearchEngineRobots(req);
if (!f4.passed) {
return blockAndRedirect(res, f4, ip, startTime);
}
console.log(` [4/5] ✅ PASSED`);

// ─── FILTER 5: Hardware Virtualization ───
console.log(` [5/5] Hardware Virtualization...`);
const f5 = filter5_HardwareVirtualization(req);
if (!f5.passed) {
return blockAndRedirect(res, f5, ip, startTime);
}
console.log(` [5/5] ✅ PASSED`);

// ─── ALL FILTERS PASSED ───
const elapsed = Date.now() - startTime;
console.log(`${"─".repeat(60)}`);
console.log(` ✅ ALL 5 FILTERS PASSED (${elapsed}ms)`);
console.log(` → Allowing access to: ${req.path}`);
console.log(`${"═".repeat(60)}\n`);

next();
}

// ─────────────────────────────────────────────
// Block and redirect helper
// ─────────────────────────────────────────────
function blockAndRedirect(res, filterResult, ip, startTime) {
const elapsed = Date.now() - startTime;

console.log(` ❌ FAILED — ${filterResult.filterName}`);
console.log(` Reason: ${filterResult.reason}`);
if (filterResult.details && Object.keys(filterResult.details).length > 0) {
console.log(` Details:`, JSON.stringify(filterResult.details));
}
console.log(`${"─".repeat(60)}`);
console.log(` 🚫 BLOCKED & REDIRECTING TO ${REDIRECT_URL} (${elapsed}ms)`);
console.log(`${"═".repeat(60)}\n`);

// Log to file if enabled
if (LOG_BLOCKED) {
const fs = require("fs");
const logEntry = {
timestamp: new Date().toISOString(),
ip,
filter: filterResult.filterName,
reason: filterResult.reason,
details: filterResult.details,
processingTimeMs: elapsed,
};
fs.appendFileSync(
"blocked.log",
JSON.stringify(logEntry) + "\n"
);
}

// Check if AJAX/API request
const isAjax =
req.xhr ||
(req.headers["accept"] || "").includes("application/json") ||
req.path.startsWith("/api/");

if (isAjax) {
return res.status(403).json({
error: "Access denied",
redirect: REDIRECT_URL,
});
}

// Regular page request — redirect
return res.redirect(302, REDIRECT_URL);
}

// Apply pipeline to all routes
app.use(botGuardPipeline);

// =============================================
// STATIC FILES & ROUTES
// =============================================
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Example API route (protected by pipeline)
app.get("/api/data", (req, res) => {
res.json({ message: "You passed all 5 filters!", timestamp: Date.now() });
});

// Honeypot trap (handled by Filter 3)
app.all("/trap-endpoint-do-not-follow", (req, res) => {
res.redirect(302, REDIRECT_URL);
});

// =============================================
// START SERVER
// =============================================
app.listen(PORT, () => {
console.log(`
╔══════════════════════════════════════════════════════╗
║ 🛡️ BOTGUARD SHIELD v1.0 ║
║ 5-Layer Protection Pipeline Active ║
╠══════════════════════════════════════════════════════╣
║ ║
║ Filter 1: Browser Automation Detection ║
║ Filter 2: Hosting Provider / Data Center ║
║ Filter 3: BotGuard (PoW + Behavioral) ║
║ Filter 4: Search Engine Robots ║
║ Filter 5: Hardware Virtualization ║
║ ║
║ Redirect URL: ${REDIRECT_URL.padEnd(36)}║
║ Port: ${String(PORT).padEnd(45)}║
║ Logging: ${String(LOG_BLOCKED).padEnd(42)}║
║ ║
╚══════════════════════════════════════════════════════╝
`);
});
