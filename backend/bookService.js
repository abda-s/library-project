const { Book } = require('./models');

const bookService = {
  getBookByTagId: async (tagId) => {
    try {
      const book = await Book.findOne({
        where: { tagId },
        attributes: ['tagId', 'name', 'author', 'createdAt']
      });
      return book ? book.toJSON() : null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  },

  addBook: async (bookData) => {
    try {
      return await Book.create(bookData);
    } catch (error) {
      console.error('Error adding book:', error);
      return null;
    }
  }
};

module.exports = bookService;