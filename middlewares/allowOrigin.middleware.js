import allowedOrigins from "../config/allowOrigin.config.js";

function verifyOrigin(req, res, next) {
  const origin = req.headers.origin || req.get("origin");
  // console.log("Request origin ==> ", origin);

  if (!origin) return next(); // for postman pass

  if (!allowedOrigins.includes(origin)) {
    console.log("hello");
    return res
      .status(403)
      .json({ message: `❌ Access denied for origin: ${origin}` });
  }

  next();
}

export default verifyOrigin;
