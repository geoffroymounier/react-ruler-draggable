import React from 'react'
import cursorPng from '../assets/cursor.png'

const Cursor = ({horizontal}) => (
  horizontal ?
  <img
    src={cursorPng}
    alt="cursor"
    height="100%"
    width="30px"
    style={{ objectFit: 'cover' }}
  />
  :
  <img
    src={cursorPng}
    alt="cursor"
    width="100%"
    style={{ objectFit: 'cover',transform:'rotate(90deg)' }}
  />
)

export default Cursor
