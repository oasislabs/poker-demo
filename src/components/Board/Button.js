import React from 'react';
import PropTypes from 'prop-types';

import './Button.css';

const Button = function({ text, onClick }) {
  return <button onClick={onClick} className="Button">{text}</button>
};

Button.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default Button;
