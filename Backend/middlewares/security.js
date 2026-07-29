const defaultHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "X-XSS-Protection": "0",
};

const securityHeaders = (req, res, next) => {
  Object.entries(defaultHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });

  next();
};

module.exports = securityHeaders;
