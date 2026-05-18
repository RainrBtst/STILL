import React from 'react'
import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import Signup from './Signup'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Home from './Home'
import SendSong from './SendSong' 
import Profile from './Profile'
import About from './About' // 1. IMPORT THE ABOUT COMPONENT
import Rewind from './Rewind' // Import the new file
import Daily from './Daily' // IMPORT THE DAILY COMPONENT

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to="/login" />} />
        <Route path='/register' element={<Signup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/home' element={<Home />} />
        <Route path="/send-song" element={<SendSong />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/rewind' element={<Rewind />} />
        
        {/* DAILY AUX ROUTE USING /daily */}
        <Route path='/daily' element={<Daily />} />
        
        {/* 2. ADD THE ABOUT ROUTE HERE */}
        <Route path='/about' element={<About />} />

        <Route path='*' element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App