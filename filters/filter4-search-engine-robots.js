// filters/filter4-search-engine-robots.js
// =============================================
// FILTER 4: SEARCH ENGINE ROBOTS
// Detects: Crawlers, spiders, bots claiming
// to be search engines but unverified
// Allows: Verified Google, Bing, Yahoo, Yandex
// =============================================

const dns = require("dns").promises;

// Verified search engine bot definitions
// Each bot has: UA patterns + valid rDNS domains
const VERIFIED_BOTS = {
Google: {
uaPatterns: [/Googlebot/i, /Google-Site-Verification/i, /AdsBot-Google/i, /Mediapartners-Google/i],
rdnsDomains: [".googlebot.com", ".google.com"],
},
Bing: {
uaPatterns: [/bingbot/i, /msnbot/i, /BingPreview/i],
rdnsDomains: [".search.msn.com"],
},
Yahoo: {
uaPatterns: [/Slurp/i],
rdnsDomains: [".crawl.yahoo.net"],
},
Yandex: {
uaPatterns: [/YandexBot/i, /YandexImages/i, /YandexMobileBot/i],
rdnsDomains: [".yandex.com", ".yandex.net", ".yandex.ru"],
},
Baidu: {
uaPatterns: [/Baiduspider/i],
rdnsDomains: [".crawl.baidu.com", ".crawl.baidu.jp"],
},
DuckDuckGo: {
uaPatterns: [/DuckDuckBot/i],
rdnsDomains: [".duckduckgo.com"],
},
Apple: {
uaPatterns: [/Applebot/i],
rdnsDomains: [".applebot.apple.com"],
},
};

// Generic crawler/spider UA patterns (always block these)
const GENERIC_CRAWLER_PATTERNS = [
/bot/i,
/crawl/i,
/spider/i,
/scraper/i,
/fetch/i,
/archiver/i,
/slurp/i,

// Specific known bad bots
/AhrefsBot/i,
/SemrushBot/i,
/MJ12bot/i,
/DotBot/i,
/BLEXBot/i,
/SearchmetricsBot/i,
/Sogou/i,
/Exabot/i,
/facebot/i, // Facebook crawler (may want to allow)
/ia_archiver/i,
/MegaIndex/i,
/BUbiNG/i,
/Qwantify/i,
/CCBot/i,
/Uptimebot/i,
/linkdexbot/i,
/GrapeshotCrawler/i,
/PetalBot/i,
/Bytespider/i,
/GPTBot/i,
/ChatGPT-User/i,
/ClaudeBot/i,
/anthropic-ai/i,
/cohere-ai/i,
];

// ─────────────────────────────────────────────
// Verify a search engine bot via reverse DNS
// Forward-confirmed reverse DNS (FCrDNS)
// ─────────────────────────────────────────────
async function verifyBotViaDNS(ip, botConfig) {
try {
// Step 1: Reverse DNS lookup
const hostnames = await dns.reverse(ip);

for (const hostname of hostnames) {
const lower = hostname.toLowerCase();

// Check if hostname matches expected domain
for (const domain of botConfig.rdnsDomains) {
if (lower.endsWith(domain)) {
// Step 2: Forward DNS verification
try {
const addresses = await dns.resolve4(hostname);
if (addresses.includes(ip)) {
return {
verified: true,
hostname: hostname,
method: "FCrDNS",
};
}
} catch (e) {}

// Try IPv6 forward lookup too
try {
const addresses6 = await dns.resolve6(hostname);
if (addresses6.includes(ip)) {
return {
verified: true,
hostname: hostname,
method: "FCrDNS-IPv6",
};
}
} catch (e) {}
}
}
}
} catch (e) {
// rDNS failed
}

return { verified: false };
}

// ─────────────────────────────────────────────
// MAIN FILTER FUNCTION
// ─────────────────────────────────────────────
async function filter4_SearchEngineRobots(req) {
const ua = req.headers["user-agent"] || "";
const ip = (req.ip || req.connection.remoteAddress || "").replace(/^::ffff:/, "");

const result = {
filterName: "FILTER_4_SEARCH_ENGINE_ROBOTS",
passed: true,
reason: null,
details: { ip, userAgent: ua },
};

// ── CHECK 4A: Is UA claiming to be a known search engine bot? ──
for (const [botName, config] of Object.entries(VERIFIED_BOTS)) {
for (const pattern of config.uaPatterns) {
if (pattern.test(ua)) {
// UA claims to be this bot — verify via DNS
const verification = await verifyBotViaDNS(ip, config);

if (verification.verified) {
// ✅ Genuine search engine bot — ALLOW (pass this filter)
result.details.verifiedBot = botName;
result.details.hostname = verification.hostname;
console.log(
`✅ Filter 4: Verified ${botName} from ${ip} (${verification.hostname})`
);
return result; // passed = true
} else {
// ❌ Fake bot — claiming to be search engine but DNS doesn't match
result.passed = false;
result.reason = `Fake ${botName}: UA claims to be ${botName} but DNS verification failed`;
result.details.claimedBot = botName;
return result;
}
}
}
}

// ── CHECK 4B: Is UA matching generic crawler patterns? ──
for (const pattern of GENERIC_CRAWLER_PATTERNS) {
if (pattern.test(ua)) {
result.passed = false;
result.reason = `Generic crawler/bot UA detected: ${pattern}`;
result.details.matchedPattern = pattern.toString();
return result;
}
}

// ── CHECK 4C: robots.txt enforcement ──
// If request is for sensitive paths that robots.txt disallows
const protectedPaths = [
"/admin", "/dashboard", "/api/private",
"/user", "/account", "/checkout", "/cart",
];
const isProtectedPath = protectedPaths.some((p) => req.path.startsWith(p));

// If any bot-like header pattern + protected path
if (isProtectedPath) {
// Check for non-browser behavior on protected paths
const hasReferer = !!req.headers["referer"];
const hasCookie = !!req.headers["cookie"];

if (!hasReferer && !hasCookie) {
// Direct access to protected path without referer/cookies = suspicious
// But only flag if other signals also look bot-like
const acceptHeader = req.headers["accept"] || "";
if (!acceptHeader.includes("text/html")) {
result.passed = false;
result.reason = `Non-browser access to protected path: ${req.path}`;
return result;
}
}
}

return result;
}

module.exports = filter4_SearchEngineRobots;
