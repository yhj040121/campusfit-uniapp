<template>
  <view class="page-shell home-shell">
    <view class="search-bar home-search" @click="goSearch">
      <view class="search-icon">搜</view>
      <view class="search-text">搜索场景、单品、博主或预算</view>
      <view class="search-enter">去发现</view>
    </view>

    <view class="hero-card home-hero">
      <view class="home-hero-top">
        <view class="home-hero-main">
          <view class="hero-title home-hero-title">本周清爽穿搭</view>
          <view class="hero-copy home-hero-copy">先看图和预算。</view>
        </view>
      </view>
      <view class="home-hero-chips">
        <view class="home-hero-chip">{{ outfits.length }} 推荐</view>
        <view class="home-hero-chip">{{ featuredActivities.length }} 活动</view>
      </view>
    </view>

    <view v-if="featuredActivity" class="panel-card home-activity-strip" @click="goActivityCenter">
      <view class="home-activity-kicker">{{ featuredActivity.badge }}</view>
      <view class="home-activity-main">
        <view class="home-activity-title">{{ featuredActivity.title }}</view>
        <view class="home-activity-meta">{{ featuredActivity.period }} · {{ featuredActivity.progressText }}</view>
      </view>
      <view class="home-activity-link">查看</view>
    </view>

    <view class="home-mini-head">
      <view class="home-mini-title">{{ recommendEnabled ? '今日推荐' : '最新内容' }}</view>
      <view class="float-link" @click="refreshHome">刷新</view>
    </view>
    <view class="chip-row channel-row">
      <view
        v-for="item in tabs"
        :key="item"
        :class="['chip', activeTab === item ? 'chip-active' : 'chip-outline']"
        @click="activeTab = item"
      >
        {{ item }}
      </view>
    </view>

    <view v-if="officialAnnouncement" class="feature-note compact-feature-note feature-note-clickable" @click="goAnnouncementDetail">
      <view class="feature-label">{{ officialAnnouncement.badge }}</view>
      <view class="feature-title">{{ officialAnnouncement.title }}</view>
      <view class="feature-meta">
        发布时间 {{ officialAnnouncement.publishTime }}
        <text v-if="officialAnnouncement.expireTime && officialAnnouncement.expireTime !== '-'"> · 截止 {{ officialAnnouncement.expireTime }}</text>
      </view>
    </view>

    <view class="home-mini-head home-feed-head">
      <view class="home-mini-title">爆款穿搭</view>
      <view class="float-link" @click="goSearch">更多筛选</view>
    </view>

    <view v-if="listLoading">
      <view class="skeleton-card" v-for="item in 2" :key="'skeleton-' + item">
        <view class="skeleton-block"></view>
        <view class="skeleton-line medium"></view>
        <view class="skeleton-line"></view>
        <view class="skeleton-line short"></view>
      </view>
    </view>
    <view v-else-if="listFailed" class="status-banner status-banner-error">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">推荐内容暂时没有加载出来</view>
          <view class="status-banner-copy">可以稍后再试一次，或者先通过搜索与活动中心继续浏览。</view>
        </view>
        <view class="status-link" @click="refreshHome">重试</view>
      </view>
    </view>
    <view v-else-if="outfits.length">
      <view class="look-card editorial-card" v-for="item in outfits" :key="item.id" @click="goDetail(item.id)">
        <view class="editorial-photo">
          <image v-if="item.coverImageUrl" class="editorial-image" :src="item.coverImageUrl" mode="aspectFill"></image>
          <view class="editorial-photo-overlay">
            <view class="editorial-pill">{{ item.coverTag }}</view>
            <view class="editorial-budget">预算 {{ item.budget }}</view>
          </view>
          <view v-if="!item.coverImageUrl" class="editorial-empty">
            <view class="editorial-empty-kicker">OOTD</view>
            <view class="editorial-empty-title">{{ item.title }}</view>
          </view>
        </view>

        <view class="editorial-body">
          <view class="editorial-kicker">{{ item.scene }} · {{ item.style }}</view>
          <view class="editorial-title">{{ item.title }}</view>
          <view v-if="getDisplaySubtitle(item)" class="editorial-subtitle">{{ getDisplaySubtitle(item) }}</view>
          <view class="editorial-desc">{{ item.desc }}</view>

          <view class="editorial-tags">
            <view class="mini-tag">{{ item.scene }}</view>
            <view class="mini-tag">{{ item.style }}</view>
            <view class="mini-tag">{{ item.platform }}</view>
          </view>

          <view class="meta-line editorial-meta">
            <view class="meta-left">
              <view :class="['avatar', item.avatarClass, item.avatarUrl ? 'avatar-has-image' : '']">
                <image v-if="item.avatarUrl" class="avatar-image" :src="item.avatarUrl" mode="aspectFill"></image>
                <text v-else>{{ item.avatar }}</text>
              </view>
              <view>
                <view class="meta-name">{{ item.user }}</view>
                <view class="meta-school">{{ item.school }}</view>
              </view>
            </view>
            <view class="stats-line">
              <view class="stat-text">赞 {{ item.likes }}</view>
              <view class="stat-text">评 {{ item.comments }}</view>
              <view class="stat-text">藏 {{ item.saves }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">暂时还没有推荐内容</view>
      <view class="text-copy">先去搜索页按场景筛选，或者看看当前正在进行的活动专题。</view>
    </view>

    <view class="bottom-gap"></view>

    <view
      :class="[
        'message-fab',
        'message-fab-' + messageDockSide,
        messageCollapsed ? 'message-fab-collapsed' : '',
        messageDragging ? 'message-fab-dragging' : ''
      ]"
      :style="messageFabStyle"
      @touchstart.stop="onMessageTouchStart"
      @touchmove.stop.prevent="onMessageTouchMove"
      @touchend.stop="onMessageTouchEnd"
      @tap.stop="handleMessageTap"
    >
      <view class="message-fab-shell">
        <view class="message-fab-icon">
          <view class="message-fab-dot"></view>
          <view class="message-fab-dot"></view>
          <view class="message-fab-dot"></view>
        </view>
      </view>
      <view v-if="unreadCount > 0" class="message-fab-badge">{{ unreadBadgeText }}</view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var postDisplay = require('../../common/post-display.js')
