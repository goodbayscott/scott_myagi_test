import React from 'react';
import _ from 'lodash';
import { t } from 'i18n';
import Style from 'style';
import { Modal } from 'components/common/modal';
import { SubmitButton, FieldHeader } from 'components/common/form';
import ModuleCreationState from 'state/module-creation';
import { HTML_PAGE_TYPE } from 'core/constants';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module';
import { Button, Icon, Modal as SemanticModal } from 'semantic-ui-react';

Quill.register('modules/ImageResize', ImageResize);

// Editor returns <p><br></p> when text area is empty.
const EDITOR_BLANK_VALUE = '<p><br></p>';

/*
 * Quill editor formats
 * See https://quilljs.com/docs/formats/
 */
const EDITOR_FORMATS = [
  'header',
  // 'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'bullet',
  'indent',
  'link',
  'image',
  'video'
];

/*
 * Quill modules to attach to editor
 * See https://quilljs.com/docs/modules/ for complete options
 */

const EDITOR_MODULES = {
  toolbar: {
    container: '#toolbar',
    items: ['image']
  },
  ImageResize: {}
};

const styles = {
  quillEditor: { height: 400 },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 15
  }
};

const CustomToolbar = () => (
  <div id="toolbar">
    <select className="ql-header">
      <option value="1" />
      <option value="2" />
      <option selected />
    </select>
    <button className="ql-bold" />
    <button className="ql-italic" />
    <button className="ql-underline" />
    <button className="ql-list" value="ordered" />
    <button className="ql-list" value="bullet" />
    <button className="ql-indent" value="-1" />
    <button className="ql-indent" value="+1" />
    <select className="ql-align" />
    <button className="ql-link" />
    <button className="ql-image" />
  </div>
);

const SnowTheme = Quill.import('themes/snow');
class SnowThemeMod extends SnowTheme {}
SnowTheme.DEFAULTS.modules.toolbar.handlers = _.extend(
  SnowTheme.DEFAULTS.modules.toolbar.handlers,
  {
    link(value) {
      if (value) {
        const range = this.quill.getSelection();
        const tooltip = this.quill.theme.tooltip;
        // if (range == null || range.length == 0) return;
        if (range == null) return;
        if (range.length === 0) {
          return;
          // TODO: pop up a tooltip and let the user know that they have to select text first.
          // tooltip.edit('link', 'paste link here');
          // this.quill.insertEmbed(range.index,  'link');
        }
        let preview = this.quill.getText(range);
        if (/^\S+@\S+\.\S+$/.test(preview) && preview.indexOf('mailto:') !== 0) {
          preview = `mailto:${preview}`;
        }

        // Myagi styling sets input width to 100%, so override on this.
        tooltip.textbox.setAttribute('style', 'width: inherit');
        tooltip.edit('link', preview);
      } else {
        this.quill.format('link', false);
      }
    }
  }
);
Quill.register(SnowThemeMod, true);

export class Editor extends React.Component {
  constructor(props) {
    super(props);
    const initialData = props.page && props.page.get('html') ? props.page.get('html') : '';
    this.state = { editorHtml: initialData };
  }

  editorChanged = _.debounce(data => {
    this.props.onEditorChange(data);
  }, 250);

  handleChange = html => {
    this.setState({ editorHtml: html });
    this.editorChanged(html);
  };

  render() {
    return (
      <div className="ui form quillEditor">
        <CustomToolbar />
        <ReactQuill
          theme="snow"
          bounds=".quillEditor"
          style={styles.quillEditor}
          ref={editor => (this.editor = editor)}
          onChange={this.handleChange}
          value={this.state.editorHtml}
          modules={EDITOR_MODULES}
          placeholder={t('')}
        />
      </div>
    );
  }
}

export class DetailsModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      html: props.page.get('html')
    };
  }

  onEditorChange = html => {
    if (html === EDITOR_BLANK_VALUE) {
      html = '';
    }
    this.setState({ html });
  };

  onSave = () => {
    const { html } = this.state;
    if (!html) return;
    this.modal.hide();
    if (this.props.page.get('id')) {
      ModuleCreationState.ActionCreators.updatePage(this.props.page.get('id'), {
        ...this.props.page.toJS(),
        html: this.state.html
      });
    } else {
      ModuleCreationState.ActionCreators.createPage({
        ...this.props.page.toJS(),
        type: HTML_PAGE_TYPE,
        html: this.state.html
      });
    }
    this.props.onSave && this.props.onSave();
  };

  show = () => {
    this.modal.show();
  };

  onDiscardChangesClick = () => {
    this.discardModal.show();
  };

  onDiscardConfirm = () => {
    this.modal.hide();
  };

  render() {
    const { page } = this.props;
    return (
      <Modal
        ref={modal => (this.modal = modal)}
        size="large"
        closeIcon
        header={`${t('document')}`}
        closeOnDimmerClick={false}
        closeOnEscape={false}
      >
        <div className="content">
          <FieldHeader required>{t('create_a_document')}</FieldHeader>
          <Editor {...this.props} onEditorChange={this.onEditorChange} />
          <div style={styles.buttons}>
            <Button
              ref={noBtn => (this.noBtn = noBtn)}
              color="red"
              onClick={this.onDiscardChangesClick}
              inverted
            >
              <Icon name="remove" /> {t('discard_changes')}
            </Button>
            <Button
              ref={yesBtn => (this.yesBtn = yesBtn)}
              color="green"
              onClick={this.onSave}
              inverted
              disabled={!this.state.html}
            >
              <Icon name="checkmark" /> {t('save')}
            </Button>
          </div>
        </div>
        <Modal
          ref={discardModal => (this.discardModal = discardModal)}
          header={`${t('discard_confirm')}`}
          onConfirm={this.onDiscardConfirm}
          closeIcon={false}
          basic
        />
      </Modal>
    );
  }
}
