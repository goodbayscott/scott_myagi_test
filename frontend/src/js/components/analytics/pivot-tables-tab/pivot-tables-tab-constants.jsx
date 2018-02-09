import { browserHistory } from 'react-router';
import parsing from '../parsing';

const GROUP_BY_CHANNEL = 'Group by Channel';
const GROUP_BY_COMPANY = 'Group by Company';
const GROUP_BY_LESSON = 'Group by Lesson';
const GROUP_BY_PLAN = 'Group by Plan';
const GROUP_BY_USER = 'Group by User';
const GROUP_BY_TEAM = 'Group by Team';
const GROUP_BY_AREA = 'Group by Area';
const GROUP_BY_GROUP = 'Group by Group';
const GROUP_BY_COMPANY_PLAN = 'Group by Company and Plan';
const GROUP_BY_USER_PLAN = 'Group by User and Plan';
const GROUP_BY_USER_TEAM = 'Group by User and Team';
const GROUP_BY_COMPANY_TEAM_PLAN = 'Group by Company, Team and Plan';

const USER_ID_DESC = {
  attr: 'user',
  name: 'User ID'
};

const USER_FIRST_NAME_DESC = {
  attr: 'user__first_name',
  name: 'First Name'
};

const USER_LAST_NAME_DESC = {
  attr: 'user__last_name',
  name: 'Last Name'
};

const USER_LAST_ACTIVITY = {
  attr: 'user__learner__last_activity',
  name: 'Last Activity',
  parseFunc: parsing.toDateTime
};

const USER_LAST_LOGIN = {
  attr: 'user__last_login',
  name: 'Last Login'
};

const USER_DATE_JOINED = {
  attr: 'user__date_joined',
  name: 'Date User Joined',
  parseFunc: parsing.toDateTime
};

const MODULE_NAME_DESC = {
  attr: 'module__name',
  name: 'Lesson'
};

const CHANNEL_NAME_DESC = {
  attr: 'training_unit__name',
  name: 'Channel'
};

const CHANNEL_DISPLAY_NAME_DESC = {
  attr: 'training_unit__display_name',
  name: 'Display Name'
};

const TRAINING_PLAN_NAME_DESC = {
  attr: 'training_plan__name',
  name: 'Plan'
};

const CATEGORY_NAMES_DESC = {
  attr: 'module__categories__name',
  name: 'Category'
};

const START_DAY_DESC = {
  attr: 'start_time__day',
  name: 'Day'
};

const START_MONTH_DESC = {
  attr: 'start_time__month',
  name: 'Month'
};

const START_YEAR_DESC = {
  attr: 'start_time__year',
  name: 'Year'
};

const TEAM_NAMES_DESC = {
  attr: 'user__learner__learnergroups__name',
  name: 'Team'
};

const COMPANY_NAMES_DESC = {
  attr: 'user__learner__company__company_name',
  name: 'Company'
};

const AREA_ID_DESC = {
  attr: 'user__learner__learnergroups__areas__id',
  name: 'Area ID',
  hidden: true
};

const AREA_NAME_DESC = {
  attr: 'user__learner__learnergroups__areas__name',
  name: 'Area Name'
};

const ENROLLMENT_GROUP_ID_DESC = {
  attr: 'user__enrollment_groups__id',
  name: 'Group ID',
  hidden: true
};

const ENROLLMENT_GROUP_NAME_DESC = {
  attr: 'user__enrollment_groups__name',
  name: 'Group Name'
};

export const INDEX_DESCRIPTORS = {
  [GROUP_BY_CHANNEL]: [CHANNEL_NAME_DESC, CHANNEL_DISPLAY_NAME_DESC],
  [GROUP_BY_COMPANY]: [COMPANY_NAMES_DESC],
  [GROUP_BY_LESSON]: [MODULE_NAME_DESC],
  [GROUP_BY_PLAN]: [COMPANY_NAMES_DESC, CHANNEL_NAME_DESC, TRAINING_PLAN_NAME_DESC],
  [GROUP_BY_USER]: [
    USER_ID_DESC,
    USER_FIRST_NAME_DESC,
    USER_LAST_NAME_DESC,
    COMPANY_NAMES_DESC,
    TEAM_NAMES_DESC,
    USER_LAST_ACTIVITY,
    USER_DATE_JOINED
  ],
  [GROUP_BY_TEAM]: [TEAM_NAMES_DESC],
  [GROUP_BY_AREA]: [AREA_ID_DESC, AREA_NAME_DESC],
  [GROUP_BY_GROUP]: [ENROLLMENT_GROUP_ID_DESC, ENROLLMENT_GROUP_NAME_DESC],
  [GROUP_BY_COMPANY_PLAN]: [COMPANY_NAMES_DESC, TRAINING_PLAN_NAME_DESC],
  [GROUP_BY_USER_PLAN]: [
    USER_ID_DESC,
    USER_FIRST_NAME_DESC,
    USER_LAST_NAME_DESC,
    COMPANY_NAMES_DESC,
    TEAM_NAMES_DESC,
    TRAINING_PLAN_NAME_DESC
  ],
  [GROUP_BY_USER_TEAM]: [
    USER_ID_DESC,
    USER_FIRST_NAME_DESC,
    USER_LAST_NAME_DESC,
    USER_LAST_ACTIVITY,
    TEAM_NAMES_DESC
  ],
  [GROUP_BY_COMPANY_TEAM_PLAN]: [COMPANY_NAMES_DESC, TEAM_NAMES_DESC, TRAINING_PLAN_NAME_DESC]
};

export const EXTRA_TABLE_ATTRS = {
  [GROUP_BY_USER]: {
    hideColumnIndex: 0,
    onRowClick: row => browserHistory.push(`/views/profile/${row.get(0)}/`)
  }
};

export const VALUE_DESCRIPTORS = [
  {
    attr: 'percentage_score',
    aggFunc: 'mean',
    name: 'Average Score (%)',
    parseFunc: parsing.toOneDecimalPlace
  },
  {
    attr: 'is_complete',
    aggFunc: 'sum',
    name: 'Complete Attempts',
    parseFunc: parsing.toTruncatedInt
  },
  {
    attr: 'is_incomplete',
    aggFunc: 'sum',
    name: 'Incomplete Attempts',
    parseFunc: parsing.toTruncatedInt
  },
  {
    attr: 'is_successful',
    aggFunc: 'sum',
    name: 'Successful Attempts',
    parseFunc: parsing.toTruncatedInt
  },
  {
    attr: 'is_failed',
    aggFunc: 'sum',
    name: 'Failed Attempts',
    parseFunc: parsing.toTruncatedInt
  }
];

export const DEFAULT_DATETIME_DAY_RANGE = 30;
