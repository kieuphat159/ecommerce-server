const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController')
console.log("Categories route loaded");

router.get('/categories', categoryController.getAllCategory)

module.exports = router;