import React from 'react';
import { t } from 'i18n';
import Style from 'style';
import { NeutralMessage } from 'components/common/message';
import { Modal } from 'components/common/modal';
import { URLInput, FieldHeader, SubmitButton } from 'components/common/form';
import ModuleCreationState from 'state/module-creation';
import { SNIPPET_PAGE_TYPE } from 'core/constants';
import { isGoogleSlides, isGoogleSlidesEmbeddable } from 'utilities/generic';

class SnippetMessage extends React.Component {
  render() {
    return (
      <NeutralMessage style={{ marginTop: 0, borderRadius: 0 }}>
        <div className="header">What are Web Snippets?</div>
        <div>
          We've got big news! Up until now you've only been able to create 2 different types of
          lessons; videos and PDFs. We now support just about&nbsp;
          <span style={{ textDecoration: 'underline' }}>every web page on the internet</span>
          , so now you can turn any web page from your online store into a lesson!
          <br />
          <br />
          Some of the popular platforms we support are:
          <ul>
            <li>
              Blogging / Q&A :&nbsp;
              <a href="http://medium.com" target="_blank">
                Medium.com
              </a>
              ,&nbsp;
              <a href="http://quora.com" target="_blank">
                Quora.com
              </a>
            </li>
            <li>
              Audio:&nbsp;
              <a href="http://SoundCloud.com" target="_blank">
                SoundCloud.com
              </a>
            </li>
            <li>
              Interactive Presentations:&nbsp;
              <a href="http://prezi.com" target="_blank">
                Prezi
              </a>
              ,&nbsp;
              <a href="http://slideshare.com" target="_blank">
                SlideShare
              </a>
            </li>
            <li>
              Reference:&nbsp;
              <a href="http://wikipedia.com" target="_blank">
                Wikipedia
              </a>
            </li>
            <li>
              Images:{' '}
              <a href="http://imgur.com" target="_blank">
                Imgur
              </a>
            </li>
            <li>
              Graphs & Charts:&nbsp;
              <a href="http://chartblocks.com" target="_blank">
                Chartblocks.com
              </a>
            </li>
            <li>
              News:&nbsp;
              <a href="http://www.huffingtonpost.com/" target="_blank">
                Huffington Post
              </a>
              ,&nbsp;
              <a href="http://www.cnn.com/" target="_blank">
                CNN
              </a>
              ,&nbsp;
              <a href="http://www.foxnews.com//" target="_blank">
                FoxNews
              </a>
            </li>
          </ul>
          {/* ** ATTACH GIF RECORDING OF CONSUMPTION ** */}
          <br />
          <b>Need Help?</b>
          <a
            href="http://help.myagi.com/content-creation/content-types-web-snippet"
            target="_blank"
          >
            &nbsp;http://help.myagi.com/content-creation/content-types-web-snippet
          </a>
        </div>
      </NeutralMessage>
    );
  }
}

export class SnippetLink extends React.Component {
  onChange = evt => {
    const url = this.refs.input.clean(evt.target.value);
    this.props.onChange(url);
  };

  render() {
    return (
      <div className="ui form">
        <FieldHeader required>{t('add_any_url_or_webpage_here')}</FieldHeader>
        <URLInput
          ref="input"
          onChange={this.onChange}
          initialValue={this.props.initialValue}
          initialIsAcceptable
          required
        />
      </div>
    );
  }
}

export class DetailsModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      snippetURL: props.page.get('snippet_url'),
      error: false
    };
  }

  show() {
    // Ensure page content is set to correct
    // initial position
    this.refs.modal.show();
  }

  onURLChange = snippetURL => {
    this.setState({ snippetURL });
  };

  onSubmit = () => {
    const { snippetURL } = this.state;
    if (!snippetURL) return;
    if (isGoogleSlides(snippetURL)) {
      if (!isGoogleSlidesEmbeddable(snippetURL)) {
        this.setState({ error: true });
        return;
      }
    }
    this.refs.modal.hide();
    if (this.props.page.get('id')) {
      ModuleCreationState.ActionCreators.updatePage(this.props.page.get('id'), {
        ...this.props.page.toJS(),
        snippet_url: this.state.snippetURL
      });
    } else {
      ModuleCreationState.ActionCreators.createPage({
        ...this.props.page.toJS(),
        type: SNIPPET_PAGE_TYPE,
        snippet_url: this.state.snippetURL
      });
    }
    this.props.onSave();
  };

  checkGoogleSlidesEmbeddable = () => (
    <span style={{ color: Style.vars.colors.get('darkRed') }}>
      {t('google_slides_url_not_embeddable')}
      <br />
      <a href="http://recordit.co/T3D1HRzA3L" target="_blank">
        {t('learn_about_embeddable')}
      </a>
    </span>
  );

  render() {
    const { page } = this.props;
    const { error } = this.state;
    return (
      <Modal ref="modal" header={`${t('web_page')}`} closeOnDimmerClick>
        <SnippetMessage />
        <div className="content">
          <SnippetLink
            onChange={this.onURLChange}
            onURLChange={this.onURLChange}
            initialValue={page.get('snippet_url')}
          />
          {error && this.checkGoogleSlidesEmbeddable()}
          <SubmitButton formIsValid={Boolean(this.state.snippetURL)} onClick={this.onSubmit} />
        </div>
      </Modal>
    );
  }
}
