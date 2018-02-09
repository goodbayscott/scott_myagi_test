import Marty from 'marty';
import app from './application';
import { getCSRFToken } from 'utilities/http';
import { browserHistory } from 'react-router';

export function getAPIBaseURL() {
  return '/api/v1/';
}

export function getMarty() {
  return Marty;
}

export function getHistory() {
  return browserHistory;
}

export function getApplication() {
  return app;
}

export function getWriteAuthHeader() {
  const token = getCSRFToken();
  return {
    'X-CSRFToken': token,
    CSRFToken: token
  };
}

export function getReadAuthHeader() {
  return null;
}

export function getDoWistiaUpload() {
  // Not required in webapp
  return null;
}

export const makeEntitiesFullyImmutable = false;

// Intercom will instead be registered by Segment
export const intercom = null;

export const { analytics } = window;

export const platform = 'web';
