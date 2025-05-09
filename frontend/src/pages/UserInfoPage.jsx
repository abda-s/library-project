import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import Layout from '../Layout'; // Assuming pages include their own Layout

function UserInfoPage() {
  const { user, logout, setUser: setAuthUser } = useAuth(); // Get user, logout, and setUser from AuthContext
  const { put: apiPut, loading: apiLoading, error: apiError, setError: setApiError } = useApi();
  
  const [username, setUsername] = useState(user?.username || '');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    setApiError(null);

    if (!username.trim()) {
      setErrorMessage('Username cannot be empty.');
      return;
    }

    try {
      // Assuming an endpoint like PUT /api/users/me or /api/users/:userId
      // For this example, let's assume /api/users/profile for updating the logged-in user's profile
      // The backend would need to identify the user from the JWT.
      const updatedUserData = await apiPut('/api/auth/user/profile', { username }); // Send only username for update
      
      setMessage('Username updated successfully!');
      
      // Update user in AuthContext
      if (setAuthUser && updatedUserData) {
         // Assuming the backend returns the full updated user object or at least the new username and role
        const newUserState = { ...user, username: updatedUserData.username || username };
        setAuthUser(newUserState); // Update user in AuthContext
        localStorage.setItem('user', JSON.stringify(newUserState)); // Update localStorage
      }

    } catch (err) {
      console.error('Failed to update username:', err);
      setErrorMessage(err.message || 'Failed to update username.');
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="p-8">Loading user information...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">User Profile</h1>

        <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Current Information</h2>
            <p className="text-gray-600"><strong>Username:</strong> {user.username}</p>
            <p className="text-gray-600"><strong>Role:</strong> {user.role}</p>
            <p className="text-gray-600"><strong>User ID:</strong> {user.userId}</p>
          </div>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Update Username</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                New Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={handleUsernameChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            {message && <p className="text-green-600 text-sm">{message}</p>}
            {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}
            {apiError && <p className="text-red-600 text-sm">API Error: {apiError.message}</p>}

            <div>
              <button
                type="submit"
                disabled={apiLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {apiLoading ? 'Updating...' : 'Update Username'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 border-t pt-6">
             <button
                onClick={logout}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default UserInfoPage;