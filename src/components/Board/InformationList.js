import React from 'react';
import PropTypes from 'prop-types';

import './InformationList.css';

const InformationList = function({ G, playerID }) {
  return (
    <div className="InformationList">
      {G.hand_result && <p className="InformationList__item">Hand Result: {G.hand_result}</p>}
      <p className="InformationList__item">Last Move: {G.last_move}</p>
      <p className="InformationList__item">Pot: {G.hand_pot}</p>
      <p className="InformationList__item">Chips on Table: {G.chip_table[playerID - 1]}</p>
      <p className="InformationList__item">Chips: {G.chips[playerID - 1]}</p>
    </div>
  )
};

InformationList.propTypes = {
  G: PropTypes.any.isRequired,
  playerID: PropTypes.number.isRequired
};

export default InformationList;
