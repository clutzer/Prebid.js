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
const STORAGE_KEY = 'akamai_dap_token';

export const storage = getStorageManager();

function logMessage() {
  console.log.apply(console, decorateLog(arguments, 'MESSAGE:'));
}

function logInfo() {
  console.info.apply(console, decorateLog(arguments, 'INFO:'));
}

function logWarn() {
  console.warn.apply(console, decorateLog(arguments, 'WARNING:'));
}

function logError() {
  console.error.apply(console, decorateLog(arguments, 'ERROR:'));
  events.emit(CONSTANTS.EVENTS.AUCTION_DEBUG, {type: 'ERROR', arguments: arguments});
}

function decorateLog(args, prefix) {
  args = [].slice.call(args);
  prefix && args.unshift(prefix);
  args.unshift('display: inline-block; color: #fff; background: #eb8f34; padding: 1px 4px; border-radius: 3px;');
  args.unshift('%cAkamai');
  return args;
}

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
    //const id = (value && value.ppid && typeof value.ppid.id === 'string') ? value.ppid.id : undefined;
    //logMessage("DEBUG(decode): value=" + value + ", id=" + id);
    //return id ? { 'dapToken': id } : undefined;
    //let o = { id: value };
    logMessage("[decode] value=", value );
    return { dapToken: value };
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
      logError('User ID - akamaiDapToken submodule requires a valid configParams');
      return;
    } else if (typeof configParams.apiHostname !== 'string') {
      logError('User ID - akamaiDapToken submodule requires a valid configParams.apiHostname');
      return;
    } else if (typeof configParams.domain !== 'string') {
      logError('User ID - akamaiDapToken submodule requires a valid configParams.domain');
      return;
    } else if (typeof configParams.type !== 'string') {
      logError('User ID - akamaiDapToken submodule requires a valid configParams.type');
      return;
    }
    const hasGdpr = (consentData && typeof consentData.gdprApplies === 'boolean' && consentData.gdprApplies) ? 1 : 0;
    const gdprConsentString = hasGdpr ? consentData.consentString : '';
    const uspConsent = uspDataHandler.getConsentData();
    if (hasGdpr && (!gdprConsentString || gdprConsentString === '')) {
      logError('User ID - akamaiDapToken submobile requires consent string to call API');
      return;
    }
    // XXX: retrieve first-party data here if needed
    let url = '';
    let postData = undefined;
    let tokenName = '';
    if (configParams.type.startsWith("dap-signature:")) {
      let parts = configParams.type.split(":");
      let v = parts[1];
      url = `https://${configParams.apiHostname}/data-activation/v1/domain/${configParams.domain}/signature?v=${v}&gdpr=${hasGdpr}&gdpr_consent=${gdprConsentString}&us_privacy=${uspConsent}`;
      tokenName = 'SigToken';
    } else {
      url = `https://${configParams.apiHostname}/data-activation/v1/identity/tokenize?gdpr=${hasGdpr}&gdpr_consent=${gdprConsentString}&us_privacy=${uspConsent}`;
      postData = {
        "version": 1,
        "domain": configParams.domain,
        "identity": configParams.identity,
        "type": configParams.type
      };
      tokenName = 'PubToken';
    }

    logInfo("[getId] making API call for " + tokenName);

    /*
    const resp = function (callback) {
      const callbacks = {
        success: response => {
          // TODO: validate that the response object is a well-formed JWT/JWE.
          let o = { id: response };
          logInfo("[getId:ajax.success]", o);
          callback(o);
        },
        error: error => {
          logError("[getId:ajax.error] Failed to retrieve " + tokenName, error);
          callback();
        }
      };
      //ajax(url, callbacks, postData, {withCredentials: true});
      ajax(url, callbacks, JSON.stringify(postData), {contentType: "application/json"});
    };
    */

    let cb = {
      success: response => {
        storage.setDataInLocalStorage( STORAGE_KEY, response );
      },
      error: error => {
        logError("[getId:ajax.error] failed to retrieve " + tokenName, error);
      }
    };

    ajax( url, cb, JSON.stringify( postData ), { contentType: "application/json" } );

    let token = storage.getDataFromLocalStorage( STORAGE_KEY );
    logMessage( "[getId] returning", token );

    return { id: token };
  }
};

submodule('userId', akamaiDataActivationPlatformSubmodule);
/* vim: set ts=2 sw=2 et: */
