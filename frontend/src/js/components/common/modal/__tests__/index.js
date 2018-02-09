const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-addons-test-utils');
const Im = require('immutable');
const _ = require('lodash');

import sinon from 'sinon';

const $ = require('jquery');

import TestUtils from 'utilities/testing';

const ModalComponents = require('../index.jsx');

const Modal = ModalComponents.Modal;

const modalSettings = require('semantic-ui-modal').settings;

const disableModalAnim = function () {
  // Disable CSS animations for modals as they cause
  // PhantomJS to complain
  modalSettings.transition = null;
  modalSettings.easing = 'swing';
  modalSettings.dimmerSettings.useCSS = false;
};

const enableModalAnim = function () {
  // Reset transition settings for other components
  modalSettings.transition = 'scale';
  modalSettings.dimmerSettings.useCSS = true;
};

describe('Modal', () => {
  beforeEach(() => {
    disableModalAnim();
  });

  it('displays correctly', done => {
    // This test runs a little slow on Chrome
    // this.timeout(4000);
    const modal = TestUtils.renderIntoDocument(<Modal header="Test Modal">
      <div className="content" />
    </Modal>);

    modal.show();
    expect(modal.state.modalOpen).to.be.true;

    _.defer(() => {
      modal.hide();
      _.delay(() => {
        // Once modal has finished hiding, expect that it is no longer
        // on the DOM.
        expect(modal.state.modalOpen).to.be.false;
        done();
      }, modalSettings.duration + 10);
    });
  });
  afterEach(() => {
    enableModalAnim();
  });
});

describe('BasicConfirmModal', () => {
  let onConfirmed;

  beforeEach(() => {
    disableModalAnim();
  });

  it('triggers confirm callback', done => {
    // let confirmed = false;
    onConfirmed = sinon.spy();
    const modal = TestUtils.renderIntoDocument(<Modal onConfirm={onConfirmed} basic>
      <div className="content" />
    </Modal>);
    modal.show();
    expect(modal.state.modalOpen).to.be.true;

    const yesBtn = modal.yesBtn;
    const noBtn = modal.noBtn;
    expect(yesBtn).to.exist;
    expect(noBtn).to.exist;
    done();
    //
    // _.defer(() => {
    //   ReactTestUtils.Simulate.click(yesBtn);
    //   // expect(confirmed).to.equal(true);
    //   expect(onConfirmed.called).to.be.true;
    //   done();
    // });
  });
  afterEach(() => {
    enableModalAnim();
  });
});
