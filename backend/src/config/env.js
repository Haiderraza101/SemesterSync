const REQUIRED_VARIABLES = ["MONGO_URI", "JWT_SECRET"];
const MIN_SECRET_LENGTH = 32;
const SAME_SITE_VALUES = ["lax", "strict", "none"];

function readNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readList(name, fallback) {
  const raw = process.env[name] || fallback;
  return raw
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV || "development";
const clientOrigins = readList("CLIENT_URL", "http://localhost:5173");
const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();

export const isProduction = nodeEnv === "production";

export const env = {
  nodeEnv,
  port: readNumber("PORT", 5001),
  mongoUri: process.env.MONGO_URI,
  clientUrl: clientOrigins[0],
  clientOrigins,
  timezone: process.env.APP_TIMEZONE || "Asia/Karachi",
  auth: {
    accessTokenSecret: process.env.JWT_SECRET,
    accessTokenTtl: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshTokenDays: readNumber("REFRESH_TOKEN_DAYS", 30),
    sessionHours: readNumber("SESSION_HOURS", 12),
    refreshGraceSeconds: 30,
    cookieName: "semestersync_refresh",
    cookieSameSite: SAME_SITE_VALUES.includes(sameSite) ? sameSite : "lax",
    cookieSecure: isProduction || sameSite === "none",
    passwordResetMinutes: readNumber("PASSWORD_RESET_MINUTES", 30),
    maxLoginAttempts: readNumber("MAX_LOGIN_ATTEMPTS", 5),
    lockMinutes: readNumber("LOCK_MINUTES", 15),
    bcryptRounds: readNumber("BCRYPT_ROUNDS", 12),
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: readNumber("SMTP_PORT", 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || "SemesterSync <no-reply@semestersync.app>",
  },
};

export function assertEnv() {
  const missing = REQUIRED_VARIABLES.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  if (isProduction && env.auth.accessTokenSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production.`);
  }
}
