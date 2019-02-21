/*
 * Copyright 2017 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import {Hand, Card, CardBack} from 'react-deck-o-cards'
import PropTypes from 'prop-types';
import { GameInfo } from 'oasis-game-components';
import './board.css';

const defHandStyle = {
  maxHeight:'30vh',
  minHeight:'30vh',
  padding: '1vh',
};

class Board extends React.Component {

  static propTypes = {
    G: PropTypes.any.isRequired,
    ctx: PropTypes.any.isRequired,
    moves: PropTypes.any.isRequired,
    playerID: PropTypes.number,
    isSpectating: PropTypes.bool,
    isMultiplayer: PropTypes.bool
  };

  onClick = id => {
    this.props.moves.poker_move(id)
  };

  format (cellValue) {
    if (cellValue === -1) return '';
    return cellValue;
  }

  getVictoryInfo () {
    let gameover = this.props.ctx.gameover
    if (gameover) {
      let victoryInfo = {};
      var color = (gameover.winner == this.props.playerID || this.props.isSpectating) ? 'green' : 'red'
      var text = `Player ${gameover.winner} won! `
      victoryInfo.winner = <div className={color} id="winner">{text}</div>;
      return victoryInfo
    }
    return null
  }

  getPotInfo() {
    return this.props.G.hand_pot.toString()
  }

  getChipInfo() {
    return this.props.G.chips.toString()
  }

  getChipTableInfo() {
    return this.props.G.chip_table.toString()
  }

  getTableInfo () {
    return this.props.G.card_table
  }

  getHandInfo () {
    let cards = this.props.G.hands
    return cards[this.props.playerID - 1]
  }

  formatLastMove() {
    return this.props.G.last_move
  }

  formatHandResult() {
    return this.props.G.hand_result
  }

  getCellClass () {
    return 'active'
  }

  render() {

    let lastMove = this.formatLastMove();

    let victoryInfo = this.getVictoryInfo() 
    let tbody = [];
    let cells = [];
    
    // Hit
    let id = '';
    let displayMessage = [];

    if (lastMove.indexOf("HAND OVER") !== -1) {

      id = 'Confirm';
      cells.push(
        <td
          key={id}
          className={'active'}
          onClick={() => this.onClick(99)}
        >
          {id}
        </td>
      );
    
      let hand_result = this.formatHandResult();

      displayMessage.push(
        <p>Hand Result: {hand_result}</p>
      );

    } else {  

      // Only fold if responding to a bet, raise or all in
      let responding = (lastMove.indexOf("Bet") !== -1 || lastMove.indexOf("Raise") !== -1 || lastMove.indexOf("All") !== -1);

      if (responding) {
        id = 'Fold';
        cells.push(
          <td
            key={id}
            className={'active'}
            onClick={() => this.onClick(0)}
          >
            {id}
          </td>
        );
      }

      // CHECK or CALL
      if (responding) {
        id = 'Call';
      } else {
        id = 'Check';
      }
        
      cells.push(
        <td
          key={id}
          className={'active'}
          onClick={() => this.onClick(1)}
        >
          {id}
        </td>
      );

      // If all in, no more additional bet, raise or all in.
      if (lastMove.indexOf("All") == -1) {

        // BET or RAISE
        if (responding) {
          id = 'Raise';
        } else {
          id = 'Bet';
        }
        cells.push(
          <td
            key={id}
            className={'active'}
            onClick={() => this.onClick(2)}
          >
            {id}
          </td>
        );

        // All in, exists regardless of responding or not
        id = 'All in';  
        cells.push(
          <td
            key={id}
            className={'active'}
            onClick={() => this.onClick(3)}
          >
            {id}
          </td>
        );

      }

    }

    tbody.push(<tr key={'m'}>{cells}</tr>);

    let tableInfo = this.getTableInfo();
    let handInfo = this.getHandInfo();

    displayMessage.push(<p>Last Move: {lastMove}</p>)

    let rendered = (
      <div className="flex flex-column justify-center items-center">
        <Hand cards={tableInfo} hidden={false} style={defHandStyle} />
        <Hand cards={handInfo} hidden={false} style={defHandStyle} />
        {displayMessage}
        <p>Pot: {this.getPotInfo()}</p>
        <p>Chips on Table: {this.getChipTableInfo()}</p>
        <p>Chips: {this.getChipInfo()}</p>
        <table id="board">
          <tbody>{tbody}</tbody>
        </table>
        <GameInfo winner={victoryInfo ? victoryInfo.winner: null} {...this.props} />
      </div>
    );
    return rendered;
  }
}

export default Board;
