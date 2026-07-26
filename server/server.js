/**
 * FlexStream Proxy Server
 * Enhanced proxy server with security features and caching
 * Built by Niranjannn
 */

const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dns = require('dns').promises;

const PORT = parseInt(process.env.PORT, 10) || 4000;
const CACHE_DIR = path.join(__dirname, '.cache');
const MAX_CACHE_SIZE = parseInt(process.env.MAX_CACHE_SIZE, 10) || 100 * 1024 * 1024; // 100MB
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_REDIRECTS = 5;

// Admin API token — required for /api/stats and /api/clear-cache.
// Set ADMIN_TOKEN in the environment; otherwise a random one is generated
// each run and printed to the console so the server is never open by default.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || crypto.randomBytes(24).toString('hex');
const ADMIN_TOKEN_WAS_GENERATED = !process.env.ADMIN_TOKEN;

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Rate limiting
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100; // 100 requests per minute per IP

// Security configuration
const SECURITY = {
    // Hostnames blocked outright, regardless of what they resolve to
    blockedHostnames: [
        'localhost'
    ],

    // Private / internal IP ranges — every proxied request is resolved via
    // DNS first and checked against these, on the *initial* request and on
    // every redirect hop, so a hostname can't be used to smuggle a client
    // to an internal address (DNS rebinding / SSRF).
    blockedCidrs: [
        '127.0.0.0/8',      // loopback
        '10.0.0.0/8',       // private
        '172.16.0.0/12',    // private
        '192.168.0.0/16',   // private
        '169.254.0.0/16',   // link-local (cloud metadata lives here)
        '100.64.0.0/10',    // carrier-grade NAT
        '0.0.0.0/8',        // "this" network
        '::1/128',          // IPv6 loopback
        'fc00::/7',         // IPv6 unique local
        'fe80::/10'         // IPv6 link-local
    ],
    
    // Allowed content types
    allowedContentTypes: [
        'video/', 'audio/', 'application/x-mpegURL', 'application/dash+xml',
        'text/vtt', 'application/octet-stream'
    ],
    
    // Maximum content size (50MB)
    maxContentSize: 50 * 1024 * 1024,
    
    // User agents to rotate
    userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    ]
};

// MIME types for serving static files
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m3u8': 'application/x-mpegURL',
    '.mpd': 'application/dash+xml',
    '.vtt': 'text/vtt; charset=utf-8'
};

