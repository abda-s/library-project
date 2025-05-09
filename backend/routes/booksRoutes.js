// your_router_file.js (e.g., routes/books.js)
const express = require('express');
const router = express.Router();
const { books } = require('../models'); // from models/index.js
const { Op } = require("sequelize"); // Needed for potential future complex queries, but not strictly for these simple ones

// POST /api/books/add - Create a new book
router.post('/add', async (req, res) => {
    try {
        const { tagId, name, author } = req.body;

        // Validate required fields
        if (!tagId || !name) {
            return res.status(400).json({ error: 'tagId and name are required fields' });
        }

        // Optional: Check if a book with this tagId already exists before creating
        const existingBook = await books.findOne({ where: { tagId: tagId } });
        if (existingBook) {
             return res.status(409).json({ error: 'A book with this Tag ID already exists' }); // 409 Conflict
        }


        // Create book in database
        const newBook = await books.create({
            tagId,
            name,
            author: author || null // Make author optional, store null if empty string or undefined
        });

        res.status(201).json(newBook);
    } catch (error) {
        console.error('Error creating book:', error);
        // Check for specific database errors, e.g., unique constraint violation if not checked above
         if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ error: 'A book with this Tag ID already exists' });
         }
        res.status(500).json({
            error: 'Server error creating book',
            details: error.message
        });
    }
});

// GET /api/books - Get all books (no pagination)
router.get('/', async (req, res) => {
    try {
        const booksDB = await books.findAll({
            order: [['createdAt', 'DESC']] // Order by creation date descending
        });

        res.json(booksDB);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({
            error: 'Server error fetching books',
            details: error.message
        });
    }
});

// GET /api/books/:tagId - Get a single book by Tag ID (Optional, but good practice)
router.get('/:tagId', async (req, res) => {
    try {
        const { tagId } = req.params;

        const book = await books.findOne({ where: { tagId: tagId } });

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json(book);

    } catch (error) {
        console.error('Error fetching single book:', error);
        res.status(500).json({
            error: 'Server error fetching book',
            details: error.message
        });
    }
});


// PUT /api/books/update/:tagId - Update a book
router.put('/update/:tagId', async (req, res) => {
    try {
        const { tagId } = req.params;
        const { name, author } = req.body; // Get updated fields from body

        // Basic validation: Ensure name is provided for update
        if (!name) {
             return res.status(400).json({ error: 'Book name is required for update' });
        }

        // Find the book by tagId
        const book = await books.findOne({ where: { tagId: tagId } });

        // If book not found
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Update book attributes
        book.name = name;
        book.author = author || null; // Update author, allow setting to null

        // Save the updated book
        await book.save();

        // Respond with the updated book or a success message
        res.status(200).json(book); // Or { message: 'Book updated successfully', book: book }

    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({
            error: 'Server error updating book',
            details: error.message
        });
    }
});

// DELETE /api/books/:tagId - Delete a book
router.delete('/:tagId', async (req, res) => {
    try {
        const { tagId } = req.params;

        // Find the book by tagId
        const book = await books.findOne({ where: { tagId: tagId } });

        // If book not found
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Delete the book
        await book.destroy();

        // Respond with success message
        // 200 OK with a message, or 204 No Content are common for successful deletion
        res.status(200).json({ message: 'Book deleted successfully', tagId: tagId }); // Including tagId in response can be useful

    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({
            error: 'Server error deleting book',
            details: error.message
        });
    }
});

module.exports = router;