import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const mockDataPath = path.join(__dirname, "../config/serviceAccountKey.json");
// const serviceAccount = JSON.parse(fs.readFileSync(mockDataPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: process.env.FIREBASE_TYPE,
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI,
      tokenUri: process.env.FIREBASE_TOKEN_URI,
      authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
      clientC509CertUrl: process.env.FIREBASE_CLIENT_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    }),
  });
}

const verifyJWTToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  // console.log("authorization: ==> ", authorization);
  // console.log("Headers: ==> ", req.headers);

  if (!authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    // check valid email from decoded.email
    req.token_email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "unauthorized access",
    });
  }
};

export default verifyJWTToken;
