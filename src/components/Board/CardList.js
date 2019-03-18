import React from 'react';
import PropTypes from 'prop-types';

import Card from './Card';

import './CardList.css'

const CardList = ({ cards = [] }) => {
  return (
    <div className="CardList">
      {cards.map((card, i) =>
        <div key={card.rank ? `${card.rank}${card.suit}` : i} className="CardList__item">
          <Card {...card}/>
        </div>
      )}
    </div>
  )
}

export default CardList;