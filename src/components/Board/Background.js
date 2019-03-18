import React from 'react';
import PropTypes from 'prop-types';

import CommunityCards from './CommunityCards';
import PlayerCards from './PlayerCards';
import OpponentCards from './OpponentCards'

import './Background.css';

const Background = function({ children }) {
  const [community, player, opponent] = children;

  return (
    <div className="Background">
      {children}
    </div>
  );
};

Background.propTypes = {
  children: function(props, propName, componentName) {
    const prop = props[propName];
    const allowed = [CommunityCards, PlayerCards, OpponentCards];

    let error = null;
    React.Children.forEach(prop, function(child) {
      if (!allowed.some(type => child.type === type)) {
        error = new Error(
          '`' + componentName + '` children should be of type `CommunityCards`, `PlayerCards`, or `OpponentCards`.'
        );
      }
    });
    return error;
  },
};

export default Background;
