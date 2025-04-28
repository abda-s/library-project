const express = require('express');
const router = express.Router();
const { books } = require('../models'); // from models/index.js

// POST /api/books/add - Create a new book
router.post('/add', async (req, res) => {
    try {
        const { tagId, name, author } = req.body;
        
        // Validate required fields
        if (!tagId || !name) {
            return res.status(400).json({ error: 'tagId and name are required fields' });
        }

        // Create book in database
        const newBook = await books.create({
            tagId,
            name,
            author: author || null // Make author optional
        });

        res.status(201).json(newBook);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ 
            error: 'Server error creating book',
            details: error.message
        });
    }
});

module.exports = router;