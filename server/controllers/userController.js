require("dotenv").config();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const axios = require("axios");
const { generateToken } = require("../middleware/authMiddleware");
const {
  logLogin,
  logLogout,
  logRegister,
  logAvatarUpdate,
} = require("../services/activityLogger");

// Lưu trữ mã xác thực tạm thời (trong thực tế nên dùng Redis)
const verificationCodes = new Map();

// Lưu trữ online users
const onlineUsers = new Map();

// Cấu hình email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Xác thực CAPTCHA
const verifyCaptcha = async (token) => {
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );
    return response.data.success;
  } catch (error) {
    console.error("Captcha verification error:", error);
    return false;
  }
};

// Validate password phía server
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[! @#$%^&*(),.? ":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { valid: false, msg: "Mật khẩu phải có ít nhất 8 ký tự." };
  }
  if (!hasUpperCase) {
    return { valid: false, msg: "Mật khẩu phải có ít nhất 1 chữ cái in hoa." };
  }
  if (!hasLowerCase) {
    return { valid: false, msg: "Mật khẩu phải có ít nhất 1 chữ cái thường." };
  }
  if (!hasNumber) {
    return { valid: false, msg: "Mật khẩu phải có ít nhất 1 số." };
  }
  if (!hasSpecialChar) {
    return { valid: false, msg: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt." };
  }
  return { valid: true };
};

// ==================== LOGIN ====================
module.exports.login = async (req, res, next) => {
  try {
    const { username, password, captchaToken } = req.body;

    // Xác thực CAPTCHA
    if (!captchaToken) {
      return res.json({ msg: "Vui lòng xác thực CAPTCHA.", status: false });
    }

    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      return res.json({ msg: "Xác thực CAPTCHA thất bại.", status: false });
    }

    // Tìm user
    const user = await User.findOne({ username });
    if (!user) {
      await logLogin(req, null, false);
      return res.json({
        msg: "Username hoặc Password không đúng",
        status: false,
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logLogin(req, user._id, false);
      return res.json({
        msg: "Username hoặc Password không đúng",
        status: false,
      });
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.isActive === false) {
      return res.json({ msg: "Tài khoản đã bị khóa", status: false });
    }

    // Log đăng nhập thành công
    await logLogin(req, user._id, true);

    // Cập nhật lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Tạo JWT token
    const token = generateToken(user._id);

    // ✅ Tạo response CHỈ với các field cần thiết (KHÔNG có password)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAvatarImageSet: user.isAvatarImageSet,
      avatarImage: user.avatarImage,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };

    return res.json({ status: true, user: userResponse, token });
  } catch (ex) {
    next(ex);
  }
};

// ==================== REGISTER ====================
module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password, captchaToken } = req.body;

    // Xác thực CAPTCHA
    if (!captchaToken) {
      return res.json({ msg: "Vui lòng xác thực CAPTCHA.", status: false });
    }

    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      return res.json({ msg: "Xác thực CAPTCHA thất bại.", status: false });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.json({ msg: passwordValidation.msg, status: false });
    }

    const usernameCheck = await User.findOne({ username });
    if (usernameCheck)
      return res.json({ msg: "Username đã được sử dụng", status: false });

    const emailCheck = await User.findOne({ email });
    if (emailCheck)
      return res.json({ msg: "Email đã được sử dụng", status: false });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });

    // Log đăng ký thành công
    await logRegister(req, user._id);

    // Tạo JWT token
    const token = generateToken(user._id);

    // ✅ Tạo response CHỈ với các field cần thiết (KHÔNG có password)
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAvatarImageSet: user.isAvatarImageSet || false,
      avatarImage: user.avatarImage || "",
      role: user.role || "user",
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    return res.json({ status: true, user: userResponse, token });
  } catch (ex) {
    next(ex);
  }
};

// ==================== SEND VERIFICATION CODE ====================
module.exports.sendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Tạo mã xác thực 6 số
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu mã với thời hạn 10 phút
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Gửi email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mã xác thực đăng ký tài khoản Snappy",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4e0eff;">Xác thực Email của bạn</h2>
          <p>Mã xác thực của bạn là:</p>
          <h1 style="color: #4e0eff; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>Mã này sẽ hết hạn sau 10 phút.</p>
          <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ status: true, msg: "Mã xác thực đã được gửi." });
  } catch (ex) {
    console.error("Send verification code error:", ex);
    return res.json({ status: false, msg: "Có lỗi xảy ra khi gửi mã." });
  }
};

// ==================== VERIFY CODE ====================
module.exports.verifyCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.json({
        status: false,
        msg: "Không tìm thấy mã xác thực.  Vui lòng gửi lại mã.",
      });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.json({
        status: false,
        msg: "Mã xác thực đã hết hạn. Vui lòng gửi lại mã.",
      });
    }

    if (storedData.code !== code) {
      return res.json({ status: false, msg: "Mã xác thực không đúng." });
    }

    // Xác thực thành công - xóa mã
    verificationCodes.delete(email);
    return res.json({ status: true, msg: "Xác thực thành công." });
  } catch (ex) {
    next(ex);
  }
};

// ==================== GET ALL USERS ====================
module.exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.params.id } }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

// ==================== SET AVATAR ====================
module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const avatarImage = req.body.image;
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage,
      },
      { new: true }
    );

    // Log cập nhật avatar
    await logAvatarUpdate(req, userId);

    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    next(ex);
  }
};

// ==================== LOGOUT ====================
module.exports.logOut = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.json({ msg: "User id is required" });
    }

    // Log đăng xuất
    await logLogout(req, userId);

    onlineUsers.delete(userId);
    return res.status(200).json({ status: true, msg: "Đăng xuất thành công" });
  } catch (ex) {
    next(ex);
  }
};
