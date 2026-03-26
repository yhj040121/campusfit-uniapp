var config = require('./config.js')
var session = require('./session.js')

var activeBaseUrl = ''
var resolvingPromise = null
var PING_OPTIONS = [
  {
    url: '/api/health',
    method: 'GET',
    timeout: 1800
  },
  {
    url: '/api/posts/recommendations',
    method: 'GET',
    timeout: 2500
  }
]

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
          var errorMessage = extractErrorMessage(response) || ('HTTP ' + response.statusCode)
          reject(new Error(errorMessage))
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
  function tryNext(index) {
    if (index >= PING_OPTIONS.length) {
      return Promise.reject(new Error('Backend ping failed'))
    }
    return rawRequest(baseUrl, PING_OPTIONS[index], true)
      .then(function() {
        return baseUrl
      })
      .catch(function() {
        return tryNext(index + 1)
      })
  }
  return tryNext(0)
}

function resolveBaseUrl(forceRefresh) {
  if (!forceRefresh && activeBaseUrl) {
    return Promise.resolve(activeBaseUrl)
  }
  if (!forceRefresh && resolvingPromise) {
    return resolvingPromise
  }
  var stored = uni.getStorageSync('campusfit_base_url')
  var candidates = unique(config.getBaseUrlCandidates().concat(stored ? [stored] : []))
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
