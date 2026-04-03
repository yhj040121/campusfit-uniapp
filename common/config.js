var PRIMARY_DEPLOYED_BASE_URL = 'https://yuhaojie.cn'
// var APP_DEBUG_BASE_URL = 'http://10.205.109.117:8080'

var ACTIVE_BASE_URL_KEY = 'campusfit_base_url'

function normalizeBaseUrl(value) {
  var text = String(value || '').trim()
  if (!text) {
    return ''
  }
  return text.replace(/\/+$/, '')
}

function getConfiguredBaseUrl() {
  if (typeof PRIMARY_DEPLOYED_BASE_URL !== 'undefined' && PRIMARY_DEPLOYED_BASE_URL) {
    return normalizeBaseUrl(PRIMARY_DEPLOYED_BASE_URL)
  }
  if (typeof APP_DEBUG_BASE_URL !== 'undefined' && APP_DEBUG_BASE_URL) {
    return normalizeBaseUrl(APP_DEBUG_BASE_URL)
  }
  return ''
}

function getBaseUrlCandidates() {
  var baseUrl = getConfiguredBaseUrl()
  return baseUrl ? [baseUrl] : []
}

module.exports = {
  ACTIVE_BASE_URL_KEY: ACTIVE_BASE_URL_KEY,
  normalizeBaseUrl: normalizeBaseUrl,
  getConfiguredBaseUrl: getConfiguredBaseUrl,
  getBaseUrlCandidates: getBaseUrlCandidates
}
