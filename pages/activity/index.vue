<template>
  <view class="page-shell activity-shell">
    <view class="activity-topbar">
      <view class="activity-topbar-left">
        <view class="activity-icon-button" @click="goBack">
          <text class="activity-back-icon">←</text>
        </view>
        <text class="activity-topbar-title">活动中心</text>
      </view>
    </view>

    <view class="activity-content">
      <scroll-view class="activity-filter-scroll" scroll-x="true" show-scrollbar="false">
        <view class="activity-filter-row">
          <view
            v-for="item in filterTabs"
            :key="item"
            :class="['activity-filter-chip', activeFilter === item ? 'activity-filter-chip-active' : '']"
            @click="activeFilter = item"
          >
            {{ item }}
          </view>
        </view>
      </scroll-view>

      <view class="activity-summary-row">
        <view class="activity-summary-copy">共 {{ activities.length }} 个活动，已参与 {{ myStats.joinedCount }} 个</view>
        <view class="activity-summary-link" @click="goMyActivities">查看我的活动</view>
      </view>

      <view v-if="activityLoading" class="activity-list">
        <view v-for="item in 3" :key="'activity-skeleton-' + item" class="activity-skeleton-card">
          <view class="activity-skeleton-cover"></view>
          <view class="activity-skeleton-line title"></view>
          <view class="activity-skeleton-line"></view>
          <view class="activity-skeleton-line short"></view>
        </view>
      </view>

      <view v-else-if="pageError" class="activity-status-card">
        <view class="activity-status-title">活动加载失败</view>
        <view class="activity-status-copy">请稍后再试，或点击下方重新获取活动列表。</view>
        <button class="activity-status-button" @click="manualRefresh">重新加载</button>
      </view>

      <view v-else-if="filteredActivities.length" class="activity-list">
        <view
          v-if="featuredActivity"
          :class="['activity-feature-card', getCardStateClass(featuredActivity)]"
          @click="goActivityDetail(featuredActivity)"
        >
          <view :class="['activity-feature-cover', featuredActivity.coverClass]">
            <view class="activity-feature-glow activity-feature-glow-one"></view>
            <view class="activity-feature-glow activity-feature-glow-two"></view>

            <view class="activity-feature-top">
              <view :class="['activity-status-pill', getStatusClass(featuredActivity)]">
                {{ featuredActivity.status || '无' }}
              </view>
            </view>

            <view class="activity-feature-tag">{{ featuredActivity.badgeText }}</view>
            <view class="activity-feature-scene">{{ featuredActivity.sceneText }}</view>
          </view>

          <view class="activity-feature-body">
            <view class="activity-feature-title">{{ featuredActivity.title || '无' }}</view>
            <view class="activity-meta-row">
              <view class="activity-meta-item">{{ featuredActivity.periodText }}</view>
              <view class="activity-meta-item">{{ featuredActivity.entriesText }}</view>
            </view>
            <view class="activity-feature-copy">{{ featuredActivity.summaryText }}</view>
            <view class="activity-detail-row">
              <view class="activity-list-stats">{{ featuredActivity.progressText || featuredActivity.entriesText }}</view>
              <view class="activity-enter-link">查看详情</view>
            </view>
          </view>
        </view>

        <view
          v-for="item in secondaryActivities"
          :key="item.id"
          :class="['activity-list-card', getCardStateClass(item)]"
          @click="goActivityDetail(item)"
        >
          <view :class="['activity-list-cover', item.coverClass]">
            <view class="activity-list-cover-overlay"></view>
            <view class="activity-list-cover-badge">{{ item.badgeText }}</view>
            <view class="activity-list-cover-scene">{{ item.sceneText }}</view>
          </view>

          <view class="activity-list-body">
            <view class="activity-list-head">
              <view class="activity-list-title">{{ item.title || '无' }}</view>
              <view :class="['activity-status-pill', getStatusClass(item)]">{{ item.status || '无' }}</view>
            </view>

            <view class="activity-list-info">{{ item.periodText }}</view>
            <view class="activity-list-info">{{ item.rewardText }}</view>
            <view class="activity-list-copy">{{ item.summaryText }}</view>

            <view class="activity-list-foot">
              <view class="activity-list-stats">{{ item.progressText || item.entriesText }}</view>
              <view class="activity-enter-link">查看详情</view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="activity-empty-state">
        <view class="activity-empty-icon">活</view>
        <view class="activity-empty-title">无</view>
        <view class="activity-empty-copy">当前筛选下没有可展示的活动</view>
        <button class="activity-empty-button" @click="manualRefresh">刷新活动列表</button>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