// Cache management
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.loadCacheIndex();
    }

    loadCacheIndex() {
        try {
            const indexFile = path.join(CACHE_DIR, 'index.json');
            if (fs.existsSync(indexFile)) {
                const data = fs.readFileSync(indexFile, 'utf8');
                this.cache = new Map(JSON.parse(data));
            }
        } catch (error) {
            console.error('Failed to load cache index:', error.message);
        }
    }

    saveCacheIndex() {
        try {
            const indexFile = path.join(CACHE_DIR, 'index.json');
            const data = JSON.stringify(Array.from(this.cache.entries()));
            fs.writeFileSync(indexFile, data, 'utf8');
        } catch (error) {
            console.error('Failed to save cache index:', error.message);
        }
    }

    getCacheKey(url) {
        return crypto.createHash('md5').update(url).digest('hex');
    }

    has(url) {
        const key = this.getCacheKey(url);
        return this.cache.has(key) && fs.existsSync(path.join(CACHE_DIR, key));
    }

    get(url) {
        const key = this.getCacheKey(url);
        const cacheInfo = this.cache.get(key);
        
        if (!cacheInfo || !fs.existsSync(path.join(CACHE_DIR, key))) {
            return null;
        }

        // Check if cache is expired (24 hours)
        if (Date.now() - cacheInfo.timestamp > 24 * 60 * 60 * 1000) {
            this.delete(url);
            return null;
        }

        try {
            return fs.readFileSync(path.join(CACHE_DIR, key));
        } catch (error) {
            console.error('Failed to read cache:', error.message);
            this.delete(url);
            return null;
        }
    }

    set(url, data, contentType) {
        const key = this.getCacheKey(url);
        
        try {
            fs.writeFileSync(path.join(CACHE_DIR, key), data);
            this.cache.set(key, {
                url,
                timestamp: Date.now(),
                size: data.length,
                contentType
            });
            
            // Clean up if cache is too large
            this.cleanup();
            
            return true;
        } catch (error) {
            console.error('Failed to write cache:', error.message);
            return false;
        }
    }

    delete(url) {
        const key = this.getCacheKey(url);
        
        try {
            const filePath = path.join(CACHE_DIR, key);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            this.cache.delete(key);
            return true;
        } catch (error) {
            console.error('Failed to delete cache:', error.message);
            return false;
        }
    }

    cleanup() {
        let totalSize = 0;
        const entries = Array.from(this.cache.entries());
        
        // Calculate total size
        for (const [key, info] of entries) {
            totalSize += info.size;
        }
        
        // If over limit, remove oldest entries
        if (totalSize > MAX_CACHE_SIZE) {
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            while (totalSize > MAX_CACHE_SIZE * 0.8 && entries.length > 0) {
                const [key, info] = entries.shift();
                this.delete(info.url);
                totalSize -= info.size;
            }
            
            this.saveCacheIndex();
        }
    }

    getStats() {
        let totalSize = 0;
        let count = 0;
        
        for (const info of this.cache.values()) {
            totalSize += info.size;
            count++;
        }
        
        return {
            count,
            totalSize: this.formatBytes(totalSize),
            entries: Array.from(this.cache.values()).map(info => ({
                url: info.url,
                size: this.formatBytes(info.size),
                age: Math.floor((Date.now() - info.timestamp) / 1000)
            }))
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

const cacheManager = new CacheManager();

// Security functions

// Convert a dotted IPv4 address to a 32-bit unsigned integer.
function ipv4ToInt(ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) return null;
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// Expand an IPv6 address to its full 8-group form as a BigInt for comparison.
function ipv6ToBigInt(ip) {
    try {
        let [head, tail] = ip.split('::');
        let headParts = head ? head.split(':') : [];
        let tailParts = tail ? tail.split(':') : [];
        if (!ip.includes('::')) {
            headParts = ip.split(':');
            tailParts = [];
        }
        const missing = 8 - headParts.length - tailParts.length;
        const groups = [...headParts, ...Array(Math.max(missing, 0)).fill('0'), ...tailParts];
        if (groups.length !== 8) return null;
        return groups.reduce((acc, g) => (acc << 16n) | BigInt(parseInt(g || '0', 16)), 0n);
    } catch {
        return null;
    }
}

function isIpv4InCidr(ip, cidr) {
    const [range, bitsStr] = cidr.split('/');
    const ipInt = ipv4ToInt(ip);
    const rangeInt = ipv4ToInt(range);
    if (ipInt === null || rangeInt === null) return false;
    const bits = parseInt(bitsStr, 10);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipInt & mask) === (rangeInt & mask);
}

function isIpv6InCidr(ip, cidr) {
    const [range, bitsStr] = cidr.split('/');
    const ipBig = ipv6ToBigInt(ip);
    const rangeBig = ipv6ToBigInt(range);
    if (ipBig === null || rangeBig === null) return false;
    const bits = BigInt(parseInt(bitsStr, 10));
    const mask = bits === 0n ? 0n : (~0n << (128n - bits)) & ((1n << 128n) - 1n);
    return (ipBig & mask) === (rangeBig & mask);
}

function isIpBlocked(ip) {
    const isV6 = ip.includes(':');
    for (const cidr of SECURITY.blockedCidrs) {
        const cidrIsV6 = cidr.includes(':');
        if (isV6 !== cidrIsV6) continue;
        if (isV6 ? isIpv6InCidr(ip, cidr) : isIpv4InCidr(ip, cidr)) {
            return true;
        }
    }
    return false;
}

// Resolves the hostname and checks both the hostname allowlist/blocklist and
// the resolved IP against internal ranges. Used before the initial request
// AND before following every redirect hop, so a redirect can't smuggle the
// proxy into fetching an internal address after an initial clean check.
async function assertHostAllowed(hostname) {
    if (SECURITY.blockedHostnames.includes(hostname.toLowerCase())) {
        throw new Error(`Access to '${hostname}' is blocked`);
    }

    // If the "hostname" is already a literal IP, check it directly.
    if (/^[\d.]+$/.test(hostname) || hostname.includes(':')) {
        if (isIpBlocked(hostname)) {
            throw new Error(`Access to ${hostname} is blocked`);
        }
        return;
    }

    let addresses;
    try {
        addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    } catch (err) {
        throw new Error(`Could not resolve host '${hostname}'`);
    }

    for (const { address } of addresses) {
        if (isIpBlocked(address)) {
            throw new Error(`'${hostname}' resolves to a blocked internal address`);
        }
    }
}

// Constant-time-ish token compare for the admin endpoints.
function isValidAdminToken(token) {
    if (!token || typeof token !== 'string') return false;
    const a = Buffer.from(token);
    const b = Buffer.from(ADMIN_TOKEN);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, []);
    }
    
    const requests = rateLimit.get(ip).filter(time => time > windowStart);
    rateLimit.set(ip, requests);
    
    if (requests.length >= RATE_LIMIT_MAX) {
        return false;
    }
    
    requests.push(now);
    return true;
}

