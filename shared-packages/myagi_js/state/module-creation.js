import _ from 'lodash';
import Im from 'immutable';
import RSVP from 'rsvp';

import {
  VIDEO_PAGE_TYPE,
  QUESTION_PAGE_TYPE,
  QUESTION_SET_PAGE_TYPE,
  PDF_PAGE_TYPE,
  SNIPPET_PAGE_TYPE,
  FLIP_CARD_PAGE_TYPE,
  FLIP_CARD_MATCH_PAGE_TYPE,
  HTML_PAGE_TYPE
} from 'core/constants';
import { getApplication, getMarty, getDoWistiaUpload, platform } from 'core/state-configuration';

import { assert } from 'utilities/assert';
import { guid } from 'utilities/generic';
import { nowInISO } from 'utilities/time';

import ModulesState from 'state/modules';
import VideoPagesState from 'state/video-pages';
import QuestionPagesState from 'state/question-pages';
import PDFPagesState from 'state/pdf-pages';
import SnippetPagesState from 'state/snippet-pages';
import FlipCardPageState from 'state/flip-card-pages';
import FlipCardMatchPageState from 'state/flip-card-match-pages';
import HTMLPagesState from 'state/html-pages';

const app = getApplication();
const Marty = getMarty();
const doWistiaUpload = getDoWistiaUpload();

const GUID_SEPARATOR = '-';
const WISTIA_VIDEO_URL = 'https://myagi-2.wistia.com/medias/';

const QUESTION_PAGE_FIELDS = ['*', 'question.*'];
const VIDEO_PAGE_FIELDS = ['*'];
const HTML_PAGE_FIELDS = ['*'];
const FLIP_CARD_MATCH_PAGE_FIELDS = ['*', 'cards.*'];

const BASE_MODULE_FIELDS = [
  'id',
  'thumbnail_url',
  'description',
  'url',
  'created_by',
  'is_attemptable',
  'deactivated',
  'pass_percentage',
  'pages',
  'name',
  'edited_on_mobile',
  'training_plans.name',
  'training_plans.url',
  'training_plans.id',

  'avg_like_rating',
  'avg_learn_rating',
  'num_feedback_submissions',

  'pages.*',
  'pages.question.*',
  'pages.question_set.*',
  'pages.question_set.questions.*'
];

let FETCH_MODULE_FIELDS = BASE_MODULE_FIELDS;

// Make sure that all the required field
// types for pages are fetched along with the
// module
[QUESTION_PAGE_FIELDS, VIDEO_PAGE_FIELDS, FLIP_CARD_MATCH_PAGE_FIELDS, HTML_PAGE_FIELDS].forEach(fields => {
  FETCH_MODULE_FIELDS = FETCH_MODULE_FIELDS.concat(fields.map(field => `pages.${field}`));
});

// TODO - Fields should be defined on the components themselves or something,
// not here.
const QUESTION_PAGE_ACTION_OPTS = {
  query: {
    fields: QUESTION_PAGE_FIELDS
  }
};
const FLIP_CARD_MATCH_PAGE_ACTION_OPTS = {
  query: {
    fields: FLIP_CARD_MATCH_PAGE_FIELDS
  }
};

const updateFlipCardMatch = function (data) {
  // Just update the essentials. No support for editing entity yet.
  const newData = {
    deactivated: data.deactivated,
    order: data.order
  };
  return FlipCardMatchPageState.ActionCreators.update(
    data.id,
    newData,
    FLIP_CARD_MATCH_PAGE_ACTION_OPTS
  );
};

const PAGE_TYPES_TO_ACTION_CREATORS = {
  [VIDEO_PAGE_TYPE]: VideoPagesState.ActionCreators,
  [PDF_PAGE_TYPE]: PDFPagesState.ActionCreators,
  [SNIPPET_PAGE_TYPE]: SnippetPagesState.ActionCreators,
  [HTML_PAGE_TYPE]: HTMLPagesState.ActionCreators,
  [FLIP_CARD_PAGE_TYPE]: FlipCardPageState.ActionCreators,
  [FLIP_CARD_MATCH_PAGE_TYPE]: {
    update: data => updateFlipCardMatch(data)
  },
  [QUESTION_PAGE_TYPE]: {
    create: data =>
      QuestionPagesState.ActionCreators.createWithQuestion(data, QUESTION_PAGE_ACTION_OPTS),
    update: data =>
      QuestionPagesState.ActionCreators.updateWithQuestion(data, QUESTION_PAGE_ACTION_OPTS)
  }
};

