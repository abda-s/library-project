import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowUpRightIcon
} from '@heroicons/react/24/outline';
import Layout from '../Layout';
import axios from 'axios';
import BookEditModal from '../components/BookEditModal';

function BooksPage() {
  const [allBooks, setAllBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bookToEdit, setBookToEdit] = useState(null); // State to hold the data of the book being edited

  // Calculate pagination values
  const totalItems = allBooks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBooks = allBooks.slice(startIndex, endIndex);

  // Function to fetch books (replace with your actual fetch logic)
  const fetchBooks = async () => {
    try {
      const response = await axios.get('http://localhost:4000/books'); // Your API endpoint
      setAllBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
      // Handle error (e.g., show error message)
    }
  };

  useEffect(() => {
    fetchBooks(); // Fetch books when the page loads
  }, []);

  // Function to call when a book item in the list is clicked
  const handleEditClick = (book) => {
    setBookToEdit(book); // Set the book data to the state
    setShowEditModal(true); // Open the modal
  };

  // Function to call after a successful edit in the modal
  const handleEditSuccess = () => {
    fetchBooks(); // Re-fetch the list to show updated data
    // Or update state locally if you prefer
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setShowEditModal(false);
    setBookToEdit(null); // Clear the book data when modal closes
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderPaginationNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md ${currentPage === i
            ? 'bg-blue-600 text-white'
            : 'hover:bg-gray-100 text-gray-700'
            }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Book Catalog ({totalItems} entries)
        </h1>
        <div className="flex items-center gap-4">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded-md px-3 py-2 text-sm"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
          <Link
            to="/scan"
            className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Book
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          All Books
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-3">Title</th>
                <th className="pb-3">Author</th>
                <th className="pb-3">NFC Tag ID</th>
                <th className="pb-3">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {currentBooks.map((book) => (
                <tr key={book.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                  onClick={() => handleEditClick(book)} // Click to open edit modal
                >
                  <td className="py-4">{book.name}</td>
                  <td className="py-4">{book.author || 'N/A'}</td>
                  <td className="py-4">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {book.tagId}
                    </span>
                  </td>
                  <td className="py-4">
                    {new Date(book.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{' '}
            {totalItems} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronDoubleLeftIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>

            <div className="flex gap-1">{renderPaginationNumbers()}</div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronDoubleRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {/* Render the Edit Modal */}
      <BookEditModal
        isOpen={showEditModal}
        onClose={handleCloseModal}
        bookData={bookToEdit} // Pass the selected book data
        onSuccess={handleEditSuccess} // Pass the success hanFdler
      />
    </Layout>
  );
}

export default BooksPage;