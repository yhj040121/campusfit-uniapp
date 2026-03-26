<template>
  <view class="page-shell results-shell">
    <view class="results-topbar">
      <view class="results-top-btn" @click="goBack">←</view>
      <view class="results-search-box">
        <view class="results-search-mark">搜</view>
        <input
          class="results-search-input"
          v-model="keyword"
          placeholder="搜索校园穿搭、品牌或活动主题"
          confirm-type="search"
          @confirm="submitQuickSearch"
        />
      </view>
    </view>

    <view class="results-content">
      <scroll-view class="results-tab-scroll" scroll-x show-scrollbar="false">
        <view class="results-tab-row">
          <view
            v-for="item in categoryTabs"
            :key="item.key"
            :class="['results-tab', activeCategory === item.key ? 'results-tab-active' : '']"
            @click="setCategory(item.key)"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>

      <view v-if="resultLoading" class="results-grid">
        <view class="results-column">
          <view class="results-skeleton results-skeleton-tall"></view>
          <view class="results-skeleton results-skeleton-short"></view>
        </view>
        <view class="results-column">
          <view class="results-skeleton results-skeleton-short"></view>
          <view class="results-skeleton results-skeleton-tall"></view>
        </view>
      </view>

      <view v-else-if="resultFailed" class="results-state-card">
        <view class="results-state-title">搜索结果暂时不可用</view>
        <view class="results-state-copy">内容搜索接口请求失败了，你可以稍后重试，或者先返回搜索页换个关键词。</view>
        <view class="results-state-actions">
          <view class="results-state-action results-state-action-light" @click="goSearch">返回搜索</view>
          <view class="results-state-action results-state-action-primary" @click="refreshResults">重新加载</view>
        </view>
      </view>

      <view v-else-if="displayedResults.length" class="results-grid">
        <view class="results-column" v-for="(column, columnIndex) in resultColumns" :key="'column-' + columnIndex">
          <view
            v-for="item in column"
            :key="item.uid"
            :class="['results-card', 'results-card-' + item.kind]"
            @click="openResult(item)"
          >
            <view
              :class="[
                'results-card-media',
                'results-card-media-' + item.cardVariant,
                item.displayCoverUrl ? 'results-card-media-image' : '',
                item.kind === 'activity' ? 'results-card-media-activity' : ''
              ]"
            >
              <image
                v-if="item.kind === 'post' && item.displayCoverUrl"
                class="results-card-image"
                :src="item.displayCoverUrl"
                mode="aspectFill"
              ></image>
              <view v-else-if="item.kind === 'activity'" class="results-activity-art">
                <view class="results-activity-mark">{{ item.badgeShort }}</view>
              </view>
              <view v-else class="results-card-fallback">
                <view class="results-card-fallback-mark">{{ item.primaryTag }}</view>
                <view class="results-card-fallback-title">{{ item.title }}</view>
              </view>

              <view class="results-card-badge-row">
                <view class="results-card-badge">{{ item.primaryTag }}</view>
                <view v-if="item.secondaryTag" class="results-card-badge results-card-badge-light">{{ item.secondaryTag }}</view>
              </view>

              <view v-if="item.kind === 'activity' || item.cardVariant === 'feature'" class="results-card-overlay-copy">
                <view class="results-card-overlay-title">{{ item.title }}</view>
                <view class="results-card-overlay-meta">{{ item.heroMeta }}</view>
              </view>
            </view>

            <view class="results-card-body">
              <view v-if="item.kind === 'post' && item.cardVariant !== 'feature'" class="results-card-title">{{ item.title }}</view>
              <view v-if="item.summary" class="results-card-desc">{{ item.summary }}</view>

              <view v-if="item.kind === 'post'" class="results-card-footer">
                <view class="results-card-user">
                  <view :class="['avatar', item.avatarClass, item.avatarUrl ? 'avatar-has-image' : '']">
                    <image v-if="item.avatarUrl" class="avatar-image" :src="item.avatarUrl" mode="aspectFill"></image>
                    <text v-else>{{ item.avatar }}</text>
                  </view>
                  <view class="results-card-user-copy">
                    <view class="results-card-user-name">{{ item.user }}</view>
                    <view class="results-card-user-meta">{{ item.footerMeta }}</view>
                  </view>
                </view>
                <view class="results-card-metric">{{ item.metricText }}</view>
              </view>

              <view v-else class="results-activity-footer">
                <view class="results-activity-line">{{ item.periodText }}</view>
                <view class="results-activity-meta">{{ item.footerMeta }}</view>
                <view class="results-activity-action">{{ item.actionText }}</view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="results-state-card">
        <view class="results-state-title">{{ emptyStateTitle }}</view>
        <view class="results-state-copy">{{ emptyStateCopy }}</view>
        <view class="results-state-actions">
          <view class="results-state-action results-state-action-light" @click="clearFiltersAndReload">清空筛选</view>
          <view class="results-state-action results-state-action-primary" @click="goSearch">返回搜索</view>
        </view>
      </view>

      <view v-if="showEndState" class="results-end-state">{{ endStateCopy }}</view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var activityStore = require('../../common/activity.js')
