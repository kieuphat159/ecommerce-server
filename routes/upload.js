const express = require('express')
const upload = require('../middleware/multerMiddleware')
const router = express.Router();

router.post('/upload', upload.array('image', 10), (req, res) => {
    console.log(req.files);
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }
        const urls = req.files.map(file => file.path);
        res.json({
            success: true,
            message: 'Upload successfully',
            count: req.files.length,
            url: urls
        });
    } catch (err) {
        console.log('Upload error: ', err);
        res.status(500).json({
            success: false,
            message: 'Error during upload'
        });
    }
});

module.exports = router;