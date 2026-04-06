import React from 'react'
import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import Signup from './Signup'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Home from './Home'
import SendSong from './SendSong' 
import Profile from './Profile' // 1. IMPORT THE PROFILE COMPONENT

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to="/login" />} />
        <Route path='/register' element={<Signup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/home' element={<Home />} />
        <Route path="/send-song" element={<SendSong />} />
        
        {/* 2. ADD THE PROFILE ROUTE HERE */}
        <Route path='/profile' element={<Profile />} />

        <Route path='*' element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App