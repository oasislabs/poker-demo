import React from 'react';
import PropTypes from 'prop-types';

import CardList from './CardList';

import './CommunityCards.css'

const CommunityCards = ({ cards }) => {
  return (
    <div className="CommunityCards">
      <CardList cards={cards} />
    </div>
  )
}

export default CommunityCards;