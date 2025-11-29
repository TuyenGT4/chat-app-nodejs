const {
  login,
  register,
  getAllUsers,
  setAvatar,
  logOut,
  sendVerificationCode,
  verifyCode,
} = require("../controllers/userController");

const router = require("express").Router();
const {
  registerValidation,
  loginValidation,
} = require("../middleware/validation");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const ActivityLog = require("../models/activityLogModel");

router.post("/login", loginValidation, login);
router.post("/register", registerValidation, register);
router.post("/send-verification-code", sendVerificationCode);
router.post("/verify-code", verifyCode);

router.get("/allusers/:id", getAllUsers);
router.post("/setavatar/:id", setAvatar);
router.get("/logout/:id", logOut);

router.get(
  "/activity-logs",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, action, userId } = req.query;

      const query = {};
      if (action) query.action = action;
      if (userId) query.userId = userId;

      const logs = await ActivityLog.find(query)
        .populate("userId", "username email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await ActivityLog.countDocuments(query);

      res.json({
        status: true,
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ status: false, message: "Lỗi khi lấy logs" });
    }
  }
);

// API xem logs của user hiện tại
router.get("/my-activity", verifyToken, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ status: true, logs });
  } catch (error) {
    res.status(500).json({ status: false, message: "Lỗi khi lấy logs" });
  }
});

module.exports = router;