const Constants = Marty.createConstants([
  'MODULE_CREATION_UPDATE_MODULE_DETAILS',
  'MODULE_CREATION_UPDATE_OR_CREATE_PAGE',
  'MODULE_CREATION_MOVE_PAGE',
  'MODULE_CREATION_REMOVE_PAGE',
  'MODULE_CREATION_DELETE_MODULE'
]);

class ActionCreators extends Marty.ActionCreators {
  updateModuleDetails(data) {
    this.dispatch(Constants.MODULE_CREATION_UPDATE_MODULE_DETAILS, data);
  }

  createPage(details) {
    const tempId = guid();
    details = _.extend({}, details);
    // Use `tempId` until we have a proper id from the server
    details.id = tempId;
    // Always store `tempId` for future reference
    details.__tmpId__ = tempId;

    this.dispatch(Constants.MODULE_CREATION_UPDATE_OR_CREATE_PAGE, details.__tmpId__, details);

    return details;
  }

  updatePage(pageId, details) {
    this.dispatch(Constants.MODULE_CREATION_UPDATE_OR_CREATE_PAGE, pageId, details);
    return details;
  }

  createVideoPageWithFile(details, file) {
    details.__progress__ = 0.0;
    details.type = VIDEO_PAGE_TYPE;
    details = this.createPage(details);

    // Start upload of video.
    doWistiaUpload(
      _.uniqueId('video-'),
      file,
      data => {
        // Update progress value. This will only happen for one video at a time,
        // so if there are two videos uploading, only one will have a functioning
        // progress bar.
        let progress = data.progress / 100.0;
        // Don't set progress to 1.0 until videoUrl has been set
        progress = _.min([progress, 0.99]);
        this.dispatch(Constants.MODULE_CREATION_UPDATE_OR_CREATE_PAGE, details.__tmpId__, {
          __progress__: progress
        });
      },
      wistiaRes => {
        const videoUrl = `${WISTIA_VIDEO_URL}${wistiaRes.hashed_id}`;
        this.dispatch(Constants.MODULE_CREATION_UPDATE_OR_CREATE_PAGE, details.__tmpId__, {
          video_url: videoUrl,
          __progress__: 1.0
        });
      }
    );

    // Immediately return `tempId`, which
    // can be used as a reference until page
    // is saved and a legitimate `id` is created
    return details.__tmpId__;
  }

  createVideoPage(details) {
    details.type = VIDEO_PAGE_TYPE;
    details = this.createPage(details);
    return details.__tmpId__;
  }

  createQuestionPageWithQuestion(question) {
    if (!question.order) question.order = 0;
    const pageDetails = {
      question,
      type: QUESTION_PAGE_TYPE
    };
    const page = this.createPage(pageDetails);
    return page.__tmpId__;
  }

  movePage(from, to) {
    this.dispatch(Constants.MODULE_CREATION_MOVE_PAGE, from, to);
  }

  removePage(pageId) {
    this.dispatch(Constants.MODULE_CREATION_REMOVE_PAGE, pageId);
  }

  deleteModule() {
    this.dispatch(Constants.MODULE_CREATION_DELETE_MODULE);
  }
}

