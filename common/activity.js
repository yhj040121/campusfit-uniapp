var ACTIVITY_JOINED_KEY = 'campusfit_joined_activity_ids'
var ACTIVITY_SELECTED_KEY = 'campusfit_selected_activity_id'
var ACTIVITY_BINDING_KEY = 'campusfit_post_activity_bindings'

function buildActivities() {
  return [
    {
      id: 'spring-library-week',
      title: '图书馆清爽穿搭周',
      badge: '本周主推',
      theme: '围绕早八、自习和图书馆久坐场景，征集干净、耐看、预算友好的校园穿搭内容。',
      summary: '适合图书馆、自习室和教室通勤的清爽穿搭专题。',
      period: '03.20 - 03.31',
      reward: '优质内容可获得首页专题位与校园品牌合作曝光。',
      participation: '发布带有“图书馆”或“早八”标签的原创内容即可参与。',
      scene: '图书馆',
      status: '进行中',
      heat: 862,
      entries: 126
    },
    {
      id: 'club-style-challenge',
      title: '社团活动出片挑战',
      badge: '热门活动',
      theme: '鼓励分享社团招新、主持、合照、路演等场景下更上镜的穿搭方案。',
      summary: '适合社团招新、路演和合照的校园活动主题。',
      period: '03.18 - 04.05',
      reward: '入选活动榜单后可获得校园创作者成长积分。',
      participation: '发布带社团活动或甜酷、运动休闲风格标签的内容即可加入。',
      scene: '社团活动',
      status: '进行中',
      heat: 1046,
      entries: 203
    },
    {
      id: 'budget-outfit-plan',
      title: '百元预算穿搭计划',
      badge: '预算友好',
      theme: '面向预算敏感用户，鼓励分享低成本、高复用、可直接照着穿的日常搭配。',
      summary: '专门收纳百元内外的理性消费穿搭内容。',
      period: '03.15 - 04.10',
      reward: '优质预算内容可进入理性消费专题并获得导购扶持。',
      participation: '内容需明确预算区间，并至少包含一件核心单品。',
      scene: '预算',
      status: '征集中',
      heat: 732,
      entries: 97
    }
  ]
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function getJoinedIds() {
  return uni.getStorageSync(ACTIVITY_JOINED_KEY) || []
}

function saveJoinedIds(list) {
  uni.setStorageSync(ACTIVITY_JOINED_KEY, list)
}

function getSelectedId() {
  return uni.getStorageSync(ACTIVITY_SELECTED_KEY) || ''
}

function getBindings() {
  return uni.getStorageSync(ACTIVITY_BINDING_KEY) || {}
}

function saveBindings(bindings) {
  uni.setStorageSync(ACTIVITY_BINDING_KEY, bindings)
}

function decorateActivity(activity) {
  var joinedIds = getJoinedIds()
  var selectedId = getSelectedId()
  var item = clone(activity)
  item.joined = joinedIds.indexOf(item.id) > -1
  item.selected = item.id === selectedId
  item.statusCopy = item.joined ? '已报名参与，可在“我的活动”中查看进度。' : '可以报名参与，也可以直接绑定到发布内容。'
  item.progressText = '热度 ' + item.heat + ' · 参与内容 ' + item.entries
  return item
}

function listActivities() {
  return buildActivities().map(decorateActivity)
}

function getFeaturedActivities() {
  return listActivities().slice(0, 2)
}

function getActivityById(activityId) {
  var list = listActivities()
  for (var i = 0; i < list.length; i += 1) {
    if (list[i].id === activityId) {
      return list[i]
    }
  }
  return null
}

function getFallbackActivity(post) {
  if (!post) {
    return getActivityById('spring-library-week')
  }
  if ((post.scene || '').indexOf('社团') > -1) {
    return getActivityById('club-style-challenge')
  }
  if ((post.budget || '').indexOf('100') > -1 || (post.budget || '').indexOf('50') > -1) {
    return getActivityById('budget-outfit-plan')
  }
  return getActivityById('spring-library-week')
}

function getPostActivity(postId, post) {
  var bindings = getBindings()
  var boundId = bindings[String(postId || '')]
  return getActivityById(boundId) || getFallbackActivity(post)
}

function bindPostToActivity(postId, activityId) {
  if (!postId || !activityId) {
    return
  }
  var bindings = getBindings()
  bindings[String(postId)] = activityId
  saveBindings(bindings)
}

function toggleJoin(activityId) {
  var ids = getJoinedIds().slice(0)
  var index = ids.indexOf(activityId)
  var active = true
  if (index > -1) {
    ids.splice(index, 1)
    active = false
  } else {
    ids.push(activityId)
  }
  saveJoinedIds(ids)
  return {
    active: active,
    activity: getActivityById(activityId)
  }
}

function selectActivity(activityId) {
  if (!activityId) {
    uni.removeStorageSync(ACTIVITY_SELECTED_KEY)
    return null
  }
  uni.setStorageSync(ACTIVITY_SELECTED_KEY, activityId)
  return getActivityById(activityId)
}

function clearSelectedActivity() {
  uni.removeStorageSync(ACTIVITY_SELECTED_KEY)
}

function getSelectedActivity() {
  return getActivityById(getSelectedId())
}

function listMyActivities() {
  return listActivities().filter(function(item) {
    return item.joined
  })
}

function getMyActivityStats() {
  var mine = listMyActivities()
  var ongoing = 0
  for (var i = 0; i < mine.length; i += 1) {
    if (mine[i].status.indexOf('进行中') > -1 || mine[i].status.indexOf('征集中') > -1) {
      ongoing += 1
    }
  }
  return {
    joinedCount: mine.length,
    ongoingCount: ongoing,
    selectedActivity: getSelectedActivity()
  }
}

module.exports = {
  listActivities: listActivities,
  getFeaturedActivities: getFeaturedActivities,
  getActivityById: getActivityById,
  getSelectedActivity: getSelectedActivity,
  selectActivity: selectActivity,
  clearSelectedActivity: clearSelectedActivity,
  toggleJoin: toggleJoin,
  listMyActivities: listMyActivities,
  getMyActivityStats: getMyActivityStats,
  bindPostToActivity: bindPostToActivity,
  getPostActivity: getPostActivity
}
