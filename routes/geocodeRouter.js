const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /api/geocode
router.get('/', async (req, res) => {
  try {
    const { address, latlng } = req.query;

    // Use the API key from environment variables, fallback to the provided key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBGtqdVoKgd9sCmz2Y8wxuwa0WfDBaymGk';
    let googleUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

    if (address) {
      googleUrl += `?address=${encodeURIComponent(address)}&key=${apiKey}`;
    } else if (latlng) {
      googleUrl += `?latlng=${encodeURIComponent(latlng)}&key=${apiKey}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either address or latlng query parameter is required.'
      });
    }

    const response = await axios.get(googleUrl);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Geocoding proxy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform geocoding.'
    });
  }
});

module.exports = router;
