// filters/filter2-hosting-provider.js
// =============================================
// FILTER 2: HOSTING PROVIDER / DATA CENTER
// Detects: AWS, GCP, Azure, DigitalOcean,
// Linode, Vultr, OVH, Hetzner,
// Proxies, VPNs, Data Centers
// =============================================

const dns = require("dns").promises;
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// Hosting provider keywords for rDNS lookup
const HOSTING_RDNS_KEYWORDS = [
"amazon", "amazonaws", "aws",
"digitalocean",
"linode", "akamai",
"vultr",
"ovh", "ovhcloud",
"hetzner",
"google-cloud", "googlecloud", "cloud.google",
"azure", "microsoft",
"oracle", "oraclecloud",
"cloudflare",
"heroku",
"rackspace",
"scaleway",
"contabo",
"kamatera",
"hostinger",
"hostgator",
"godaddy",
"bluehost",
"dreamhost",
"ionos",
"leaseweb",
"softlayer",
"choopa", // Vultr parent
"cogent",
"servercentral",
"quadranet",
"psychz",
"colocrossing",
"reliablesite",
"buyvm",
"hostwinds",
"interserver",
];

// IP Reputation API cache
const ipCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// In-memory CIDR ranges (loaded from cloud providers)
let hostingCIDRs = [];
let lastCIDRLoad = 0;
const CIDR_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// ─────────────────────────────────────────────
// Load cloud provider IP ranges
// ─────────────────────────────────────────────
async function loadHostingCIDRs() {
const now = Date.now();
if (now - lastCIDRLoad < CIDR_REFRESH_INTERVAL && hostingCIDRs.length > 0) {
return; // Already loaded recently
}

const newCIDRs = [];
const cacheFile = path.join(__dirname, "..", "data", "hosting-ranges.json");

try {
// AWS
const awsResp = await fetch("https://ip-ranges.amazonaws.com/ip-ranges.json", { timeout: 10000 });
const awsData = await awsResp.json();
awsData.prefixes.forEach((p) => newCIDRs.push(p.ip_prefix));
if (awsData.ipv6_prefixes) {
awsData.ipv6_prefixes.forEach((p) => newCIDRs.push(p.ipv6_prefix));
}
} catch (e) {
console.warn("⚠️ Failed to load AWS IP ranges:", e.message);
}

try {
// GCP
const gcpResp = await fetch("https://www.gstatic.com/ipranges/cloud.json", { timeout: 10000 });
const gcpData = await gcpResp.json();
gcpData.prefixes.forEach((p) => {
if (p.ipv4Prefix) newCIDRs.push(p.ipv4Prefix);
if (p.ipv6Prefix) newCIDRs.push(p.ipv6Prefix);
});
} catch (e) {
console.warn("⚠️ Failed to load GCP IP ranges:", e.message);
}

try {
// DigitalOcean (published via CSV, using known ranges)
const doRanges = [
"104.131.0.0/16", "104.236.0.0/16", "128.199.0.0/16",
"134.209.0.0/16", "137.184.0.0/16", "138.68.0.0/16",
"138.197.0.0/16", "139.59.0.0/16", "142.93.0.0/16",
"143.110.0.0/16", "143.198.0.0/16", "144.126.0.0/16",
"146.190.0.0/16", "147.182.0.0/16", "157.230.0.0/16",
"159.65.0.0/16", "159.89.0.0/16", "159.203.0.0/16",
"161.35.0.0/16", "162.243.0.0/16", "163.47.8.0/21",
"164.90.0.0/16", "164.92.0.0/16", "165.22.0.0/16",
"165.227.0.0/16", "167.71.0.0/16", "167.172.0.0/16",
"170.64.0.0/16", "174.138.0.0/16", "178.128.0.0/16",
"178.62.0.0/16", "188.166.0.0/16", "192.241.0.0/16",
"198.199.64.0/18", "198.211.96.0/19", "206.81.0.0/16",
"206.189.0.0/16", "207.154.192.0/18", "209.97.128.0/17",
"45.55.0.0/16", "46.101.0.0/16", "64.225.0.0/16",
"67.205.128.0/17", "68.183.0.0/16"
];
doRanges.forEach((r) => newCIDRs.push(r));
} catch (e) {}

try {
// Vultr known ranges
const vultrRanges = [
"45.32.0.0/15", "45.63.0.0/16", "45.76.0.0/15",
"45.77.0.0/16", "64.156.0.0/16", "66.42.0.0/16",
"78.141.192.0/18", "80.240.16.0/20", "95.179.128.0/17",
"104.156.224.0/19", "104.207.128.0/17", "108.61.0.0/16",
"136.244.64.0/18", "137.220.32.0/19", "139.180.128.0/17",
"140.82.0.0/16", "141.164.32.0/19", "144.202.0.0/16",
"149.28.0.0/16", "149.248.0.0/16", "155.138.128.0/17",
"192.248.144.0/20", "199.247.0.0/16", "207.148.0.0/17",
"209.250.224.0/19", "216.128.128.0/17"
];
vultrRanges.forEach((r) => newCIDRs.push(r));
} catch (e) {}

if (newCIDRs.length > 0) {
hostingCIDRs = newCIDRs;
lastCIDRLoad = now;

// Save to cache file
try {
const dir = path.dirname(cacheFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(cacheFile, JSON.stringify(hostingCIDRs, null, 2));
} catch (e) {}

console.log(`✅ Filter 2: Loaded ${hostingCIDRs.length} hosting CIDR ranges`);
} else {
// Try loading from cache file
try {
if (fs.existsSync(cacheFile)) {
hostingCIDRs = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
lastCIDRLoad = now;
console.log(`✅ Filter 2: Loaded ${hostingCIDRs.length} ranges from cache`);
}
} catch (e) {}
}
}

// ─────────────────────────────────────────────
// Simple CIDR matching (no external dependency needed)
// ─────────────────────────────────────────────
function ipToLong(ip) {
const parts = ip.split(".").map(Number);
return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIPInCIDR(ip, cidr) {
if (ip.includes(":")) return false; // Skip IPv6 for now
if (cidr.includes(":")) return false;
try {
const [range, bits] = cidr.split("/");
const mask = ~(2 ** (32 - parseInt(bits)) - 1) >>> 0;
return (ipToLong(ip) & mask) === (ipToLong(range) & mask);
} catch {
return false;
}
}

function isHostingIP(ip) {
for (const cidr of hostingCIDRs) {
if (isIPInCIDR(ip, cidr)) return true;
}
return false;
}

// ─────────────────────────────────────────────
// Reverse DNS lookup
// ─────────────────────────────────────────────
async function checkReverseDNS(ip) {
try {
const hostnames = await dns.reverse(ip);
for (const hostname of hostnames) {
const lower = hostname.toLowerCase();
for (const keyword of HOSTING_RDNS_KEYWORDS) {
if (lower.includes(keyword)) {
return { isHosting: true, hostname, matchedKeyword: keyword };
}
}
}
} catch (e) {
// rDNS failed — not conclusive
}
return { isHosting: false };
}

// ─────────────────────────────────────────────
// IP Reputation API (ip-api.com — free tier)
// ─────────────────────────────────────────────
async function checkIPReputation(ip) {
// Check cache first
if (ipCache.has(ip)) {
const cached = ipCache.get(ip);
if (Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
}

try {
const resp = await fetch(
`http://ip-api.com/json/${ip}?fields=status,hosting,proxy,org,as,isp`,
{ timeout: 5000 }
);
const data = await resp.json();

if (data.status === "success") {
const result = {
isHosting: data.hosting || false,
isProxy: data.proxy || false,
org: data.org || "",
isp: data.isp || "",
as: data.as || "",
};
ipCache.set(ip, { data: result, timestamp: Date.now() });
return result;
}
} catch (e) {}

return { isHosting: false, isProxy: false, org: "", isp: "", as: "" };
}

// ─────────────────────────────────────────────
// MAIN FILTER FUNCTION
// ─────────────────────────────────────────────
async function filter2_HostingProvider(req) {
const ip = req.ip || req.connection.remoteAddress || "";
// Clean IPv6-mapped IPv4
const cleanIP = ip.replace(/^::ffff:/, "");

const result = {
filterName: "FILTER_2_HOSTING_PROVIDER",
passed: true,
reason: null,
details: { ip: cleanIP },
};

// Ensure CIDRs are loaded
await loadHostingCIDRs();

// ── CHECK 2A: CIDR range match ──
if (isHostingIP(cleanIP)) {
result.passed = false;
result.reason = `IP ${cleanIP} matches known hosting provider CIDR range`;
return result;
}

// ── CHECK 2B: Reverse DNS lookup ──
const rdns = await checkReverseDNS(cleanIP);
if (rdns.isHosting) {
result.passed = false;
result.reason = `Reverse DNS indicates hosting provider: ${rdns.hostname} (${rdns.matchedKeyword})`;
result.details.rdnsHostname = rdns.hostname;
result.details.matchedKeyword = rdns.matchedKeyword;
return result;
}

// ── CHECK 2C: IP Reputation API ──
const reputation = await checkIPReputation(cleanIP);
if (reputation.isHosting) {
result.passed = false;
result.reason = `IP flagged as data center/hosting: ${reputation.org} (${reputation.as})`;
result.details.org = reputation.org;
result.details.isp = reputation.isp;
result.details.as = reputation.as;
return result;
}

if (reputation.isProxy) {
result.passed = false;
result.reason = `IP flagged as proxy/VPN: ${reputation.org} (${reputation.as})`;
result.details.org = reputation.org;
result.details.isp = reputation.isp;
result.details.as = reputation.as;
return result;
}

return result;
}

module.exports = filter2_HostingProvider;
