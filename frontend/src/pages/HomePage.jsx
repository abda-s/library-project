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

const HomePage = () => {
  // Temporary data - replace with real data from your API
  const stats = [
    { id: 1, title: 'Total Books', value: '1,234', icon: BookOpenIcon, trend: '12%' },
    { id: 2, title: 'Active Tags', value: '894', icon: TagIcon, trend: '4%' },
    { id: 3, title: 'Recent Scans', value: '56', icon: ClockIcon, trend: '23%' },
  ];

  const recentBooks = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', tagId: '5X8R9', date: '2023-03-15' },
    { id: 2, title: '1984', author: 'George Orwell', tagId: '3A2B4', date: '2023-03-14' },
    { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', tagId: '9C1D7', date: '2023-03-13' },
  ];

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
              <Link
                to="/add-book"
                className="flex items-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Book
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => (
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
                      <td className="py-4">{book.title}</td>
                      <td className="py-4">{book.author}</td>
                      <td className="py-4">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {book.tagId}
                        </span>
                      </td>
                      <td className="py-4">{book.date}</td>
                    </tr>
                  ))}
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