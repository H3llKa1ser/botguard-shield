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
