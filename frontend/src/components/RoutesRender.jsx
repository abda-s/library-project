import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import HomePage from '../pages/HomePage';
import NFCScanPage from '../pages/NFCScanPage';
import BooksPage from '../pages/BooksPage';
import RFIDChartPage from '../pages/RFIDChartPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import UserInfoPage from '../pages/UserInfoPage'; // Import UserInfoPage

// Components
import ProtectedRoute from './ProtectedRoute'; // HOC for protected routes
import { useAuth } from '../context/AuthContext'; // To check user status for fallback

function RoutesRender() {
    const { user } = useAuth(); // Get user to determine fallback route

    // Define protected routes that will be wrapped by Layout
    const protectedLayoutRoutes = [
        { path: '/', element: <HomePage /> },
        { path: '/scan', element: <NFCScanPage /> },
        { path: '/books', element: <BooksPage /> },
        { path: '/chart', element: <RFIDChartPage /> }, // Corrected path from /rfid-chart
        { path: '/profile', element: <UserInfoPage /> }, // Added route for UserInfoPage
        // Add other protected routes that need the Layout here
    ];

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes wrapped by ProtectedRoute */}
            {/* Individual page components are now expected to include Layout themselves */}
            <Route element={<ProtectedRoute />}>
                {protectedLayoutRoutes.map(({ path, element }) => (
                    <Route key={path} path={path} element={element} />
                ))}
            </Route>
            
            {/* Fallback for non-matched routes */}
            {/* If user is logged in, redirect to home, otherwise to login */}
            <Route path="*" element={user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
        </Routes>
    );
}

export default RoutesRender;