import React from 'react'
import cursorPng from '../assets/cursor.png'

const Cursor = () => (
  <img
    src={cursorPng}
    alt="cursor"
    height="100%"
    width="30px"
    style={{ objectFit: 'cover' }}
  />
)

export default Cursor
