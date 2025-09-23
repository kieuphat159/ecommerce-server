const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController')

const now = new Date();
const seconds = now.getSeconds().toString().padStart(2, "0");
const ms = now.getMilliseconds().toString().padStart(3, "0");
console.log(`Response category: ${seconds}.${ms}`);

router.get('/categories', categoryController.getAllCategory)

module.exports = router;