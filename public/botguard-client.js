(function () {
    "use strict";

    var REDIRECT_URL = "https://www.google.com";

    // ─────────────────────────────────────────
    // Immediate redirect on detection
    // ─────────────────────────────────────────
    function block(reason) {
        console.warn("BotGuard Client Block:", reason);

        try {
            navigator.sendBeacon(
                "/api/bot-report",
                JSON.stringify({
                    isBot: true,
                    reason: reason,
                    timestamp: Date.now(),
                    url: window.location.href,
                })
            );
        } catch (e) {}

        window.location.replace(REDIRECT_URL);
        document.documentElement.innerHTML = "";
        throw new Error("BotGuard: Access Denied - " + reason);
    }

    // =============================================
    // FILTER 1: BROWSER AUTOMATION OBJECTS
    // =============================================

    // Selenium detection
    if (navigator.webdriver) block("navigator.webdriver is true");
    if (window.__selenium_unwrap) block("Selenium unwrap detected");
    if (window.__fxdriver_unwrap) block("Firefox driver detected");
    if (document.__selenium_evaluate) block("Selenium evaluate detected");
    if (document.__selenium_unwrap) block("Selenium doc unwrap detected");
    if (window.callSelenium) block("callSelenium detected");
    if (window._Selenium_IDE_Recorder) block("Selenium IDE detected");

    // PhantomJS detection
    if (window.callPhantom || window._phantom || window.phantom)
        block("PhantomJS detected");

    // Nightmare.js detection
    if (window.__nightmare) block("Nightmare.js detected");

    // CasperJS detection
    if (window.__casper) block("CasperJS detected");

    // DOM automation detection
    if (window.domAutomation || window.domAutomationController)
        block("domAutomation detected");

    // CDP (Chrome DevTools Protocol) runtime detection
    if (window.cdc_adoQpoasnfa76pfcZLmcfl_Array ||
        window.cdc_adoQpoasnfa76pfcZLmcfl_Promise ||
        window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol)
        block("Chrome DevTools Protocol runtime variable detected");

    // Detect any __driver_ prefixed globals (generic driver detection)
    for (var prop in window) {
        if (/^__driver_/.test(prop) || /^__webdriver_/.test(prop)) {
            block("Driver global variable detected: " + prop);
        }
    }

    // Headless Chrome in User-Agent
    if (/HeadlessChrome/.test(navigator.userAgent))
        block("HeadlessChrome in User-Agent");

    // Chrome spoof check (UA says Chrome but no window.chrome object)
    if (/Chrome/.test(navigator.userAgent) && !window.chrome)
        block("Fake Chrome detected (no window.chrome object)");

    // Empty or missing languages
    if (!navigator.languages || navigator.languages.length === 0)
        block("navigator.languages is empty or undefined");

    // No plugins on desktop browser
    if (
        navigator.plugins.length === 0 &&
        !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    ) {
        block("No browser plugins detected on desktop browser");
    }

    // Zero outer window dimensions (headless indicator)
    if (window.outerWidth === 0 && window.outerHeight === 0)
        block("Zero outer window dimensions - headless browser");

    // Zero screen dimensions
    if (screen.width === 0 || screen.height === 0)
        block("Zero screen dimensions detected");

    // Abnormally low color depth
    if (screen.colorDepth < 8)
        block("Abnormally low color depth: " + screen.colorDepth);

    // Missing User-Agent
    if (!navigator.userAgent || navigator.userAgent.trim() === "")
        block("Empty or missing User-Agent");

    // Known bot/scraper User-Agent patterns
    var botPatterns = [
        /bot/i, /crawl/i, /spider/i, /scrape/i, /headless/i,
        /phantom/i, /selenium/i, /puppeteer/i, /playwright/i,
        /wget/i, /curl/i, /httpie/i, /python-requests/i,
        /go-http-client/i, /java\//i, /libwww/i, /mechanize/i,
        /scrapy/i, /httpclient/i, /okhttp/i, /node-fetch/i,
        /axios/i, /undici/i, /aiohttp/i, /colly/i,
        /postman/i, /insomnia/i
    ];
    for (var b = 0; b < botPatterns.length; b++) {
        if (botPatterns[b].test(navigator.userAgent))
            block("Bot UA pattern matched: " + botPatterns[b]);
    }

    // =============================================
    // FILTER 2: PLATFORM / UA CONSISTENCY CHECK
    // =============================================

    var plat = navigator.platform || "";
    var ua = navigator.userAgent || "";

    if (/Windows/.test(ua) && !/Win/.test(plat))
        block("UA says Windows but platform is: " + plat);
    if (/Macintosh/.test(ua) && !/Mac/.test(plat))
        block("UA says Mac but platform is: " + plat);
    if (/Linux/.test(ua) && !/Linux/.test(plat) && !/Win|Mac/.test(ua))
        block("UA says Linux but platform is: " + plat);

    // =============================================
    // FILTER 3: WEBGL GPU CHECK (VM DETECTION)
    // =============================================

    var vmReport = {
        gpuRenderer: null,
        gpuVendor: null,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory || null,
        screenWidth: screen.width,
        screenHeight: screen.height,
        colorDepth: screen.colorDepth,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        webglAvailable: true,
        canvasBlank: false,
        battery: null,
        mediaDeviceCount: null,
        computeTimeMs: null,
        touchSupport: ("ontouchstart" in window || navigator.maxTouchPoints > 0),
        maxTouchPoints: navigator.maxTouchPoints || 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    };

    try {
        var canvas = document.createElement("canvas");
        var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        if (!gl) {
            vmReport.webglAvailable = false;
            block("WebGL not available - likely headless or VM");
        } else {
            var debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
                vmReport.gpuRenderer =
                    gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
                vmReport.gpuVendor =
                    gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";

                var combined = (
                    vmReport.gpuRenderer + " " + vmReport.gpuVendor
                ).toLowerCase();

                var vmGPUs = [
                    "swiftshader",
                    "llvmpipe",
                    "mesa",
                    "virtualbox",
                    "vmware",
                    "parallels",
                    "hyper-v",
                    "qemu",
                    "microsoft basic",
                    "microsoft basic render",
                    "microsoft basic display",
                    "google swiftshader",
                    "virgl",
                    "virtio",
                    "bhyve",
                    "kvm",
                    "xen",
                    "bochs",
                    "innotek",
                    "red hat virtio",
                    "amazon elastic",
                    "cirrus logic",
                ];

                for (var g = 0; g < vmGPUs.length; g++) {
                    if (combined.indexOf(vmGPUs[g]) !== -1) {
                        try {
                            navigator.sendBeacon(
                                "/api/vm-report",
                                JSON.stringify(vmReport)
                            );
                        } catch (e) {}
                        block("VM GPU detected: " + vmReport.gpuRenderer);
                    }
                }
            }
        }
    } catch (e) {
        vmReport.webglAvailable = false;
        block("WebGL detection error: " + e.message);
    }

    // =============================================
    // FILTER 4: CANVAS FINGERPRINT CHECK
    // =============================================

    try {
        var fpCanvas = document.createElement("canvas");
        fpCanvas.width = 200;
        fpCanvas.height = 50;
        var fpCtx = fpCanvas.getContext("2d");
        fpCtx.textBaseline = "top";
        fpCtx.font = "14px 'Arial'";
        fpCtx.fillStyle = "#f60";
        fpCtx.fillRect(0, 0, 200, 50);
        fpCtx.fillStyle = "#069";
        fpCtx.fillText("BotGuard\u00AE\u2665", 2, 15);
        fpCtx.fillStyle = "rgba(102,204,0,0.7)";
        fpCtx.fillText("TestString123", 4, 35);
        var fpData = fpCanvas.toDataURL();
        if (!fpData || fpData === "data:," || fpData.length < 100) {
            vmReport.canvasBlank = true;
            block("Canvas fingerprint is blank or default - headless browser");
        }
    } catch (e) {
        vmReport.canvasBlank = true;
        block("Canvas fingerprinting failed: " + e.message);
    }

    // =============================================
    // FILTER 5: HARDWARE CHECKS
    // =============================================

    // CPU cores check
    if (
        navigator.hardwareConcurrency !== undefined &&
        navigator.hardwareConcurrency <= 1
    ) {
        block(
            "Suspiciously low CPU cores: " + navigator.hardwareConcurrency
        );
    }

    // Device memory check
    if (navigator.deviceMemory !== undefined && navigator.deviceMemory < 1) {
        block(
            "Suspiciously low device memory: " + navigator.deviceMemory + "GB"
        );
    }

    // Computation speed test (VMs with shared CPU are slower)
    var compStart = performance.now();
    for (var k = 0; k < 1000000; k++) {
        Math.sqrt(k);
    }
    vmReport.computeTimeMs = Math.round(performance.now() - compStart);
    if (vmReport.computeTimeMs > 100) {
        block(
            "Abnormally slow computation: " +
                vmReport.computeTimeMs +
                "ms - possible VM"
        );
    }

    // =============================================
    // FILTER 6: BATTERY API (VM DETECTION)
    // =============================================

    if ("getBattery" in navigator) {
        navigator
            .getBattery()
            .then(function (battery) {
                vmReport.battery = {
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime,
                    level: battery.level,
                };

                if (
                    battery.charging &&
                    battery.chargingTime === 0 &&
                    battery.dischargingTime === Infinity &&
                    battery.level === 1
                ) {
                    sendVMReport();
                    block(
                        "Virtual battery detected - always 100% and always charging"
                    );
                }
            })
            .catch(function () {});
    }

    // =============================================
    // FILTER 7: MEDIA DEVICES CHECK
    // =============================================

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices
            .enumerateDevices()
            .then(function (devices) {
                vmReport.mediaDeviceCount = devices.length;
                if (devices.length === 0) {
                    sendVMReport();
                    block(
                        "No media devices found - likely headless browser or VM"
                    );
                }
            })
            .catch(function () {});
    }

    // =============================================
    // FILTER 8: PERMISSIONS API INCONSISTENCY
    // =============================================

    if (navigator.permissions) {
        navigator.permissions
            .query({ name: "notifications" })
            .then(function (result) {
                if (
                    Notification.permission === "default" &&
                    result.state === "denied"
                ) {
                    block(
                        "Permissions API inconsistency - automation fingerprint"
                    );
                }
            })
            .catch(function () {});
    }

    // =============================================
    // FILTER 9: AUDIO CONTEXT FINGERPRINT
    // =============================================

    try {
        var audioCtx = new (window.AudioContext ||
            window.webkitAudioContext)();
        if (audioCtx.sampleRate === 0) {
            block("Audio context sample rate is 0 - headless browser");
        }
        audioCtx.close();
    } catch (e) {
        // AudioContext not available - not conclusive alone
    }

    // =============================================
    // FILTER 10: IFRAME PROTECTION
    // =============================================

    if (window.self !== window.top) {
        block("Page loaded inside an iframe - clickjacking attempt");
    }

    // =============================================
    // FILTER 11: BEHAVIORAL ANALYSIS (DELAYED)
    // =============================================

    var humanSignals = {
        mouseMoved: false,
        mouseVariance: false,
        clicked: false,
        scrolled: false,
        keyPressed: false,
        touchUsed: false,
        mousePositions: [],
        mouseTimestamps: [],
        keyTimestamps: [],
        scrollPositions: [],
    };

    // Track mouse movement
    document.addEventListener("mousemove", function (e) {
        humanSignals.mouseMoved = true;
        humanSignals.mousePositions.push({ x: e.clientX, y: e.clientY });
        humanSignals.mouseTimestamps.push(Date.now());

        // Keep only last 100 positions to save memory
        if (humanSignals.mousePositions.length > 100) {
            humanSignals.mousePositions = humanSignals.mousePositions.slice(-100);
            humanSignals.mouseTimestamps = humanSignals.mouseTimestamps.slice(-100);
        }

        // Check for non-linear movement (bots move in straight lines)
        if (humanSignals.mousePositions.length >= 5) {
            var pts = humanSignals.mousePositions.slice(-5);
            for (var m = 2; m < pts.length; m++) {
                var dx1 = pts[m - 1].x - pts[m - 2].x;
                var dy1 = pts[m - 1].y - pts[m - 2].y;
                var dx2 = pts[m].x - pts[m - 1].x;
                var dy2 = pts[m].y - pts[m - 1].y;
                var cross = Math.abs(dx1 * dy2 - dy1 * dx2);
                if (cross > 2) {
                    humanSignals.mouseVariance = true;
                    break;
                }
            }
        }
    });

    // Track clicks
    document.addEventListener("click", function () {
        humanSignals.clicked = true;
    });

    // Track scrolling
    document.addEventListener("scroll", function () {
        humanSignals.scrolled = true;
        humanSignals.scrollPositions.push({
            y: window.scrollY,
            t: Date.now(),
        });
    });

    // Track key presses
    document.addEventListener("keydown", function () {
        humanSignals.keyPressed = true;
        humanSignals.keyTimestamps.push(Date.now());
    });

    // Track touch events
    document.addEventListener("touchstart", function () {
        humanSignals.touchUsed = true;
    });

    // Check human interaction after 8 seconds
    setTimeout(function () {
        var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(
            navigator.userAgent
        );

        if (isMobile) {
            // Mobile: must have touch or scroll
            if (!humanSignals.touchUsed && !humanSignals.scrolled) {
                block("No human interaction after 8 seconds (mobile device)");
            }
        } else {
            // Desktop: must have mouse movement
            if (!humanSignals.mouseMoved) {
                block("No mouse movement after 8 seconds (desktop)");
            }

            // If mouse moved but only in straight lines = bot
            if (
                humanSignals.mouseMoved &&
                !humanSignals.mouseVariance &&
                humanSignals.mousePositions.length > 10
            ) {
                block(
                    "Mouse moved only in straight lines - bot-like behavior"
                );
            }

            // Check mouse speed consistency (bots have inhuman consistency)
            if (humanSignals.mouseTimestamps.length > 10) {
                var speeds = [];
                for (
                    var s = 1;
                    s < humanSignals.mousePositions.length;
                    s++
                ) {
                    var dx =
                        humanSignals.mousePositions[s].x -
                        humanSignals.mousePositions[s - 1].x;
                    var dy =
                        humanSignals.mousePositions[s].y -
                        humanSignals.mousePositions[s - 1].y;
                    var dt =
                        humanSignals.mouseTimestamps[s] -
                        humanSignals.mouseTimestamps[s - 1];
                    if (dt > 0) {
                        var speed = Math.sqrt(dx * dx + dy * dy) / dt;
                        speeds.push(speed);
                    }
                }

                if (speeds.length > 5) {
                    var avgSpeed =
                        speeds.reduce(function (a, c) {
                            return a + c;
                        }, 0) / speeds.length;
                    var speedVariance =
                        speeds.reduce(function (sum, val) {
                            return sum + Math.pow(val - avgSpeed, 2);
                        }, 0) / speeds.length;

                    // Very low variance in speed = mechanical movement
                    if (speedVariance < 0.001 && speeds.length > 20) {
                        block(
                            "Mouse speed has near-zero variance - mechanical movement detected"
                        );
                    }
                }
            }
        }

        // If we reach here, behavioral checks passed
        // Update UI to show content is safe
        var statusEl = document.getElementById("status");
        var contentEl = document.getElementById("content");
        if (statusEl) {
            statusEl.className = "status passed";
            statusEl.textContent = "All security checks passed.";
        }
        if (contentEl) {
            contentEl.style.display = "block";
        }
    }, 8000);

    // Second behavioral check at 15 seconds (stricter)
    setTimeout(function () {
        var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(
            navigator.userAgent
        );

        if (!isMobile) {
            // On desktop, by 15 seconds we should have multiple interaction types
            var interactionTypes = 0;
            if (humanSignals.mouseMoved) interactionTypes++;
            if (humanSignals.clicked) interactionTypes++;
            if (humanSignals.scrolled) interactionTypes++;
            if (humanSignals.keyPressed) interactionTypes++;

            // If only 1 type of interaction, could still be a bot
            // Just log this - don't block (to avoid false positives)
        }

        // Check for keyboard timing consistency (bots type at exact intervals)
        if (humanSignals.keyTimestamps.length > 5) {
            var keyIntervals = [];
            for (var ki = 1; ki < humanSignals.keyTimestamps.length; ki++) {
                keyIntervals.push(
                    humanSignals.keyTimestamps[ki] -
                        humanSignals.keyTimestamps[ki - 1]
                );
            }
            var avgKeyInterval =
                keyIntervals.reduce(function (a, c) {
                    return a + c;
                }, 0) / keyIntervals.length;
            var keyVariance =
                keyIntervals.reduce(function (sum, val) {
                    return sum + Math.pow(val - avgKeyInterval, 2);
                }, 0) / keyIntervals.length;
            var keyStdDev = Math.sqrt(keyVariance);

            if (keyStdDev < 10 && keyIntervals.length > 10) {
                block(
                    "Keyboard typing has near-zero variance - automated input detected"
                );
            }
        }
    }, 15000);

    // =============================================
    // FILTER 12: HONEYPOT LINK TRAP
    // =============================================

    window.addEventListener("DOMContentLoaded", function () {
        // Create hidden link that only bots would find and click
        var hp = document.createElement("a");
        hp.href = "/trap-endpoint-do-not-follow";
        hp.textContent = "Important Link";
        hp.style.cssText =
            "position:absolute;left:-9999px;top:-9999px;" +
            "width:1px;height:1px;overflow:hidden;opacity:0;" +
            "pointer-events:auto;z-index:-1;";
        hp.setAttribute("tabindex", "-1");
        hp.setAttribute("aria-hidden", "true");
        hp.addEventListener("click", function (e) {
            e.preventDefault();
            block("Honeypot link clicked - only bots find hidden links");
        });
        document.body.appendChild(hp);

        // Create second hidden link with different bait
        var hp2 = document.createElement("a");
        hp2.href = "/admin-login";
        hp2.textContent = "Admin Panel";
        hp2.style.cssText =
            "position:absolute;left:-9999px;top:-9999px;" +
            "width:1px;height:1px;overflow:hidden;opacity:0;";
        hp2.setAttribute("tabindex", "-1");
        hp2.setAttribute("aria-hidden", "true");
        hp2.addEventListener("click", function (e) {
            e.preventDefault();
            block("Honeypot admin link clicked");
        });
        document.body.appendChild(hp2);

        // Monitor honeypot form fields
        var hpFields = document.querySelectorAll(
            'input[name="website_url_hp"], input[name="fax_number_hp"], input[name="middle_name_hp"]'
        );
        for (var hf = 0; hf < hpFields.length; hf++) {
            hpFields[hf].addEventListener("input", function () {
                if (this.value.trim() !== "") {
                    block(
                        "Honeypot form field filled: " + this.name
                    );
                }
            });
        }
    });

    // =============================================
    // FILTER 13: PROOF-OF-WORK FOR FETCH/XHR
    // =============================================

    async function solvePoW() {
        var challenge =
            Date.now().toString(36) +
            "." +
            Math.random().toString(36).substr(2);
        var nonce = 0;
        while (true) {
            var data = challenge + ":" + nonce;
            var buffer = await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(data)
            );
            var hex = Array.from(new Uint8Array(buffer))
                .map(function (b) {
                    return b.toString(16).padStart(2, "0");
                })
                .join("");
            if (hex.startsWith("0000")) {
                return challenge + ":" + nonce;
            }
            nonce++;
            if (nonce % 5000 === 0) {
                await new Promise(function (r) {
                    setTimeout(r, 0);
                });
            }
        }
    }

    // Override fetch to include PoW token and VM report
    var _fetch = window.fetch;
    window.fetch = async function () {
        var args = Array.from(arguments);
        try {
            var token = await solvePoW();
            if (typeof args[1] !== "object" || args[1] === null)
                args[1] = {};
            if (!args[1].headers) args[1].headers = {};

            if (args[1].headers instanceof Headers) {
                args[1].headers.set("X-PoW-Token", token);
                args[1].headers.set(
                    "X-VM-Report",
                    JSON.stringify(vmReport)
                );
            } else {
                args[1].headers["X-PoW-Token"] = token;
                args[1].headers["X-VM-Report"] = JSON.stringify(vmReport);
            }
        } catch (e) {}
        return _fetch.apply(this, args);
    };

    // Override XMLHttpRequest to include PoW token
    var _xhrOpen = XMLHttpRequest.prototype.open;
    var _xhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function () {
        this._botguardArgs = arguments;
        return _xhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        var xhr = this;
        solvePoW()
            .then(function (token) {
                xhr.setRequestHeader("X-PoW-Token", token);
                xhr.setRequestHeader(
                    "X-VM-Report",
                    JSON.stringify(vmReport)
                );
                _xhrSend.call(xhr, body);
            })
            .catch(function () {
                _xhrSend.call(xhr, body);
            });
    };

    // =============================================
    // FILTER 14: WEBRTC LEAK DETECTION
    // =============================================

    try {
        var rtc = new (window.RTCPeerConnection ||
            window.webkitRTCPeerConnection ||
            window.mozRTCPeerConnection)(
            { iceServers: [] },
            { optional: [{ RtpDataChannels: true }] }
        );

        rtc.createDataChannel("");
        rtc.createOffer().then(function (offer) {
            rtc.setLocalDescription(offer);
        });

        rtc.onicecandidate = function (event) {
            if (event && event.candidate && event.candidate.candidate) {
                var candidate = event.candidate.candidate;
                // Extract IP from candidate
                var ipMatch = candidate.match(
                    /([0-9]{1,3}(\.[0-9]{1,3}){3})/
                );
                if (ipMatch) {
                    var localIP = ipMatch[1];
                    vmReport.localIP = localIP;

                    // Check if local IP is in VM/hosting ranges
                    // 10.0.2.x is VirtualBox default NAT
                    if (/^10\.0\.2\./.test(localIP)) {
                        sendVMReport();
                        block(
                            "VirtualBox NAT IP detected via WebRTC: " +
                                localIP
                        );
                    }
                }
            }
        };

        setTimeout(function () {
            rtc.close();
        }, 5000);
    } catch (e) {
        // WebRTC not available - not conclusive
    }

    // =============================================
    // FILTER 15: FONT DETECTION
    // =============================================

    try {
        var testFonts = [
            "Arial",
            "Verdana",
            "Times New Roman",
            "Courier New",
            "Georgia",
            "Comic Sans MS",
            "Impact",
            "Trebuchet MS",
            "Palatino Linotype",
            "Lucida Console",
        ];

        var installedFonts = 0;
        var testString = "mmmmmmmmmmlli";
        var baseCanvas = document.createElement("canvas");
        var baseCtx = baseCanvas.getContext("2d");

        baseCtx.font = "72px monospace";
        var baseWidth = baseCtx.measureText(testString).width;

        for (var fi = 0; fi < testFonts.length; fi++) {
            baseCtx.font = "72px '" + testFonts[fi] + "', monospace";
            var testWidth = baseCtx.measureText(testString).width;
            if (testWidth !== baseWidth) {
                installedFonts++;
            }
        }

        vmReport.installedFonts = installedFonts;

        // Headless browsers typically have very few fonts
        if (installedFonts <= 1) {
            block(
                "Too few fonts installed (" +
                    installedFonts +
                    ") - likely headless browser"
            );
        }
    } catch (e) {}

    // =============================================
    // SEND VM REPORT TO SERVER
    // =============================================

    function sendVMReport() {
        try {
            navigator.sendBeacon(
                "/api/vm-report",
                JSON.stringify(vmReport)
            );
        } catch (e) {}
    }

    // Send initial VM report after 2 seconds (allows async checks to complete)
    setTimeout(sendVMReport, 2000);

    // Send updated report after 10 seconds (includes behavioral data)
    setTimeout(function () {
        vmReport.behavioralData = {
            mouseMoved: humanSignals.mouseMoved,
            mouseVariance: humanSignals.mouseVariance,
            clicked: humanSignals.clicked,
            scrolled: humanSignals.scrolled,
            keyPressed: humanSignals.keyPressed,
            touchUsed: humanSignals.touchUsed,
            mousePositionCount: humanSignals.mousePositions.length,
        };
        sendVMReport();
    }, 10000);

    // =============================================
    // PERIODIC RE-CHECK (every 30 seconds)
    // =============================================

    setInterval(function () {
        // Re-check webdriver flag (can be set after page load)
        if (navigator.webdriver)
            block("navigator.webdriver set after page load");

        // Re-check for injected automation objects
        if (window.__selenium_unwrap)
            block("Selenium injected after page load");
        if (window.callPhantom || window._phantom)
            block("PhantomJS injected after page load");
        if (window.__nightmare)
            block("Nightmare injected after page load");
    }, 30000);

    console.log(
        "BotGuard Client: All immediate checks passed. Behavioral analysis running..."
    );
})();
