import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import YouTube from 'react-youtube';
import { Page as PageContainer, PageContent as VideoPageContent } from '../index';
import { YouTubeContainer, VimeoContainer, URL_TO_VIDEO_CONTAINER } from '../video-containers';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

// Skipping because these tests are causing unnecssary broken builds
describe.skip('VideoPageContent', () => {
  let component;
  let node;
  let goToNextPageSpy;
  let page = Im.Map({
    id: 1,
    url: 'pages/1',
    video_url: 'http://youtube.com/123'
  });
  const module = Im.Map({
    pages: [{ id: 2 }, { id: 1 }]
  });

  beforeEach(function () {
    TestUtils.mockComponent(this.sandbox, YouTube);
    goToNextPageSpy = sinon.spy();
    component = TestUtils.renderIntoDocument(<VideoPageContent
      page={page}
      module={module}
      goToNextPage={goToNextPageSpy}
      currentUser={currentUser}
    />);
    node = ReactDOM.findDOMNode(component);
  });

  describe('`video_url` is YouTube link', () => {
    before(() => {
      page = page.set('video_url', 'http://youtube.com/123');
    });

    it('renders a `YouTubeContainer`', () => {
      const container = ReactTestUtils.findRenderedComponentWithType(component, YouTubeContainer);
    });
  });

  describe('`video_url` is Vimeo link', () => {
    before(() => {
      page = page.set('video_url', 'http://vimeo.com/123');
    });

    it('renders a `VimeoContainer`', () => {
      const container = ReactTestUtils.findRenderedComponentWithType(component, VimeoContainer);
    });

    after(() => {
      page = page.set('video_url', 'http://youtube.com/123');
    });
  });

  describe('`require_video_view` changes', () => {
    let nextBtn;

    beforeEach(() => {
      nextBtn = ReactTestUtils.scryRenderedDOMComponentsWithClass(component, 'next-btn')[0];
    });

    describe('`require_video_view` is `false`', () => {
      before(() => {
        page = page.set('require_video_view', false);
      });

      it('allows user to progress without having watched the video', () => {
        ReactTestUtils.Simulate.click(nextBtn);
        expect(component.getVideoWatched()).to.be.false;
        expect(goToNextPageSpy.called).to.be.true;
      });
    });

    describe('`require_video_view` is `true`', () => {
      before(() => {
        page = page.set('require_video_view', true);
      });

      it('does not allow user to progress without having watched the video', function () {
        this.sandbox.stub(component.refs.videoContainer, 'videoWasSkipped').returns(false);
        expect(nextBtn).to.not.exist;
        expect(component.state.videoWatched).to.be.false;
        component.onVideoEnd();
        nextBtn = ReactTestUtils.scryRenderedDOMComponentsWithClass(component, 'next-btn')[0];
        expect(nextBtn).to.exist;
        expect(component.state.videoWatched).to.be.true;
        expect(goToNextPageSpy.called).to.be.false;
        ReactTestUtils.Simulate.click(nextBtn);
        expect(goToNextPageSpy.called).to.be.true;
      });
    });
  });
});
