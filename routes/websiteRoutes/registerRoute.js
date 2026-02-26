const express = require('express');
const router = express.Router();

const {sendRegistrationMail} = require("../../service/mailService");
// POST /api/contact

router.post("/", async (req, res) => {
    try{
        await sendRegistrationMail(req.body);
        res.status(200).json({ success: true, message: 'Registration email sent successfully' });
    }catch(error){
        res.status(500).json({ success: false, message: 'Failed to send registration email' });
    }
});

module.exports = router;