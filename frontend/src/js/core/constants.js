export const RETAILER = 'retailer';
export const BRAND = 'brand';
export const HOSPO_COMPANY = 'hospitality_company';
export const CONTENT_SELLER = 'content_seller';
export const OTHER = 'other';

export const VIDEO_PAGE_TYPE = 'videopage';
export const PDF_PAGE_TYPE = 'pdfpage';
export const SNIPPET_PAGE_TYPE = 'snippetpage';
export const QUESTION_SET_PAGE_TYPE = 'questionsetpage';
export const QUESTION_PAGE_TYPE = 'questionpage';
export const FLIP_CARD_PAGE_TYPE = 'flipcardpage';
export const FLIP_CARD_MATCH_PAGE_TYPE = 'flipcardmatchpage';
export const MULTICHOICE_QUESTION_TYPE = 'multichoicequestion';
export const IFRAME_PAGE_TYPE = 'iframepage';
export const HTML_PAGE_TYPE = 'htmlpage';

export const CHANNEL_REQUEST_DECIDER_IS_CONSUMER = 1;
export const CHANNEL_REQUEST_DECIDER_IS_PRODUCER = 2;

export const SLACK_WEBHOOK =
  'https://hooks.slack.com/services/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';

export const TYPEFORM_URL = 'https://myagi.typeform.com/to/';

export const MOBILE_WIDTH = 768;
export const COMPUTER_WIDTH = 992;

export const PDF_MIME_TYPE = 'application/pdf';
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const KEY_CODES = {
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  ESCAPE: 27
};

export const SHARELINK_BLACKLIST = ['team', 'user', 'company', 'myagi'];

export const APP_DEEP_LINKS = [
  'views/training/$',
  'views/profile/(\\d+/)?',
  'views/training/\\?plans=\\d+',
  'views/training_plans/\\d+/modules/\\d+/attempts/new/'
];

export const ANALYTICS_EVENTS = {
  CLICK_CONNECT_SALES_DATA: 'Clicked connect sales data',
  CLICK_FIND_NEW_CHANNELS: 'Clicked find new channels',
  BEGIN_MODULE: 'Begin module',
  CREATE_COMPANY: 'Create company',
  CREATE_USER: 'Create user',
  FINISH_MODULE: 'Finish module',
  GO_TO_NEXT_MODULE: 'Go to next module',
  START_MODULE_CREATION: 'Start module creation',
  FINISH_MODULE_CREATION: 'Finish module creation',
  START_MODULE_EDITING: 'Start module editing',
  FINISH_MODULE_EDITING: 'Finish module editing',
  START_TRAINING_PLAN_CREATION: 'Start training plan creation',
  FINISH_TRAINING_PLAN_CREATION: 'Finish training plan creation',
  START_TRAINING_PLAN_EDITING: 'Start training plan editing',
  FINISH_TRAINING_PLAN_EDITING: 'Finish training plan editing',
  BEGIN_CHALLENGE: 'Begin challenge',
  CLICK_REPEAT_CHALLENGE: 'Click "Repeat Challenge" button',
  VISIT_SIGNUP: 'Visit Sign Up page',
  CLICK_CHALLENGE_SOMEONE_ELSE: 'Click "Challenge Someone Else" button',
  CLICK_CALENDLY_CTA: 'clicked on calendly CTA',
  VISIT_DISCUSSION_PAGE: 'Visit discussion detail page',
  SUBMIT_DISCUSSION_COMMENT: 'Submit discussion comment',
  CLICK_GMAIL_CONTACT_IMPORT: 'Used gmail contact importer',
  VISIT_COMPANY_SELECT: 'Visit company select page',
  VISIT_COMPANY_HOME: 'Visit company home page',
  EDIT_USER_DATA: 'Submit edit user data',
  ENROLL_USERS_IN_CONTENT: 'User enrolled other users in content',
  SET_AUTO_ENROLL_TEAM_IN_PLANS: 'Auto enroll in plan turned on for team',
  INVITE_USERS_TO_JOIN_MYAGI: 'Invite users to join Myagi',
  VISIT_CHANNELS_DISCOVERY: 'Visit channel discovery page',
  VIEW_CHANNEL_DETAILS_DISCOVERY_PAGE: 'Click channel for more details in channel discovery',
  VIEWED_ANALYTICS: 'Viewed analytics',
  VIEWED_PRODUCT_SEARCH_RESULT: 'Viewed product search result',
  VIEWED_MODULE_SEARCH_RESULT: 'Viewed module search result',
  VIEWED_VIDEO_RESULT: 'Viewed video search result',
  CREATED_MODULE_FROM_VIDEO_RESULT: 'Created module from video result',
  UNSUPPORTED_PUBLISHER: 'Attempted to create module using video from unsupported publisher',
  EXECUTED_SEARCH: 'Executed search',
  ECOMMERCE_DEMO: 'Viewed e-commerce search demo',
  CLICK_MORE_90_SECS: 'Interested in 90 seconds tv',
  START_TODAY_MODULE: 'Started module for today',
  CLICKED_NEXT_FOR_TODAY: 'Clicked "Next for Today"',
  CLICKED_NEXT_IN_PLAN: 'Clicked "Next in Plan"',
  VIEWED_TRAINING_TAB: 'Viewed training tab',
  CLICKED_CHANNEL_CARD: 'Clicked on channel card',
  PAYWALL_DISPLAYED: 'Paywall displayed',
  PAYWALL_CONTACT_MYAGI_CLICK: 'Paywall contact Myagi clicked',
  SIGN_UP_VIA_SHARELINK: 'Signed up via sharelink',
  LOG_IN_VIA_SHARELINK: 'Logged in via sharelink',
  VIEW_CONTENT_VIA_SHARELINK: 'View content via sharelink'
};

export const BLANK_IMAGE = '/static/img/empty_placeholder.png';
export const DEFAULT_COVER_IMAGE = require('img/default-cover-image.svg');

export const ABOUT_MYAGI_VIDEO = 'https://www.youtube.com/watch?v=fsE9v6S6gPE';
export const LOGIN_URL = `${window.location.protocol}//${window.location.host}/accounts/login/`;
export const SIGNUP_URL = `${window.location.protocol}//${window.location.host}/signup/user/`;

export const WINDOW = {
  SEARCH: window.location.search
};