function isValidContentType(contentType) {
    if (!contentType) return true; // Allow unknown types
    
    for (const allowedType of SECURITY.allowedContentTypes) {
        if (contentType.includes(allowedType)) {
            return true;
        }
    }
    
    return false;
}

function getRandomUserAgent() {
    return SECURITY.userAgents[Math.floor(Math.random() * SECURITY.userAgents.length)];
}

// Create server
const server = http.createServer(async (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Origin, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Check rate limiting
    if (!checkRateLimit(clientIp)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.'
        }));
        console.log(`⏱️ Rate limit exceeded for ${clientIp}`);
        return;
    }
    
    // API endpoints — admin-only, require a valid token via
    // `Authorization: Bearer <token>`, `X-Admin-Token` header, or `?token=`.
    if (pathname === '/api/stats' || pathname === '/api/clear-cache') {
        const bearer = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
        const providedToken = req.headers['x-admin-token'] || bearer || parsedUrl.query.token;

        if (!isValidAdminToken(providedToken)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Unauthorized',
                message: 'A valid admin token is required for this endpoint.'
            }));
            console.log(`🔒 Rejected unauthenticated admin request to ${pathname} from ${clientIp}`);
            return;
        }

        if (pathname === '/api/stats') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                cache: cacheManager.getStats(),
                rateLimits: Array.from(rateLimit.entries()).map(([ip, requests]) => ({
                    ip,
                    requestsLastMinute: requests.length
                }))
            }));
            return;
        }

        if (pathname === '/api/clear-cache') {
            const entries = Array.from(cacheManager.cache.keys());
            for (const key of entries) {
                cacheManager.delete(cacheManager.cache.get(key).url);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Cache cleared successfully' }));
            return;
        }
    }
    
    // Proxy endpoint
    if (pathname === '/proxy') {
        const videoUrl = parsedUrl.query.url;
        
        if (!videoUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
        }
        
        console.log(`\n🎬 Proxying request from ${clientIp}`);
        console.log(`📥 URL: ${videoUrl}`);
        
        try {
            // Check cache first
            const cachedData = cacheManager.get(videoUrl);
            if (cachedData && !req.headers.range) {
                console.log('💾 Serving from cache');
                const cacheInfo = cacheManager.cache.get(cacheManager.getCacheKey(videoUrl));
                res.writeHead(200, {
                    'Content-Type': cacheInfo.contentType,
                    'Content-Length': cacheInfo.size,
                    'X-Cache': 'HIT',
                    'Cache-Control': 'public, max-age=86400'
                });
                res.end(cachedData);
                return;
            }
            
            await proxyVideo(videoUrl, req, res, clientIp);
        } catch (error) {
            console.error('❌ Proxy error:', error.message);
            
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Proxy error',
                    message: error.message 
                }));
            }
        }
        return;
    }
    
    // Serve static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, 'public', filePath);

    // Security: prevent directory traversal. Resolve fully and require the
    // result to sit *inside* the public root — comparing with a trailing
    // separator so "public-evil" can't pass a bare startsWith check.
    const publicRoot = path.resolve(__dirname, 'public') + path.sep;
    const normalizedPath = path.resolve(filePath);
    if (!(normalizedPath + path.sep).startsWith(publicRoot) && normalizedPath !== publicRoot.slice(0, -1)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
            return;
        }
        
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600'
        });
        res.end(data);
    });
});

