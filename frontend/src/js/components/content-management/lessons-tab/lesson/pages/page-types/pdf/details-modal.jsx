import React from 'react';
import { t } from 'i18n';

import { PDF_MIME_TYPE, MAX_FILE_SIZE } from 'core/constants';
import ModuleCreationState from 'state/module-creation';

import { Modal } from 'components/common/modal';
import { FileInput, FieldHeader, SubmitButton } from 'components/common/form';
import PDF from 'components/common/pdf';

import { PDF_PAGE_TYPE } from 'core/constants';

export class DetailsModal extends React.Component {
  constructor() {
    super();
    this.state = {
      pdfFile: null
    };
  }

  show() {
    this.refs.modal.show();
  }

  onSubmit = () => {
    if (!this.state.pdfFile) return;
    this.refs.modal.hide();

    const reader = new FileReader();
    reader.onload = upload => {
      if (this.props.page.get('id')) {
        ModuleCreationState.ActionCreators.updatePage(this.props.page.get('id'), {
          type: PDF_PAGE_TYPE,
          pdf_file: upload.target.result,
          pdf_name: this.state.pdfFile.name,
          order: 0
        });
      } else {
        ModuleCreationState.ActionCreators.createPage({
          ...this.props.page.toJS(),
          type: PDF_PAGE_TYPE,
          pdf_file: upload.target.result,
          pdf_name: this.state.pdfFile.name,
          order: 0
        });
      }
    };
    reader.readAsDataURL(this.state.pdfFile);
    this.props.onSave();
  };

  onFileSelected = () => {
    if (!this.refs.input.isValid()) {
      this.setState({ pdfFile: null });
      return;
    }
    this.setState({ pdfFile: this.refs.input.getValue() });
  };

  render() {
    return (
      <Modal ref="modal" header={t('pdf')} closeOnDimmerClick>
        <div className="content">
          {this.props.page.get('id') && <PDF url={this.props.page.get('pdf_file')} />}
          <FieldHeader required>{t('select_a_pdf_file')}</FieldHeader>
          <FileInput
            ref="input"
            allowedTypes={[PDF_MIME_TYPE]}
            onChange={this.onFileSelected}
            maxFileSize={MAX_FILE_SIZE}
            required
          />
          <SubmitButton formIsValid={Boolean(this.state.pdfFile)} onClick={this.onSubmit} />
        </div>
      </Modal>
    );
  }
}
