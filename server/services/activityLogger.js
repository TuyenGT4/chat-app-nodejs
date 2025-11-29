const ActivityLog = require("../models/activityLogModel");

const logActivity = async (
  req,
  action,
  userId = null,
  details = {},
  status = "SUCCESS"
) => {
  try {
    // Lấy IP address
    const ipAddress =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "unknown";

    // Lấy User Agent
    const userAgent = req.headers["user-agent"] || "unknown";

    const log = new ActivityLog({
      userId,
      action,
      ipAddress:
        typeof ipAddress === "string"
          ? ipAddress.split(",")[0].trim()
          : "unknown",
      userAgent,
      details,
      status,
    });

    await log.save();

    // Log ra console trong development
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[ACTIVITY] ${action} - User: ${
          userId || "anonymous"
        } - Status: ${status}`
      );
    }

    return log;
  } catch (error) {
    console.error("Error logging activity:", error);
    // Không throw error để không ảnh hưởng đến luồng chính
  }
};

// Helper functions
const logLogin = (req, userId, success = true) => {
  return logActivity(
    req,
    success ? "LOGIN_SUCCESS" : "LOGIN_FAILED",
    userId,
    { username: req.body.username },
    success ? "SUCCESS" : "FAILED"
  );
};

const logLogout = (req, userId) => {
  return logActivity(req, "LOGOUT", userId);
};

const logRegister = (req, userId) => {
  return logActivity(req, "REGISTER", userId, {
    username: req.body.username,
    email: req.body.email,
  });
};

const logMessageSent = (req, userId, toUserId) => {
  return logActivity(req, "MESSAGE_SENT", userId, { to: toUserId });
};

const logAvatarUpdate = (req, userId) => {
  return logActivity(req, "AVATAR_UPDATE", userId);
};

const logInvalidToken = (req) => {
  return logActivity(req, "INVALID_TOKEN", null, {}, "FAILED");
};

module.exports = {
  logActivity,
  logLogin,
  logLogout,
  logRegister,
  logMessageSent,
  logAvatarUpdate,
  logInvalidToken,
};
