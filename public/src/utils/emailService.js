import emailjs from "@emailjs/browser";

const SERVICE_ID = "service_nm1j6y6";
const TEMPLATE_ID = "template_nsdke6d";
const PUBLIC_KEY = "ZwK1-URw7Qus7ft6H";

// Khởi tạo EmailJS
emailjs.init(PUBLIC_KEY);

// Tạo mã xác thực 6 số
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi email xác thực
export const sendVerificationEmail = async (toEmail, code) => {
  try {
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_email: toEmail,
      code: code,
    });
    console.log("Email sent successfully!", response);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.text };
  }
};