class Store extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onUpdateModuleDetails: Constants.MODULE_CREATION_UPDATE_MODULE_DETAILS,
      onUpdateOrCreatePage: Constants.MODULE_CREATION_UPDATE_OR_CREATE_PAGE,
      onMovePage: Constants.MODULE_CREATION_MOVE_PAGE,
      onRemovePage: Constants.MODULE_CREATION_REMOVE_PAGE,
      onDeleteModule: Constants.MODULE_CREATION_DELETE_MODULE
    };
    this.reset();
  }

  reset(modId) {
    const state = {
      saveExecuting: false,
      _fetchModId: null
    };
    if (!modId) {
      state.module = Im.fromJS({
        name: '',
        pages: [],
        training_plans: []
      });
    } else {
      state.module = null;
      state._fetchModId = modId;
    }
    this.state = state;
    // This will do nothing if _fetchModId has not
    // been set.
    this._fetchModule();
  }

  _fetchModule() {
    const fetchId = this.state._fetchModId;
    if (!fetchId) return;
    // The success of this function actually depends on ModulesState.ActionCreators.resetLocalData();``
    // being called when modules / pages get updated. If that is not called, then
    // this function will fetch stale data if a module is re-edited
    ModulesState.Store.getItem(fetchId, { fields: FETCH_MODULE_FIELDS })
      .toPromise()
      .then(mod => {
        // We may have switched to another module in the time it has taken for this
        // fetch to complete...if so do not do anything with the data.
        if (this.state._fetchModId !== mod.get('id')) return;
        // fromJS, toJS required for webapp compat...not necessary in native app
        this.state.module = Im.fromJS(mod.toJS());
        this.hasChanged();
      });
  }

  _hasServerId(data) {
    const { id } = data;
    return Boolean(id) && !_.includes(id.toString(), GUID_SEPARATOR);
  }

  _getActionCreatorsForPage(p) {
    return PAGE_TYPES_TO_ACTION_CREATORS[p.get('type')];
  }

  _savePages(oldModule) {
    const promises = [];
    this.state.module.get('pages').forEach((p, i) => {
      // Check to see if page has actually change, if not do nothing
      const oldP = oldModule.get('pages').find(page => this._matchesId(page, p.get('id')));
      if (oldP && p.equals(oldP)) return;

      const pData = p.toJS();

      // Set page order explicitly so that pages don't get saved out of order.
      pData.order = pData.order !== undefined && p.order !== null ? pData.order : i;

      // Do not save page data if still in progress
      if (pData.__progress__ !== undefined && pData.__progress__ < 1.0) return;
      pData.module = this.state.module.get('url');

      // Set source. This is mainly for analytics.
      pData.source = platform;

      const PageActionCreators = this._getActionCreatorsForPage(p);
      if (!PageActionCreators) {
        console.warn(`Could not find action creator for page type: ${p.get('type')}`);
        return;
      }
      let ActionCreator = this._hasServerId(pData)
        ? PageActionCreators.update
        : PageActionCreators.create;
      ActionCreator = ActionCreator.bind(PageActionCreators);
      const promise = ActionCreator(pData);
      promises.push(promise);
      promise.then(res => {
        const data = res.body;
        // Update local data, but do not save changes to the server, as this
        // can easily create an infinite loop of local change > save to server >
        // store data returned from server > trigger local change > save to server
        // and so on.
        this.onUpdateOrCreatePage(p.get('id') || p.get('__tmpId__'), data, {
          saveChanges: false
        });
      });
    });
    return RSVP.all(promises);
  }

  _handleModuleSaveRes = (res, oldModule) => {
    if (res) {
      this.state.module = this.state.module.mergeDeep(_.pick(res.body, [
        'id',
        'url',
        'thumbnail_url' // base64 will be turned to url
      ]));
    }
    this._savePages(oldModule).then(() => {
      // Force modules state to reset, so that when we go back to the
      // "Lesson Management" page, all the data will be refreshed.
      // This allow prevents stale data from being displayed if
      // a module is re-edited.
      // TODO - This could be handle by listening to page creation
      // within the modules state module itself, however this would
      // need to happen for every page type.

      ModulesState.ActionCreators.resetLocalData();
      this.state.saveExecuting = false;
      this.hasChanged();

      // trigger update to refresh the thumbnail if it can be deduced from a page
      _.defer(() =>
        ModulesState.ActionCreators.update(this.state.module.get('id'), {}).then(res => {
          this.state.module = this.state.module.mergeDeep({
            thumbnail_url: res.body.thumbnail_url
          });
          this.hasChanged();
        }));
    });
  };

  saveModuleChanges(oldModule) {
    // This is the only place where server API calls should be made
    // and data should be saved. Defer is used as a bit of a hack to
    // get around issues with having a dispatch within a dispatch.
    this.state.saveExecuting = true;
    _.defer(() => {
      // No need to try to save page data, so remove it before
      // saving (otherwise API will complain).
      const newMod = this.state.module.delete('pages');
      const oldModNoPages = oldModule.delete('pages');
      // Do not save module if there are no changes (although do
      // save if it is yet to be assigned an ID).
      if (!newMod.equals(oldModNoPages) || !newMod.get('id')) {
        // Save module using training plan URLs, not objects
        const saveMod = newMod.set(
          'training_plans',
          newMod.get('training_plans').map(p => p.get('url'))
        );
        const modData = saveMod.toJS();
        // thumbnail is changed with custom_thumbnail
        // it will clobber changes if provided
        delete modData.thumbnail_url;
        const opts = {};
        if (!newMod.get('id')) {
          ModulesState.ActionCreators.create(modData, opts).then(res =>
            this._handleModuleSaveRes(res, oldModule));
        } else {
          ModulesState.ActionCreators.update(modData.id, modData, opts).then(res =>
            this._handleModuleSaveRes(res, oldModule));
        }
      } else {
        // Even if there are no changes to the module object, there
        // may be changes to the pages, so attempt to save them.
        this._handleModuleSaveRes(null, oldModule);
      }
    });
  }

  _matchesId(p, i) {
    return p.get('id') === i || p.get('__tmpId__') === i;
  }

  _updateLocalModule(details, opts = { saveChanges: true }) {
    const prev = this.state.module;
    this.state.module = this.state.module.merge(details);
    // If module has been deactivated and does not have a server ID, then no
    // matter what do not save changes to the server. If it does have a server
    // ID, then deactivated value will need to be saved to the server.
    if (this.state.module.get('deactivated') && !this._hasServerId(this.state.module.toJS())) {
      this.hasChanged();
      return;
    }
    if (opts.saveChanges && !this.state.module.equals(prev)) {
      this.saveModuleChanges(prev);
    }
    this.hasChanged();
  }

  onUpdateModuleDetails(details) {
    this._updateLocalModule(details);
  }

  onUpdateOrCreatePage(id, details, opts) {
    try {
      assert(Boolean(id), 'No ID was specified when updating or creating page!');
      let pages = this.state.module.get('pages');
      const pageIndex = pages.findIndex(p => this._matchesId(p, id));
      const allMatching = pages.filter(p => this._matchesId(p, id));
      assert(allMatching.count() <= 1, 'More than 1 pages exists with the same ID');
      let page;
      if (pageIndex < 0) {
        page = Im.fromJS(details);
        pages = pages.push(page);
      } else {
        page = pages.get(pageIndex);
        page = page.mergeDeep(details);
        pages = pages.set(pageIndex, page);
      }
      this._updateLocalModule({ pages }, opts);
      this.hasChanged();
    } catch (e) {
      console.error(e);
    }
  }

  onMovePage(from, to) {
    const pages = this.state.module
      .get('pages')
      .filter(p => !p.get('deactivated'))
      .toArray();
    pages.splice(to, 0, pages.splice(from, 1)[0]);
    const newPages = pages.map((p, i) => ({ ...p.toJS(), order: i }));
    this.onUpdateModuleDetails({ pages: newPages });
  }

  onRemovePage(pageId) {
    const pages = this.state.module.get('pages');
    const pageIndex = pages.findIndex(p => this._matchesId(p, pageId));
    // Make sure page actually exists
    if (pageIndex > -1) {
      // Set deactivated value to remove the page
      this.onUpdateOrCreatePage(pageId, { deactivated: nowInISO() });
    }
  }

  onDeleteModule() {
    this.onUpdateModuleDetails({ deactivated: nowInISO() });
  }

  getModule() {
    return this.state.module;
  }

  getPage(id) {
    return this.state.module.get('pages').find(p => this._matchesId(p, id));
  }

  getSaveExecuting() {
    return this.state.saveExecuting;
  }

  isMobileModule(mod) {
    let isMobileModule = false;
    if (this.state.module) {
      let otherPages = this.state.module.get('pages').filter(p => !p.get('deactivated'));
      otherPages = otherPages.sortBy(p => p.get('order')).rest();
      // If any page other than the first page is a content page, then
      // this is a module created in the mobile app and cannot be edited here.
      otherPages.forEach(p => {
        if (p.get('type') !== QUESTION_PAGE_TYPE && p.get('type') !== QUESTION_SET_PAGE_TYPE) {
          isMobileModule = true;
        }
      });
    }
    return isMobileModule;
  }
}

app.register('ModuleCreationStore', Store);
app.register('ModuleCreationActionCreators', ActionCreators);

export default {
  ActionCreators: app.ModuleCreationActionCreators,
  Store: app.ModuleCreationStore
};
