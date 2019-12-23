const express = require("express");
const {
    check,
    validationResult
} = require('express-validator');

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

const pattern = new RegExp('^(https?:\\/\\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$', 'i');
const router = express.Router();


// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post("/add-product",
    isAuth,
    check("title", "Title is require")
    .not().isEmpty(),
    check("price", "Please input a valid price")
    .not().isEmpty()
    .isNumeric(), adminController.postAddProduct);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post("/edit-product", isAuth, adminController.postEditProduct);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

module.exports = router;