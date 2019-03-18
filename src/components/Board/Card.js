import React from 'react';
import PropTypes from 'prop-types';

import './Card.css'

const Card = function ({ rank, suit }) {
  if (rank === undefined && suit === undefined) {
    return (
      <img className="Card" src={require('../../assets/2x/poker_card_back.png')} alt="Unknown Card"></img>
    )
  }

  let suitChar = '';
  switch (suit) {
    case 0: 
      suitChar = 'D';
      break;
    case 1: 
      suitChar = 'C';
      break;
    case 2: 
      suitChar = 'H';
      break;
    case 3: 
      suitChar = 'S';
      break;
    default:
      break;
  }

  let rankString = '';
  switch (rank) {
    case 12: 
      rankString = 'A';
      break;
    case 11: 
      rankString = 'K';
      break;
    case 10: 
      rankString = 'Q';
      break;
    case 9: 
      rankString = 'J';
      break;
    default:
      rankString = (rank + 2).toString()
      break;
  }

  return (
    <img className="Card" src={rankString + suitChar + '.png'} alt={rankString + suitChar}></img>
  )
}

Card.propTypes = {
  suit: PropTypes.oneOf([0,1,2,3]),
  rank: PropTypes.oneOf([0,1,2,3,4,5,6,7,8,9,10,11,12]),
}

export default Card;
