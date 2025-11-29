const { addMessage, getMessages } = require("../controllers/messageController");
const router = require("express").Router();
const { messageValidation } = require("../middleware/validation");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/addmsg", verifyToken, messageValidation, addMessage);
router.post("/getmsg", verifyToken, getMessages);

module.exports = router;
