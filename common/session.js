var TOKEN_KEY = 'campusfit_user_token'
var USER_KEY = 'campusfit_user_info'

function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

function getUser() {
  return uni.getStorageSync(USER_KEY) || null
}

function isLoggedIn() {
  return !!getToken()
}

function saveSession(payload) {
  if (!payload) {
    return
  }
  uni.setStorageSync(TOKEN_KEY, payload.token || '')
  uni.setStorageSync(USER_KEY, {
    userId: payload.userId,
    phone: payload.phone,
    nickname: payload.nickname
  })
}

function updateUser(patch) {
  var current = getUser() || {}
  uni.setStorageSync(USER_KEY, Object.assign({}, current, patch || {}))
}

function clearSession() {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(USER_KEY)
}

module.exports = {
  getToken: getToken,
  getUser: getUser,
  isLoggedIn: isLoggedIn,
  saveSession: saveSession,
  updateUser: updateUser,
  clearSession: clearSession
}