async function proxyVideo(videoUrl, clientReq, clientRes, clientIp, redirectCount = 0) {
    if (redirectCount > MAX_REDIRECTS) {
        throw new Error('Too many redirects');
    }

    const parsedUrl = url.parse(videoUrl);

    // Security check — resolves the hostname and blocks internal/loopback
    // targets. Re-run on every redirect hop by the caller below, so a
    // redirect can't smuggle the proxy into an internal address after the
    // first hop passed.
    await assertHostAllowed(parsedUrl.hostname);

    return new Promise((resolve, reject) => {
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        // Prepare headers
        const headers = {
            'User-Agent': getRandomUserAgent(),
            'Accept': '*/*',
            'Accept-Encoding': 'identity', // Disable compression for streaming
            'Connection': 'keep-alive',
            'Referer': `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
            'Origin': `${parsedUrl.protocol}//${parsedUrl.hostname}`
        };
        
        // Forward Range header for seeking
        if (clientReq.headers.range) {
            headers['Range'] = clientReq.headers.range;
            console.log(`📍 Range request: ${clientReq.headers.range}`);
        }
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.path,
            method: clientReq.method || 'GET',
            headers: headers,
            timeout: REQUEST_TIMEOUT
        };
        
        const proxyReq = protocol.request(options, (proxyRes) => {
            console.log(`📥 Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
            
            // Handle redirects
            if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                let redirectUrl = proxyRes.headers.location;
                
                // Handle relative redirects
                if (redirectUrl.startsWith('/')) {
                    redirectUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${redirectUrl}`;
                }
                
                console.log(`🔄 Redirecting to: ${redirectUrl}`);
                proxyVideo(redirectUrl, clientReq, clientRes, clientIp, redirectCount + 1)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            // Check content type
            const contentType = proxyRes.headers['content-type'];
            if (!isValidContentType(contentType)) {
                reject(new Error(`Content type not allowed: ${contentType}`));
                return;
            }
            
            // Check content length
            const contentLength = proxyRes.headers['content-length'];
            if (contentLength && parseInt(contentLength) > SECURITY.maxContentSize) {
                reject(new Error(`Content too large: ${contentLength} bytes`));
                return;
            }
            
            // Collect data for caching
            let responseData = Buffer.alloc(0);
            let isCacheable = !clientReq.headers.range && 
                             proxyRes.statusCode === 200 && 
                             contentLength && 
                             parseInt(contentLength) < 10 * 1024 * 1024; // Cache files under 10MB
            
            // Forward response headers
            const responseHeaders = {
                'Content-Type': contentType || 'video/mp4',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache',
                'X-Proxy': 'FlexStream/1.0',
                'X-Cache': 'MISS'
            };
            
            if (proxyRes.headers['content-length']) {
                responseHeaders['Content-Length'] = proxyRes.headers['content-length'];
            }
            
            if (proxyRes.headers['content-range']) {
                responseHeaders['Content-Range'] = proxyRes.headers['content-range'];
            }
            
            // Handle partial content
            if (proxyRes.statusCode === 206) {
                responseHeaders['Content-Range'] = proxyRes.headers['content-range'];
            }
            
            // Send headers to client
            if (!clientRes.headersSent) {
                clientRes.writeHead(proxyRes.statusCode, responseHeaders);
            }
            
            // Stream data
            proxyRes.on('data', (chunk) => {
                if (isCacheable) {
                    responseData = Buffer.concat([responseData, chunk]);
                    
                    // Stop caching if data gets too large
                    if (responseData.length > SECURITY.maxContentSize) {
                        isCacheable = false;
                        responseData = Buffer.alloc(0);
                    }
                }
                
                clientRes.write(chunk);
            });
            
            proxyRes.on('end', () => {
                // Cache the response if cacheable
                if (isCacheable && responseData.length > 0) {
                    cacheManager.set(videoUrl, responseData, contentType);
                    console.log(`💾 Cached ${responseData.length} bytes`);
                }
                
                clientRes.end();
                console.log('✅ Request completed');
                resolve();
            });
            
            proxyRes.on('error', (err) => {
                console.error('Stream error:', err.message);
                if (!clientRes.headersSent) {
                    reject(err);
                } else {
                    resolve(); // Already streaming, just end
                }
            });
        });
        
        proxyReq.on('timeout', () => {
            console.error('⏱️ Request timeout');
            proxyReq.destroy();
            reject(new Error('Request timeout'));
        });
        
        proxyReq.on('error', (err) => {
            console.error('Request error:', err.message);
            reject(err);
        });
        
        // Handle client disconnect
        clientReq.on('close', () => {
            proxyReq.destroy();
        });
        
        clientRes.on('close', () => {
            proxyReq.destroy();
        });
        
        proxyReq.end();
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 FlexStream Proxy Server v1.0                            ║
║   Built by Niranjannn                                        ║
║                                                                ║
║   📍 Local:  http://localhost:${PORT}                          ║
║   🔗 Proxy:  http://localhost:${PORT}/proxy?url=VIDEO_URL       ║
║   📊 Stats:  http://localhost:${PORT}/api/stats?token=...      ║
║                                                                ║
║   🔒 Security features enabled (resolved-IP SSRF guard)       ║
║   💾 Caching enabled (${cacheManager.formatBytes(MAX_CACHE_SIZE)})            ║
║   ⏱️  Rate limiting enabled (${RATE_LIMIT_MAX}/min per IP)              ║
║                                                                ║
║   Press Ctrl+C to stop                                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);

    if (ADMIN_TOKEN_WAS_GENERATED) {
        console.log(`🔑 Generated admin token (no ADMIN_TOKEN env var set):`);
        console.log(`   ${ADMIN_TOKEN}`);
        console.log(`   Use it as ?token=... or an X-Admin-Token header on /api/stats and /api/clear-cache.`);
        console.log(`   Set ADMIN_TOKEN in your environment to use a fixed value instead.\n`);
    }

    // Log cache stats
    const stats = cacheManager.getStats();
    console.log(`📦 Cache: ${stats.count} files, ${stats.totalSize}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n💾 Saving cache index...');
    cacheManager.saveCacheIndex();
    console.log('👋 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    cacheManager.saveCacheIndex();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});