var FILTER_ALL = '全部'
var FILTER_HOT = '热门'
var FILTER_ACTIVE = '进行中'
var FILTER_FINISHED = '已结束'
var FILTER_TABS = [FILTER_ALL, FILTER_HOT, FILTER_ACTIVE, FILTER_FINISHED]
var COVER_CLASSES = [
  'activity-cover-tone-blue',
  'activity-cover-tone-green',
  'activity-cover-tone-amber',
  'activity-cover-tone-slate'
]

function defaultStats() {
  return {
    joinedCount: 0,
    ongoingCount: 0
  }
}

function safeText(value, fallback) {
  var text = String(value || '').trim()
  return text || (fallback || '无')
}

function formatCount(value) {
  var count = Number(value || 0)
  if (!count) {
    return '0'
  }
  if (count >= 10000) {
    return (count / 10000).toFixed(count >= 100000 ? 0 : 1) + '万'
  }
  return String(count)
}

function resolveStatusCategory(status) {
  var text = String(status || '').trim()
  if (text.indexOf('结束') > -1) {
    return 'finished'
  }
  if (text.indexOf('招募') > -1) {
    return 'recruiting'
  }
  return 'active'
}

function normalizeActivities(list) {
  return (list || []).map(function(item, index) {
    var statusCategory = resolveStatusCategory(item.status)
    return Object.assign({}, item, {
      badgeText: safeText(item.badge, '活动'),
      sceneText: safeText(item.scene, '校园活动'),
      periodText: '周期：' + safeText(item.period, '无'),
      rewardText: '奖励：' + safeText(item.reward, '无'),
      entriesText: formatCount(item.entries) + ' 人参与',
      summaryText: safeText(item.summary || item.theme, '无'),
      statusCategory: statusCategory,
      coverClass: COVER_CLASSES[index % COVER_CLASSES.length]
    })
  })
}

function sortHotActivities(list) {
  return (list || []).slice(0).sort(function(a, b) {
    return Number(b.heat || 0) - Number(a.heat || 0)
  })
}

