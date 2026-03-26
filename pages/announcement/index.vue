<template>
  <view class="page-shell announcement-shell">
    <view class="announcement-topbar">
      <view class="announcement-topbar-left">
        <view class="announcement-icon-button" @click="goBack">
          <text class="announcement-back-icon">←</text>
        </view>
        <text class="announcement-topbar-title">官方公告</text>
      </view>

      <view class="announcement-icon-button" @click="showSearchHint">
        <view class="announcement-search-icon">
          <view class="announcement-search-lens"></view>
          <view class="announcement-search-handle"></view>
        </view>
      </view>
    </view>

    <view class="announcement-content">
      <view v-if="loading" class="announcement-timeline">
        <view class="announcement-timeline-line"></view>

        <view
          v-for="item in 3"
          :key="'announcement-skeleton-' + item"
          class="announcement-item"
        >
          <view class="announcement-node announcement-node-skeleton"></view>
          <view class="announcement-card announcement-card-skeleton">
            <view class="announcement-skeleton-row">
              <view class="announcement-skeleton-chip"></view>
              <view class="announcement-skeleton-time"></view>
            </view>
            <view class="announcement-skeleton-title"></view>
            <view class="announcement-skeleton-line"></view>
            <view class="announcement-skeleton-line"></view>
            <view class="announcement-skeleton-line short"></view>
          </view>
        </view>
      </view>

      <view v-else-if="loadFailed" class="announcement-status-card">
        <view class="announcement-status-title">公告加载失败</view>
        <view class="announcement-status-copy">{{ statusText }}</view>
        <button class="announcement-status-button" @click="loadAnnouncements">重新加载</button>
      </view>

      <view v-else-if="displayItems.length" class="announcement-timeline">
        <view class="announcement-timeline-line"></view>

        <view
          v-for="item in displayItems"
          :key="item.id"
          class="announcement-item"
        >
          <view :class="['announcement-node', item.nodeClass]">
            <text class="announcement-node-text">{{ item.iconText }}</text>
          </view>

          <view :class="['announcement-card', item.highlighted ? 'announcement-card-highlighted' : '']">
            <view class="announcement-chip-row">
              <view :class="['announcement-chip', item.badgeClass]">{{ item.badgeText }}</view>
              <view class="announcement-date">{{ item.publishTime || '无' }}</view>
            </view>

            <view class="announcement-title">{{ item.title || '无' }}</view>
            <view class="announcement-summary">{{ item.summary || '无' }}</view>

            <view
              v-if="item.content && item.content !== item.summary"
              class="announcement-body"
            >{{ item.content }}</view>

            <view class="announcement-footer">
              <view class="announcement-footer-label">有效期</view>
              <view class="announcement-footer-value">{{ item.expireTime || '长期有效' }}</view>
            </view>
          </view>
        </view>

        <view class="announcement-end">
          <view class="announcement-end-dot"></view>
          <view class="announcement-end-copy">没有更多公告了</view>
        </view>
      </view>

      <view v-else class="announcement-status-card">
        <view class="announcement-status-title">无</view>
        <view class="announcement-status-copy">当前没有可展示的公告</view>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')

function resolveToneByBadge(badge) {
  var text = String(badge || '').trim()
  if (text.indexOf('重要') > -1) {
    return {
      iconText: '!',
      nodeClass: 'announcement-node-danger',
      badgeClass: 'announcement-chip-danger'
    }
  }
  if (text.indexOf('活动') > -1) {
    return {
      iconText: '动',
      nodeClass: 'announcement-node-primary',
      badgeClass: 'announcement-chip-mint'
    }
  }
  if (text.indexOf('资讯') > -1 || text.indexOf('通知') > -1) {
    return {
      iconText: '讯',
      nodeClass: 'announcement-node-neutral',
      badgeClass: 'announcement-chip-neutral'
    }
  }
  return {
    iconText: '公',
    nodeClass: 'announcement-node-primary',
    badgeClass: 'announcement-chip-primary'
  }
}

function normalizeAnnouncements(list, currentId) {
  var selectedId = String(currentId || '')
  return (list || []).map(function(item) {
    var tone = resolveToneByBadge(item && item.badge)
    return Object.assign({}, item, tone, {
      badgeText: String((item && item.badge) || '').trim() || '官方公告',
      highlighted: !!selectedId && String(item && item.id) === selectedId
    })
  })
}

export default {
  data: function() {
    return {
      announcementId: '',
      loading: false,
      loadFailed: false,
      announcements: [],
      statusText: '正在加载公告...'
    }
  },
  computed: {
    displayItems: function() {
      return normalizeAnnouncements(this.announcements, this.announcementId)
    }
  },
  onLoad: function(options) {
    this.announcementId = (options && options.id) || ''
    this.loadAnnouncements()
  },
  methods: {
    goBack: function() {
      var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      if (pages && pages.length > 1) {
        uni.navigateBack({ delta: 1 })
        return
      }
      uni.switchTab({ url: '/pages/index/index' })
    },
    showSearchHint: function() {
      uni.showToast({
        title: '公告中心暂不支持搜索',
        icon: 'none'
      })
    },
    loadAnnouncements: function() {
      var self = this
      self.loading = true
      self.loadFailed = false

      api.listAnnouncements()
        .then(function(list) {
          self.announcements = list || []
          self.statusText = ''
        })
        .catch(function(error) {
          self.announcements = []
          self.loadFailed = true
          self.statusText = error.message || '公告加载失败，请稍后再试'
        })
        .finally(function() {
          self.loading = false
        })
    }
  }
}
</script>

