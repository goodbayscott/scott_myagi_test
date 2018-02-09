import Im from 'immutable';
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import { AvatarImage } from '../avatar-images';

import TestUtils from 'utilities/testing';

import ReactTestUtils from 'react-addons-test-utils';

describe('AvatarImage', () => {
  let component;
  let componentNode;

  const src = 'https://placeholdit.imgix.net/~text?w=1&h=1';

  describe('when `user` is valid', () => {
    beforeEach(() => {
      const user = Im.Map({
        first_name: 'john',
        last_name: 'smith',
        profile_photo: src
      });

      component = TestUtils.renderIntoDocument(<AvatarImage user={user} />);

      componentNode = ReactDOM.findDOMNode(component);
    });

    it('should render the avatar image', () => {
      expect(componentNode.attributes.src.value).to.contain(src);
    });

    it('should render in default size', () => {
      expect(componentNode.attributes.style.value).to.contain('2.5em');
    });
  });

  describe('when `user` does not have profile_photo', () => {
    beforeEach(() => {
      const user = Im.Map({
        first_name: 'john',
        last_name: 'smith',
        learner: {}
      });

      component = TestUtils.renderIntoDocument(<AvatarImage user={user} />);

      componentNode = ReactDOM.findDOMNode(component);
    });

    it('should render the initials', () => {
      expect(componentNode.innerHTML).to.contain('JS');
    });

    it('should not render the avatar image', () => {
      expect(_.map(componentNode.attributes, 'nodeName')).to.not.contain('src');
    });
  });
});
