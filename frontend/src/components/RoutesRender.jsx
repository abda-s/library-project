import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import NFCScanPage from '../pages/NFCScanPage';
import BooksPage from '../pages/BooksPage';
import RFIDChartPage from '../pages/RFIDChartPage';
function RoutesRender() {
    const publicRoutes = [
        { path: '/', element: <HomePage /> },
        { path: '/scan', element: <NFCScanPage /> },
        { path: '/books', element: <BooksPage /> },
        { path: '/rfid-chart', element: <RFIDChartPage /> },
        
    ];
  return (
    <Routes>
        
        {publicRoutes.map(({ path, element }) => (
                    <Route key={path} path={path} element={element} />
                ))}

        <Route path="*" element={<Navigate to={'/'} />} />
    </Routes>
  )
}

export default RoutesRender