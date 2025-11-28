const { body, validationResult } = require("express-validator");

// Middleware xử lý lỗi validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// Validation cho đăng ký
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username phải từ 3-20 ký tự")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username chỉ được chứa chữ, số và dấu gạch dưới"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Mật khẩu phải ít nhất 8 ký tự")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Mật khẩu phải có chữ hoa, chữ thường và số"),

  handleValidationErrors,
];

// Validation cho đăng nhập
const loginValidation = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username không được để trống"),

  body("password").notEmpty().withMessage("Mật khẩu không được để trống"),

  handleValidationErrors,
];

// Validation cho tin nhắn
const messageValidation = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Tin nhắn không được để trống")
    .isLength({ max: 1000 })
    .withMessage("Tin nhắn không được quá 1000 ký tự"),

  body("from").notEmpty().withMessage("Thiếu thông tin người gửi"),

  body("to").notEmpty().withMessage("Thiếu thông tin người nhận"),

  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  messageValidation,
};
