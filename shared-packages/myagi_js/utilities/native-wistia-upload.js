import Marty from 'marty-native';
import _ from 'lodash';
import Im from 'immutable';
import { DeviceEventEmitter, Platform } from 'react-native';

import app from 'core/application';

import GlobalConstants from 'core/constants';

import RNUploader from 'react-native-uploader';

let progressCbSubscription;

export function doWistiaUpload(fileName, filePath, progressCb, completedCb) {
  const files = [
    {
      filename: fileName,
      filepath: filePath,
      filetype: 'video/mp4'
    }
  ];

  const opts = {
    url: 'https://upload.wistia.com',
    files,
    method: 'POST',
    headers: { Accept: 'application/x-www-form-urlencoded' },
    params: {
      access_token: GlobalConstants.WISTIA_TOKEN,
      project_id: GlobalConstants.WISTIA_PROJECT_ID
    }
  };
  RNUploader.upload(opts, (err, response) => {
    if (err) {
      console.error(err);
      return;
    }
    if (Platform.OS === 'ios') {
      const status = response.status;
      const responseString = response.data;
      const json = JSON.parse(responseString);
      completedCb(json, status);
    } else {
      // Android response looks a little different
      completedCb(JSON.parse(response), 201);
    }

    if (progressCbSubscription) progressCbSubscription.remove();
    progressCbSubscription = null;
  });

  if (!progressCbSubscription) {
    progressCbSubscription = DeviceEventEmitter.addListener('RNUploaderProgress', data => {
      progressCb(data);
    });
  } else {
    // We can't register a progress callback because one has already been registered.
    // This will happen if there are multiple simultaneous uploads
  }
}
