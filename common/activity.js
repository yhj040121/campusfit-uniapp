var ACTIVITY_SELECTED_KEY = 'campusfit_selected_activity_snapshot'

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : null
}

function normalizeActivity(activity) {
  if (!activity || !activity.id) {
    return null
  }
  return {
    id: activity.id,
    title: activity.title || '',
    badge: activity.badge || '',
    theme: activity.theme || '',
    summary: activity.summary || '',
    period: activity.period || '',
    reward: activity.reward || '',
    participation: activity.participation || '',
    scene: activity.scene || '',
    status: activity.status || '',
    heat: Number(activity.heat || 0),
    entries: Number(activity.entries || 0),
    joined: !!activity.joined,
    statusCopy: activity.statusCopy || '',
    progressText: activity.progressText || ''
  }
}

function selectActivity(activity) {
  var normalized = normalizeActivity(activity)
  if (!normalized) {
    clearSelectedActivity()
    return null
  }
  uni.setStorageSync(ACTIVITY_SELECTED_KEY, normalized)
  return clone(normalized)
}

function getSelectedActivity() {
  return clone(uni.getStorageSync(ACTIVITY_SELECTED_KEY) || null)
}

function clearSelectedActivity() {
  uni.removeStorageSync(ACTIVITY_SELECTED_KEY)
}

module.exports = {
  selectActivity: selectActivity,
  getSelectedActivity: getSelectedActivity,
  clearSelectedActivity: clearSelectedActivity,
  normalizeActivity: normalizeActivity
}
