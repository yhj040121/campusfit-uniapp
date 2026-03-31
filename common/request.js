var config = require('./config.js')
var session = require('./session.js')

var activeBaseUrl = ''
var resolvingPromise = null

function extractErrorMessage(response) {
  var payload = response && response.data
  if (payload && typeof payload === 'object' && payload.message) {
    return payload.message
  }
  if (typeof payload === 'string') {
    try {
      var parsed = JSON.parse(payload)
      if (parsed && parsed.message) {
        return parsed.message
      }
    } catch (error) {
      return payload
    }
    return payload
  }
  return ''
}

function createRequestError(message, extra) {
  var error = new Error(message)
  var patch = extra || {}
  var keys = Object.keys(patch)
  for (var i = 0; i < keys.length; i += 1) {
    error[keys[i]] = patch[keys[i]]
  }
  return error
}

function rememberBaseUrl(baseUrl) {
  var normalized = config.normalizeBaseUrl(baseUrl)
  activeBaseUrl = normalized
  if (normalized) {
    uni.setStorageSync(config.ACTIVE_BASE_URL_KEY, normalized)
    return normalized
  }
  uni.removeStorageSync(config.ACTIVE_BASE_URL_KEY)
  return ''
}

function clearActiveBaseUrl() {
  activeBaseUrl = ''
  uni.removeStorageSync(config.ACTIVE_BASE_URL_KEY)
}

function getActiveBaseUrl() {
  return activeBaseUrl || config.getConfiguredBaseUrl() || ''
}

function getBaseUrlCandidates() {
  return config.getBaseUrlCandidates()
}

function getFallbackBaseUrl() {
  return ''
}

function rawRequest(baseUrl, options, silent) {
  return new Promise(function(resolve, reject) {
    var header = {
      'Content-Type': 'application/json'
    }
    var token = session.getToken()
    if (token) {
      header.Authorization = 'Bearer ' + token
    }
    uni.request({
      url: baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: options.timeout || 8000,
      header: header,
      success: function(response) {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(createRequestError(
            extractErrorMessage(response) || ('HTTP ' + response.statusCode),
            {
              baseUrl: baseUrl,
              statusCode: response.statusCode,
              isHttpError: true
            }
          ))
          return
        }
        var payload = response.data || {}
        rememberBaseUrl(baseUrl)
        if (silent) {
          resolve(payload)
          return
        }
        if (payload.code === 0) {
          resolve(payload.data)
          return
        }
        reject(createRequestError(
          payload.message || 'API returned an unexpected result',
          {
            baseUrl: baseUrl,
            code: payload.code,
            isBusinessError: true
          }
        ))
      },
      fail: function(error) {
        reject(createRequestError(
          error.errMsg || 'Network request failed',
          {
            baseUrl: baseUrl,
            isNetworkError: true
          }
        ))
      }
    })
  })
}

function resolveBaseUrl(forceRefresh) {
  if (!forceRefresh && activeBaseUrl) {
    return Promise.resolve(activeBaseUrl)
  }
  if (!forceRefresh && resolvingPromise) {
    return resolvingPromise
  }

  resolvingPromise = new Promise(function(resolve, reject) {
    var baseUrl = config.getConfiguredBaseUrl()
    if (!baseUrl) {
      reject(new Error('No backend base URL is configured'))
      return
    }
    resolve(rememberBaseUrl(baseUrl))
  })

  return resolvingPromise.finally(function() {
    resolvingPromise = null
  })
}

function request(options) {
  return resolveBaseUrl(false)
    .then(function(baseUrl) {
      return rawRequest(baseUrl, options, false)
    })
}

module.exports = {
  request: request,
  clearActiveBaseUrl: clearActiveBaseUrl,
  getActiveBaseUrl: getActiveBaseUrl,
  getBaseUrlCandidates: getBaseUrlCandidates,
  getFallbackBaseUrl: getFallbackBaseUrl,
  resolveBaseUrl: resolveBaseUrl,
  setActiveBaseUrl: rememberBaseUrl
}
