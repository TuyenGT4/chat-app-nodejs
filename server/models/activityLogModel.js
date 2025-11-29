const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: false,
  },
  action: {
    type: String,
    required: true,
    enum: [
      "LOGIN_SUCCESS",
      "LOGIN_FAILED",
      "LOGOUT",
      "REGISTER",
      "PASSWORD_CHANGE",
      "AVATAR_UPDATE",
      "MESSAGE_SENT",
      "ACCOUNT_LOCKED",
      "INVALID_TOKEN",
    ],
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    default: "SUCCESS",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60, // Tự động xóa sau 30 ngày
  },
});

// Index để query nhanh hơn
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
