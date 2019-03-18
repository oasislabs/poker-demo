/*
 * Copyright 2017 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { GameInfo } from 'oasis-game-components';

import Card from './Card'
import Background from './Background';
import CommunityCards from './CommunityCards';
import PlayerCards from './PlayerCards';
import OpponentCards from './OpponentCards'
import ActionList from './ActionList';
import InformationList from './InformationList';

// Import all the cards in src/assets/2x/cards directory. This is needed for webpack
function importAll(r) {
  return r.keys().map(r);
}
importAll(require.context('../../assets/2x/cards', false, /\.(png|jpe?g|svg)$/));

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

  getPlayerCards() {
    // Since the state is fully-filtered for this player, we use the first hand in the list.
    const { G } = this.props;
    return G.hands[0];
  }

  getCommunityCards() {
    // An empty object will render the back of a card
    const cardTable = this.props.G.card_table;
    const cards = [{}, {}, {}, {}, {}];
    return cards.map((card, i) =>
      typeof cardTable[i] === 'object'
        ? cardTable[i]
        : card
    )
  }

  render() {
    const victoryInfo = this.getVictoryInfo();

    return (
      <div className="flex flex-column justify-center items-center">
        <Background>
          <CommunityCards cards={this.getCommunityCards()} />
          <PlayerCards cards={this.getPlayerCards()} />
          <OpponentCards cards={[{}, {}]} />
        </Background>
        <InformationList G={this.props.G} playerID={this.props.playerID}/>
        <ActionList lastMove={this.props.G.last_move} onClick={this.onClick}/>
        <GameInfo winner={victoryInfo ? victoryInfo.winner : null} {...this.props} />
      </div>
    );
  }
}

export default Board;
