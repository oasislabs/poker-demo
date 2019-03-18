import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import './ActionList.css'

const ACTION = {
  FOLD: 0,
  CHECK_OR_CALL: 1,
  BET_OR_RAISE: 2,
  ALL_IN: 3,
  CONFIRM: 99
};

const ActionList = function ({ lastMove, onClick }) {
  let actions = [];

  if (lastMove.indexOf('HAND OVER') !== -1) {
    actions.push({
      name: 'Confirm',
      clickId: ACTION.CONFIRM
    })
  } else {  
    // Only fold if responding to a bet, raise or all in
    let responding = (lastMove.indexOf('Bet') !== -1 || lastMove.indexOf('Raise') !== -1 || lastMove.indexOf('All') !== -1);

    if (responding) {
      actions.push({
        name: 'Fold',
        clickId: ACTION.FOLD
      })
    }

    // CHECK or CALL
    if (responding) {
      actions.push({
        name: 'Call',
        clickId: ACTION.CHECK_OR_CALL
      })
    } else {
      actions.push({
        name: 'Check',
        clickId: ACTION.CHECK_OR_CALL
      })
    }
      
    // If all in, no more additional bet, raise or all in.
    if (lastMove.indexOf('All') == -1) {

      // BET or RAISE
      if (responding) {
        actions.push({
          name: 'Raise',
          clickId: ACTION.BET_OR_RAISE
        })
      } else {
        actions.push({
          name: 'Bet',
          clickId: ACTION.BET_OR_RAISE
        })
      }

      // All in, exists regardless of responding or not
      actions.push({
        name: 'All in',
        clickId: ACTION.ALL_IN
      });
    }
  }

  return (
    <div className="ActionList">
      {actions.map(action =>
        <div key={action.name} className="ActionList__item">
          <Button text={action.name} onClick={() => onClick(action.clickId)} />
        </div>
      )}
    </div>
  )
}

ActionList.propTypes = {
  lastMove: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
}

export default ActionList;
