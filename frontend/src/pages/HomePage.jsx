import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpRightIcon,
  BookOpenIcon,
  TagIcon,
  ClockIcon,
  PlusIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { BookOpenIcon as BookSolid } from '@heroicons/react/24/solid';
import Layout from '../Layout';
// import axios from 'axios'; // Replaced by useApi
import useApi from '../hooks/useApi'; // Import useApi

const HomePage = () => {
  const { get: apiGet, loading: apiLoading, error: apiError } = useApi(); // Use the hook
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeTags: 0,
    recentScans: 0
  });
  const [recentBooks, setRecentBooks] = useState([]);
  // const [loading, setLoading] = useState(true); // Replaced by apiLoading from useApi
  const [pageError, setPageError] = useState(null); // For displaying errors in UI

  useEffect(() => {
    const fetchData = async () => {
      setPageError(null);
      try {
        // Fetch books data using useApi
        const allBooks = await apiGet('/books'); // Endpoint relative to baseURL in useApi

        if (allBooks) { // Check if data was successfully fetched
          // Calculate stats
          setStats({
            totalBooks: allBooks.length,
            activeTags: allBooks.length, // Assuming 1 tag per book
            recentScans: 54 // Placeholder, as scans endpoint is not implemented
          });

          // Get recent books (last 3 added)
          const sortedBooks = [...allBooks].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setRecentBooks(sortedBooks.slice(0, 3));
        }
      } catch (error) {
        // apiError from useApi will be set.
        // We can use it directly or set a page-specific error message.
        console.error('Error fetching homepage data (caught in component):', error);
        setPageError(error.message || 'Failed to load dashboard data.');
        // Auth errors (401/403) are handled by useApi (logout & redirect)
      }
      // setLoading(false) is handled by useApi
    };

    fetchData();
  }, [apiGet]); // Depend on apiGet from useApi

  const statsConfig = [
    { 
      id: 1, 
      title: 'Total Books', 
      value: stats.totalBooks.toLocaleString(), 
      icon: BookOpenIcon,
      trend: '+12%'
    },
    { 
      id: 3, 
      title: 'Recent Scans', 
      value: stats.recentScans.toLocaleString(), 
      icon: ClockIcon,
      trend: '+23%'
    },
  ];

  if (apiLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }
  
  if (apiError || pageError) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <p className="text-red-500 text-xl mb-4">
            Error: {apiError?.message || pageError || 'Could not load dashboard data.'}
          </p>
          <p className="text-gray-600">Please try refreshing the page. If the problem persists, contact support.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-4">
          <Link
            to="/scan"
            className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <SignalIcon className="w-5 h-5 mr-2" />
            Scan NFC Tag
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {statsConfig.map((stat) => (
          <div
            key={stat.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUpRightIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">{stat.trend}</span>
                </div>
              </div>
              <stat.icon className="w-12 h-12 text-blue-600 p-2 bg-blue-50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Books Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BookSolid className="w-5 h-5 mr-2 text-blue-600" />
          Recently Added Books
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
              {recentBooks.map((book) => (
                <tr key={book.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                  <td className="py-4">{book.name}</td>
                  <td className="py-4">{book.author || 'Unknown'}</td>
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
              {recentBooks.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">
                    No books found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <Link
            to="/books"
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            View All Books
            <ArrowUpRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;