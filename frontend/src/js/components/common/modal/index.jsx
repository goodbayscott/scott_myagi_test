import _ from 'lodash';
import React from 'react';
import Im from 'immutable';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import reactMixin from 'react-mixin';

import { t } from 'i18n';

import { Button, Icon, Modal as SemanticModal } from 'semantic-ui-react';

import Style from 'style';

class ModalContent extends React.Component {
  render() {
    const { children, content } = this.props;
    if (!children && !content) return <span />;
    return (
      <SemanticModal.Content
        style={this.props.contentStyle ? this.props.contentStyle : {}}
        scrolling={this.props.scrolling}
      >
        {children && children}
        {content && content}
      </SemanticModal.Content>
    );
  }
}

class ModalHeader extends React.Component {
  render() {
    return (
      <SemanticModal.Header style={this.props.headerStyle ? this.props.headerStyle : {}}>
        {this.props.header}
      </SemanticModal.Header>
    );
  }
}

/*
Wrapper around Semantic's react implementation of modals.
https://react.semantic-ui.com/modules/modal
Example usage:

...
showModal = () => {
  this.m.show();
}

render() {
  return (
    <div>
      <Modal ref={m => (this.m = m)} header={'Here is a cool modal'} size={'large'}>
        <div>This is shown as modal content</div>
      </Modal>
      <Button onClick={this.showModal} />
    </div>
  )
}

*/
export class Modal extends React.Component {
  static propTypes = {
    showOnInit: React.PropTypes.bool,
    size: React.PropTypes.oneOf(['fullscreen', 'large', 'mini', 'small', 'tiny', undefined]),
    onOpen: React.PropTypes.func,
    onHidden: React.PropTypes.func,
    onConfirm: React.PropTypes.func,
    basic: React.PropTypes.bool, // Full screen, simple text
    closeOnDimmerClick: React.PropTypes.bool,
    header: React.PropTypes.node,
    noConfirm: React.PropTypes.bool, // If truthy don't provide buttons for confirmation
    message: React.PropTypes.bool, // If truthy, show confirmation or yes / no buttons
    leftText: React.PropTypes.string,
    rightText: React.PropTypes.string
  };

  constructor(props) {
    super(props);
    this.state = {
      modalOpen: props.showOnInit
    };
  }

  show = () => {
    this.setState({ modalOpen: true });
  };

  hide = evt => {
    if (this.props.onHidden) {
      this.props.onHidden(evt);
    }
    _.defer(() => this.setState({ modalOpen: false }));
  };

  onConfirm = () => {
    if (this.props.onConfirm) this.props.onConfirm();
    this.hide();
  };

  onOpen = () => {
    if (this.props.onOpen) this.props.onOpen();
  };

  isOpen = () => this.state.modalOpen;

  getModalContentsComponent = () => this.content;

  render() {
    return (
      <SemanticModal
        size={this.props.size ? this.props.size : 'small'}
        open={this.props.showOnInit ? undefined : this.state.modalOpen}
        onClose={this.hide}
        onOpen={this.onOpen}
        basic={this.props.basic}
        dimmer="blurring"
        closeIcon={this.props.closeIcon !== undefined ? this.props.closeIcon : true}
        closeOnDimmerClick={this.props.closeOnDimmerClick}
        closeOnEscape={this.props.closeOnEscape}
        style={this.props.style}
        defaultOpen={this.props.showOnInit ? this.props.showOnInit : undefined}
      >
        {this.props.header ? (
          <ModalHeader ref={header => (this.header = header)} {...this.props} />
        ) : null}

        <ModalContent ref={content => (this.content = content)} {...this.props} />

        {this.props.basic && !this.props.noConfirm ? (
          <SemanticModal.Actions>
            {this.props.message ? (
              <Button
                ref={confirmBtn => (this.confirmBtn = confirmBtn)}
                color="green"
                onClick={this.onConfirm}
                inverted
              >
                <Icon name="checkmark" /> {this.props.rightText || t('okay')}
              </Button>
            ) : (
              <div>
                <Button
                  ref={noBtn => (this.noBtn = noBtn)}
                  basic
                  color="red"
                  onClick={this.hide}
                  inverted
                >
                  <Icon name="remove" /> {this.props.leftText || t('no')}
                </Button>
                <Button
                  ref={yesBtn => (this.yesBtn = yesBtn)}
                  color="green"
                  onClick={this.onConfirm}
                  inverted
                >
                  <Icon name="checkmark" /> {this.props.rightText || t('yes')}
                </Button>
              </div>
            )}
          </SemanticModal.Actions>
        ) : null}
      </SemanticModal>
    );
  }
}

export class ConfirmDeleteModal extends React.Component {
  show() {
    this.modal.show();
  }
  render() {
    return (
      <Modal
        ref={e => (this.modal = e)}
        basic
        header={t('are_you_sure_you_want_to_delete')}
        closeIcon={null}
        onConfirm={this.props.onConfirm}
      />
    );
  }
}
