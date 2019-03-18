import React from 'react';
import PropTypes from 'prop-types';

import CardList from './CardList';

import './OpponentCards.css'

const OpponentCards = ({ cards }) => {
  return (
    <div className="OpponentCards">
      <CardList cards={cards} />
    </div>
  )
}

export default OpponentCards;