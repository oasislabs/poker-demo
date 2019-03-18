import React from 'react';
import PropTypes from 'prop-types';

import CardList from './CardList';

import './PlayerCards.css'

const PlayerCards = ({ cards }) => {
  return (
    <div className="PlayerCards">
      <CardList cards={cards} />
    </div>
  )
}

export default PlayerCards;