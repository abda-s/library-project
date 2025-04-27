import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import NFCScanPage from '../pages/NFCScanPage';
function RoutesRender() {
    const publicRoutes = [
        { path: '/', element: <HomePage /> },
        { path: '/scan', element: <NFCScanPage /> },
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