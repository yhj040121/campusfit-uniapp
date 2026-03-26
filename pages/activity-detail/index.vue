<template>
  <view class="page-shell activity-detail-shell">
    <view class="activity-detail-topbar">
      <view class="activity-detail-topbar-left">
        <view class="activity-detail-icon-button" @click="goBack">
          <text class="activity-detail-back-icon">←</text>
        </view>
        <text class="activity-detail-topbar-title">活动详情</text>
      </view>

      <view v-if="fromPublish" class="activity-detail-topbar-tag">发布选择</view>
    </view>

    <scroll-view class="activity-detail-scroll" scroll-y="true" show-scrollbar="false">
      <view class="activity-detail-content">
        <view v-if="detailLoading" class="activity-detail-skeleton-card">
          <view class="activity-detail-skeleton-cover"></view>
          <view class="activity-detail-skeleton-line title"></view>
          <view class="activity-detail-skeleton-line"></view>
          <view class="activity-detail-skeleton-line short"></view>
        </view>

        <view v-else-if="pageError || !currentActivity" class="activity-detail-status-card">
          <view class="activity-detail-status-title">活动加载失败</view>
          <view class="activity-detail-status-copy">请稍后再试，或点击下方重新获取活动详情。</view>
          <button class="activity-detail-primary-button" @click="manualRefresh">重新加载</button>
        </view>

        <view v-else>
          <view :class="['activity-detail-hero', heroToneClass]">
            <view class="activity-detail-hero-glow activity-detail-hero-glow-one"></view>
            <view class="activity-detail-hero-glow activity-detail-hero-glow-two"></view>

            <view class="activity-detail-hero-top">
              <view :class="['activity-detail-status-pill', statusClass]">
                {{ currentActivity.status || '活动中' }}
              </view>
              <view :class="['activity-detail-selectable-pill', currentActivity.selectable === false ? 'activity-detail-selectable-pill-muted' : '']">
                {{ currentActivity.selectable === false ? '发布不可选' : '发布可选' }}
              </view>
            </view>

            <view class="activity-detail-hero-badge">{{ currentActivity.badge || '校园活动' }}</view>
            <view class="activity-detail-hero-title">{{ currentActivity.title || '未命名活动' }}</view>
            <view class="activity-detail-hero-scene">{{ currentActivity.scene || currentActivity.theme || 'Campus Activity' }}</view>
          </view>

          <view class="activity-detail-panel">
            <view class="activity-detail-meta-row">
              <view class="activity-detail-meta-item">{{ currentActivity.period || '待更新时间' }}</view>
              <view class="activity-detail-meta-item">{{ entriesText }}</view>
              <view class="activity-detail-meta-item">{{ heatText }}</view>
            </view>
            <view class="activity-detail-summary">{{ currentActivity.summary || currentActivity.theme || '暂无活动说明。' }}</view>
          </view>

          <view v-if="fromPublish" class="activity-detail-tip-card">
            <view class="activity-detail-tip-kicker">发布说明</view>
            <view class="activity-detail-tip-copy">
              {{ currentActivity.selectable === false ? '这个活动当前不出现在发布选择列表中，请改选其他活动。' : '选择后会回到发布页，并把当前内容关联到这个活动专题。' }}
            </view>
          </view>

          <view class="activity-detail-section">
            <view class="activity-detail-section-title">活动简介</view>
            <view class="activity-detail-section-copy">{{ currentActivity.theme || currentActivity.summary || '暂无活动简介。' }}</view>
          </view>

          <view class="activity-detail-section">
            <view class="activity-detail-section-title">参与方式</view>
            <view class="activity-detail-section-copy">{{ currentActivity.participation || '暂无参与方式说明。' }}</view>
          </view>

          <view class="activity-detail-section">
            <view class="activity-detail-section-title">奖励说明</view>
            <view class="activity-detail-section-copy">{{ currentActivity.reward || '暂无奖励说明。' }}</view>
          </view>

          <view class="activity-detail-section">
            <view class="activity-detail-section-title">活动进展</view>
            <view class="activity-detail-section-copy">{{ currentActivity.progressText || currentActivity.statusCopy || '活动状态将持续更新。' }}</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="!detailLoading && currentActivity && (canToggleJoin || fromPublish)" class="activity-detail-actions">
      <button
        v-if="canToggleJoin"
        class="activity-detail-secondary-button"
        :disabled="actionLoading"
        :class="actionLoading ? 'activity-detail-button-loading' : ''"
        @click="toggleJoin"
      >
        {{ joinButtonText }}
      </button>

      <button
        v-if="fromPublish"
        class="activity-detail-primary-button"
        :disabled="!canSelectForPublish || actionLoading"
        :class="(!canSelectForPublish || actionLoading) ? 'activity-detail-button-disabled' : ''"
        @click="selectForPublish"
      >
        {{ selectButtonText }}
      </button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var activityStore = require('../../common/activity.js')

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
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

