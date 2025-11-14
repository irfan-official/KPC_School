import { config } from "dotenv";
config();

const allowedOrigins = [
  process.env.HOST_URL,
  "http;//localhost:5173",
  "http;//localhost:5174",
];

export default allowedOrigins;
