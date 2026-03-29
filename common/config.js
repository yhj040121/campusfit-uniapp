var PRIMARY_DEPLOYED_BASE_URL = 'https://yuhaojie.cn'
var APP_DEBUG_BASE_URL = 'http://192.168.31.193:8080'

var CUSTOM_BASE_URL_KEY = 'campusfit_custom_base_url'
var ACTIVE_BASE_URL_KEY = 'campusfit_base_url'

function normalizeBaseUrl(value) {
  var text = String(value || '').trim()
  if (!text) {
    return ''
  }
  return text.replace(/\/+$/, '')
}

function unique(list) {
  var result = []
  for (var i = 0; i < list.length; i += 1) {
    if (list[i] && result.indexOf(list[i]) === -1) {
      result.push(list[i])
    }
  }
  return result
}

function getCustomBaseUrl() {
  return normalizeBaseUrl(uni.getStorageSync(CUSTOM_BASE_URL_KEY))
}

function getStoredBaseUrl() {
  return normalizeBaseUrl(uni.getStorageSync(ACTIVE_BASE_URL_KEY))
}

function getDefaultBaseUrl() {
  return normalizeBaseUrl(PRIMARY_DEPLOYED_BASE_URL)
}

function getDebugBaseUrl() {
  // #ifdef APP-PLUS
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return normalizeBaseUrl(APP_DEBUG_BASE_URL)
  }
  // #endif
  return ''
}

function getBaseUrlCandidates() {
  var list = []
  var customBaseUrl = getCustomBaseUrl()
  var storedBaseUrl = getStoredBaseUrl()
  var debugBaseUrl = getDebugBaseUrl()
  var defaultBaseUrl = getDefaultBaseUrl()

  if (customBaseUrl) {
    list.push(customBaseUrl)
  }
  if (storedBaseUrl) {
    list.push(storedBaseUrl)
  }
  if (debugBaseUrl) {
    list.push(debugBaseUrl)
  }
  if (defaultBaseUrl) {
    list.push(defaultBaseUrl)
  }

  return unique(list)
}

module.exports = {
  ACTIVE_BASE_URL_KEY: ACTIVE_BASE_URL_KEY,
  CUSTOM_BASE_URL_KEY: CUSTOM_BASE_URL_KEY,
  normalizeBaseUrl: normalizeBaseUrl,
  getCustomBaseUrl: getCustomBaseUrl,
  getStoredBaseUrl: getStoredBaseUrl,
  getDefaultBaseUrl: getDefaultBaseUrl,
  getBaseUrlCandidates: getBaseUrlCandidates
}