export default {
  data: function() {
    return {
      activityId: '',
      fromPublish: false,
      currentActivity: null,
      detailLoading: false,
      pageError: false,
      actionLoading: false
    }
  },
  computed: {
    statusCategory: function() {
      return resolveStatusCategory(this.currentActivity && this.currentActivity.status)
    },
    statusClass: function() {
      if (this.statusCategory === 'finished') {
        return 'activity-detail-status-pill-finished'
      }
      if (this.statusCategory === 'recruiting') {
        return 'activity-detail-status-pill-recruiting'
      }
      return 'activity-detail-status-pill-active'
    },
    heroToneClass: function() {
      if (this.statusCategory === 'finished') {
        return 'activity-detail-hero-slate'
      }
      if (this.statusCategory === 'recruiting') {
        return 'activity-detail-hero-green'
      }
      return 'activity-detail-hero-blue'
    },
    entriesText: function() {
      var count = Number(this.currentActivity && this.currentActivity.entries || 0)
      return count + ' 人参与'
    },
    heatText: function() {
      var heat = Number(this.currentActivity && this.currentActivity.heat || 0)
      return '热度 ' + heat
    },
    canToggleJoin: function() {
      return !!(this.currentActivity && this.statusCategory !== 'finished')
    },
    joinButtonText: function() {
      if (!this.currentActivity) {
        return '活动操作'
      }
      return this.currentActivity.joined ? '退出活动' : '立即报名'
    },
    canSelectForPublish: function() {
      return !!(this.currentActivity && this.currentActivity.selectable !== false && this.statusCategory !== 'finished')
    },
    selectButtonText: function() {
      if (!this.currentActivity) {
        return '选择活动'
      }
      if (this.statusCategory === 'finished') {
        return '活动已结束'
      }
      if (this.currentActivity.selectable === false) {
        return '当前不可在发布时选择'
      }
      return '选择该活动'
    }
  },
  onLoad: function(options) {
    this.activityId = options && options.id ? String(options.id) : ''
    this.fromPublish = !!(options && String(options.pick || '') === '1')
  },
  onShow: function() {
    this.loadDetail(false)
  },
  methods: {
    loadDetail: function(showToast) {
      var self = this
      if (!self.activityId) {
        self.currentActivity = null
        self.pageError = true
        return
      }
      self.detailLoading = true
      self.pageError = false
      api.getActivityDetail(self.activityId)
        .then(function(activity) {
          self.currentActivity = activity || null
          self.pageError = !activity
          if (showToast) {
            uni.showToast({ title: '活动详情已刷新', icon: 'none' })
          }
        })
        .catch(function(error) {
          self.currentActivity = null
          self.pageError = true
          if (showToast) {
            uni.showToast({ title: error.message || '活动详情加载失败', icon: 'none' })
          }
        })
        .finally(function() {
          self.detailLoading = false
        })
    },
    manualRefresh: function() {
      this.loadDetail(true)
    },
    toggleJoin: function() {
      var self = this
      if (!self.currentActivity || self.actionLoading || self.statusCategory === 'finished') {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('登录后才能报名或退出活动。')
        return
      }
      self.actionLoading = true
      api.toggleActivityJoin(self.currentActivity.id)
        .then(function(updated) {
          self.currentActivity = updated
          var selected = activityStore.getSelectedActivity()
          if (selected && selected.id === updated.id) {
            activityStore.selectActivity(updated)
          }
          uni.showToast({ title: updated.joined ? '已报名活动' : '已退出活动', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.promptLogin('登录状态已失效，请重新登录。')
            return
          }
          uni.showToast({ title: error.message || '活动状态更新失败', icon: 'none' })
        })
        .finally(function() {
          self.actionLoading = false
        })
    },
    selectForPublish: function() {
      if (!this.canSelectForPublish || !this.currentActivity) {
        return
      }
      activityStore.selectActivity(this.currentActivity)
      uni.showToast({ title: '已选择活动', icon: 'none' })
      setTimeout(function() {
        uni.switchTab({ url: '/pages/publish/index' })
      }, 220)
    },
    goBack: function() {
      var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      if (pages && pages.length > 1) {
        uni.navigateBack({ delta: 1 })
        return
      }
      if (this.fromPublish) {
        uni.switchTab({ url: '/pages/publish/index' })
        return
      }
      uni.switchTab({ url: '/pages/index/index' })
    },
    promptLogin: function(message) {
      uni.showModal({
        title: '需要登录',
        content: message,
        confirmText: '去登录',
        cancelText: '稍后',
        success: function(result) {
          if (result.confirm) {
            uni.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.activity-detail-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(68, 165, 255, 0.18), transparent 30%),
    linear-gradient(180deg, #f7fbff 0%, #f4f6f8 48%, #edf3fa 100%);
}

.activity-detail-shell::before,
.activity-detail-shell::after {
  display: none;
}

.activity-detail-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: calc(env(safe-area-inset-top) + 18rpx) 24rpx 18rpx;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20rpx);
  box-shadow: 0 14rpx 32rpx rgba(15, 23, 42, 0.05);
}

.activity-detail-topbar-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
}

.activity-detail-icon-button {
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.08);
  flex-shrink: 0;
}

.activity-detail-back-icon {
  color: #2c2f30;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1;
}

.activity-detail-topbar-title {
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 800;
}

.activity-detail-topbar-tag {
  min-height: 56rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  font-size: 22rpx;
  font-weight: 700;
}

.activity-detail-scroll {
  height: 100vh;
}

.activity-detail-content {
  padding: calc(env(safe-area-inset-top) + 112rpx) 24rpx calc(194rpx + env(safe-area-inset-bottom));
}

.activity-detail-hero,
.activity-detail-panel,
.activity-detail-tip-card,
.activity-detail-section,
.activity-detail-status-card,
.activity-detail-skeleton-card {
  overflow: hidden;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 20rpx 46rpx rgba(15, 23, 42, 0.07);
}

.activity-detail-hero {
  position: relative;
  min-height: 360rpx;
  padding: 28rpx;
  color: #ffffff;
}

.activity-detail-hero-blue {
  background: linear-gradient(135deg, #0f5fd7 0%, #1484f2 58%, #3bc2ff 100%);
}

.activity-detail-hero-green {
  background: linear-gradient(135deg, #0e6c61 0%, #20a489 58%, #5ed7b2 100%);
}

.activity-detail-hero-slate {
  background: linear-gradient(135deg, #334155 0%, #475569 58%, #64748b 100%);
}

.activity-detail-hero-glow {
  position: absolute;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.16);
}

.activity-detail-hero-glow-one {
  width: 220rpx;
  height: 220rpx;
  top: -80rpx;
  right: -40rpx;
}

.activity-detail-hero-glow-two {
  width: 160rpx;
  height: 160rpx;
  left: -30rpx;
  bottom: -34rpx;
}

.activity-detail-hero-top,
.activity-detail-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rpx;
}

.activity-detail-status-pill,
.activity-detail-selectable-pill,
.activity-detail-meta-item {
  min-height: 44rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 700;
}

.activity-detail-status-pill-active {
  background: rgba(177, 239, 216, 0.95);
  color: #1d5c4a;
}

.activity-detail-status-pill-recruiting {
  background: rgba(255, 242, 212, 0.96);
  color: #705900;
}

.activity-detail-status-pill-finished {
  background: rgba(224, 227, 228, 0.92);
  color: #667085;
}

.activity-detail-selectable-pill {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.activity-detail-selectable-pill-muted {
  background: rgba(15, 23, 42, 0.18);
  color: rgba(255, 255, 255, 0.88);
}

.activity-detail-hero-badge {
  margin-top: 138rpx;
  display: inline-flex;
  min-height: 44rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  font-size: 20rpx;
  font-weight: 700;
}

.activity-detail-hero-title {
  margin-top: 18rpx;
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1.2;
}

.activity-detail-hero-scene {
  margin-top: 14rpx;
  color: rgba(255, 255, 255, 0.9);
  font-size: 24rpx;
  line-height: 1.6;
}

.activity-detail-panel,
.activity-detail-tip-card,
.activity-detail-section,
.activity-detail-status-card,
.activity-detail-skeleton-card {
  margin-top: 20rpx;
  padding: 28rpx;
}

.activity-detail-meta-item {
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
}

.activity-detail-summary,
.activity-detail-tip-copy,
.activity-detail-section-copy,
.activity-detail-status-copy {
  margin-top: 16rpx;
  color: #475467;
  font-size: 24rpx;
  line-height: 1.75;
}

.activity-detail-tip-card {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(143, 230, 194, 0.16));
}

.activity-detail-tip-kicker,
.activity-detail-section-title,
.activity-detail-status-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 800;
}

.activity-detail-tip-kicker {
  color: #2563eb;
}

.activity-detail-status-card {
  text-align: center;
}

.activity-detail-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  gap: 14rpx;
  padding: 18rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(24rpx);
  box-shadow: 0 -14rpx 30rpx rgba(15, 23, 42, 0.06);
}

.activity-detail-primary-button,
.activity-detail-secondary-button {
  flex: 1;
  min-height: 92rpx;
  margin: 0;
  border: 0;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
}

.activity-detail-primary-button {
  background: linear-gradient(135deg, #005e9f 0%, #2498f5 58%, #7ec9ff 100%);
  color: #edf3ff;
  box-shadow: 0 18rpx 34rpx rgba(37, 99, 235, 0.18);
}

.activity-detail-secondary-button {
  background: #eef4ff;
  color: #2563eb;
}

.activity-detail-button-loading {
  opacity: 0.66;
}

.activity-detail-button-disabled {
  opacity: 0.56;
  box-shadow: none;
}

.activity-detail-skeleton-cover,
.activity-detail-skeleton-line {
  background: linear-gradient(90deg, rgba(236, 240, 244, 0.96) 0%, rgba(247, 249, 252, 1) 50%, rgba(236, 240, 244, 0.96) 100%);
}

.activity-detail-skeleton-cover {
  height: 300rpx;
  border-radius: 26rpx;
}

.activity-detail-skeleton-line {
  height: 24rpx;
  margin-top: 16rpx;
  border-radius: 12rpx;
}

.activity-detail-skeleton-line.title {
  width: 70%;
  height: 36rpx;
  margin-top: 22rpx;
}

.activity-detail-skeleton-line.short {
  width: 54%;
}
</style>