export default {
  data: function() {
    return {
      fromPublish: false,
      activities: [],
      activityLoading: false,
      pageError: false,
      myStats: defaultStats(),
      activeFilter: FILTER_ALL
    }
  },
  computed: {
    filterTabs: function() {
      return FILTER_TABS
    },
    normalizedActivities: function() {
      return normalizeActivities(this.activities)
    },
    filteredActivities: function() {
      var list = this.normalizedActivities
      if (this.activeFilter === FILTER_HOT) {
        return sortHotActivities(list)
      }
      if (this.activeFilter === FILTER_ACTIVE) {
        return list.filter(function(item) {
          return item.statusCategory !== 'finished'
        })
      }
      if (this.activeFilter === FILTER_FINISHED) {
        return list.filter(function(item) {
          return item.statusCategory === 'finished'
        })
      }
      return list
    },
    featuredActivity: function() {
      return this.filteredActivities.length ? this.filteredActivities[0] : null
    },
    secondaryActivities: function() {
      return this.filteredActivities.length > 1 ? this.filteredActivities.slice(1) : []
    }
  },
  onLoad: function(options) {
    this.fromPublish = !!(options && String(options.pick || '') === '1')
  },
  onShow: function() {
    this.refreshState(false)
  },
  methods: {
    refreshState: function(showToast) {
      var self = this
      self.activityLoading = true
      self.pageError = false

      var tasks = [api.listActivities()]
      if (session.isLoggedIn()) {
        tasks.push(api.getMyActivitySummary())
      } else {
        tasks.push(Promise.resolve(defaultStats()))
      }

      Promise.all(tasks)
        .then(function(result) {
          self.activities = result[0] || []
          self.myStats = result[1] || defaultStats()
          self.pageError = false
          if (showToast) {
            uni.showToast({ title: '活动列表已刷新', icon: 'none' })
          }
        })
        .catch(function(error) {
          self.activities = []
          self.myStats = defaultStats()
          self.pageError = true
          if (showToast) {
            uni.showToast({ title: error.message || '活动加载失败', icon: 'none' })
          }
        })
        .finally(function() {
          self.activityLoading = false
        })
    },
    getStatusClass: function(item) {
      if (!item || item.statusCategory === 'finished') {
        return 'activity-status-pill-finished'
      }
      if (item.statusCategory === 'recruiting') {
        return 'activity-status-pill-recruiting'
      }
      return 'activity-status-pill-active'
    },
    getCardStateClass: function(item) {
      if (!item || item.statusCategory !== 'finished') {
        return ''
      }
      return 'activity-card-finished'
    },
    goBack: function() {
      var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      if (pages && pages.length > 1) {
        uni.navigateBack({ delta: 1 })
        return
      }
      uni.switchTab({ url: '/pages/index/index' })
    },
    goActivityDetail: function(item) {
      if (!item || !item.id) {
        return
      }
      var query = '?id=' + encodeURIComponent(item.id)
      if (this.fromPublish) {
        query += '&pick=1'
      }
      uni.navigateTo({ url: '/pages/activity-detail/index' + query })
    },
    goMyActivities: function() {
      uni.navigateTo({ url: '/pages/my-activity/index' })
    },
    manualRefresh: function() {
      this.refreshState(true)
    }
  }
}
</script>

<style scoped>
.activity-shell {
  min-height: 100vh;
  padding: 0 0 48rpx;
  background: #f5f6f7;
}

.activity-shell::before,
.activity-shell::after {
  display: none;
}

.activity-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 18rpx) 24rpx 18rpx;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18rpx);
  box-shadow: 0 12rpx 32rpx rgba(44, 47, 48, 0.05);
}

.activity-topbar-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
}

.activity-icon-button {
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-back-icon {
  color: #2c2f30;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1;
}

.activity-topbar-title {
  color: #2563eb;
  font-size: 32rpx;
  font-weight: 800;
  letter-spacing: -0.8rpx;
}

.activity-content {
  padding: calc(env(safe-area-inset-top) + 110rpx) 24rpx 0;
}

.activity-filter-scroll {
  width: 100%;
  white-space: nowrap;
}

.activity-filter-row {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 6rpx 4rpx 10rpx;
}

.activity-filter-chip {
  min-height: 70rpx;
  padding: 0 30rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #6b7280;
  font-size: 24rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.05);
}

.activity-filter-chip-active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 14rpx 28rpx rgba(37, 99, 235, 0.2);
}

.activity-inline-card {
  margin-top: 18rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(143, 230, 194, 0.14) 100%);
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
}

.activity-inline-main {
  min-width: 0;
}

.activity-inline-kicker {
  color: #2563eb;
  font-size: 20rpx;
  font-weight: 700;
}

.activity-inline-title {
  margin-top: 10rpx;
  color: #111827;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.35;
}

.activity-inline-copy {
  margin-top: 8rpx;
  color: #667085;
  font-size: 22rpx;
  line-height: 1.6;
}

.activity-inline-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 18rpx;
}

.activity-inline-link,
.activity-summary-link {
  color: #2563eb;
  font-size: 22rpx;
  font-weight: 700;
}

