require("dotenv").config();

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgrid = require("nodemailer-sendgrid-transport");
const {
  check,
  validationResult
} = require('express-validator');

const User = require("../models/user");

const transport = nodemailer.createTransport(
  sendgrid({
    auth: {
      api_key: process.env.SENGGRID_API_KEY
    }
  })
);

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: {
      email: "",
      password: ""
    },
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
    oldInput: [],
    validationErrors: []
  });
};

exports.getRest = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset",
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }
  User.findOne({
    email: email
  }).then(user => {
    if (!user) {
      return res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "Please enter valid email",
        oldInput: {
          email: email,
          password: password
        },
        validationErrors: []
      });
    }
    return bcrypt
      .compare(password, user.password)
      .then(doMatch => {
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(err => {
            console.log(err);
            res.redirect("/");
          });
        }
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Password has to be valid",
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      })
      .catch(err => {
        console.log(err);
        res.redirect("/login");
      });
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(console.error());
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmedPassword: req.body.confirmedPassword
      },
      validationErrors: errors.array()
    });
  }

  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: {
          items: []
        }
      });
      return user.save();
    })
    .then(result => {
      res.redirect("/login");
      return transport
        .sendMail({
          to: email,
          from: "shop@takuya.com",
          subject: "Signp succeeded!",
          html: "<h1>You Successfully signed up!!</h1>"
        })
        .then();
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect("/");
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({
        email: req.body.email
      })
      .then(user => {
        if (!user) {
          req.flash("error", "User Not Existed");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect("/");
        return transport.sendMail({
          to: req.body.email,
          from: "shop@takuya.com",
          subject: "Please Reset Password",
          html: `
                <p>Please Reset Password</p>
                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
            `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
      resetToken: token,
      resetTokenExpiration: {
        $gt: Date.now()
      }
    })
    .then(user => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        passwordToken: token,
        userId: user._id.toString()
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: {
        $gt: Date.now()
      },
      _id: userId
    })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect("/login");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};