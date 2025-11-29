import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../assets/logo.svg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  registerRoute,
  sendVerificationCodeRoute,
  verifyCodeRoute,
} from "../utils/APIRoutes";
import ReCAPTCHA from "react-google-recaptcha";

export default function Register() {
  const navigate = useNavigate();
  const recaptchaRef = useRef();

  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
  });

  const [captchaToken, setCaptchaToken] = useState(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues({ ...values, [name]: value });

    if (name === "password") {
      setPasswordStrength({
        hasMinLength: value.length >= 8,
        hasUpperCase: /[A-Z]/.test(value),
        hasLowerCase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }
  };

  const onCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[! @#$%^&*(),.? ":{}|<>]/.test(password);

    if (password.length < minLength) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự.", toastOptions);
      return false;
    }
    if (!hasUpperCase) {
      toast.error("Mật khẩu phải có ít nhất 1 chữ cái in hoa.", toastOptions);
      return false;
    }
    if (!hasLowerCase) {
      toast.error("Mật khẩu phải có ít nhất 1 chữ cái thường.", toastOptions);
      return false;
    }
    if (!hasNumber) {
      toast.error("Mật khẩu phải có ít nhất 1 số.", toastOptions);
      return false;
    }
    if (!hasSpecialChar) {
      toast.error(
        "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (! @#$%^&*...).",
        toastOptions
      );
      return false;
    }
    return true;
  };

  const handleValidation = () => {
    const { password, confirmPassword, username, email } = values;

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.", toastOptions);
      return false;
    }
    if (username.length < 3) {
      toast.error("Username phải có ít nhất 3 ký tự.", toastOptions);
      return false;
    }
    if (!validatePassword(password)) {
      return false;
    }
    if (email === "") {
      toast.error("Email là bắt buộc.", toastOptions);
      return false;
    }
    if (!captchaToken) {
      toast.error("Vui lòng hoàn thành xác thực CAPTCHA.", toastOptions);
      return false;
    }
    if (!isCodeVerified) {
      toast.error("Vui lòng xác thực mã gửi về email.", toastOptions);
      return false;
    }
    return true;
  };

  const handleSendVerificationCode = async () => {
    const { email } = values;
    if (!email || !email.includes("@")) {
      toast.error("Vui lòng nhập email hợp lệ trước.", toastOptions);
      return;
    }

    try {
      const { data } = await axios.post(sendVerificationCodeRoute, { email });
      if (data.status === true) {
        setIsCodeSent(true);
        toast.success(
          "Mã xác thực đã được gửi về email của bạn.",
          toastOptions
        );
      } else {
        toast.error(data.msg, toastOptions);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi mã xác thực.", toastOptions);
    }
  };

  const handleVerifyCode = async () => {
    const { email, verificationCode } = values;
    if (!verificationCode) {
      toast.error("Vui lòng nhập mã xác thực.", toastOptions);
      return;
    }

    try {
      const { data } = await axios.post(verifyCodeRoute, {
        email,
        code: verificationCode,
      });
      if (data.status === true) {
        setIsCodeVerified(true);
        toast.success("Xác thực email thành công!", toastOptions);
      } else {
        toast.error(data.msg, toastOptions);
      }
    } catch (error) {
      toast.error("Mã xác thực không đúng.", toastOptions);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (handleValidation()) {
      const { email, username, password } = values;
      const { data } = await axios.post(registerRoute, {
        username,
        email,
        password,
        captchaToken,
      });

      if (data.status === false) {
        toast.error(data.msg, toastOptions);
      }
      if (data.status === true) {
        localStorage.setItem("chat-app-token", data.token);
        localStorage.setItem(
          process.env.REACT_APP_LOCALHOST_KEY,
          JSON.stringify(data.user)
        );
        navigate("/");
      }

      recaptchaRef.current.reset();
      setCaptchaToken(null);
    }
  };

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  return (
    <>
      <FormContainer>
        <form onSubmit={(event) => handleSubmit(event)}>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h1>snappy</h1>
          </div>

          <input
            type="text"
            placeholder="Tên tài khoản"
            name="username"
            onChange={(e) => handleChange(e)}
          />

          <div className="email-verification">
            <input
              type="email"
              placeholder="Email"
              name="email"
              onChange={(e) => handleChange(e)}
              disabled={isCodeVerified}
            />
            <button
              type="button"
              className="send-code-btn"
              onClick={handleSendVerificationCode}
              disabled={isCodeVerified}
            >
              {isCodeSent ? "Gửi lại mã" : "Gửi mã"}
            </button>
          </div>

          {isCodeSent && !isCodeVerified && (
            <div className="verification-code">
              <input
                type="text"
                placeholder="Nhập mã xác thực"
                name="verificationCode"
                onChange={(e) => handleChange(e)}
              />
              <button
                type="button"
                className="verify-btn"
                onClick={handleVerifyCode}
              >
                Xác thực
              </button>
            </div>
          )}

          {isCodeVerified && (
            <span className="verified-badge">✓ Email đã xác thực</span>
          )}

          <input
            type="password"
            placeholder="Mật khẩu"
            name="password"
            onChange={(e) => handleChange(e)}
          />

          <div className="password-requirements">
            <p className={passwordStrength.hasMinLength ? "valid" : "invalid"}>
              {passwordStrength.hasMinLength ? "✓" : "✗"} Ít nhất 8 ký tự
            </p>
            <p className={passwordStrength.hasUpperCase ? "valid" : "invalid"}>
              {passwordStrength.hasUpperCase ? "✓" : "✗"} Có chữ cái in hoa
            </p>
            <p className={passwordStrength.hasLowerCase ? "valid" : "invalid"}>
              {passwordStrength.hasLowerCase ? "✓" : "✗"} Có chữ cái thường
            </p>
            <p className={passwordStrength.hasNumber ? "valid" : "invalid"}>
              {passwordStrength.hasNumber ? "✓" : "✗"} Có số
            </p>
            <p
              className={passwordStrength.hasSpecialChar ? "valid" : "invalid"}
            >
              {passwordStrength.hasSpecialChar ? "✓" : "✗"} Có ký tự đặc biệt
            </p>
          </div>

          <input
            type="password"
            placeholder="Xác nhận lại mật khẩu"
            name="confirmPassword"
            onChange={(e) => handleChange(e)}
          />

          <div className="captcha-container">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
              onChange={onCaptchaChange}
              theme="dark"
            />
          </div>

          <button
            type="submit"
            disabled={!isPasswordValid || !captchaToken || !isCodeVerified}
          >
            Đăng ký
          </button>

          <span>
            Đã có tài khoản? <Link to="/login">Đăng nhập. </Link>
          </span>
        </form>
      </FormContainer>
      <ToastContainer />
    </>
  );
}

const FormContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;

  . brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 5rem;
    }
    h1 {
      color: white;
      text-transform: uppercase;
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1 5rem;
    background-color: #00000076;
    border-radius: 2rem;
    padding: 3rem 5rem;
  }

  input {
    background-color: transparent;
    padding: 1rem;
    border: 0.1rem solid #4e0eff;
    border-radius: 0.4rem;
    color: white;
    width: 100%;
    font-size: 1rem;
    &:focus {
      border: 0.1rem solid #997af0;
      outline: none;
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .email-verification,
  .verification-code {
    display: flex;
    gap: 0.5rem;
    align-items: center;

    input {
      flex: 1;
    }

    . send-code-btn,
    .verify-btn {
      padding: 1rem 1.5rem;
      background-color: #997af0;
      color: white;
      border: none;
      border-radius: 0.4rem;
      cursor: pointer;
      font-size: 0.9rem;
      white-space: nowrap;

      &:hover {
        background-color: #4e0eff;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .verified-badge {
    color: #00ff00;
    font-size: 0.9rem;
    text-align: center;
  }

  .password-requirements {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    p {
      font-size: 0.8rem;
      margin: 0;

      &.valid {
        color: #00ff00;
      }

      &.invalid {
        color: #ff6b6b;
      }
    }
  }

  .captcha-container {
    display: flex;
    justify-content: center;
  }

  button[type="submit"] {
    background-color: #4e0eff;
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0 4rem;
    font-size: 1rem;
    text-transform: uppercase;

    &:hover {
      background-color: #4e0eff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  span {
    color: white;
    text-transform: uppercase;
    a {
      color: #4e0eff;
      text-decoration: none;
      font-weight: bold;
    }
  }
`;
