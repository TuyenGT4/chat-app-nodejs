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

router.post("/login", loginValidation, login);
router.post("/register", registerValidation, register);
router.post("/send-verification-code", sendVerificationCode);
router.post("/verify-code", verifyCode);
router.get("/allusers/:id", getAllUsers);
router.post("/setavatar/:id", setAvatar);
router.get("/logout/:id", logOut);

module.exports = router;
