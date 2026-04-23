# botguard-shield
An experimental multi-layer web application protection solution.

# Project Structure

    botguard-shield/
    ├── server.js # Main Express server + 5 filter pipeline
    ├── filters/
    │ ├── filter1-browser-automation.js
    │ ├── filter2-hosting-provider.js
    │ ├── filter3-botguard.js
    │ ├── filter4-search-engine-robots.js
    │ └── filter5-hardware-virtualization.js
    ├── public/
    │ ├── index.html # Protected page
    │ └── botguard-client.js # Client-side detection script
    ├── data/
    │ └── hosting-ranges.json # Cached hosting IP ranges
    ├── package.json
    └── .env

# BotGuard Shield - Complete Setup & Usage Guide

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [System Requirements](#2-system-requirements)
3. [Project Structure](#3-project-structure)
4. [Step-by-Step Installation](#4-step-by-step-installation)
5. [File Placement Guide](#5-file-placement-guide)
6. [Configuration (.env)](#6-configuration-env)
7. [NGINX Setup](#7-nginx-setup)
8. [Starting the Server](#8-starting-the-server)
9. [Testing the Pipeline](#9-testing-the-pipeline)
10. [Verifying Each Filter](#10-verifying-each-filter)
11. [Whitelisting IPs](#11-whitelisting-ips)
12. [Monitoring & Logs](#12-monitoring--logs)
13. [Production Checklist](#13-production-checklist)
14. [Updating IP Ranges](#14-updating-ip-ranges)
15. [Troubleshooting](#15-troubleshooting)
16. [Security Considerations](#16-security-considerations)

---

## 1. Prerequisites

### Required Software

- **Node.js** v16 or higher
- **npm** v8 or higher
- **NGINX** (for production reverse proxy)
- **Git** (optional, for version control)

### Install Node.js

**Ubuntu / Debian:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

**CentOS / RHEL / Amazon Linux:**

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
node --version
npm --version
```

**macOS (using Homebrew):**

```bash
brew install node
node --version
npm --version
```

**Windows:**

Download the installer from https://nodejs.org and run it.
Make sure to check "Add to PATH" during installation.

### Install NGINX

**Ubuntu / Debian:**

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

**CentOS / RHEL:**

```bash
sudo yum install -y epel-release
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 2. System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 512 MB | 1 GB+ |
| Disk | 100 MB | 500 MB+ |
| Network | 1 Mbps | 10 Mbps+ |
| OS | Any Linux, macOS, Windows | Ubuntu 22.04 LTS |

The hosting IP range file and in-memory caches will use approximately 50-100 MB of RAM under normal operation.

---

## 3. Project Structure

Your final project should look exactly like this:

```
botguard-shield/
├── package.json
├── .env
├── server.js
├── blocked.log                     (auto-created at runtime)
├── filters/
│   ├── filter1-browser-automation.js
│   ├── filter2-hosting-provider.js
│   ├── filter3-botguard.js
│   ├── filter4-search-engine-robots.js
│   └── filter5-hardware-virtualization.js
├── public/
│   ├── index.html
│   ├── botguard-client.js
│   └── robots.txt
└── data/
    └── hosting-ranges.json
```

---

## 4. Step-by-Step Installation

### Step 1: Create the project directory

```bash
mkdir botguard-shield
cd botguard-shield
```

### Step 2: Create subdirectories

```bash
mkdir -p filters
mkdir -p public
mkdir -p data
```

### Step 3: Place all files

Copy each file from the downloaded documents into the correct location.
See Section 5 (File Placement Guide) for exact mappings.

### Step 4: Install dependencies

```bash
npm install
```

This reads package.json and installs:
- express
- express-rate-limit
- node-fetch
- dotenv
- ua-parser-js
- ip-range-check

### Step 5: Verify the structure

```bash
find . -type f | head -20
```

You should see all the files listed in Section 3 above.

---

## 5. File Placement Guide

This maps each downloaded document to the exact files you need to create:

| Downloaded Document | Files Inside | Save To |
|--------------------|--------------|---------|
| Part 1 - Filters 1 & 2 | package.json | botguard-shield/package.json |
| Part 1 - Filters 1 & 2 | .env | botguard-shield/.env |
| Part 1 - Filters 1 & 2 | filter1-browser-automation.js | botguard-shield/filters/filter1-browser-automation.js |
| Part 1 - Filters 1 & 2 | filter2-hosting-provider.js | botguard-shield/filters/filter2-hosting-provider.js |
| Part 2 - Filters 3 & 4 | filter3-botguard.js | botguard-shield/filters/filter3-botguard.js |
| Part 2 - Filters 3 & 4 | filter4-search-engine-robots.js | botguard-shield/filters/filter4-search-engine-robots.js |
| Part 3 - Filter 5 | filter5-hardware-virtualization.js | botguard-shield/filters/filter5-hardware-virtualization.js |
| Part 4 - Main Server | server.js | botguard-shield/server.js |
| Part 5 - Client Side | index.html | botguard-shield/public/index.html |
| Part 5 - Client Side | botguard-client.js | botguard-shield/public/botguard-client.js |
| Part 6 - NGINX & Setup | botguard.conf | /etc/nginx/conf.d/botguard.conf |
| Part 6 - NGINX & Setup | robots.txt | botguard-shield/public/robots.txt |
| hosting-ranges.json | hosting-ranges.json | botguard-shield/data/hosting-ranges.json |

---

## 6. Configuration (.env)

Open the .env file in your project root and configure these values:

```
PORT=3000
REDIRECT_URL=https://www.google.com
LOG_BLOCKED=true
BYPASS_KEY=your-secret-bypass-key-here
```

### Variable Reference

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | The port your Node.js server listens on |
| REDIRECT_URL | https://www.google.com | Where blocked visitors are redirected |
| LOG_BLOCKED | true | Whether to log blocked requests to blocked.log |
| BYPASS_KEY | (none) | Secret key to bypass all filters (for admin/testing) |

### Important Notes on BYPASS_KEY

- Change this to a long random string in production
- Use it by adding the header: X-Bypass-Key: your-secret-key
- Never share this key publicly
- Example generation: 

```bash
openssl rand -hex 32
```

---

## 7. NGINX Setup

### Step 1: Create the NGINX config file

Copy the NGINX configuration from Part 6 document into:

```bash
sudo nano /etc/nginx/conf.d/botguard.conf
```

### Step 2: Update the server_name

Replace "yourdomain.com" with your actual domain name in the config file.

### Step 3: Test the NGINX configuration

```bash
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 4: Reload NGINX

```bash
sudo systemctl reload nginx
```

### Step 5: Set up SSL/HTTPS with Certbot (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
# Test it with:
sudo certbot renew --dry-run
```

### Step 6: Verify NGINX is running

```bash
sudo systemctl status nginx
curl -I http://yourdomain.com
```

---

## 8. Starting the Server

### Development Mode (for testing)

```bash
cd botguard-shield
node server.js
```

You should see the BotGuard Shield ASCII banner with all 5 filters listed.

### Development Mode with Auto-Restart

```bash
npm install -g nodemon
nodemon server.js
```

This auto-restarts the server when you change any file.

### Production Mode with PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name botguard-shield

# Set PM2 to start on boot
pm2 startup
pm2 save

# Useful PM2 commands:
pm2 status                    # Check status
pm2 logs botguard-shield      # View logs
pm2 restart botguard-shield   # Restart
pm2 stop botguard-shield      # Stop
pm2 monit                     # Real-time monitoring dashboard
```

### Production Mode with systemd

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/botguard.service
```

Paste this content:

```ini
[Unit]
Description=BotGuard Shield
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/youruser/botguard-shield
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable botguard
sudo systemctl start botguard
sudo systemctl status botguard
```

---

## 9. Testing the Pipeline

Once the server is running, test each filter with these commands.
All of these should result in a redirect to google.com (HTTP 302).

### Test 1: Empty User-Agent (Filter 1)

```bash
curl -v -H "User-Agent: " http://localhost:3000/
```

Expected: 302 redirect to google.com
Filter: FILTER_1_BROWSER_AUTOMATION
Reason: Empty or missing User-Agent header

### Test 2: Bot User-Agent (Filter 1)

```bash
curl -v -H "User-Agent: python-requests/2.28.0" http://localhost:3000/
```

Expected: 302 redirect to google.com
Filter: FILTER_1_BROWSER_AUTOMATION
Reason: Automation UA pattern matched

### Test 3: Selenium User-Agent (Filter 1)

```bash
curl -v -H "User-Agent: Mozilla/5.0 Selenium" http://localhost:3000/
```

Expected: 302 redirect to google.com

### Test 4: Missing Accept-Language (Filter 1)

```bash
curl -v -H "User-Agent: Mozilla/5.0" -H "Accept: text/html" -H "Accept-Encoding: gzip" http://localhost:3000/
```

Expected: 302 redirect to google.com
Reason: Missing required browser header: accept-language

### Test 5: Honeypot Trap (Filter 3)

```bash
curl -v http://localhost:3000/trap-endpoint-do-not-follow
```

Expected: 302 redirect to google.com
Filter: FILTER_3_BOTGUARD
Reason: Honeypot/trap URL accessed

### Test 6: Fake Googlebot (Filter 4)

```bash
curl -v \
  -H "User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  -H "Accept: text/html" \
  -H "Accept-Language: en-US" \
  -H "Accept-Encoding: gzip" \
  http://localhost:3000/
```

Expected: 302 redirect to google.com (because your IP won't pass Google's rDNS verification)
Filter: FILTER_4_SEARCH_ENGINE_ROBOTS
Reason: Fake Googlebot

### Test 7: Legitimate Browser (should PASS)

```bash
curl -v \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
  -H "Accept-Language: en-US,en;q=0.9" \
  -H "Accept-Encoding: gzip, deflate, br" \
  -H "sec-ch-ua: \"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"" \
  http://localhost:3000/
```

Expected: 200 OK with the HTML page content
Note: This may still be blocked by Filter 2 if your IP is from a hosting provider.

### Test 8: Bypass Key (should always PASS)

```bash
curl -v \
  -H "X-Bypass-Key: your-secret-bypass-key-here" \
  http://localhost:3000/
```

Expected: 200 OK regardless of any other headers

---

## 10. Verifying Each Filter

### Reading the Console Output

When the server is running, every request produces console output like this:

```
════════════════════════════════════════════════════════════
🔍 BOTGUARD PIPELINE START
   IP: 192.168.1.100
   UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
   Path: GET /
────────────────────────────────────────────────────────────
   [1/5] Browser Automation...
   [1/5] ✅ PASSED
   [2/5] Hosting Provider...
   [2/5] ✅ PASSED
   [3/5] BotGuard...
   [3/5] ✅ PASSED
   [4/5] Search Engine Robots...
   [4/5] ✅ PASSED
   [5/5] Hardware Virtualization...
   [5/5] ✅ PASSED
────────────────────────────────────────────────────────────
   ✅ ALL 5 FILTERS PASSED (47ms)
   → Allowing access to: /
════════════════════════════════════════════════════════════
```

When a filter FAILS:

```
   [2/5] Hosting Provider...
   ❌ FAILED — FILTER_2_HOSTING_PROVIDER
   Reason: IP 104.131.45.67 matches known hosting provider CIDR range
────────────────────────────────────────────────────────────
   🚫 BLOCKED & REDIRECTING TO https://www.google.com (23ms)
════════════════════════════════════════════════════════════
```

### Filter-by-Filter Verification

**Filter 1 (Browser Automation):**
- Triggers on bot/automation User-Agents
- Triggers on missing browser headers
- Triggers on Chrome without sec-ch-ua header
- Test with curl using various UA strings

**Filter 2 (Hosting Provider):**
- Triggers on IPs from AWS, GCP, Azure, DigitalOcean, etc.
- Triggers on IPs flagged by ip-api.com as hosting/proxy
- Test by running your server on a cloud VPS and accessing it from another VPS

**Filter 3 (BotGuard):**
- Triggers on honeypot URLs
- Triggers on high request rates with uniform timing
- Triggers on filled honeypot form fields
- Triggers on missing/invalid PoW tokens for API routes

**Filter 4 (Search Engine Robots):**
- Triggers on any bot/crawler/spider UA
- ALLOWS verified search engine bots (Google, Bing, etc.) via rDNS
- Test with fake Googlebot UA from a non-Google IP

**Filter 5 (Hardware Virtualization):**
- Triggers when client-side JS detects VM GPU (VMware, VirtualBox, etc.)
- Triggers on virtual battery, no media devices
- Requires the client-side script to run and report back
- Test by opening the page in a browser running inside a VM

---

## 11. Whitelisting IPs

### Method 1: Bypass Key Header

The simplest way. Add this header to any request:

```
X-Bypass-Key: your-secret-bypass-key-here
```

This skips ALL filters entirely. Use for:
- Your own admin access
- Health check monitoring tools
- Payment processor callbacks (Stripe, PayPal webhooks)
- CI/CD deployment tools

### Method 2: Code-Level IP Whitelist

Edit server.js and add a whitelist before the pipeline middleware:

```javascript
const WHITELISTED_IPS = [
    "127.0.0.1",
    "::1",
    "YOUR.OFFICE.IP.HERE",
    "YOUR.HOME.IP.HERE",
];

app.use((req, res, next) => {
    const ip = (req.ip || "").replace(/^::ffff:/, "");
    if (WHITELISTED_IPS.includes(ip)) {
        console.log(`🔑 Whitelisted IP: ${ip}`);
        return next();
    }
    next();
});
```

Add this BEFORE the botGuardPipeline middleware in server.js.

### Method 3: NGINX-Level Whitelist

Add to your NGINX config inside the server block:

```nginx
# Whitelist specific IPs - skip all bot checks
geo $whitelisted {
    default 0;
    127.0.0.1/32 1;
    YOUR.OFFICE.IP.HERE/32 1;
    YOUR.HOME.IP.HERE/32 1;
}

# If whitelisted, proxy directly without bot checks
if ($whitelisted) {
    # These IPs bypass NGINX-level bot filters
    # They still go through Node.js filters unless also code-whitelisted
}
```

---

## 12. Monitoring & Logs

### Log File Location

Blocked requests are logged to:

```
botguard-shield/blocked.log
```

Each line is a JSON object:

```json
{
    "timestamp": "2026-04-23T16:30:00.000Z",
    "ip": "104.131.45.67",
    "filter": "FILTER_2_HOSTING_PROVIDER",
    "reason": "IP matches known hosting provider CIDR range",
    "details": { "ip": "104.131.45.67" },
    "processingTimeMs": 23
}
```

### Useful Log Analysis Commands

**Count total blocks today:**

```bash
grep "$(date +%Y-%m-%d)" blocked.log | wc -l
```

**Count blocks by filter:**

```bash
cat blocked.log | jq -r '.filter' | sort | uniq -c | sort -rn
```

**Count blocks by IP:**

```bash
cat blocked.log | jq -r '.ip' | sort | uniq -c | sort -rn | head -20
```

**Count blocks by reason:**

```bash
cat blocked.log | jq -r '.reason' | sort | uniq -c | sort -rn | head -20
```

**View blocks in the last hour:**

```bash
awk -v d="$(date -d '1 hour ago' +%Y-%m-%dT%H:%M)" '$0 ~ d' blocked.log
```

**Watch logs in real-time:**

```bash
tail -f blocked.log | jq .
```

**With PM2:**

```bash
pm2 logs botguard-shield --lines 100
```

### Log Rotation

To prevent the log file from growing too large, set up logrotate:

```bash
sudo nano /etc/logrotate.d/botguard
```

Paste this content:

```
/home/youruser/botguard-shield/blocked.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    copytruncate
}
```

This keeps 30 days of compressed logs and rotates daily.

---

## 13. Production Checklist

Before going live, verify each item:

- [ ] 1. All files are in the correct directories (see Section 3)
- [ ] 2. npm install completed without errors
- [ ] 3. .env file has a strong BYPASS_KEY (use openssl rand -hex 32)
- [ ] 4. .env file has the correct REDIRECT_URL
- [ ] 5. server.js starts without errors (node server.js)
- [ ] 6. NGINX config passes syntax test (sudo nginx -t)
- [ ] 7. SSL/HTTPS is configured with Certbot
- [ ] 8. PM2 or systemd is set up for auto-restart
- [ ] 9. Firewall allows only ports 80, 443, and SSH
- [ ] 10. Your own IP is whitelisted (see Section 11)
- [ ] 11. Payment processor IPs are whitelisted (if applicable)
- [ ] 12. Health check / uptime monitor IPs are whitelisted
- [ ] 13. All 8 test commands from Section 9 produce expected results
- [ ] 14. Log rotation is configured (see Section 12)

### Firewall Setup (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

IMPORTANT: Do NOT expose port 3000 publicly. Only NGINX should access it.

### Firewall Setup (firewalld)

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

---

## 14. Updating IP Ranges

### Automatic Updates

Filter 2 automatically fetches fresh IP ranges from AWS and GCP APIs every 24 hours while the server is running. No action needed.

### Manual Update

To force a refresh of IP ranges:

```bash
# Restart the server
pm2 restart botguard-shield

# Or with systemd
sudo systemctl restart botguard
```

The server fetches the latest ranges on startup.

### Adding Custom IP Ranges

Edit data/hosting-ranges.json and add your custom CIDR ranges to the array:

```json
[
    "existing ranges...",
    "YOUR.CUSTOM.RANGE.0/24",
    "ANOTHER.RANGE.0/16"
]
```

Then restart the server.

### Updating the Static Ranges File

The hosting-ranges.json file contains static ranges for providers that don't publish live APIs (DigitalOcean, Vultr, OVH, Hetzner, etc.).

To update these, check the provider's documentation or use tools like:

```bash
# Look up ASN ranges for a provider
whois -h whois.radb.net -- '-i origin AS14061'   # DigitalOcean
whois -h whois.radb.net -- '-i origin AS20473'   # Vultr
whois -h whois.radb.net -- '-i origin AS16276'   # OVH
whois -h whois.radb.net -- '-i origin AS24940'   # Hetzner
```

---

## 15. Troubleshooting

### Problem 1: Server won't start

**Symptom:** Error when running node server.js

**Solutions:**

```bash
# Check Node.js version (must be 16+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for syntax errors
node -c server.js
node -c filters/filter1-browser-automation.js
node -c filters/filter2-hosting-provider.js
node -c filters/filter3-botguard.js
node -c filters/filter4-search-engine-robots.js
node -c filters/filter5-hardware-virtualization.js

# Check if port is already in use
lsof -i :3000
# Kill the process if needed
kill -9 $(lsof -t -i :3000)
```

### Problem 2: All visitors are being blocked

**Symptom:** Even legitimate browsers get redirected to google.com

**Solutions:**

1. Check if your server is running on a hosting provider IP (Filter 2 will block your own testing from a VPS)
2. Add your IP to the whitelist (see Section 11)
3. Use the bypass key header for testing
4. Check the console output to see which filter is failing
5. For Filter 1 Check 1F: If you're using an older Chrome version that doesn't send sec-ch-ua, you may need to adjust the Chrome version threshold in filter1-browser-automation.js

### Problem 3: Legitimate search engine bots are being blocked

**Symptom:** Google/Bing can't crawl your site

**Solutions:**

1. Check Google Search Console for crawl errors
2. Test with: curl -H "User-Agent: Googlebot" http://yoursite.com/ from a non-Google IP (should be blocked = correct behavior)
3. Real Googlebot from Google IPs should pass Filter 4's rDNS verification
4. Ensure DNS resolution is working on your server:

```bash
# Test reverse DNS
host 66.249.66.1
# Should return: crawl-66-249-66-1.googlebot.com

# Test forward DNS
host crawl-66-249-66-1.googlebot.com
# Should return: 66.249.66.1
```

5. If DNS is blocked by your firewall, allow outbound DNS (port 53)

### Problem 4: Client-side checks not working

**Symptom:** VMs and headless browsers pass through without being detected

**Solutions:**

1. Verify botguard-client.js is loading in the browser (check browser console)
2. Verify the /api/bot-report and /api/vm-report endpoints are accessible
3. Check that these endpoints are excluded from the pipeline (they are in the skipPaths array in server.js)
4. Open browser DevTools > Console and look for "BotGuard Client" messages
5. The VM report is sent after 2 seconds — make sure the page stays loaded long enough

### Problem 5: NGINX returns 502 Bad Gateway

**Symptom:** NGINX can't connect to the Node.js app

**Solutions:**

```bash
# Check if Node.js is running
pm2 status
# or
sudo systemctl status botguard

# Check if it's listening on the correct port
ss -tlnp | grep 3000

# Check NGINX error log
sudo tail -f /var/log/nginx/error.log

# Make sure NGINX proxy_pass points to the right port
grep proxy_pass /etc/nginx/conf.d/botguard.conf
```

### Problem 6: High memory usage

**Symptom:** Server using too much RAM

**Solutions:**

1. The IP cache grows over time. The code auto-expires entries after 1 hour.
2. Reduce the cache TTL in filter2-hosting-provider.js (change CACHE_TTL)
3. Reduce the hosting CIDR list to only providers you care about
4. Monitor with: pm2 monit

### Problem 7: Slow response times

**Symptom:** Pages load slowly due to filter processing

**Solutions:**

1. Filter 2 and Filter 4 make DNS lookups which can be slow
2. Add DNS caching to your server:

```bash
sudo apt install -y dnsmasq
```

3. The IP reputation API (ip-api.com) has rate limits on the free tier (45 requests/minute). Consider upgrading or using a different provider.
4. Monitor processing times in the console output (shown in milliseconds)

### Problem 8: blocked.log file is too large

**Symptom:** Disk filling up with log data

**Solutions:**

1. Set up log rotation (see Section 12)
2. Disable logging: set LOG_BLOCKED=false in .env
3. Manually truncate: > blocked.log
4. Archive old logs: gzip blocked.log && mv blocked.log.gz /archive/

### Problem 9: node-fetch import error

**Symptom:** Error: require() of ES Module node-fetch

**Solutions:**

node-fetch v3 is ESM-only. Use v2 instead:

```bash
npm uninstall node-fetch
npm install node-fetch@2
```

This is already specified in the package.json ("node-fetch": "^2.7.0").

---

## 16. Security Considerations

### What This System Protects Against

- Automated scraping tools (Selenium, Puppeteer, Playwright, Scrapy)
- HTTP library access (Python requests, curl, wget, Go, Java)
- Headless browsers
- Fake search engine bots
- Traffic from hosting providers / data centers
- VPN and proxy traffic
- Virtual machine access (VMware, VirtualBox, Hyper-V, QEMU)
- RDP server access
- High-rate automated requests
- Honeypot-triggering bots
- Form-filling bots

### What This System Does NOT Protect Against

- DDoS attacks (use Cloudflare or AWS Shield for this)
- SQL injection, XSS, CSRF (use input validation and security headers)
- Authenticated user abuse (use session management and rate limiting per user)
- Highly sophisticated bots that perfectly mimic human behavior
- Zero-day browser exploits
- Physical access to the server

### Recommendations

1. **Layer this with other security measures.** BotGuard Shield is one layer of defense, not a complete security solution.

2. **Use HTTPS everywhere.** Never serve the site over plain HTTP in production.

3. **Keep dependencies updated.** Run npm audit regularly and update packages.

4. **Monitor your logs.** Review blocked.log regularly to understand attack patterns.

5. **Tune the filters.** Some filters may be too aggressive or too lenient for your use case. Adjust thresholds based on your traffic.

6. **Consider CAPTCHA as a fallback.** Instead of immediately redirecting, you could show a CAPTCHA challenge for borderline cases.

7. **Test from multiple locations.** Some filters (especially Filter 2) may block legitimate users on VPNs or corporate networks.

8. **Have a recovery plan.** If you accidentally block all traffic, the BYPASS_KEY header lets you regain access.

9. **Do not rely solely on robots.txt.** It's advisory only. Malicious bots ignore it. The server-side filters enforce the real blocking.

10. **Regular security audits.** Review the filter logic periodically and update the hosting IP ranges.

---

## Quick Reference Commands

```bash
# Start server (development)
node server.js

# Start server (production with PM2)
pm2 start server.js --name botguard-shield

# View logs
pm2 logs botguard-shield
tail -f blocked.log | jq .

# Restart
pm2 restart botguard-shield

# Test with bypass key
curl -H "X-Bypass-Key: YOUR_KEY" http://localhost:3000/

# Check NGINX
sudo nginx -t
sudo systemctl reload nginx

# Check firewall
sudo ufw status

# Update dependencies
npm update
npm audit
```

---

End of BotGuard Shield Setup Guide.
