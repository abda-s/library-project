// your_router_file.js (e.g., routes/books.js)
const express = require('express');
const router = express.Router();
const { books } = require('../models'); // from models/index.js
const { Op } = require("sequelize"); // Needed for potential future complex queries, but not strictly for these simple ones
const { authorizeRoles, authorizePermission } = require('../middleware/authMiddleware'); // Import auth middleware

// POST /api/books/add - Create a new book
// Requires 'manage_books' permission (admin, librarian)
router.post('/add', authorizePermission('manage_books'), async (req, res) => {
    console.log(`[BooksRoutes] POST /add: User ID ${req.userId} attempting to add book. Body:`, req.body);
    try {
        const { tagId, name, author } = req.body;

        if (!tagId || !name) {
            console.log('[BooksRoutes] POST /add: Failed - Missing tagId or name.');
            return res.status(400).json({ error: 'tagId and name are required fields' });
        }

        const existingBook = await books.findOne({ where: { tagId: tagId } });
        if (existingBook) {
            console.log('[BooksRoutes] POST /add: Failed - Book with Tag ID already exists:', tagId);
             return res.status(409).json({ error: 'A book with this Tag ID already exists' });
        }

        const newBook = await books.create({
            tagId,
            name,
            author: author || null
        });
        console.log('[BooksRoutes] POST /add: Success - Book added:', newBook.name, 'ID:', newBook.id);
        res.status(201).json(newBook);
    } catch (error) {
        console.error('[BooksRoutes] POST /add: Error creating book:', error);
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
// Requires 'view_books' permission (admin, librarian, member)
router.get('/', authorizePermission('view_books'), async (req, res) => {
    console.log(`[BooksRoutes] GET /: User ID ${req.userId} fetching all books.`);
    try {
        const booksDB = await books.findAll({
            order: [['createdAt', 'DESC']]
        });
        console.log(`[BooksRoutes] GET /: Success - Found ${booksDB.length} books.`);
        res.json(booksDB);
    } catch (error) {
        console.error('[BooksRoutes] GET /: Error fetching books:', error);
        res.status(500).json({
            error: 'Server error fetching books',
            details: error.message
        });
    }
});

// GET /api/books/:tagId - Get a single book by Tag ID (Optional, but good practice)
// Requires 'view_books' permission (admin, librarian, member)
router.get('/:tagId', authorizePermission('view_books'), async (req, res) => {
    const { tagId } = req.params;
    console.log(`[BooksRoutes] GET /${tagId}: User ID ${req.userId} fetching book by Tag ID.`);
    try {
        const book = await books.findOne({ where: { tagId: tagId } });

        if (!book) {
            console.log(`[BooksRoutes] GET /${tagId}: Failed - Book not found.`);
            return res.status(404).json({ error: 'Book not found' });
        }
        console.log(`[BooksRoutes] GET /${tagId}: Success - Found book:`, book.name);
        res.json(book);

    } catch (error) {
        console.error(`[BooksRoutes] GET /${tagId}: Error fetching single book:`, error);
        res.status(500).json({
            error: 'Server error fetching book',
            details: error.message
        });
    }
});


// PUT /api/books/update/:tagId - Update a book
// Requires 'manage_books' permission (admin, librarian)
router.put('/update/:tagId', authorizePermission('manage_books'), async (req, res) => {
    const { tagId } = req.params;
    console.log(`[BooksRoutes] PUT /update/${tagId}: User ID ${req.userId} attempting to update book. Body:`, req.body);
    try {
        const { name, author } = req.body;

        if (!name) {
            console.log(`[BooksRoutes] PUT /update/${tagId}: Failed - Book name is required.`);
             return res.status(400).json({ error: 'Book name is required for update' });
        }

        const book = await books.findOne({ where: { tagId: tagId } });

        if (!book) {
            console.log(`[BooksRoutes] PUT /update/${tagId}: Failed - Book not found.`);
            return res.status(404).json({ error: 'Book not found' });
        }

        book.name = name;
        book.author = author || null;
        await book.save();
        console.log(`[BooksRoutes] PUT /update/${tagId}: Success - Book updated:`, book.name);
        res.status(200).json(book);

    } catch (error) {
        console.error(`[BooksRoutes] PUT /update/${tagId}: Error updating book:`, error);
        res.status(500).json({
            error: 'Server error updating book',
            details: error.message
        });
    }
});

// DELETE /api/books/:tagId - Delete a book
// Requires 'manage_books' permission (admin, librarian)
router.delete('/:tagId', authorizePermission('manage_books'), async (req, res) => {
    const { tagId } = req.params;
    console.log(`[BooksRoutes] DELETE /${tagId}: User ID ${req.userId} attempting to delete book.`);
    try {
        const book = await books.findOne({ where: { tagId: tagId } });

        if (!book) {
            console.log(`[BooksRoutes] DELETE /${tagId}: Failed - Book not found.`);
            return res.status(404).json({ error: 'Book not found' });
        }

        await book.destroy();
        console.log(`[BooksRoutes] DELETE /${tagId}: Success - Book deleted.`);
        res.status(200).json({ message: 'Book deleted successfully', tagId: tagId });

    } catch (error) {
        console.error(`[BooksRoutes] DELETE /${tagId}: Error deleting book:`, error);
        res.status(500).json({
            error: 'Server error deleting book',
            details: error.message
        });
    }
});

module.exports = router;