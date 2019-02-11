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
    this.props.moves.blackjack_move(id)
  };

  format (cellValue) {
    if (cellValue === -1) return '';
    return cellValue;
  }

  getVictoryInfo () {
    let gameover = this.props.ctx.gameover
    if (gameover) {
      let victoryInfo = {};
      if (!gameover.winner) {
        var color = 'orange'
        var text = 'It\'s a draw! ' + gameover.scores.toString()
      } else {
        color = (gameover.winner == this.props.playerID || this.props.isSpectating) ? 'green' : 'red'
        text = `Player ${gameover.winner} won! `  + gameover.scores.toString()
      }
      victoryInfo.winner = <div className={color} id="winner">{text}</div>;
      victoryInfo.color = color
      victoryInfo.cells = new Set(gameover.winning_cells)
      return victoryInfo
    }
    return null
  }

  getCardInfo () {
    let cards = this.props.G.hands
    return cards[this.props.playerID - 1]
  }

  getCellClass () {
    return 'active'
  }

  render() {

    let victoryInfo = this.getVictoryInfo() 
    let tbody = [];

    let cells = [];
    
    // Hit
    let id = 'Hit';
    cells.push(
      <td
        key={id}
        className={'active'}
        onClick={() => this.onClick(0)}
      >
        {id}
      </td>
    );

    // Stay
    id = 'Stay';  
    cells.push(
      <td
        key={id}
        className={'active'}
        onClick={() => this.onClick(1)}
      >
        {id}
      </td>
    );

    tbody.push(<tr key={'m'}>{cells}</tr>);

    let player = null;
    if (this.props.playerID) {
      player = <div id="player">Player: {this.props.playerID}</div>;
    }

    let cardInfo = this.getCardInfo()

    let rendered = (
      <div className="flex flex-column justify-center items-center">
        <Hand cards={cardInfo} hidden={false} style={defHandStyle} />
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
