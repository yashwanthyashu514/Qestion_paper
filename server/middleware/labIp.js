/**
 * labIpOnly middleware — blocks requests not originating from the authorized lab IP.
 * LAB_IP is stored in .env (supports comma-separated list for multiple labs).
 */
const labIpOnly = (req, res, next) => {
    const labIps = (process.env.LAB_IP || '127.0.0.1')
        .split(',')
        .map(ip => ip.trim());

    // Get real client IP (handles proxies/nginx)
    const clientIp =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        '';

    // Normalize IPv6 loopback
    const normalizedIp = clientIp.replace('::ffff:', '');

    const isAllowed = labIps.includes(normalizedIp) || labIps.includes('*');

    if (!isAllowed) {
        return res.status(403).json({
            msg: 'Access denied: This portal is restricted to authorized lab systems only.',
            yourIp: normalizedIp
        });
    }

    // Attach lab IP flag to request for use in scorecard logic
    req.isLabIp = true;
    req.clientIp = normalizedIp;
    next();
};

/**
 * detectLabIp middleware — attaches isLabIp flag WITHOUT blocking.
 * Used in scorecard routes to conditionally show/hide answer key.
 */
const detectLabIp = (req, res, next) => {
    const labIps = (process.env.LAB_IP || '127.0.0.1')
        .split(',')
        .map(ip => ip.trim());

    const clientIp =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        '';

    const normalizedIp = clientIp.replace('::ffff:', '');
    req.isLabIp = labIps.includes(normalizedIp) || labIps.includes('*');
    req.clientIp = normalizedIp;
    next();
};

module.exports = { labIpOnly, detectLabIp };