<style scoped>
.announcement-shell {
  min-height: 100vh;
  padding: 0 0 56rpx;
  background: #f5f6f7;
}

.announcement-shell::before,
.announcement-shell::after {
  display: none;
}

.announcement-topbar {
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

.announcement-topbar-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
}

.announcement-icon-button {
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.announcement-back-icon {
  color: #2c2f30;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1;
}

.announcement-topbar-title {
  color: #2c2f30;
  font-size: 30rpx;
  font-weight: 800;
  letter-spacing: -0.5rpx;
}

.announcement-search-icon {
  position: relative;
  width: 28rpx;
  height: 28rpx;
}

.announcement-search-lens {
  width: 16rpx;
  height: 16rpx;
  border: 3rpx solid #596173;
  border-radius: 999rpx;
  box-sizing: border-box;
}

.announcement-search-handle {
  position: absolute;
  right: 0;
  bottom: 1rpx;
  width: 12rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: #596173;
  transform: rotate(45deg);
}

.announcement-content {
  padding: calc(env(safe-area-inset-top) + 118rpx) 28rpx 0;
}

.announcement-timeline {
  position: relative;
  padding-bottom: 32rpx;
}

.announcement-timeline-line {
  position: absolute;
  left: 18rpx;
  top: 20rpx;
  bottom: 54rpx;
  width: 4rpx;
  border-radius: 999rpx;
  background: rgba(218, 221, 223, 0.72);
}

.announcement-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 18rpx;
  margin-bottom: 28rpx;
}

.announcement-node {
  position: relative;
  z-index: 1;
  width: 40rpx;
  height: 40rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 0 10rpx #f5f6f7;
}

.announcement-node-primary {
  background: #2563eb;
}

.announcement-node-danger {
  background: #fb5151;
}

.announcement-node-neutral {
  background: #98a2b3;
}

.announcement-node-skeleton {
  background: #dadddf;
}

.announcement-node-text {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1;
}

.announcement-card,
.announcement-status-card {
  flex: 1;
  min-width: 0;
  padding: 28rpx;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(15, 23, 42, 0.06);
}

.announcement-card-highlighted {
  border: 2rpx solid rgba(37, 99, 235, 0.14);
  box-shadow: 0 16rpx 34rpx rgba(37, 99, 235, 0.1);
}

.announcement-chip-row,
.announcement-skeleton-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.announcement-chip {
  min-height: 38rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: 700;
}

.announcement-chip-primary {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.announcement-chip-danger {
  background: rgba(251, 81, 81, 0.12);
  color: #e5484d;
}

.announcement-chip-neutral {
  background: #eff1f2;
  color: #667085;
}

.announcement-chip-mint {
  background: #dff7ee;
  color: #25755b;
}

.announcement-date {
  margin-left: auto;
  color: #98a2b3;
  font-size: 18rpx;
  font-weight: 600;
}

.announcement-title {
  margin-top: 18rpx;
  color: #2c2f30;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.35;
}

.announcement-summary {
  margin-top: 14rpx;
  color: #5d6675;
  font-size: 24rpx;
  line-height: 1.72;
}

.announcement-body {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid rgba(218, 221, 223, 0.7);
  color: #5d6675;
  font-size: 23rpx;
  line-height: 1.8;
  white-space: pre-wrap;
}

.announcement-footer {
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 2rpx solid rgba(218, 221, 223, 0.55);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.announcement-footer-label {
  color: #98a2b3;
  font-size: 20rpx;
  font-weight: 600;
}

.announcement-footer-value {
  color: #475467;
  font-size: 20rpx;
  font-weight: 700;
}

.announcement-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 22rpx 0 8rpx;
  opacity: 0.46;
}

.announcement-end-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: #667085;
}

.announcement-end-copy {
  color: #667085;
  font-size: 18rpx;
  letter-spacing: 4rpx;
}

.announcement-status-title {
  color: #2c2f30;
  font-size: 30rpx;
  font-weight: 800;
}

.announcement-status-copy {
  margin-top: 14rpx;
  color: #667085;
  font-size: 24rpx;
  line-height: 1.7;
}

.announcement-status-button {
  width: 100%;
  min-height: 84rpx;
  margin-top: 24rpx;
  border: 0;
  border-radius: 22rpx;
  background: #2563eb;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
}

.announcement-skeleton-chip,
.announcement-skeleton-time,
.announcement-skeleton-title,
.announcement-skeleton-line {
  border-radius: 999rpx;
  background: linear-gradient(90deg, rgba(236, 240, 244, 0.96) 0%, rgba(247, 249, 252, 1) 50%, rgba(236, 240, 244, 0.96) 100%);
}

.announcement-skeleton-chip {
  width: 112rpx;
  height: 38rpx;
}

.announcement-skeleton-time {
  margin-left: auto;
  width: 148rpx;
  height: 28rpx;
}

.announcement-skeleton-title {
  width: 88%;
  height: 34rpx;
  margin-top: 18rpx;
  border-radius: 14rpx;
}

.announcement-skeleton-line {
  width: 100%;
  height: 24rpx;
  margin-top: 14rpx;
  border-radius: 12rpx;
}

.announcement-skeleton-line.short {
  width: 62%;
}

@media screen and (min-width: 768px) {
  .announcement-content {
    max-width: 860rpx;
    margin: 0 auto;
  }
}
</style>
