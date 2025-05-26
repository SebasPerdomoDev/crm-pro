const authController = require("../controllers/authController");

module.exports = (app) => {
  app.post("/api/auth/forgotPassword", authController.forgotPassword);
  app.post("/api/auth/verifyOtp", authController.verificarOtp);
  app.post("/api/auth/resetPassword", authController.resetPassword);
};
