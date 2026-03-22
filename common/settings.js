var SETTINGS_KEY = 'campusfit_local_settings'

function defaultSettings() {
  return [
    { key: 'push', title: '消息推送', copy: '及时接收评论、点赞、激励与活动提醒', active: true },
    { key: 'privacy', title: '隐私可见', copy: '控制校园信息与个人资料的展示范围', active: true },
    { key: 'recommend', title: '个性化推荐', copy: '根据你的浏览和互动记录推荐内容', active: true },
    { key: 'safe', title: '理性消费提醒', copy: '导购场景下展示预算与消费提示', active: true }
  ]
}

function cloneSettings(list) {
  return JSON.parse(JSON.stringify(list || []))
}

function buildSettingMap(list) {
  var map = {}
  for (var i = 0; i < list.length; i += 1) {
    if (list[i] && list[i].key) {
      map[list[i].key] = !!list[i].active
    }
  }
  return map
}

function normalizeSettings(stored) {
  var defaults = defaultSettings()
  var storedMap = buildSettingMap(Array.isArray(stored) ? stored : [])
  for (var i = 0; i < defaults.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(storedMap, defaults[i].key)) {
      defaults[i].active = !!storedMap[defaults[i].key]
    }
  }
  return defaults
}

function getSettings() {
  var stored = uni.getStorageSync(SETTINGS_KEY)
  return normalizeSettings(stored)
}

function saveSettings(list) {
  var normalized = normalizeSettings(list)
  uni.setStorageSync(SETTINGS_KEY, normalized)
  return cloneSettings(normalized)
}

function getSettingMap() {
  return buildSettingMap(getSettings())
}

function isEnabled(key) {
  var map = getSettingMap()
  return map[key] !== false
}

function setEnabled(key, active) {
  var list = getSettings()
  for (var i = 0; i < list.length; i += 1) {
    if (list[i].key === key) {
      list[i].active = !!active
      break
    }
  }
  return saveSettings(list)
}

module.exports = {
  SETTINGS_KEY: SETTINGS_KEY,
  defaultSettings: defaultSettings,
  getSettings: getSettings,
  saveSettings: saveSettings,
  getSettingMap: getSettingMap,
  isEnabled: isEnabled,
  setEnabled: setEnabled
}
