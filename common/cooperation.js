var COOPERATION_SELECTED_KEY = 'campusfit_selected_cooperation_snapshot'

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : null
}

function normalizeCooperation(cooperation) {
  if (!cooperation || !cooperation.id) {
    return null
  }
  return {
    id: cooperation.id,
    title: cooperation.title || '',
    merchantName: cooperation.merchantName || '',
    desc: cooperation.desc || '',
    status: cooperation.status || '',
    statusCode: Number(cooperation.statusCode || 0),
    rewardAmount: cooperation.rewardAmount || '',
    targetPostCount: Number(cooperation.targetPostCount || 1),
    approvedPostCount: Number(cooperation.approvedPostCount || 0),
    submittedPostCount: Number(cooperation.submittedPostCount || 0),
    targetLikeCount: Number(cooperation.targetLikeCount || 0),
    approvedLikeCount: Number(cooperation.approvedLikeCount || 0),
    deadlineAt: cooperation.deadlineAt || '',
    canAccept: !!cooperation.canAccept,
    accepted: !!cooperation.accepted,
    canPublish: !!cooperation.canPublish,
    canAbandon: !!cooperation.canAbandon,
    rewardReady: !!cooperation.rewardReady,
    rewardIssued: !!cooperation.rewardIssued,
    ruleText: cooperation.ruleText || '',
    progressText: cooperation.progressText || ''
  }
}

function selectCooperation(cooperation) {
  var normalized = normalizeCooperation(cooperation)
  if (!normalized) {
    clearSelectedCooperation()
    return null
  }
  uni.setStorageSync(COOPERATION_SELECTED_KEY, normalized)
  return clone(normalized)
}

function getSelectedCooperation() {
  return clone(uni.getStorageSync(COOPERATION_SELECTED_KEY) || null)
}

function clearSelectedCooperation() {
  uni.removeStorageSync(COOPERATION_SELECTED_KEY)
}

module.exports = {
  selectCooperation: selectCooperation,
  getSelectedCooperation: getSelectedCooperation,
  clearSelectedCooperation: clearSelectedCooperation,
  normalizeCooperation: normalizeCooperation
}
