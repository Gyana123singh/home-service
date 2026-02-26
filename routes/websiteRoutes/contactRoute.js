const express = require('express');
const router = express.Router();

const {sendContactMail} = require("../../service/mailService");
// POST /api/contact
router.post("/", async (req, res) => {
    try{
        await sendContactMail(req.body);
        res.status(200).json({ success: true, message: 'Email sent successfully' });
    }catch(error){
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
});

module.exports = router;