.activity-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 22rpx;
  margin-bottom: 18rpx;
}

.activity-summary-copy {
  color: #667085;
  font-size: 22rpx;
  line-height: 1.5;
}

.activity-list {
  display: grid;
  gap: 24rpx;
}

.activity-feature-card,
.activity-list-card,
.activity-status-card,
.activity-empty-state,
.activity-skeleton-card {
  overflow: hidden;
  border-radius: 34rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.06);
}

.activity-feature-card,
.activity-list-card {
  position: relative;
}

.activity-card-finished {
  opacity: 0.78;
  filter: grayscale(0.15);
}

.activity-feature-cover {
  position: relative;
  overflow: hidden;
  height: 340rpx;
  padding: 26rpx;
}

.activity-feature-glow {
  position: absolute;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
}

.activity-feature-glow-one {
  width: 220rpx;
  height: 220rpx;
  top: -80rpx;
  right: -40rpx;
}

.activity-feature-glow-two {
  width: 160rpx;
  height: 160rpx;
  bottom: -40rpx;
  left: -30rpx;
  background: rgba(255, 255, 255, 0.12);
}

.activity-cover-tone-blue {
  background: linear-gradient(135deg, #0f5fd7 0%, #1484f2 58%, #3bc2ff 100%);
}

.activity-cover-tone-green {
  background: linear-gradient(135deg, #0e6c61 0%, #20a489 58%, #5ed7b2 100%);
}

.activity-cover-tone-amber {
  background: linear-gradient(135deg, #8b5a10 0%, #d48b1a 58%, #f4c148 100%);
}

.activity-cover-tone-slate {
  background: linear-gradient(135deg, #334155 0%, #475569 58%, #64748b 100%);
}

.activity-feature-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14rpx;
}

.activity-status-pill,
.activity-reward-pill,
.activity-list-cover-badge {
  min-height: 42rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: 700;
}

.activity-status-pill {
  min-width: 92rpx;
  padding: 0 22rpx;
  white-space: nowrap;
  word-break: keep-all;
  line-height: 1;
  flex-shrink: 0;
  text-align: center;
}

.activity-feature-top .activity-status-pill,
.activity-feature-tag {
  width: 124rpx;
  min-height: 44rpx;
  padding: 0;
  font-size: 18rpx;
  line-height: 1;
}

.activity-status-pill-active {
  background: rgba(177, 239, 216, 0.95);
  color: #1d5c4a;
}

.activity-status-pill-recruiting {
  background: rgba(255, 242, 212, 0.96);
  color: #705900;
}

.activity-status-pill-finished {
  background: rgba(224, 227, 228, 0.92);
  color: #667085;
}

.activity-reward-pill {
  background: rgba(255, 255, 255, 0.92);
  color: #8b5a10;
}

.activity-feature-tag {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 136rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-weight: 700;
}

.activity-feature-scene {
  position: relative;
  z-index: 1;
  margin-top: 16rpx;
  color: rgba(255, 255, 255, 0.96);
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.18;
}

.activity-feature-body {
  padding: 28rpx;
}

.activity-feature-title {
  color: #1f2937;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.35;
}

.activity-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  margin-top: 14rpx;
}

.activity-meta-item,
.activity-list-info,
.activity-list-stats {
  color: #667085;
  font-size: 22rpx;
  line-height: 1.5;
}

.activity-feature-copy,
.activity-list-copy {
  margin-top: 14rpx;
  color: #475467;
  font-size: 23rpx;
  line-height: 1.7;
}

.activity-detail-row,
.activity-list-foot {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 22rpx;
}

.activity-detail-row {
  justify-content: space-between;
}

.activity-primary-button,
.activity-secondary-button,
.activity-status-button,
.activity-empty-button,
.activity-link-button {
  margin: 0;
  border: 0;
  border-radius: 22rpx;
  font-weight: 700;
}

.activity-primary-button,
.activity-status-button,
.activity-empty-button {
  flex: 1;
  min-height: 84rpx;
  background: #2563eb;
  color: #ffffff;
  font-size: 26rpx;
}

.activity-secondary-button {
  min-width: 190rpx;
  min-height: 84rpx;
  background: #eef4ff;
  color: #2563eb;
  font-size: 24rpx;
}

.activity-button-loading {
  opacity: 0.6;
}

.activity-button-disabled {
  background: #dadddf;
  color: #98a2b3;
}

.activity-list-card {
  display: flex;
  min-height: 272rpx;
}

.activity-list-cover {
  position: relative;
  width: 238rpx;
  flex-shrink: 0;
  overflow: hidden;
}

.activity-list-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(12, 15, 16, 0.05) 0%, rgba(12, 15, 16, 0.18) 100%);
}

