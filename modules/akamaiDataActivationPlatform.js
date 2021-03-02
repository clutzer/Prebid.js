/**
 * This module adds DAP to the User ID module
 * The {@link module:modules/userId} module is required
 * @module modules/akamaiDataActivationPlatformSubmodule
 * @requires module:modules/userId
 */

import * as utils from '../src/utils.js'
import { ajax } from '../src/ajax.js';
import { submodule } from '../src/hook.js';
import { getStorageManager } from '../src/storageManager.js';
import { uspDataHandler } from '../src/adapterManager.js';

const MODULE_NAME = 'akamaiDataActivationPlatform';
const DAP_STORAGE_KEY_NAME = 'akamai_dap_token';

export const storage = getStorageManager();

/** @type {Submodule} */
export const akamaiDataActivationPlatformSubmodule = {
  /**
   * used to link submodule with config
   * @type {string}
   */
  name: MODULE_NAME,
  /**
   * decode the stored id value for passing to bid requests
   * @function
   * @param {{userId: string, fpId: string}} value
   * @returns {{dapToken:string}}
   */
  decode(value) {
    const id = (value && value.ppid && typeof value.ppid.id === 'string') ? value.ppid.id : undefined;
    return id ? { 'dapToken': id } : undefined;
  },
  
  /**
   * performs action to obtain id and return a value in the callback's response argument
   * @function
   * @param {ConsentData} [consentData]
   * @param {SubmoduleConfig} [config]
   * @returns {IdResponse|undefined}
   */
  getId(config, consentData) {
    const configParams = (config && config.params) || {};
    if (!configParams) {
      utils.logError('User ID - akamaiDapToken submodule requires a valid configParams');
      return;
    } else if (typeof configParams.apiHostname !== 'string') {
      utils.logError('User ID - akamaiDapToken submodule requires a valid configParams.apiHostname');
      return;
    } else if (typeof configParams.domain !== 'string') {
      utils.logError('User ID - akamaiDapToken submodule requires a valid configParams.domain');
      return;
    } else if (typeof configParams.type !== 'string') {
      utils.logError('User ID - akamaiDapToken submodule requires a valid configParams.type');
      return;
    }
    const hasGdpr = (consentData && typeof consentData.gdprApplies === 'boolean' && consentData.gdprApplies) ? 1 : 0;
    const gdprConsentString = hasGdpr ? consentData.consentString : '';
    const uspConsent = uspDataHandler.getConsentData();
    if (hasGdpr && (!gdprConsentString || gdprConsentString === '')) {
      utils.logError('User ID - akamaiDapToken submobile requires consent string to call API');
      return;
    }
    // XXX: retrieve first-party data here if needed
    let url = '';
    let postData = undefined;
    if (configParams.type.startsWith("signature:")) {
      let parts = configParams.type.split(":");
      let v = parts[1];
      url = `https://${configParams.apiHostname}/data-activation/v1/domain/${configParams.domain}/signature?v=${v}&gdpr=${hasGdpr}&gdpr_consent=${gdprConsentString}&us_privacy=${uspConsent}`;
    } else {
      url = `https://${configParams.apiHostname}/data-activation/v1/identity/tokenize?gdpr=${hasGdpr}&gdpr_consent=${gdprConsentString}&us_privacy=${uspConsent}`;
      postData = {
        "version": 1,
        "account": "B-3-1G3ZFUQ",
        "domain": configParams.domain,
        "identity": configParams.identity,
        "type": configParams.type
      };
    }

    console.log( "DAP: url="+url+", postData=", postData );

    const resp = function (callback) {
      const callbacks = {
        success: response => {
          // TODO: validate that the response object is a well-formed JWT/JWE.
          let responseObj;
          if (response) {
            try {
              responseObj = response;
            } catch (error) {
              utils.logError(error);
            }
          }
          // XXX: set first-party data here if needed
          callback(responseObj);
        },
        error: error => {
          utils.logError(`${MODULE_NAME}: dapToken fetch encountered an error`, error);
          callback();
        }
      };
      //ajax(url, callbacks, postData, {withCredentials: true});
      ajax(url, callbacks, JSON.stringify(postData), {contentType: "application/json"});
    };

    return {callback: resp};
  }
};

function getFirstPartyId() {
  let fpId = storage.localStorageIsEnabled ? storage.getDataFromLocalStorage(DAP_STORAGE_KEY_NAME) : null;
  if (!fpId) {
    fpId = storage.cookiesAreEnabled ? storage.getCookie(DAP_STORAGE_KEY_NAME) : null;
  }
  return fpId || '';
}

function setFirstPartyId(fpId) {
  if (fpId) {
    if (storage.localStorageIsEnabled) {
      storage.setDataInLocalStorage(DAP_STORAGE_KEY_NAME, fpId);
    } else if (storage.cookiesAreEnabled) {
      storage.setCookie(DAP_STORAGE_KEY_NAME, fpId);
    }
  }
}

submodule('userId', akamaiDataActivationPlatformSubmodule);
/* vim: set ts=2 sw=2 et: */