var postDisplay = require('../../common/post-display.js')
var settingsStore = require('../../common/settings.js')

var SEARCH_HISTORY_KEY = 'campusfit_search_history'

function normalizeText(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function pickFirstText() {
  for (var i = 0; i < arguments.length; i += 1) {
    var text = normalizeText(arguments[i])
    if (text) return text
  }
  return ''
}

function formatCount(value) {
  var amount = Number(value || 0)
  if (!isFinite(amount) || amount <= 0) return '0'
  if (amount >= 10000) return (amount / 10000).toFixed(amount >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'w'
  if (amount >= 1000) return (amount / 1000).toFixed(amount >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k'
  return String(Math.round(amount))
}

function buildCardVariant(index, kind) {
  if (kind === 'activity') return index % 2 === 0 ? 'feature' : 'square'
  if (index % 5 === 0) return 'feature'
  if (index % 4 === 1) return 'square'
  if (index % 4 === 2) return 'landscape'
  return 'portrait'
}

function decoratePosts(list) {
  return (list || []).map(function(item, index) {
    var scene = normalizeText(item.scene)
    var style = normalizeText(item.style)
    var budget = normalizeText(item.budget)
    var user = pickFirstText(item.user, '校园同学')
    return {
      uid: 'post-' + String(item.id || index),
      id: item.id,
      kind: 'post',
      raw: item,
      title: pickFirstText(item.title, '校园内容'),
      summary: pickFirstText(postDisplay.getDisplaySubtitle(item), item.desc),
      displayCoverUrl: postDisplay.getDisplayCoverUrl(item),
      primaryTag: pickFirstText(item.coverTag, scene, '内容'),
      secondaryTag: pickFirstText(style, budget ? ('预算 ' + budget) : ''),
      heroMeta: pickFirstText(item.school, user, scene, 'CampusFit'),
      user: user,
      avatar: pickFirstText(item.avatar, user.slice(0, 1), 'C'),
      avatarUrl: normalizeText(item.avatarUrl),
      avatarClass: normalizeText(item.avatarClass),
      footerMeta: pickFirstText(item.school, scene, 'CampusFit'),
      metricText: formatCount(item.likes),
      periodText: '',
      actionText: '',
      badgeShort: '',
      cardVariant: buildCardVariant(index, 'post')
    }
  })
}

function activityMatches(activity, keyword, filters) {
  var safeKeyword = normalizeText(keyword).toLowerCase()
  var safeScene = normalizeText(filters && filters.scene)
  if (safeScene && normalizeText(activity.scene) !== safeScene) return false
  if (!safeKeyword) return true
  var haystack = [
    activity.title, activity.badge, activity.theme, activity.summary, activity.period,
    activity.reward, activity.participation, activity.scene, activity.statusCopy, activity.progressText
  ].join(' ').toLowerCase()
  return haystack.indexOf(safeKeyword) > -1
}

function decorateActivities(list, keyword, filters) {
  return (list || [])
    .filter(function(item) { return activityMatches(item, keyword, filters) })
    .sort(function(a, b) { return Number(b.heat || 0) - Number(a.heat || 0) })
    .map(function(item, index) {
      var badge = pickFirstText(item.badge, '校园活动')
      return {
        uid: 'activity-' + String(item.id || index),
        id: item.id,
        kind: 'activity',
        raw: activityStore.normalizeActivity(item),
        title: pickFirstText(item.title, '活动推荐'),
        summary: pickFirstText(item.summary, item.reward, item.participation),
        displayCoverUrl: '',
        primaryTag: badge,
        secondaryTag: pickFirstText(item.scene, item.theme),
        heroMeta: pickFirstText(item.period, item.progressText, item.statusCopy, '校园活动进行中'),
        user: '',
        avatar: '',
        avatarUrl: '',
        avatarClass: '',
        footerMeta: pickFirstText(item.participation, item.statusCopy, item.theme, '查看活动详情'),
        metricText: formatCount(item.heat || item.entries),
        periodText: pickFirstText(item.period, item.progressText, '近期活动'),
        actionText: item.joined ? '已报名' : '去看看',
        badgeShort: badge.slice(0, 1) || '活',
        cardVariant: buildCardVariant(index, 'activity')
      }
    })
}

function mixResults(posts, activities) {
  var merged = []
  var postIndex = 0
  var activityIndex = 0
  while (postIndex < posts.length || activityIndex < activities.length) {
    if (activityIndex < activities.length) merged.push(activities[activityIndex++])
    for (var count = 0; count < 2 && postIndex < posts.length; count += 1) merged.push(posts[postIndex++])
  }
  return merged
}

function estimateCardWeight(item) {
  if (!item) return 1
  if (item.cardVariant === 'feature') return 1.5
  if (item.cardVariant === 'portrait') return 1.32
  if (item.cardVariant === 'landscape') return 1.02
  return 1.12
}

function buildColumns(list) {
  var columns = [[], []]
  var weights = [0, 0]
  for (var i = 0; i < list.length; i += 1) {
    var target = weights[0] <= weights[1] ? 0 : 1
    columns[target].push(list[i])
    weights[target] += estimateCardWeight(list[i])
  }
  return columns
}

export default {
  data: function() {
    return {
      keyword: '',
      filters: { scene: '', style: '', budget: '' },
      postResults: [],
      activityResults: [],
      resultLoading: false,
      resultFailed: false,
      sortType: 'recommended',
      activeCategory: 'all',
      categoryTabs: [
        { key: 'all', label: '全部' },
        { key: 'content', label: '内容' },
        { key: 'activity', label: '活动' }
      ]
    }
  },
  computed: {
    sortedPostResults: function() {
      var list = this.postResults.slice(0)
      if (this.sortType === 'latest') {
        list.sort(function(a, b) { return String(b.id || '').localeCompare(String(a.id || '')) })
        return list
      }
      list.sort(function(a, b) { return Number((b.raw && b.raw.likes) || 0) - Number((a.raw && a.raw.likes) || 0) })
      return list
    },
    displayedResults: function() {
      if (this.activeCategory === 'content') return this.sortedPostResults
      if (this.activeCategory === 'activity') return this.activityResults
      if (this.activeCategory === 'all') return mixResults(this.sortedPostResults, this.activityResults)
      return []
    },
    resultColumns: function() {
      return buildColumns(this.displayedResults)
    },
    emptyStateTitle: function() {
      return this.activeCategory === 'activity' ? '没有搜到匹配的活动' : '暂时没有匹配结果'
    },
    emptyStateCopy: function() {
      return this.activeCategory === 'activity'
        ? '可以换一个活动主题关键词，或者先去活动中心看看当前正在进行的专题。'
        : '可以换个关键词，或者清空筛选条件后重新看看。'
    },
    showEndState: function() {
      return !this.resultLoading && !this.resultFailed && this.displayedResults.length > 0
    },
    endStateCopy: function() {
      var keyword = normalizeText(this.keyword)
      return keyword ? ('没有更多关于“' + keyword + '”的内容了') : '已经翻到当前搜索结果的底部了'
    }
  },
  onLoad: function(options) {
    this.keyword = options && options.keyword ? decodeURIComponent(options.keyword) : ''
    this.filters.scene = options && options.scene ? decodeURIComponent(options.scene) : ''
    this.filters.style = options && options.style ? decodeURIComponent(options.style) : ''
    this.filters.budget = options && options.budget ? decodeURIComponent(options.budget) : ''
    if (!settingsStore.isEnabled('recommend')) this.sortType = 'latest'
    this.loadResults()
  },
  onShow: function() {
    this.sortType = settingsStore.isEnabled('recommend') ? 'recommended' : 'latest'
  },
  methods: {
    saveHistory: function(keyword) {
      var safeKeyword = normalizeText(keyword)
      if (!safeKeyword) return
      var stored = uni.getStorageSync(SEARCH_HISTORY_KEY) || []
      var list = Array.isArray(stored) ? stored.slice(0) : []
      var index = list.indexOf(safeKeyword)
      if (index > -1) list.splice(index, 1)
      list.unshift(safeKeyword)
      uni.setStorageSync(SEARCH_HISTORY_KEY, list.slice(0, 8))
    },
    loadResults: function() {
      var self = this
      self.resultLoading = true
      self.resultFailed = false
      Promise.all([
        api.searchPosts(self.keyword, self.filters),
        api.listActivities().catch(function() { return [] })
      ])
        .then(function(payload) {
          self.postResults = decoratePosts(payload[0] || [])
          self.activityResults = decorateActivities(payload[1] || [], self.keyword, self.filters)
        })
        .catch(function() {
          self.postResults = []
          self.activityResults = []
          self.resultFailed = true
        })
        .finally(function() { self.resultLoading = false })
    },
    refreshResults: function() {
      this.loadResults()
      uni.showToast({ title: '正在刷新搜索结果', icon: 'none' })
    },
    clearFilters: function() {
      this.filters = { scene: '', style: '', budget: '' }
    },
    clearFiltersAndReload: function() {
      this.clearFilters()
      this.loadResults()
      uni.showToast({ title: '已清空筛选', icon: 'none' })
    },
    setCategory: function(key) {
      this.activeCategory = key
    },
    submitQuickSearch: function() {
      this.saveHistory(this.keyword)
      this.activeCategory = 'all'
      this.loadResults()
    },
    openResult: function(item) {
      if (!item) return
      if (item.kind === 'activity') {
        if (item.raw) activityStore.selectActivity(item.raw)
        uni.navigateTo({ url: '/pages/activity/index' })
        return
      }
      uni.navigateTo({ url: '/pages/detail/index?id=' + item.id })
    },
    goSearch: function() {
      uni.switchTab({ url: '/pages/search/index' })
    },
    goBack: function() {
      var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      if (pages && pages.length > 1) {
        uni.navigateBack({ delta: 1 })
        return
      }
      this.goSearch()
    }
  }
}
</script>

<style scoped>
.results-shell { min-height: 100vh; padding: 0 24rpx 80rpx; background: radial-gradient(circle at 8% 2%, rgba(255,213,103,0.18), transparent 24%), radial-gradient(circle at 92% 0%, rgba(68,165,255,0.16), transparent 28%), linear-gradient(180deg, #f7f8fa 0%, #f5f6f7 42%, #f8f3eb 100%); }
.results-shell::before { top: 120rpx; right: -70rpx; width: 220rpx; height: 220rpx; background: radial-gradient(circle, rgba(68,165,255,0.18) 0%, rgba(68,165,255,0) 72%); }
.results-shell::after { bottom: 180rpx; left: -100rpx; width: 260rpx; height: 260rpx; background: radial-gradient(circle, rgba(177,239,216,0.24) 0%, rgba(177,239,216,0) 72%); }
.results-topbar { position: fixed; top: 0; left: 24rpx; right: 24rpx; z-index: 30; display: grid; grid-template-columns: 64rpx minmax(0, 1fr); align-items: center; gap: 14rpx; padding-top: calc(var(--status-bar-height) + 16rpx); }
.results-top-btn { width: 64rpx; height: 64rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.84); box-shadow: 0 14rpx 28rpx rgba(44,47,48,0.08); backdrop-filter: blur(22rpx); color: #637381; font-size: 28rpx; font-weight: 700; }
.results-top-btn-active { background: rgba(0,94,159,0.12); color: #005e9f; }
.results-search-box { height: 72rpx; padding: 0 22rpx; border-radius: 26rpx; display: flex; align-items: center; gap: 14rpx; background: rgba(255,255,255,0.78); box-shadow: 0 14rpx 28rpx rgba(44,47,48,0.06); backdrop-filter: blur(24rpx); }
.results-search-mark { width: 34rpx; height: 34rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; background: rgba(0,94,159,0.08); color: #005e9f; font-size: 18rpx; font-weight: 800; flex-shrink: 0; }
.results-search-input { flex: 1; min-width: 0; color: #2c2f30; font-size: 28rpx; font-weight: 700; }
.results-content { padding-top: calc(var(--status-bar-height) + 112rpx); }
.results-summary-card { padding: 30rpx 28rpx 26rpx; border-radius: 34rpx; background: rgba(255,255,255,0.74); box-shadow: 0 18rpx 46rpx rgba(44,47,48,0.06); backdrop-filter: blur(20rpx); }
.results-summary-kicker { color: #7c7f88; font-size: 20rpx; font-weight: 700; letter-spacing: 4rpx; }
.results-summary-title { margin-top: 12rpx; color: #1f2937; font-size: 42rpx; font-weight: 800; line-height: 1.15; }
.results-summary-copy { margin-top: 10rpx; color: #64748b; font-size: 23rpx; line-height: 1.6; }
.results-summary-chip-row,.results-filter-chip-row,.results-card-badge-row { display: flex; flex-wrap: wrap; gap: 10rpx; }
.results-summary-chip { min-height: 48rpx; padding: 0 16rpx; border-radius: 999rpx; display: inline-flex; align-items: center; background: rgba(0,94,159,0.08); color: #1d5c4a; font-size: 20rpx; font-weight: 700; }
.results-tab-scroll { margin: 10rpx -24rpx 0; padding: 0 24rpx; white-space: nowrap; }
.results-tab-row { display: inline-flex; gap: 12rpx; }
.results-tab { min-width: 112rpx; height: 58rpx; padding: 0 24rpx; border-radius: 999rpx; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.92); color: #6b7280; font-size: 23rpx; font-weight: 700; box-shadow: 0 8rpx 22rpx rgba(44,47,48,0.04); }
.results-tab-active { background: linear-gradient(135deg, #005e9f 0%, #44a5ff 100%); color: #edf3ff; box-shadow: 0 18rpx 26rpx rgba(0,94,159,0.2); }
.results-filter-card,.results-state-card { margin-top: 18rpx; padding: 26rpx; border-radius: 30rpx; background: rgba(255,255,255,0.82); box-shadow: 0 18rpx 42rpx rgba(44,47,48,0.05); backdrop-filter: blur(20rpx); }
.results-filter-head,.results-state-actions,.results-card-footer { display: flex; align-items: flex-start; justify-content: space-between; gap: 14rpx; }
.results-filter-title,.results-state-title { color: #1f2937; font-size: 30rpx; font-weight: 800; }
.results-filter-copy,.results-state-copy,.results-filter-tip { margin-top: 8rpx; color: #7c7f88; font-size: 22rpx; line-height: 1.6; }
.results-filter-refresh { flex-shrink: 0; min-width: 84rpx; height: 48rpx; padding: 0 16rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; background: rgba(0,94,159,0.08); color: #005e9f; font-size: 20rpx; font-weight: 700; }
.results-filter-group { margin-top: 20rpx; }
.results-filter-label { margin-bottom: 12rpx; color: #1f2937; font-size: 24rpx; font-weight: 700; }
.results-filter-chip { min-height: 52rpx; padding: 0 18rpx; border-radius: 999rpx; display: inline-flex; align-items: center; justify-content: center; background: #ffffff; color: #6b7280; font-size: 21rpx; font-weight: 700; border: 1rpx solid rgba(171,173,174,0.28); }
.results-filter-chip-active { background: linear-gradient(135deg, rgba(0,94,159,0.14) 0%, rgba(68,165,255,0.18) 100%); color: #005e9f; border-color: rgba(0,94,159,0.22); }
.results-filter-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12rpx; margin-top: 24rpx; }
.results-filter-action,.results-state-action { height: 72rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 700; }
.results-filter-action-light,.results-state-action-light { background: rgba(224,227,228,0.72); color: #595c5d; }
.results-filter-action-primary,.results-state-action-primary { background: linear-gradient(135deg, #005e9f 0%, #44a5ff 100%); color: #edf3ff; box-shadow: 0 18rpx 28rpx rgba(0,94,159,0.18); }
.results-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; margin-top: 20rpx; }
.results-column { display: flex; flex-direction: column; gap: 16rpx; }
.results-card { overflow: hidden; border-radius: 30rpx; background: rgba(255,255,255,0.96); box-shadow: 0 12rpx 32rpx rgba(44,47,48,0.05); }
.results-card-media { position: relative; overflow: hidden; background: linear-gradient(145deg, #e6ebf2 0%, #f7f3ea 100%); }
.results-card-media-feature { height: 420rpx; }
.results-card-media-square { height: 314rpx; }
.results-card-media-landscape { height: 264rpx; }
.results-card-media-portrait { height: 364rpx; }
.results-card-media-image::after,.results-card-media-activity::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(12,15,16,0.06) 0%, rgba(12,15,16,0.56) 100%); }
.results-card-image { width: 100%; height: 100%; display: block; }
.results-card-fallback { display: flex; flex-direction: column; justify-content: flex-end; height: 100%; padding: 24rpx; background: radial-gradient(circle at 18% 20%, rgba(68,165,255,0.16), transparent 28%), linear-gradient(145deg, #f4efe7 0%, #f5f6f7 100%); }
.results-card-fallback-mark,.results-card-badge { min-height: 40rpx; padding: 0 14rpx; border-radius: 999rpx; display: inline-flex; align-items: center; justify-content: center; font-size: 18rpx; font-weight: 700; }
.results-card-fallback-mark,.results-card-badge { background: rgba(177,239,216,0.94); color: #1d5c4a; }
.results-card-badge-row { position: absolute; left: 14rpx; right: 14rpx; top: 14rpx; z-index: 3; }
.results-card-badge-light { background: rgba(255,255,255,0.18); color: rgba(255,255,255,0.94); backdrop-filter: blur(8rpx); }
.results-card-fallback-title,.results-card-overlay-title,.results-card-title { color: #2c2f30; font-size: 28rpx; font-weight: 800; line-height: 1.3; }
.results-card-overlay-copy { position: absolute; left: 16rpx; right: 16rpx; bottom: 16rpx; z-index: 3; }
.results-card-overlay-title { color: #ffffff; font-size: 30rpx; }
.results-card-overlay-meta { margin-top: 8rpx; color: rgba(255,255,255,0.82); font-size: 20rpx; line-height: 1.45; }
.results-card-body { padding: 18rpx 18rpx 20rpx; }
.results-card-desc { margin-top: 10rpx; color: #595c5d; font-size: 21rpx; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.results-card-user { display: flex; align-items: center; gap: 10rpx; min-width: 0; flex: 1; }
.results-card-user-copy { min-width: 0; }
.results-card-user-name { color: #2c2f30; font-size: 21rpx; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.results-card-user-meta { margin-top: 4rpx; color: #8a8d91; font-size: 18rpx; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.results-card-metric { flex-shrink: 0; color: #005e9f; font-size: 22rpx; font-weight: 800; }
.results-activity-art { position: relative; width: 100%; height: 100%; background: radial-gradient(circle at 20% 18%, rgba(255,255,255,0.16), transparent 24%), linear-gradient(135deg, #0f5c96 0%, #0a79c6 52%, #27a6ff 100%); }
.results-activity-mark { position: absolute; right: 20rpx; bottom: 18rpx; z-index: 2; width: 60rpx; height: 60rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.18); color: #ffffff; font-size: 28rpx; font-weight: 800; }
.results-activity-footer { margin-top: 16rpx; }
.results-activity-line { color: #2c2f30; font-size: 20rpx; font-weight: 700; line-height: 1.5; }
.results-activity-meta { margin-top: 6rpx; color: #7c7f88; font-size: 19rpx; line-height: 1.55; }
.results-activity-action { margin-top: 12rpx; min-width: 88rpx; height: 46rpx; padding: 0 14rpx; border-radius: 999rpx; display: inline-flex; align-items: center; justify-content: center; background: rgba(0,94,159,0.08); color: #005e9f; font-size: 19rpx; font-weight: 700; }
.results-end-state { padding: 34rpx 0 8rpx; color: #757778; font-size: 22rpx; line-height: 1.6; text-align: center; opacity: 0.48; }
.results-skeleton { border-radius: 30rpx; background: linear-gradient(110deg, rgba(255,255,255,0.9) 8%, rgba(240,243,245,0.96) 18%, rgba(255,255,255,0.9) 33%); background-size: 220% 100%; animation: resultsSkeleton 1.2s linear infinite; }
.results-skeleton-tall { height: 420rpx; }
.results-skeleton-short { height: 280rpx; }
@keyframes resultsSkeleton { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
</style>
