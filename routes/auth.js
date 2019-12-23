const express = require("express");
const {
  check,
  validationResult
} = require('express-validator');

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.get("/reset/:token", authController.getNewPassword);

router.get("/reset", authController.getRest);

router.post(
  "/login",
  check("email")
  .isEmail()
  .withMessage("Please enter valid e-mail address"),
  check("password")
  .isLength({
    min: 8
  })
  .isAlphanumeric()
  .withMessage("Password has to be valid")
  .trim(),
  authController.postLogin
);

router.post(
  "/signup",
  [
    check("email")
    .isEmail()
    .withMessage("Please input valid e-mail address")
    .normalizeEmail()
    .custom((value, {
      req
    }) => {
      return User.findOne({
        email: value
      }).then(userDoc => {
        if (userDoc) {
          return Promise.reject("Please pick a different one.");
        }
      });
    })
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.post("/reset", authController.postReset);

router.post("/new-password", authController.postNewPassword);

module.exports = router;