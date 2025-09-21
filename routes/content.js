const express = require('express');
const router = express.Router();
const Gallery = require('../models/content'); // adjust path
const News = require('../models/news'); // adjust path


// PUT /gallery
router.put('/gallery', async (req, res) => {
  try {
    const galleryImages = req.body.galleryImages; // frontend sends { galleryImages: [...] }

    if (!Array.isArray(galleryImages)) {
      return res.status(400).json({ error: "galleryImages must be an array" });
    }

    // Replace the array in the first document
    let gallery = await Gallery.findOne();
    if (gallery) {
      gallery.galleryImages = galleryImages;  // replace existing array
      await gallery.save();
    } else {
      // if no document exists, create a new one
      gallery = new Gallery({ galleryImages });
      await gallery.save();
    }

    res.json({ message: "Gallery updated successfully", gallery });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.put('/news', async (req, res) => {
  try {
    const newsItems = req.body.newsItems; // frontend sends { newsItems: [...] }

    if (!Array.isArray(newsItems)) {
      return res.status(400).json({ error: "newsItems must be an array" });
    }

    // Find the first document
    let newsDoc = await News.findOne();

    if (newsDoc) {
      // Replace the array
      newsDoc.newsItems = newsItems;
      await newsDoc.save();
    } else {
      // Create new document if none exists
      newsDoc = new News({ newsItems });
      await newsDoc.save();
    }

    res.json({ message: "News updated successfully", news: newsDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
