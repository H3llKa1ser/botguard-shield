// filters/filter1-browser-automation.js
// =============================================
// FILTER 1: BROWSER AUTOMATION DETECTION
// Detects: Selenium, Puppeteer, Playwright,
// PhantomJS, Nightmare, CasperJS,
// Headless browsers, HTTP libraries
// =============================================

const AUTOMATION_UA_PATTERNS = [
/selenium/i,
/puppeteer/i,
/playwright/i,
/headlesschrome/i,
/headless/i,
/phantomjs/i,
/nightmare/i,
/casperjs/i,
/webdriver/i,
/chromedriver/i,
/geckodriver/i,

// HTTP libraries (not real browsers)
/python-requests/i,
/python-urllib/i,
/python-aiohttp/i,
/go-http-client/i,
/java\//i,
/apache-httpclient/i,
/okhttp/i,
/libwww-perl/i,
/mechanize/i,
/scrapy/i,
/node-fetch/i,
/axios/i,
/undici/i,
/got\//i,
/superagent/i,
/request\//i,
/wget/i,
/curl/i,
/httpie/i,
/lwp-trivial/i,
/postman/i,
/insomnia/i,
/rest-client/i,
/http_request/i,
/ruby/i,
/perl/i,
/php\//i,
/colly/i,
];

// Headers that real browsers always send
const REQUIRED_BROWSER_HEADERS = [
"accept",
"accept-language",
"accept-encoding",
];

// Suspicious header combinations
const SUSPICIOUS_HEADERS = [
"x-requested-with", // Only sent by AJAX, not page loads
];

function filter1_BrowserAutomation(req) {
const ua = req.headers["user-agent"] || "";
const result = {
filterName: "FILTER_1_BROWSER_AUTOMATION",
passed: true,
reason: null,
details: {},
};

// ── CHECK 1A: Empty or missing User-Agent ──
if (!ua || ua.trim() === "") {
result.passed = false;
result.reason = "Empty or missing User-Agent header";
result.details.userAgent = "(empty)";
return result;
}

// ── CHECK 1B: Known automation/bot User-Agent patterns ──
for (const pattern of AUTOMATION_UA_PATTERNS) {
if (pattern.test(ua)) {
result.passed = false;
result.reason = `Automation UA pattern matched: ${pattern}`;
result.details.userAgent = ua;
result.details.matchedPattern = pattern.toString();
return result;
}
}

// ── CHECK 1C: Missing required browser headers ──
for (const header of REQUIRED_BROWSER_HEADERS) {
if (!req.headers[header] || req.headers[header].trim() === "") {
result.passed = false;
result.reason = `Missing required browser header: ${header}`;
result.details.missingHeader = header;
result.details.userAgent = ua;
return result;
}
}

// ── CHECK 1D: Suspicious Accept-Language ──
const acceptLang = req.headers["accept-language"] || "";
if (acceptLang === "*" || acceptLang === "en") {
result.passed = false;
result.reason = `Suspicious Accept-Language value: "${acceptLang}"`;
result.details.acceptLanguage = acceptLang;
return result;
}

// ── CHECK 1E: Connection header anomaly ──
// Real browsers rarely send "Connection: close" on HTTP/1.1
if (
req.httpVersion === "1.1" &&
req.headers["connection"] &&
req.headers["connection"].toLowerCase() === "close"
) {
result.passed = false;
result.reason = "HTTP/1.1 with Connection: close (library behavior)";
return result;
}

// ── CHECK 1F: UA claims Chrome but no sec-ch-ua header ──
// Modern Chrome (v89+) always sends Client Hints
if (/Chrome\/(\d+)/.test(ua)) {
const chromeVersion = parseInt(RegExp.$1);
if (chromeVersion >= 89 && !req.headers["sec-ch-ua"]) {
result.passed = false;
result.reason = `Chrome ${chromeVersion} without sec-ch-ua header (likely automation)`;
result.details.chromeVersion = chromeVersion;
return result;
}
}

return result;
}

module.exports = filter1_BrowserAutomation;
