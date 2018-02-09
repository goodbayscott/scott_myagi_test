const LOGGING_ENABLED = true;

function log(...args) {
  if (LOGGING_ENABLED) console.log.call(console, ...args);
}

// Have extracted this function out because we need a stringified version of it for the
// mobile app.
export function makeLMSGetValue(data) {
  return function generatedLMSGetValue(strElement) {
    switch (strElement) {
      case 'cmi.core.lesson_status':
        return 'not attempted';
      case 'cmi.suspend_data':
        return data.suspendData || '';
      default:
        return null;
    }
  };
}

export function setupScormLmsApi(opts) {
  function callHandler(handler, ...args) {
    if (opts[handler]) opts[handler].apply(null, args);
  }
  const getValue = makeLMSGetValue(opts.data);
  const api = {
    LMSInitialize(str) {
      log('LMSInitialize:', arguments);
    },
    LMSSetValue(strElement, strValue) {
      log('LMSSetValue:', arguments);
      switch (strElement) {
        case 'cmi.core.score.raw':
          callHandler('onSetCurrentScore', strValue);
          break;
        case 'cmi.core.score.max':
          callHandler('onSetMaxScore', strValue);
          break;
        case 'cmi.suspend_data':
          callHandler('onSetSuspendData', strValue);
          break;
        case 'cmi.core.lesson_status':
          if (strValue === 'completed') {
            callHandler('onComplete');
          }
          break;
        default:
          break;
      }
    },
    LMSGetValue(strElement) {
      log('LMSGetValue:', arguments);
      return getValue(strElement);
    },
    LMSGetLastError() {
      log('LMSGetLastError:', arguments);
    },
    LMSCommit(str) {
      log('LMSCommit:', arguments);
    },
    LMSFinish(str) {
      log('LMSFinish:', arguments);
      callHandler('onFinish');
    },
    LMSGetLastError() {
      log('LMSGetLastError:', arguments);
    },
    LMSGetErrorString(intSCORMError) {
      log('LMSGetErrorString:', arguments);
    },
    LMSGetDiagnostic(str) {
      log('LMSGetDiagnostic:', arguments);
    }
  };

  return api;
}
