import Im from 'immutable';
import React from 'react';
import ReactDOM from 'react-dom';
import { BadgeAward, BadgeAwardList } from '../badge-list';

import TestUtils from 'utilities/testing';

const ReactTestUtils = require('react-addons-test-utils');

describe('BadgeAwardList', () => {
  let component,
    componentNode;

  describe('when `badges` is falsy', () => {
    beforeEach(() => {
      const badges = null;

      component = TestUtils.renderIntoDocument(<BadgeAwardList badgeAwards={badges} />);

      componentNode = ReactDOM.findDOMNode(component);
    });

    it('should render `No badges have been earned`', () => {
      expect(componentNode.innerHTML).to.contain('No badges have been earned');
    });
  });

  describe('when `badges` is an Im.List', () => {
    const badgeAwards = Im.List([
      {
        badge: {
          badge_image: '',
          name: 'testBadge',
          description: 'badge description'
        }
      }
    ]);

    beforeEach(() => {
      component = TestUtils.renderIntoDocument(<BadgeAwardList badgeAwards={badgeAwards} />);

      componentNode = ReactDOM.findDOMNode(component);
    });

    it('should render a <BadgeAward>', () => {
      const badgesComponents = ReactTestUtils.scryRenderedDOMComponentsWithClass(
        component,
        'badgey-boi'
      );
      expect(badgesComponents.length).to.equal(1);
      expect(componentNode.innerHTML).to.contain(badgeAwards.get(0).badge.name);
    });
  });
});
