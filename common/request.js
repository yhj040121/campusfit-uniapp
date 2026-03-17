var config = require('./config.js')
var session = require('./session.js')

var activeBaseUrl = ''
var resolvingPromise = null

function unique(list) {
  var result = []
  for (var i = 0; i < list.length; i += 1) {
    if (list[i] && result.indexOf(list[i]) === -1) {
      result.push(list[i])
    }
  }
  return result
}

function getActiveBaseUrl() {
  return activeBaseUrl || uni.getStorageSync('campusfit_base_url') || ''
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
          reject(new Error('HTTP ' + response.statusCode))
          return
        }
        var payload = response.data || {}
        if (silent) {
          resolve(payload)
          return
        }
        if (payload.code === 0) {
          resolve(payload.data)
          return
        }
        reject(new Error(payload.message || 'API returned an unexpected result'))
      },
      fail: function(error) {
        reject(new Error(error.errMsg || 'Network request failed'))
      }
    })
  })
}

function ping(baseUrl) {
  return rawRequest(baseUrl, {
    url: '/api/health',
    method: 'GET',
    timeout: 1500
  }, true).then(function() {
    return baseUrl
  })
}

function resolveBaseUrl(forceRefresh) {
  if (!forceRefresh && getActiveBaseUrl()) {
    activeBaseUrl = getActiveBaseUrl()
    return Promise.resolve(activeBaseUrl)
  }
  if (!forceRefresh && resolvingPromise) {
    return resolvingPromise
  }
  var stored = uni.getStorageSync('campusfit_base_url')
  var candidates = unique((stored ? [stored] : []).concat(config.getBaseUrlCandidates()))
  resolvingPromise = new Promise(function(resolve, reject) {
    function tryNext(index) {
      if (index >= candidates.length) {
        reject(new Error('No available Spring Boot backend was detected'))
        return
      }
      ping(candidates[index])
        .then(function(baseUrl) {
          activeBaseUrl = baseUrl
          uni.setStorageSync('campusfit_base_url', baseUrl)
          resolve(baseUrl)
        })
        .catch(function() {
          tryNext(index + 1)
        })
    }
    tryNext(0)
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
    .catch(function(error) {
      activeBaseUrl = ''
      uni.removeStorageSync('campusfit_base_url')
      return resolveBaseUrl(true)
        .then(function(baseUrl) {
          return rawRequest(baseUrl, options, false)
        })
        .catch(function() {
          throw error
        })
    })
}

module.exports = {
  request: request,
  getActiveBaseUrl: getActiveBaseUrl,
  resolveBaseUrl: resolveBaseUrl
}