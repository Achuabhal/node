const express = require('express');
const router = express.Router();
const Gallery = require('../models/content'); // adjust path
const News = require('../models/news'); // adjust path
const Toggle = require('../models/button'); // adjust path
const Galleryy = require('../models/img'); // adjust path


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

router.get('/all-content', async (req, res) => {
  try {
    // Fetch both from DB
    const newsDoc = await News.findOne();      // since you keep all newsItems in one doc
    const galleryDoc = await Gallery.findOne(); // same for galleryImages
    let toggle = await Toggle.findOne();
    let banner = await Galleryy.findOne(); // only one gallery document

    res.json({
      newsItems: newsDoc ? newsDoc.newsItems : [],
      galleryImages: galleryDoc ? galleryDoc.galleryImages : [],
       banner: banner ? banner.images : [],
      toggle: toggle ? toggle.isActive : false
     
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching content' });
  }
});



// Update state
router.put('/toggle', async (req, res) => {
  try {
    const { isActive } = req.body; // { isActive: true/false }

    let toggle = await Toggle.findOne();
    if (!toggle) {
      toggle = new Toggle({ isActive });
    } else {
      toggle.isActive = isActive;
    }
    await toggle.save();

    res.json({ isActive: toggle.isActive });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/gallery', async (req, res) => {
  try {
    let gallery = await Galleryy.findOne(); // only one gallery document
    if (!gallery) {
      // If not exist, create one
      gallery = new Galleryy({ images: [] });
      await gallery.save();
    }
    res.json(gallery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.put('/banner', async (req, res) => {
  try {
    const { images } = req.body; // frontend sends { images: [...] }

    if (!Array.isArray(images)) {
      return res.status(400).json({ message: 'Images should be an array' });
    }

    let gallery = await Galleryy.findOne();
    if (!gallery) {
      gallery = new Galleryy({ images });
    } else {
      gallery.images = images; // replace existing array
    }

    await gallery.save();
    res.json(gallery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
