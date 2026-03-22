<template>
  <view class="page-shell announcement-shell">
    <view v-if="loading">
      <view class="skeleton-card">
        <view class="skeleton-line short"></view>
        <view class="skeleton-line medium"></view>
        <view class="skeleton-line"></view>
        <view class="skeleton-line"></view>
      </view>
      <view class="skeleton-card">
        <view class="skeleton-line"></view>
        <view class="skeleton-line"></view>
        <view class="skeleton-line medium"></view>
      </view>
    </view>

    <view v-else-if="loadFailed" class="status-banner status-banner-error">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">公告暂时无法查看</view>
          <view class="status-banner-copy">{{ statusText }}</view>
        </view>
        <view class="status-link" @click="loadDetail">重新加载</view>
      </view>
    </view>

    <view v-else-if="detail">
      <view class="hero-card announcement-hero">
        <view class="announcement-hero-head">
          <view class="hero-badge announcement-hero-badge">{{ detail.badge || '官方公告' }}</view>
        </view>
        <view class="hero-title announcement-hero-title">{{ detail.title }}</view>
        <view class="hero-copy announcement-hero-copy">{{ detail.summary }}</view>
        <view class="announcement-meta-row">
          <view class="announcement-meta-chip">发布 {{ detail.publishTime || '-' }}</view>
          <view class="announcement-meta-chip">{{ detail.expireTime || '长期有效' }}</view>
        </view>
      </view>

      <view class="panel-card announcement-body-card">
        <view class="announcement-status">{{ statusText }}</view>
        <view class="announcement-content">{{ detail.content || detail.summary }}</view>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')

export default {
  data: function() {
    return {
      announcementId: '',
      loading: false,
      loadFailed: false,
      detail: null,
      statusText: '正在加载公告详情...'
    }
  },
  onLoad: function(options) {
    this.announcementId = (options && options.id) || ''
    this.loadDetail()
  },
  methods: {
    loadDetail: function() {
      var self = this
      if (!self.announcementId) {
        self.loadFailed = true
        self.loading = false
        self.detail = null
        self.statusText = '缺少公告编号，请从首页公告卡片重新进入。'
        return
      }
      self.loading = true
      self.loadFailed = false
      api.getAnnouncementDetail(self.announcementId)
        .then(function(detail) {
          self.detail = detail || null
          self.statusText = '发布时间 ' + ((detail && detail.publishTime) || '-') + '，可随时回到首页查看最新公告。'
        })
        .catch(function(error) {
          self.detail = null
          self.loadFailed = true
          self.statusText = error.message || '公告详情加载失败，请稍后再试。'
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
  padding-top: 10rpx;
}

.announcement-hero {
  margin-top: 0;
  padding: 18rpx 18rpx;
  border-radius: 28rpx;
}

.announcement-hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.announcement-hero-badge {
  padding: 8rpx 14rpx;
  font-size: 18rpx;
}

.announcement-hero-title {
  margin-top: 10rpx;
  font-size: 36rpx;
  line-height: 1.14;
}

.announcement-hero-copy {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.45;
}

.announcement-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.announcement-meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.12);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
  font-size: 20rpx;
  font-weight: 700;
}

.announcement-body-card {
  margin-top: 14rpx;
}

.announcement-status {
  color: var(--campus-text-muted);
  font-size: 22rpx;
  line-height: 1.5;
}

.announcement-content {
  margin-top: 12rpx;
  color: var(--campus-text);
  font-size: 26rpx;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
