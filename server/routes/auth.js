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

router.post("/login", login);
router.post("/register", register);
router.get("/allusers/:id", getAllUsers);
router.post("/setavatar/:id", setAvatar);
router.get("/logout/:id", logOut);

// Email verification routes
router.post("/send-verification-code", sendVerificationCode);
router.post("/verify-code", verifyCode);

module.exports = router;