.activity-list-cover-badge {
  position: absolute;
  top: 18rpx;
  left: 18rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #2563eb;
}

.activity-list-cover-scene {
  position: absolute;
  left: 18rpx;
  right: 18rpx;
  bottom: 20rpx;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.35;
}

.activity-list-body {
  flex: 1;
  min-width: 0;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
}

.activity-list-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.activity-list-title {
  flex: 1;
  min-width: 0;
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.35;
}

.activity-list-info {
  margin-top: 8rpx;
}

.activity-list-copy {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-list-foot {
  margin-top: auto;
  justify-content: space-between;
}

.activity-enter-link {
  color: #2563eb;
  font-size: 22rpx;
  font-weight: 700;
}

.activity-list-actions {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.activity-link-button {
  min-width: 128rpx;
  min-height: 64rpx;
  padding: 0 20rpx;
  background: #eff1f2;
  color: #475467;
  font-size: 22rpx;
}

.activity-link-button-primary {
  background: #2563eb;
  color: #ffffff;
}

.activity-empty-state,
.activity-status-card {
  padding: 40rpx 28rpx;
  text-align: center;
}

.activity-empty-icon {
  width: 112rpx;
  height: 112rpx;
  margin: 0 auto;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff1f2;
  color: #98a2b3;
  font-size: 38rpx;
  font-weight: 800;
}

.activity-empty-title,
.activity-status-title {
  margin-top: 20rpx;
  color: #111827;
  font-size: 30rpx;
  font-weight: 800;
}

.activity-empty-copy,
.activity-status-copy {
  margin-top: 12rpx;
  color: #667085;
  font-size: 23rpx;
  line-height: 1.7;
}

.activity-empty-button,
.activity-status-button {
  width: 100%;
  margin-top: 24rpx;
}

.activity-skeleton-card {
  padding: 24rpx;
}

.activity-skeleton-cover,
.activity-skeleton-line {
  background: linear-gradient(90deg, rgba(236, 240, 244, 0.96) 0%, rgba(247, 249, 252, 1) 50%, rgba(236, 240, 244, 0.96) 100%);
}

.activity-skeleton-cover {
  height: 280rpx;
  border-radius: 28rpx;
}

.activity-skeleton-line {
  height: 24rpx;
  margin-top: 16rpx;
  border-radius: 12rpx;
}

.activity-skeleton-line.title {
  width: 78%;
  height: 34rpx;
  margin-top: 22rpx;
}

.activity-skeleton-line.short {
  width: 56%;
}

@media screen and (max-width: 720px) {
  .activity-list-card {
    flex-direction: column;
  }

  .activity-list-cover {
    width: 100%;
    height: 220rpx;
  }

  .activity-list-foot {
    flex-direction: column;
    align-items: stretch;
  }

  .activity-list-actions {
    width: 100%;
  }

  .activity-link-button {
    flex: 1;
  }
}

@media screen and (min-width: 768px) {
  .activity-content {
    max-width: 860rpx;
    margin: 0 auto;
  }
}
</style>