var settingsStore = require('../../common/settings.js')

var MESSAGE_FLOAT_STORAGE_KEY = 'campusfit_home_message_float'
var MESSAGE_FLOAT_SIZE = 46
var MESSAGE_FLOAT_MARGIN = 8
var MESSAGE_FLOAT_MIN_Y = 88
var MESSAGE_FLOAT_BOTTOM_GAP = 100

export default {
  data: function() {
    return {
      tabs: ['推荐', '热门', '校园', '场景'],
      activeTab: '推荐',
      outfits: [],
      featuredActivities: [],
      officialAnnouncement: null,
      settingMap: settingsStore.getSettingMap(),
      listLoading: false,
      listFailed: false,
      unreadCount: 0,
      viewportWidth: 375,
      viewportHeight: 667,
      messageFloatX: 0,
      messageFloatY: 0,
      messageDockSide: 'right',
      messageCollapsed: false,
      messageDragging: false,
      messageCollapseTimer: null,
      messageDragStartX: 0,
      messageDragStartY: 0,
      messageDragOriginX: 0,
      messageDragOriginY: 0,
      messageDragMoved: false
    }
  },
  computed: {
    unreadBadgeText: function() {
      return this.unreadCount > 99 ? '99+' : String(this.unreadCount)
    },
    messageFabStyle: function() {
      return {
        left: this.messageFloatX + 'px',
        top: this.messageFloatY + 'px'
      }
    },
    featuredActivity: function() {
      return this.featuredActivities && this.featuredActivities.length ? this.featuredActivities[0] : null
    },
    pushEnabled: function() {
      return this.settingMap.push !== false
    },
    recommendEnabled: function() {
      return this.settingMap.recommend !== false
    }
  },
  onLoad: function() {
    this.initMessageFloat()
  },
  onShow: function() {
    this.settingMap = settingsStore.getSettingMap()
    this.loadAnnouncement()
    this.loadActivities()
    this.loadRecommendations()
    this.loadUnreadCount()
    this.queueMessageCollapse(1200)
  },
  onHide: function() {
    this.clearMessageCollapseTimer()
  },
  onUnload: function() {
    this.clearMessageCollapseTimer()
  },
  methods: {
    loadAnnouncement: function() {
      var self = this
      api.getLatestAnnouncement()
        .then(function(item) {
          self.officialAnnouncement = item || null
        })
        .catch(function() {
          self.officialAnnouncement = null
        })
    },
    loadActivities: function() {
      var self = this
      api.listFeaturedActivities()
        .then(function(list) {
          self.featuredActivities = list || []
        })
        .catch(function() {
          self.featuredActivities = []
        })
    },
    loadRecommendations: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
      api.listRecommendations()
        .then(function(list) {
          var nextList = (list || []).slice(0)
          if (!self.recommendEnabled) {
            nextList.sort(function(a, b) {
              return String(b.id || '').localeCompare(String(a.id || ''))
            })
          }
          self.outfits = nextList
          self.listFailed = false
        })
        .catch(function() {
          self.outfits = []
          self.listFailed = true
        })
        .finally(function() {
          self.listLoading = false
        })
    },
    loadUnreadCount: function() {
      var self = this
      if (!session.isLoggedIn() || !self.pushEnabled) {
        self.unreadCount = 0
        return
      }
      api.getUnreadMessageCount()
        .then(function(count) {
          self.unreadCount = Number(count || 0)
        })
        .catch(function() {
          self.unreadCount = 0
        })
    },
    initMessageFloat: function() {
      var systemInfo = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {}
      this.viewportWidth = Number(systemInfo.windowWidth || 375)
      this.viewportHeight = Number(systemInfo.windowHeight || 667)

      var saved = uni.getStorageSync(MESSAGE_FLOAT_STORAGE_KEY) || {}
      var defaultX = this.viewportWidth - MESSAGE_FLOAT_SIZE - MESSAGE_FLOAT_MARGIN
      var defaultY = this.viewportHeight - MESSAGE_FLOAT_SIZE - MESSAGE_FLOAT_BOTTOM_GAP
      var position = this.clampMessageFloat(
        typeof saved.x === 'number' ? saved.x : defaultX,
        typeof saved.y === 'number' ? saved.y : defaultY
      )
      var dockSide = this.getMessageDockSide(position.x)
      var snappedX = dockSide === 'left' ? MESSAGE_FLOAT_MARGIN : this.getMessageFloatMaxX()
      var snappedPosition = this.clampMessageFloat(snappedX, position.y)

      this.messageFloatX = snappedPosition.x
      this.messageFloatY = snappedPosition.y
      this.messageDockSide = dockSide
      this.messageCollapsed = true
      this.persistMessageFloat()
    },
    getMessageFloatMaxX: function() {
      return Math.max(MESSAGE_FLOAT_MARGIN, this.viewportWidth - MESSAGE_FLOAT_SIZE - MESSAGE_FLOAT_MARGIN)
    },
    clampMessageFloat: function(x, y) {
      var maxX = this.getMessageFloatMaxX()
      var maxY = Math.max(MESSAGE_FLOAT_MIN_Y, this.viewportHeight - MESSAGE_FLOAT_SIZE - MESSAGE_FLOAT_BOTTOM_GAP)

      return {
        x: Math.min(maxX, Math.max(MESSAGE_FLOAT_MARGIN, Number(x || 0))),
        y: Math.min(maxY, Math.max(MESSAGE_FLOAT_MIN_Y, Number(y || 0)))
      }
    },
    getMessageDockSide: function(x) {
      var maxX = this.getMessageFloatMaxX()
      return Number(x || 0) <= maxX / 2 ? 'left' : 'right'
    },
    clearMessageCollapseTimer: function() {
      if (this.messageCollapseTimer) {
        clearTimeout(this.messageCollapseTimer)
        this.messageCollapseTimer = null
      }
    },
    queueMessageCollapse: function(delay) {
      var self = this
      this.clearMessageCollapseTimer()
      this.messageCollapseTimer = setTimeout(function() {
        self.messageCollapsed = true
      }, typeof delay === 'number' ? delay : 900)
    },
    persistMessageFloat: function() {
      uni.setStorageSync(MESSAGE_FLOAT_STORAGE_KEY, {
        x: this.messageFloatX,
        y: this.messageFloatY
      })
    },
    snapMessageFloat: function(shouldCollapse) {
      var dockSide = this.getMessageDockSide(this.messageFloatX)
      var snappedX = dockSide === 'left' ? MESSAGE_FLOAT_MARGIN : this.getMessageFloatMaxX()
      var position = this.clampMessageFloat(snappedX, this.messageFloatY)

      this.messageFloatX = position.x
      this.messageFloatY = position.y
      this.messageDockSide = dockSide
      this.persistMessageFloat()

      if (shouldCollapse !== false) {
        this.queueMessageCollapse(700)
      }
    },
    onMessageTouchStart: function(event) {
      var touch = event && event.touches && event.touches[0]
      if (!touch) {
        return
      }

      this.clearMessageCollapseTimer()
      this.messageCollapsed = false
      this.messageDragging = true
      this.messageDragStartX = Number(touch.clientX || touch.pageX || 0)
      this.messageDragStartY = Number(touch.clientY || touch.pageY || 0)
      this.messageDragOriginX = this.messageFloatX
      this.messageDragOriginY = this.messageFloatY
      this.messageDragMoved = false
    },
    onMessageTouchMove: function(event) {
      var touch = event && event.touches && event.touches[0]
      if (!touch) {
        return
      }

      var currentX = Number(touch.clientX || touch.pageX || 0)
      var currentY = Number(touch.clientY || touch.pageY || 0)
      var deltaX = currentX - this.messageDragStartX
      var deltaY = currentY - this.messageDragStartY

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        this.messageDragMoved = true
      }

      var position = this.clampMessageFloat(
        this.messageDragOriginX + deltaX,
        this.messageDragOriginY + deltaY
      )

      this.messageFloatX = position.x
      this.messageFloatY = position.y
      this.messageDockSide = this.getMessageDockSide(position.x)
    },
    onMessageTouchEnd: function() {
      this.messageDragging = false
      if (this.messageDragMoved) {
        this.snapMessageFloat(true)
        return
      }
      this.queueMessageCollapse(1600)
    },
    handleMessageTap: function() {
      if (this.messageDragMoved) {
        this.messageDragMoved = false
        return
      }
      this.clearMessageCollapseTimer()
      this.messageCollapsed = false
      this.goMessages()
    },
    goSearch: function() {
      uni.switchTab({ url: '/pages/search/index' })
    },
    goActivityCenter: function() {
      uni.navigateTo({ url: '/pages/activity/index' })
    },
    goAnnouncementDetail: function() {
      if (!this.officialAnnouncement || !this.officialAnnouncement.id) {
        return
      }
      uni.navigateTo({ url: '/pages/announcement/index?id=' + this.officialAnnouncement.id })
    },
    goDetail: function(id) {
      uni.navigateTo({ url: '/pages/detail/index?id=' + id })
    },
    getDisplaySubtitle: function(item) {
      return postDisplay.getDisplaySubtitle(item)
    },
    goMessages: function() {
      if (!session.isLoggedIn()) {
        uni.navigateTo({ url: '/pages/login/index' })
        return
      }
      uni.navigateTo({ url: '/pages/messages/index' })
    },
    refreshHome: function() {
      this.loadAnnouncement()
      this.loadActivities()
      this.loadRecommendations()
      this.loadUnreadCount()
      uni.showToast({ title: '首页已刷新', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.home-shell {
  padding-top: 10rpx;
}

.home-search {
  position: sticky;
  top: 12rpx;
  z-index: 4;
  margin-top: 0;
}

.search-enter {
  margin-left: auto;
  color: var(--campus-secondary);
  font-size: 22rpx;
  font-weight: 700;
}

.home-hero {
  margin-top: 10rpx;
  padding: 18rpx 18rpx;
  border-radius: 28rpx;
}

.home-hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.home-hero-main {
  flex: 1;
  min-width: 0;
}

.home-hero-badge {
  padding: 8rpx 14rpx;
  font-size: 18rpx;
}

.home-hero-side {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.36);
  font-family: var(--campus-font-data);
  font-size: 18rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.home-hero-title {
  max-width: 96%;
  margin-top: 10rpx;
  font-size: 36rpx;
  line-height: 1.14;
}

.home-hero-copy {
  margin-top: 8rpx;
  max-width: 100%;
  font-size: 22rpx;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.home-hero-chip {
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

.home-activity-strip {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 18rpx;
  padding: 24rpx 26rpx;
}

.home-activity-kicker {
  flex-shrink: 0;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(45, 87, 217, 0.08);
  color: var(--campus-secondary);
  font-family: var(--campus-font-data);
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.home-activity-main {
  flex: 1;
  min-width: 0;
}

.home-activity-title {
  color: var(--campus-text);
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-activity-meta {
  margin-top: 8rpx;
  color: var(--campus-text-soft);
  font-size: 22rpx;
}

.home-activity-link {
  flex-shrink: 0;
  color: var(--campus-secondary);
  font-family: var(--campus-font-data);
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.home-mini-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin: 24rpx 0 12rpx;
}

.home-mini-title {
  color: var(--campus-secondary);
  font-family: var(--campus-font-data);
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.channel-row {
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 6rpx;
  margin-top: 0;
}

.feature-note {
  position: relative;
  margin: 18rpx 0 6rpx;
  padding: 24rpx 26rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 250, 245, 0.92);
  border: 1rpx solid rgba(43, 24, 34, 0.08);
  box-shadow: 0 14rpx 30rpx rgba(43, 24, 34, 0.08);
}

.feature-note-clickable {
  cursor: pointer;
}

.compact-feature-note .feature-label {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(201, 49, 91, 0.08);
  color: var(--campus-primary);
  font-size: 20rpx;
  font-weight: 700;
}

.compact-feature-note .feature-title {
  margin-top: 16rpx;
  padding-right: 0;
  font-size: 30rpx;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feature-meta {
  margin-top: 10rpx;
  color: var(--campus-text-soft);
  font-size: 22rpx;
  line-height: 1.5;
}

.home-feed-head {
  margin-top: 20rpx;
}

.editorial-card {
  overflow: hidden;
  padding: 18rpx;
  border-radius: 34rpx;
  margin-top: 14rpx;
}

.editorial-photo {
  position: relative;
  overflow: hidden;
  height: 420rpx;
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.2), transparent 26%),
    linear-gradient(140deg, rgba(255, 239, 231, 0.96) 0%, rgba(238, 244, 255, 0.96) 100%);
}

.editorial-photo::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(13, 25, 37, 0.04) 0%, rgba(13, 25, 37, 0.18) 100%),
    linear-gradient(120deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 34%);
  pointer-events: none;
}

.editorial-image {
  width: 100%;
  height: 100%;
}

.editorial-photo-overlay {
  position: absolute;
  left: 20rpx;
  right: 20rpx;
  top: 20rpx;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.editorial-pill,
.editorial-budget {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 21rpx;
  font-weight: 700;
}

.editorial-pill {
  background: rgba(255, 255, 255, 0.88);
  color: var(--campus-primary);
}

.editorial-budget {
  background: rgba(32, 49, 66, 0.52);
  color: #ffffff;
}

.editorial-empty {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: 32rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 250, 245, 0.8) 48%, rgba(255, 250, 245, 0.94) 100%);
}

.editorial-empty-kicker {
  color: rgba(32, 49, 66, 0.64);
  font-size: 22rpx;
  letter-spacing: 3rpx;
}

.editorial-empty-title {
  margin-top: 12rpx;
  color: var(--campus-text);
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1.28;
}

.editorial-body {
  display: grid;
  gap: 4rpx;
  padding: 22rpx 10rpx 6rpx;
}

.editorial-kicker {
  color: var(--campus-primary);
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.editorial-title {
  margin-top: 10rpx;
  color: var(--campus-text);
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.22;
}

.editorial-subtitle {
  margin-top: 8rpx;
  color: var(--campus-text);
  font-size: 25rpx;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.editorial-desc {
  margin-top: 10rpx;
  color: var(--campus-text-soft);
  font-size: 23rpx;
  line-height: 1.68;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.editorial-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}

.mini-tag {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 250, 245, 0.92);
  border: 1rpx solid rgba(43, 24, 34, 0.08);
  color: var(--campus-text-soft);
  font-size: 22rpx;
}

.editorial-meta {
  margin-top: 4rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(43, 24, 34, 0.08);
}

.editorial-card:first-child {
  border-radius: 38rpx;
}

.editorial-card:first-child .editorial-photo {
  height: 468rpx;
}

.editorial-card:first-child .editorial-title {
  font-size: 44rpx;
  line-height: 1.16;
}

.message-fab {
  position: fixed;
  z-index: 12;
  width: 46px;
  height: 46px;
  opacity: 0.96;
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease;
}

.message-fab-dragging {
  transition: none;
}

.message-fab-collapsed {
  opacity: 0.74;
}

.message-fab-collapsed.message-fab-left {
  transform: translateX(-16px);
}

.message-fab-collapsed.message-fab-right {
  transform: translateX(16px);
}

.message-fab-shell {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(201, 49, 91, 0.72), rgba(45, 87, 217, 0.64)),
    rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: 0 10px 18px rgba(43, 24, 34, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.message-fab-left .message-fab-shell {
  border-top-left-radius: 14px;
  border-bottom-left-radius: 14px;
}

.message-fab-right .message-fab-shell {
  border-top-right-radius: 14px;
  border-bottom-right-radius: 14px;
}

.message-fab-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transform: translate(-50%, -50%);
}

.message-fab-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 2px 6px rgba(43, 24, 34, 0.16);
}

.message-fab-badge {
  position: absolute;
  right: -2px;
  top: -2px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 999px;
  background: #ffffff;
  color: var(--campus-primary);
  font-family: var(--campus-font-data);
  font-size: 9px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  box-shadow: 0 6px 12px rgba(43, 24, 34, 0.12);
  box-sizing: border-box;
}

@media (min-width: 720rpx) {
  .message-fab {
    width: 50px;
    height: 50px;
  }

  .message-fab-dot {
    width: 6px;
    height: 6px;
  }
}
</style>
