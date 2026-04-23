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

# BotGuard Shield — Reverse Proxy Setup Guide

Complete step-by-step instructions to deploy BotGuard Shield with a reverse proxy.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Choose Your Deployment Model](#3-choose-your-deployment-model)
4. [Initial Server Setup](#4-initial-server-setup)
5. [Install Node.js and Dependencies](#5-install-nodejs-and-dependencies)
6. [Create the Project Structure](#6-create-the-project-structure)
7. [Place All BotGuard Files](#7-place-all-botguard-files)
8. [Configure Environment Variables](#8-configure-environment-variables)
9. [Option A — BotGuard in Front of NGINX](#9-option-a--botguard-in-front-of-nginx)
10. [Option B — NGINX in Front with Auth Subrequest](#10-option-b--nginx-in-front-with-auth-subrequest)
11. [Option C — BotGuard Inside a Node.js Reverse Proxy](#11-option-c--botguard-inside-a-nodejs-reverse-proxy)
12. [Inject the Client-Side Script](#12-inject-the-client-side-script)
13. [Set Up SSL/HTTPS](#13-set-up-sslhttps)
14. [Run BotGuard as a Background Service](#14-run-botguard-as-a-background-service)
15. [Firewall Configuration](#15-firewall-configuration)
16. [Testing the Full Pipeline](#16-testing-the-full-pipeline)
17. [Monitoring and Logs](#17-monitoring-and-logs)
18. [Whitelisting Your Own IPs](#18-whitelisting-your-own-ips)
19. [Updating Hosting IP Ranges](#19-updating-hosting-ip-ranges)
20. [Troubleshooting](#20-troubleshooting)
21. [Production Checklist](#21-production-checklist)

---

## 1. Architecture Overview

BotGuard Shield is a 5-layer sequential filter pipeline. Every incoming request passes through each filter in order. If ANY filter fails, the visitor is immediately redirected to google.com. Only requests that pass all 5 filters reach your actual website.

The 5 filters in order:

```
Filter 1: Browser Automation Detection
Filter 2: Hosting Provider / Data Center IP Detection
Filter 3: BotGuard (Proof-of-Work, Request Patterns, Honeypots)
Filter 4: Search Engine Robot Detection
Filter 5: Hardware Virtualization Detection
```

The traffic flow with a reverse proxy:

```
Internet
   |
   v
[NGINX / Load Balancer] (SSL termination, rate limiting)
   |
   v
[BotGuard Shield] (5-filter pipeline)
   |
   v
[Your Backend Servers] (only clean, verified traffic arrives here)
```

OR the alternative flow where BotGuard sits in front:

```
Internet
   |
   v
[BotGuard Shield] (port 443/80, 5-filter pipeline)
   |
   v
[NGINX / Reverse Proxy] (routing, load balancing)
   |
   v
[Your Backend Servers]
```

---

## 2. Prerequisites

Before starting, make sure you have the following:

- A Linux server (Ubuntu 20.04/22.04/24.04, Debian 11/12, or CentOS 8/9)
- Root or sudo access
- A domain name pointed to your server IP
- NGINX installed (or you will install it in this guide)
- Node.js 18 or higher
- npm 9 or higher
- At least 1 GB RAM
- At least 10 GB disk space
- Ports 80 and 443 open in your firewall

---

## 3. Choose Your Deployment Model

There are three ways to deploy BotGuard with a reverse proxy. Read all three and pick the one that fits your setup.

**Option A — BotGuard in front of NGINX**

- BotGuard listens on a port (e.g., 3000)
- NGINX listens on port 80/443 and forwards to BotGuard on port 3000
- BotGuard filters the request, then forwards clean traffic to your backend
- Best for: new setups, simple architectures

**Option B — NGINX in front with auth subrequest**

- NGINX stays as your main reverse proxy on port 80/443
- On every request, NGINX calls BotGuard via auth_request to check if the visitor should be allowed
- BotGuard returns 200 (allow) or 403 (block)
- NGINX redirects blocked visitors to google.com
- Best for: existing NGINX setups you do not want to restructure

**Option C — BotGuard inside a Node.js reverse proxy**

- Your reverse proxy is already a Node.js/Express application
- You add the BotGuard filters as middleware directly into your existing proxy code
- No separate BotGuard service needed
- Best for: existing Node.js based proxies

---

## 4. Initial Server Setup

Step 4.1 — Update your system:

```
sudo apt update && sudo apt upgrade -y
```

Step 4.2 — Install essential tools:

```
sudo apt install -y curl wget git build-essential
```

Step 4.3 — Install NGINX:

```
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Step 4.4 — Verify NGINX is running:

```
sudo systemctl status nginx
curl http://localhost
```

You should see the NGINX default welcome page.

---

## 5. Install Node.js and Dependencies

Step 5.1 — Install Node.js 20 LTS:

```
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Step 5.2 — Verify installation:

```
node --version
npm --version
```

node should show v20.x.x or higher. npm should show 9.x.x or higher.

Step 5.3 — Install PM2 globally (process manager for production):

```
sudo npm install -g pm2
```

---

## 6. Create the Project Structure

Step 6.1 — Create the project directory:

```
sudo mkdir -p /opt/botguard-shield
sudo chown $USER:$USER /opt/botguard-shield
cd /opt/botguard-shield
```

Step 6.2 — Create all subdirectories:

```
mkdir -p filters
mkdir -p public
mkdir -p data
mkdir -p logs
```

Step 6.3 — Initialize npm and install dependencies:

```
npm init -y
npm install express express-rate-limit node-fetch@2 dotenv ua-parser-js http-proxy-middleware
```

Note: We use node-fetch version 2 because version 3 is ESM-only and causes issues with require().

Step 6.4 — Verify your directory looks like this:

```
/opt/botguard-shield/
├── node_modules/
├── package.json
├── package-lock.json
├── filters/
├── public/
├── data/
└── logs/
```

---

## 7. Place All BotGuard Files

You should have downloaded the following documents from the previous session. Place each file in the correct location:

Step 7.1 — From Part 1 document, copy and save:

- package.json content into /opt/botguard-shield/package.json (or keep the one npm generated)
- .env content into /opt/botguard-shield/.env
- filter1-browser-automation.js into /opt/botguard-shield/filters/filter1-browser-automation.js
- filter2-hosting-provider.js into /opt/botguard-shield/filters/filter2-hosting-provider.js

Step 7.2 — From Part 2 document, copy and save:

- filter3-botguard.js into /opt/botguard-shield/filters/filter3-botguard.js
- filter4-search-engine-robots.js into /opt/botguard-shield/filters/filter4-search-engine-robots.js

Step 7.3 — From Part 3 document, copy and save:

- filter5-hardware-virtualization.js into /opt/botguard-shield/filters/filter5-hardware-virtualization.js

Step 7.4 — From Part 5 (Client Side) document, copy and save:

- botguard-client.js into /opt/botguard-shield/public/botguard-client.js
- index.html into /opt/botguard-shield/public/index.html

Step 7.5 — From the hosting-ranges.json document, copy and save:

- hosting-ranges.json into /opt/botguard-shield/data/hosting-ranges.json

Step 7.6 — Verify all files are in place:

```
find /opt/botguard-shield -type f -name "*.js" -o -name "*.json" -o -name "*.html" -o -name ".env" | sort
```

You should see:

```
/opt/botguard-shield/.env
/opt/botguard-shield/data/hosting-ranges.json
/opt/botguard-shield/filters/filter1-browser-automation.js
/opt/botguard-shield/filters/filter2-hosting-provider.js
/opt/botguard-shield/filters/filter3-botguard.js
/opt/botguard-shield/filters/filter4-search-engine-robots.js
/opt/botguard-shield/filters/filter5-hardware-virtualization.js
/opt/botguard-shield/package.json
/opt/botguard-shield/public/botguard-client.js
/opt/botguard-shield/public/index.html
```

---

## 8. Configure Environment Variables

Step 8.1 — Edit the .env file:

```
nano /opt/botguard-shield/.env
```

Step 8.2 — Set these values:

```
PORT=3000
REDIRECT_URL=https://www.google.com
LOG_BLOCKED=true
BYPASS_KEY=change-this-to-a-long-random-string
```

Explanation of each variable:

- PORT: The port BotGuard listens on internally. Use 3000 unless it conflicts with something.
- REDIRECT_URL: Where blocked visitors get sent. Default is google.com.
- LOG_BLOCKED: Set to true to log every blocked request to blocked.log. Set to false in high traffic production to save disk I/O.
- BYPASS_KEY: A secret key you can send in the X-Bypass-Key header to skip all filters. Use this for your own monitoring tools, health checks, and admin access. Make it long and random.

Step 8.3 — Generate a random bypass key:

```
openssl rand -hex 32
```

Copy the output and paste it as your BYPASS_KEY value.

Step 8.4 — Save and close the file (Ctrl+X, Y, Enter in nano).

---

## 9. Option A — BotGuard in Front of NGINX

Use this option if you want BotGuard to filter all traffic before it reaches your NGINX reverse proxy.

### Step 9.1 — Create the server.js file

This version of server.js runs the 5-filter pipeline and then forwards clean traffic to NGINX.

Save this as /opt/botguard-shield/server.js:

```
require("dotenv").config();

const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const filter1 = require("./filters/filter1-browser-automation");
const filter2 = require("./filters/filter2-hosting-provider");
const filter3 = require("./filters/filter3-botguard");
const filter4 = require("./filters/filter4-search-engine-robots");
const filter5 = require("./filters/filter5-hardware-virtualization");

const { storeClientReport } = require("./filters/filter3-botguard");
const { storeVMReport } = require("./filters/filter5-hardware-virtualization");

const app = express();
const PORT = process.env.PORT || 3000;
const REDIRECT_URL = process.env.REDIRECT_URL || "https://www.google.com";
const BYPASS_KEY = process.env.BYPASS_KEY || "";
const LOG_BLOCKED = process.env.LOG_BLOCKED === "true";

// Your NGINX reverse proxy address
// Change this to wherever NGINX is listening
const BACKEND_PROXY = "http://127.0.0.1:8080";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", true);

// Serve client-side detection script
app.use("/botguard-client.js", express.static(path.join(__dirname, "public", "botguard-client.js")));

// Report endpoints — excluded from filtering
app.post("/api/bot-report", (req, res) => {
    const ip = (req.ip || "").replace(/^::ffff:/, "");
    storeClientReport(ip, req.body);
    res.status(204).end();
});

app.post("/api/vm-report", (req, res) => {
    const ip = (req.ip || "").replace(/^::ffff:/, "");
    storeVMReport(ip, req.body);
    res.status(204).end();
});

app.post("/api/bot-log", (req, res) => {
    const ip = (req.ip || "").replace(/^::ffff:/, "");
    console.log("Client-side block from " + ip + ":", JSON.stringify(req.body));
    res.status(204).end();
});

// Main pipeline middleware
async function botGuardPipeline(req, res, next) {
    const skipPaths = ["/api/bot-report", "/api/vm-report", "/api/bot-log"];
    if (skipPaths.includes(req.path)) return next();

    if (BYPASS_KEY && req.headers["x-bypass-key"] === BYPASS_KEY) return next();

    const ip = (req.ip || "").replace(/^::ffff:/, "");
    const startTime = Date.now();

    // Filter 1
    const f1 = filter1(req);
    if (!f1.passed) return blockAndRedirect(req, res, f1, ip, startTime);

    // Filter 2
    const f2 = await filter2(req);
    if (!f2.passed) return blockAndRedirect(req, res, f2, ip, startTime);

    // Filter 3
    const f3 = filter3(req);
    if (!f3.passed) return blockAndRedirect(req, res, f3, ip, startTime);

    // Filter 4
    const f4 = await filter4(req);
    if (!f4.passed) return blockAndRedirect(req, res, f4, ip, startTime);

    // Filter 5
    const f5 = filter5(req);
    if (!f5.passed) return blockAndRedirect(req, res, f5, ip, startTime);

    // All passed
    const elapsed = Date.now() - startTime;
    console.log("PASSED | IP: " + ip + " | Path: " + req.path + " | Time: " + elapsed + "ms");
    next();
}

function blockAndRedirect(req, res, filterResult, ip, startTime) {
    const elapsed = Date.now() - startTime;
    console.log("BLOCKED | IP: " + ip + " | Filter: " + filterResult.filterName + " | Reason: " + filterResult.reason + " | Time: " + elapsed + "ms");

    if (LOG_BLOCKED) {
        const fs = require("fs");
        const logEntry = {
            timestamp: new Date().toISOString(),
            ip: ip,
            filter: filterResult.filterName,
            reason: filterResult.reason,
            path: req.path,
            ua: req.headers["user-agent"] || "",
            processingTimeMs: elapsed
        };
        fs.appendFileSync("/opt/botguard-shield/logs/blocked.log", JSON.stringify(logEntry) + "
");
    }

    const isAjax = req.xhr || (req.headers["accept"] || "").includes("application/json");
    if (isAjax) {
        return res.status(403).json({ error: "Access denied", redirect: REDIRECT_URL });
    }
    return res.redirect(302, REDIRECT_URL);
}

// Apply pipeline
app.use(botGuardPipeline);

// Forward clean traffic to NGINX
app.use("/", createProxyMiddleware({
    target: BACKEND_PROXY,
    changeOrigin: true,
    ws: true,
    xfwd: true,
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader("X-Real-IP", req.ip || "");
        proxyReq.setHeader("X-BotGuard-Verified", "true");
    }
}));

app.listen(PORT, () => {
    console.log("BotGuard Shield running on port " + PORT);
    console.log("Forwarding clean traffic to " + BACKEND_PROXY);
    console.log("Redirect URL: " + REDIRECT_URL);
});
```

### Step 9.2 — Configure NGINX to listen on port 8080

Edit your NGINX config:

```
sudo nano /etc/nginx/sites-available/default
```

Change the listen port from 80 to 8080:

```
server {
    listen 8080;
    server_name yourdomain.com;

    # Only accept requests from BotGuard (localhost)
    allow 127.0.0.1;
    deny all;

    # Verify the request came through BotGuard
    if ($http_x_botguard_verified != "true") {
        return 403;
    }

    # Your existing proxy_pass or root directives
    location / {
        proxy_pass http://your-backend-server:port;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_x_real_ip;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 9.3 — Add a front-facing NGINX server block on port 80/443

This block receives traffic from the internet and sends it to BotGuard:

```
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 9.4 — Test and restart NGINX:

```
sudo nginx -t
sudo systemctl restart nginx
```

### Step 9.5 — Start BotGuard:

```
cd /opt/botguard-shield
node server.js
```

You should see:

```
BotGuard Shield running on port 3000
Forwarding clean traffic to http://127.0.0.1:8080
```

### Step 9.6 — Verify the traffic flow:

The request path is now:

```
Visitor browser → yourdomain.com:80 → NGINX (port 80) → BotGuard (port 3000) → NGINX (port 8080) → Your backend
```

---

## 10. Option B — NGINX in Front with Auth Subrequest

Use this option if NGINX is already your main reverse proxy and you do not want to change the traffic flow.

### Step 10.1 — Create the server.js file for auth mode

Save this as /opt/botguard-shield/server.js:

```
require("dotenv").config();

const express = require("express");
const path = require("path");

const filter1 = require("./filters/filter1-browser-automation");
const filter2 = require("./filters/filter2-hosting-provider");
const filter3 = require("./filters/filter3-botguard");
const filter4 = require("./filters/filter4-search-engine-robots");
const filter5 = require("./filters/filter5-hardware-virtualization");

const { storeClientReport } = require("./filters/filter3-botguard");
const { storeVMReport } = require("./filters/filter5-hardware-virtualization");

const app = express();
const PORT = process.env.PORT || 3000;
const BYPASS_KEY = process.env.BYPASS_KEY || "";
const LOG_BLOCKED = process.env.LOG_BLOCKED === "true";

app.use(express.json());
app.set("trust proxy", true);

// Serve client-side script
app.use("/botguard-client.js", express.static(path.join(__dirname, "public", "botguard-client.js")));

// Report endpoints
app.post("/api/bot-report", (req, res) => {
    const ip = (req.ip || "").replace(/^::ffff:/, "");
    storeClientReport(ip, req.body);
    res.status(204).end();
});

app.post("/api/vm-report", (req, res) => {
    const ip = (req.ip || "").replace(/^::ffff:/, "");
    storeVMReport(ip, req.body);
    res.status(204).end();
});

app.post("/api/bot-log", (req, res) => {
    res.status(204).end();
});

// Auth check endpoint — NGINX calls this on every request
app.get("/auth-check", async (req, res) => {
    if (BYPASS_KEY && req.headers["x-bypass-key"] === BYPASS_KEY) {
        return res.status(200).end();
    }

    const fakeReq = {
        ip: req.headers["x-real-ip"] || req.ip,
        path: req.headers["x-original-uri"] || "/",
        method: req.headers["x-original-method"] || "GET",
        httpVersion: req.httpVersion,
        headers: {
            "user-agent": req.headers["x-original-ua"] || req.headers["user-agent"] || "",
            "accept": req.headers["x-original-accept"] || req.headers["accept"] || "",
            "accept-language": req.headers["x-original-accept-language"] || req.headers["accept-language"] || "",
            "accept-encoding": req.headers["x-original-accept-encoding"] || req.headers["accept-encoding"] || "",
            "sec-ch-ua": req.headers["x-original-sec-ch-ua"] || req.headers["sec-ch-ua"] || "",
            "referer": req.headers["x-original-referer"] || "",
            "cookie": req.headers["x-original-cookie"] || "",
            "connection": req.headers["connection"] || "",
            "x-pow-token": req.headers["x-original-pow-token"] || "",
            "x-vm-report": req.headers["x-original-vm-report"] || "",
            "x-ja3-hash": req.headers["x-original-ja3"] || ""
        },
        connection: req.connection,
        body: {},
        xhr: false
    };

    const ip = (fakeReq.ip || "").replace(/^::ffff:/, "");

    // Filter 1
    const f1 = filter1(fakeReq);
    if (!f1.passed) {
        logBlock(ip, f1);
        return res.status(403).end();
    }

    // Filter 2
    const f2 = await filter2(fakeReq);
    if (!f2.passed) {
        logBlock(ip, f2);
        return res.status(403).end();
    }

    // Filter 3
    const f3 = filter3(fakeReq);
    if (!f3.passed) {
        logBlock(ip, f3);
        return res.status(403).end();
    }

    // Filter 4
    const f4 = await filter4(fakeReq);
    if (!f4.passed) {
        logBlock(ip, f4);
        return res.status(403).end();
    }

    // Filter 5
    const f5 = filter5(fakeReq);
    if (!f5.passed) {
        logBlock(ip, f5);
        return res.status(403).end();
    }

    // All passed
    console.log("PASSED | IP: " + ip + " | Path: " + fakeReq.path);
    res.status(200).end();
});

function logBlock(ip, filterResult) {
    console.log("BLOCKED | IP: " + ip + " | Filter: " + filterResult.filterName + " | Reason: " + filterResult.reason);
    if (LOG_BLOCKED) {
        const fs = require("fs");
        const logEntry = {
            timestamp: new Date().toISOString(),
            ip: ip,
            filter: filterResult.filterName,
            reason: filterResult.reason
        };
        fs.appendFileSync("/opt/botguard-shield/logs/blocked.log", JSON.stringify(logEntry) + "
");
    }
}

app.listen(PORT, "127.0.0.1", () => {
    console.log("BotGuard Auth Service running on 127.0.0.1:" + PORT);
});
```

### Step 10.2 — Configure NGINX with auth_request

Edit your NGINX site config:

```
sudo nano /etc/nginx/sites-available/default
```

Replace or modify to:

```
server {
    listen 80;
    server_name yourdomain.com;

    # Auth subrequest to BotGuard
    location = /botguard-auth {
        internal;
        proxy_pass http://127.0.0.1:3000/auth-check;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Original-URI $request_uri;
        proxy_set_header X-Original-Method $request_method;
        proxy_set_header X-Original-UA $http_user_agent;
        proxy_set_header X-Original-Accept $http_accept;
        proxy_set_header X-Original-Accept-Language $http_accept_language;
        proxy_set_header X-Original-Accept-Encoding $http_accept_encoding;
        proxy_set_header X-Original-Sec-Ch-Ua $http_sec_ch_ua;
        proxy_set_header X-Original-Referer $http_referer;
        proxy_set_header X-Original-Cookie $http_cookie;
        proxy_set_header X-Original-PoW-Token $http_x_pow_token;
        proxy_set_header X-Original-VM-Report $http_x_vm_report;
        proxy_set_header X-Original-JA3 $http_x_ja3_hash;
    }

    # Redirect blocked visitors to Google
    error_page 403 = @botguard_blocked;
    location @botguard_blocked {
        return 302 https://www.google.com;
    }

    # Client-side script and report endpoints go directly to BotGuard
    location = /botguard-client.js {
        proxy_pass http://127.0.0.1:3000/botguard-client.js;
    }

    location = /api/bot-report {
        proxy_pass http://127.0.0.1:3000/api/bot-report;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location = /api/vm-report {
        proxy_pass http://127.0.0.1:3000/api/vm-report;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location = /api/bot-log {
        proxy_pass http://127.0.0.1:3000/api/bot-log;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # All other locations use auth_request
    location / {
        auth_request /botguard-auth;

        # Your existing proxy_pass to backend
        proxy_pass http://your-backend-server:port;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 10.3 — Test and restart NGINX:

```
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10.4 — Start BotGuard:

```
cd /opt/botguard-shield
node server.js
```

### Step 10.5 — Verify the traffic flow:

```
Visitor browser → yourdomain.com:80 → NGINX → auth_request to BotGuard (port 3000)
                                                  |
                                            200 = allow → NGINX proxies to backend
                                            403 = block → NGINX redirects to google.com
```

---

## 11. Option C — BotGuard Inside a Node.js Reverse Proxy

Use this option if your reverse proxy is already a Node.js application.

### Step 11.1 — Add BotGuard to your existing proxy

In your existing Node.js reverse proxy code, add the following:

```
// At the top of your existing proxy file, add these requires:
const path = require("path");
const filter1 = require("/opt/botguard-shield/filters/filter1-browser-automation");
const filter2 = require("/opt/botguard-shield/filters/filter2-hosting-provider");
const filter3 = require("/opt/botguard-shield/filters/filter3-botguard");
const filter4 = require("/opt/botguard-shield/filters/filter4-search-engine-robots");
const filter5 = require("/opt/botguard-shield/filters/filter5-hardware-virtualization");

const REDIRECT_URL = "https://www.google.com";

// Add this middleware BEFORE your proxy routes:
app.use(async (req, res, next) => {
    const skipPaths = ["/api/bot-report", "/api/vm-report", "/api/bot-log"];
    if (skipPaths.includes(req.path)) return next();

    const f1 = filter1(req);
    if (!f1.passed) return res.redirect(302, REDIRECT_URL);

    const f2 = await filter2(req);
    if (!f2.passed) return res.redirect(302, REDIRECT_URL);

    const f3 = filter3(req);
    if (!f3.passed) return res.redirect(302, REDIRECT_URL);

    const f4 = await filter4(req);
    if (!f4.passed) return res.redirect(302, REDIRECT_URL);

    const f5 = filter5(req);
    if (!f5.passed) return res.redirect(302, REDIRECT_URL);

    next();
});

// Serve client-side script
app.use("/botguard-client.js", express.static("/opt/botguard-shield/public/botguard-client.js"));

// Report endpoints
app.post("/api/bot-report", (req, res) => res.status(204).end());
app.post("/api/vm-report", (req, res) => res.status(204).end());
app.post("/api/bot-log", (req, res) => res.status(204).end());

// Then your existing proxy routes continue below...
```

### Step 11.2 — Install dependencies in your existing project:

```
npm install node-fetch@2 ua-parser-js
```

### Step 11.3 — Restart your proxy and test.

---

## 12. Inject the Client-Side Script

The client-side detection script must be loaded in the browser for Filters 3 and 5 to receive client reports. You need to add a script tag to your HTML pages.

### Step 12.1 — Add this script tag to the head section of every HTML page on your site:

```
<script src="/botguard-client.js"></script>
```

It must be the FIRST script tag in the head, before any other JavaScript.

### Step 12.2 — If your backend is a template engine (EJS, Pug, Handlebars, etc.):

Add the script tag to your base layout template so it appears on every page automatically.

For EJS:
```
<head>
    <script src="/botguard-client.js"></script>
    <%- /* rest of your head content */ %>
</head>
```

For Pug:
```
head
    script(src="/botguard-client.js")
```

### Step 12.3 — If your backend is a SPA (React, Vue, Angular):

Add the script tag to your public/index.html file:

```
<head>
    <script src="/botguard-client.js"></script>
    <!-- rest of your head -->
</head>
```

### Step 12.4 — If you cannot modify HTML (third party backend):

Use NGINX sub_filter to inject the script tag:

```
location / {
    proxy_pass http://your-backend;
    sub_filter '</head>' '<script src="/botguard-client.js"></script></head>';
    sub_filter_once on;
    proxy_set_header Accept-Encoding "";
}
```

---

## 13. Set Up SSL/HTTPS

Step 13.1 — Install Certbot:

```
sudo apt install -y certbot python3-certbot-nginx
```

Step 13.2 — Obtain SSL certificate:

```
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Step 13.3 — Follow the prompts. Select option 2 to redirect all HTTP to HTTPS.

Step 13.4 — Verify auto-renewal:

```
sudo certbot renew --dry-run
```

Step 13.5 — Verify HTTPS is working:

```
curl -I https://yourdomain.com
```

---

## 14. Run BotGuard as a Background Service

You need BotGuard to run permanently, restart on crash, and start on boot.

### Method 1 — Using PM2 (recommended)

Step 14.1 — Start with PM2:

```
cd /opt/botguard-shield
pm2 start server.js --name botguard-shield
```

Step 14.2 — Save the process list:

```
pm2 save
```

Step 14.3 — Set PM2 to start on boot:

```
pm2 startup
```

Run the command it outputs (it will look like sudo env PATH=... pm2 startup ...).

Step 14.4 — Useful PM2 commands:

```
pm2 status                    # Check if running
pm2 logs botguard-shield      # View live logs
pm2 restart botguard-shield   # Restart
pm2 stop botguard-shield      # Stop
pm2 monit                     # Live monitoring dashboard
```

### Method 2 — Using systemd

Step 14.5 — Create a systemd service file:

```
sudo nano /etc/systemd/system/botguard.service
```

Paste this:

```
[Unit]
Description=BotGuard Shield
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/botguard-shield
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
StandardOutput=append:/opt/botguard-shield/logs/stdout.log
StandardError=append:/opt/botguard-shield/logs/stderr.log

[Install]
WantedBy=multi-user.target
```

Step 14.6 — Enable and start:

```
sudo systemctl daemon-reload
sudo systemctl enable botguard
sudo systemctl start botguard
sudo systemctl status botguard
```

---

## 15. Firewall Configuration

You must block direct access to your backend servers. Only BotGuard and NGINX should be able to reach them.

### Using UFW (Ubuntu/Debian)

Step 15.1 — Allow SSH, HTTP, HTTPS:

```
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Step 15.2 — Block direct access to BotGuard port from outside:

```
sudo ufw deny 3000/tcp
sudo ufw deny 8080/tcp
```

Step 15.3 — Enable firewall:

```
sudo ufw enable
sudo ufw status
```

### Using firewalld (CentOS/RHEL)

```
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --remove-port=3000/tcp
sudo firewall-cmd --permanent --remove-port=8080/tcp
sudo firewall-cmd --reload
```

---

## 16. Testing the Full Pipeline

After everything is set up, run these tests to verify each filter works.

Test 1 — Normal browser access:

Open your domain in a real browser. You should see your website normally.

Test 2 — Block empty User-Agent (Filter 1):

```
curl -H "User-Agent: " https://yourdomain.com -v
```

Expected: 302 redirect to google.com

Test 3 — Block bot User-Agent (Filter 1):

```
curl -H "User-Agent: python-requests/2.28.0" https://yourdomain.com -v
```

Expected: 302 redirect to google.com

Test 4 — Block Selenium User-Agent (Filter 1):

```
curl -H "User-Agent: Mozilla/5.0 Selenium" https://yourdomain.com -v
```

Expected: 302 redirect to google.com

Test 5 — Block wget (Filter 1):

```
wget https://yourdomain.com -O /dev/null
```

Expected: 302 redirect to google.com

Test 6 — Test honeypot (Filter 3):

```
curl https://yourdomain.com/trap-endpoint-do-not-follow -v
```

Expected: 302 redirect to google.com

Test 7 — Test bypass key:

```
curl -H "X-Bypass-Key: your-bypass-key-here" -H "User-Agent: curl" https://yourdomain.com -v
```

Expected: 200 OK (bypass key skips all filters)

Test 8 — Test from a cloud server:

SSH into an AWS/GCP/DigitalOcean server and try:

```
curl -H "User-Agent: Mozilla/5.0" -H "Accept: text/html" -H "Accept-Language: en-US" -H "Accept-Encoding: gzip" https://yourdomain.com -v
```

Expected: 302 redirect to google.com (Filter 2 blocks hosting IPs)

---

## 17. Monitoring and Logs

Step 17.1 — Watch live blocked requests:

```
tail -f /opt/botguard-shield/logs/blocked.log
```

Step 17.2 — Count blocked requests by filter:

```
cat /opt/botguard-shield/logs/blocked.log | jq -r '.filter' | sort | uniq -c | sort -rn
```

Step 17.3 — Find top blocked IPs:

```
cat /opt/botguard-shield/logs/blocked.log | jq -r '.ip' | sort | uniq -c | sort -rn | head -20
```

Step 17.4 — Find top blocked reasons:

```
cat /opt/botguard-shield/logs/blocked.log | jq -r '.reason' | sort | uniq -c | sort -rn | head -20
```

Step 17.5 — Set up log rotation:

```
sudo nano /etc/logrotate.d/botguard
```

Paste:

```
/opt/botguard-shield/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

---

## 18. Whitelisting Your Own IPs

### Method 1 — Bypass key header

Add this header to your monitoring tools, health checks, and admin requests:

```
X-Bypass-Key: your-bypass-key-value
```

### Method 2 — IP whitelist in server.js

Add this at the top of the botGuardPipeline function:

```
const WHITELISTED_IPS = [
    "1.2.3.4",        // Your office IP
    "5.6.7.8",        // Your home IP
    "10.0.0.0/8",     // Internal network
    "127.0.0.1"       // Localhost
];

const clientIP = (req.ip || "").replace(/^::ffff:/, "");
if (WHITELISTED_IPS.includes(clientIP)) return next();
```

### Method 3 — NGINX whitelist

Add this before the auth_request or proxy_pass:

```
set $skip_botguard 0;
if ($remote_addr = 1.2.3.4) {
    set $skip_botguard 1;
}
if ($skip_botguard = 0) {
    auth_request /botguard-auth;
}
```

---

## 19. Updating Hosting IP Ranges

Filter 2 automatically downloads fresh IP ranges from AWS and GCP every 24 hours. The ranges are cached in /opt/botguard-shield/data/hosting-ranges.json.

To manually refresh:

Step 19.1 — Delete the cache:

```
rm /opt/botguard-shield/data/hosting-ranges.json
```

Step 19.2 — Restart BotGuard:

```
pm2 restart botguard-shield
```

It will re-download fresh ranges on startup.

To add custom IP ranges, edit hosting-ranges.json and add your CIDR blocks to the array.

---

## 20. Troubleshooting

Problem: All visitors are being blocked.
Solution: Check if your NGINX is sending the correct headers to BotGuard. The most common issue is missing X-Real-IP or X-Forwarded-For headers, which causes BotGuard to see the NGINX IP instead of the real visitor IP. Make sure trust proxy is set to true and NGINX sends the real IP.

Problem: Legitimate users on mobile are blocked.
Solution: The behavioral check requires mouse movement on desktop and touch/scroll on mobile within 8 seconds. If your page loads slowly, increase the timeout in botguard-client.js. Search for setTimeout and change 8000 to 12000 or 15000.

Problem: Filter 2 is not blocking hosting IPs.
Solution: Check if hosting-ranges.json exists and has content. Check PM2 logs for errors loading IP ranges. The ip-api.com free tier has a rate limit of 45 requests per minute. If you have high traffic, consider using a paid IP reputation API.

Problem: BotGuard crashes or runs out of memory.
Solution: The IP cache in filter2 and filter3 grows over time. If you have millions of unique visitors, the cache will use a lot of memory. Add a cache size limit or use Redis instead of in-memory Maps.

Problem: NGINX returns 500 instead of 302 when blocking.
Solution: Make sure the error_page 403 directive is set correctly. Use "error_page 403 = @botguard_blocked" with the equals sign, not "error_page 403 @botguard_blocked".

Problem: WebSocket connections are blocked.
Solution: In Option A, make sure ws: true is set in createProxyMiddleware. In Option B, WebSocket upgrade requests do not go through auth_request by default. You need to handle the upgrade event separately.

Problem: The client-side script is not loading.
Solution: Check that /botguard-client.js is being served. Open browser dev tools, go to Network tab, and check if the script loads with 200 status. If using Option B, make sure the NGINX location for /botguard-client.js proxies to BotGuard.

Problem: Certbot fails to obtain SSL certificate.
Solution: Make sure your domain DNS A record points to your server IP. Make sure port 80 is open. Make sure NGINX is running and listening on port 80.

Problem: I need to temporarily disable BotGuard.
Solution: Stop the service with pm2 stop botguard-shield or systemctl stop botguard. Then either remove the auth_request line from NGINX or change the proxy_pass to go directly to your backend.

---

## 21. Production Checklist

Before going live, verify everything on this list:

- [ ] All 5 filter files are in /opt/botguard-shield/filters/
- [ ] botguard-client.js is being served and loads in the browser
- [ ] .env file has a strong random BYPASS_KEY
- [ ] .env file has LOG_BLOCKED=true
- [ ] hosting-ranges.json exists in /opt/botguard-shield/data/
- [ ] NGINX is configured correctly (test with nginx -t)
- [ ] SSL/HTTPS is set up and working
- [ ] BotGuard is running via PM2 or systemd
- [ ] BotGuard auto-starts on server reboot
- [ ] Firewall blocks direct access to ports 3000 and 8080
- [ ] Your own IP is whitelisted or you have the bypass key saved
- [ ] Log rotation is configured
- [ ] You tested with curl and confirmed bots are blocked
- [ ] You tested with a real browser and confirmed access works
- [ ] You tested from a cloud server and confirmed hosting IPs are blocked
- [ ] Backend servers check for X-BotGuard-Verified header
- [ ] The client-side script tag is in the head of all HTML pages
- [ ] Report endpoints (/api/bot-report, /api/vm-report, /api/bot-log) are accessible
- [ ] DNS is pointing to the correct server
- [ ] You have SSH access saved in case you lock yourself out

---

This completes the setup. Your website is now protected by 5 layers of bot detection, both server-side and client-side, with all failed checks redirecting to google.com.

