<template>
  <view class="page-shell home-shell">
    <view class="home-topbar">
      <view class="home-search-box" @click="goSearch">
        <view class="home-search-icon">
          <view class="home-search-lens"></view>
          <view class="home-search-handle"></view>
        </view>
        <view class="home-search-placeholder">搜索校园趋势...</view>
      </view>

      <view class="home-message-button" @click="goMessages">
        <view class="home-message-bubble"></view>
        <view v-if="unreadCount > 0" class="home-message-dot"></view>
      </view>

      <view class="home-avatar-button" @click="goProfile">
        <image
          v-if="currentUserAvatar"
          class="home-avatar-image"
          :src="currentUserAvatar"
          mode="aspectFill"
        ></image>
        <text v-else>{{ currentUserInitial }}</text>
      </view>
    </view>

    <view class="home-content">
      <scroll-view class="home-tab-scroll" scroll-x="true" show-scrollbar="false">
        <view class="home-tab-row">
          <view
            v-for="item in tabs"
            :key="item"
            :class="['home-tab-item', activeTab === item ? 'home-tab-item-active' : '']"
            @click="activeTab = item"
          >
            {{ item }}
          </view>
        </view>
      </scroll-view>

      <view class="home-section">
        <view class="home-section-head">
          <view class="home-section-title">每周精选</view>
        </view>

        <view class="home-weekly-grid">
          <view class="home-weekly-panel">
            <view class="home-weekly-label">公告</view>
            <view v-if="weeklyAnnouncement" class="home-weekly-card home-weekly-card-note" @click="goAnnouncementDetail">
              <view class="home-weekly-note-icon">
                <text class="home-weekly-note-icon-text">公</text>
              </view>
              <view class="home-weekly-card-title">{{ weeklyAnnouncement.title }}</view>
              <view class="home-weekly-card-copy">{{ weeklyAnnouncement.summary || '无' }}</view>
              <view class="home-weekly-card-meta">{{ weeklyAnnouncement.publishTime || '无' }}</view>
            </view>
            <view v-else class="home-weekly-empty">无</view>
          </view>

          <view class="home-weekly-panel">
            <view class="home-weekly-label">活动</view>
            <view v-if="weeklyActivity" class="home-weekly-card home-weekly-card-activity" @click="goActivityCenter">
              <view class="home-weekly-activity-badge">{{ weeklyActivity.badge || '活动' }}</view>
              <view class="home-weekly-card-title home-weekly-card-title-light">{{ weeklyActivity.title }}</view>
              <view class="home-weekly-card-copy home-weekly-card-copy-light">{{ weeklyActivity.summary || '无' }}</view>
              <view class="home-weekly-card-meta home-weekly-card-meta-light">{{ weeklyActivity.period || '无' }}</view>
            </view>
            <view v-else class="home-weekly-empty">无</view>
          </view>
        </view>
      </view>

      <view class="home-feed-head">
        <view class="home-feed-head-mark"></view>
        <view class="home-feed-head-title">每日灵感</view>
      </view>

      <view v-if="listLoading" class="home-feed-grid">
        <view class="home-feed-column" v-for="column in 2" :key="'skeleton-column-' + column">
          <view class="home-feed-skeleton" v-for="item in 2" :key="'skeleton-' + column + '-' + item"></view>
        </view>
      </view>

      <view v-else-if="listFailed" class="home-empty-card">
        <view class="home-empty-title">无</view>
        <view class="home-empty-copy">帖子数据加载失败</view>
      </view>

      <view v-else-if="displayedPosts.length" class="home-feed-grid">
        <view class="home-feed-column" v-for="(column, columnIndex) in feedColumns" :key="'column-' + columnIndex">
          <view class="home-feed-card" v-for="item in column" :key="item.id" @click="goDetail(item.id)">
            <view :class="['home-feed-media', item.feedMediaClass]">
              <image
                v-if="item.displayCoverUrl || item.coverImageUrl"
                class="home-feed-image"
                :src="item.displayCoverUrl || item.coverImageUrl"
                mode="aspectFill"
              ></image>
              <view v-else class="home-feed-empty-media">
                <view class="home-feed-empty-media-text">无</view>
              </view>
              <view class="home-feed-badge">{{ item.feedBadge }}</view>
            </view>

            <view class="home-feed-body">
              <view class="home-feed-title">{{ item.title || '无' }}</view>
              <view v-if="item.feedTags && item.feedTags.length" class="home-feed-tag-row">
                <view
                  v-for="tag in item.feedTags"
                  :key="item.id + '-' + tag"
                  class="home-feed-tag"
                >
                  {{ tag }}
                </view>
              </view>
              <view class="home-feed-desc">{{ item.feedDesc || '无' }}</view>

              <view class="home-feed-footer">
                <view class="home-feed-user">
                  <view :class="['avatar', item.avatarClass, item.avatarUrl ? 'avatar-has-image' : '']">
                    <image v-if="item.avatarUrl" class="avatar-image" :src="item.avatarUrl" mode="aspectFill"></image>
                    <text v-else>{{ item.avatar || 'U' }}</text>
                  </view>
                  <view class="home-feed-user-copy">
                    <view class="home-feed-user-name">{{ item.user || '无' }}</view>
                    <view class="home-feed-user-school">{{ item.school || '无' }}</view>
                  </view>
                </view>

                <view class="home-feed-like">
                  <text class="home-feed-like-icon">&#9825;</text>
                  <text class="home-feed-like-value">{{ formatCount(item.likes) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="home-empty-card">
        <view class="home-empty-title">无</view>
        <view class="home-empty-copy">{{ emptyText }}</view>
      </view>
    </view>

    <view class="home-fab" @click="goPublish">
      <view class="home-fab-plus"></view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var postDisplay = require('../../common/post-display.js')
var settingsStore = require('../../common/settings.js')

var TAB_RECOMMEND = '\u63a8\u8350'
var TAB_FOLLOWING = '\u5173\u6ce8'
var TAB_HOT = '\u70ed\u95e8'
var HOME_DATA_CACHE_MS = 45000
var FEED_MEDIA_CLASSES = ['home-feed-media-portrait', 'home-feed-media-square', 'home-feed-media-tall', 'home-feed-media-landscape']

function pickInitial(value, fallback) {
  var text = String(value || '').trim()
  if (!text) {
    return fallback || 'C'
  }
  return text.slice(0, 1).toUpperCase()
}

function safeText(value, fallback) {
  var text = String(value || '').trim()
  return text || (fallback || '')
}

function formatCountValue(value) {
  var count = Number(value || 0)
  if (!count) {
    return '0'
  }
  if (count >= 10000) {
    return (count / 10000).toFixed(count >= 100000 ? 0 : 1) + 'w'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(count >= 10000 ? 0 : 1) + 'k'
  }
  return String(count)
}

function normalizePosts(list) {
  return (list || []).map(function(item, index) {
    var feedTags = []
    if (item.scene) {
      feedTags.push(item.scene)
    }
    if (item.style) {
      feedTags.push(item.style)
    }
    if (item.budget) {
      feedTags.push('预算 ' + item.budget)
    }
    return Object.assign({}, item, {
      displayCoverUrl: item.displayCoverUrl || postDisplay.getDisplayCoverUrl(item),
      feedBadge: safeText(item.coverTag || item.scene, '\u5e16\u5b50'),
      feedDesc: safeText(postDisplay.getDisplaySubtitle(item) || item.desc || item.subtitle, ''),
      feedTags: feedTags,
      feedMediaClass: FEED_MEDIA_CLASSES[index % FEED_MEDIA_CLASSES.length],
      feedWeight: [1.2, 1, 1.25, 0.9][index % 4]
    })
  })
}

function buildFeedColumns(list) {
  var columns = [[], []]
  var heights = [0, 0]
  var items = list || []
  for (var i = 0; i < items.length; i += 1) {
    var columnIndex = heights[0] <= heights[1] ? 0 : 1
    columns[columnIndex].push(items[i])
    heights[columnIndex] += Number(items[i].feedWeight || 1)
  }
  return columns
}

function extractFollowedUserIds(list) {
  var ids = []
  var source = list || []
  for (var i = 0; i < source.length; i += 1) {
    var item = source[i] || {}
    var id = item.userId || item.id || item.targetUserId || item.followUserId || item.authorId
    if (!id) {
      continue
    }
    id = String(id)
    if (ids.indexOf(id) === -1) {
      ids.push(id)
    }
  }
  return ids
}

function sortHotPosts(list) {
  return (list || []).slice(0).sort(function(a, b) {
    return Number(b.likes || 0) - Number(a.likes || 0)
  })
}

export default {
  data: function() {
    return {
      tabs: [TAB_RECOMMEND, TAB_FOLLOWING, TAB_HOT],
      activeTab: TAB_RECOMMEND,
      allPosts: [],
      featuredActivities: [],
      officialAnnouncement: null,
      followingUsers: [],
      settingMap: settingsStore.getSettingMap(),
      homeDataLoading: false,
      homeDataLoadedAt: 0,
      listLoading: false,
      listFailed: false,
      unreadCount: 0
    }
  },
  computed: {
    currentUserAvatar: function() {
      var user = session.getUser() || {}
      return user.avatarUrl || ''
    },
    currentUserInitial: function() {
      var user = session.getUser() || {}
      return pickInitial(user.nickname || user.name || 'C', 'C')
    },
    weeklyAnnouncement: function() {
      return this.officialAnnouncement || null
    },
    weeklyActivity: function() {
      return this.featuredActivities && this.featuredActivities.length ? this.featuredActivities[0] : null
    },
    followedUserIds: function() {
      return extractFollowedUserIds(this.followingUsers)
    },
    displayedPosts: function() {
      var list = normalizePosts(this.allPosts)
      if (this.activeTab === TAB_FOLLOWING) {
        var ids = this.followedUserIds
        if (!ids.length) {
          return []
        }
        return list.filter(function(item) {
          var authorId = item.authorId || item.userId
          return ids.indexOf(String(authorId || '')) > -1
        })
      }
      if (this.activeTab === TAB_HOT) {
        return sortHotPosts(list)
      }
      return list
    },
    feedColumns: function() {
      return buildFeedColumns(this.displayedPosts)
    },
    emptyText: function() {
      if (this.activeTab === TAB_FOLLOWING) {
        return '\u5173\u6ce8\u9875\u65e0\u5e16\u5b50'
      }
      if (this.activeTab === TAB_HOT) {
        return '\u70ed\u95e8\u9875\u65e0\u5e16\u5b50'
      }
      return '\u6bcf\u65e5\u7075\u611f\u65e0\u5e16\u5b50'
    }
  },
  watch: {
    activeTab: function(nextTab) {
      if (nextTab === TAB_FOLLOWING && session.isLoggedIn() && !this.followingUsers.length) {
        this.loadFollowingUsers()
      }
    }
  },
  onShow: function() {
    this.settingMap = settingsStore.getSettingMap()
    this.loadUnreadCount()
    if (this.shouldRefreshHomeData()) {
      this.refreshHomeData()
      return
    }
    if (this.activeTab === TAB_FOLLOWING && session.isLoggedIn() && !this.followingUsers.length) {
      this.loadFollowingUsers()
    }
  },
  methods: {
    formatCount: function(value) {
      return formatCountValue(value)
    },
    shouldRefreshHomeData: function() {
      if (this.homeDataLoading) {
        return false
      }
      if (this.listFailed || !this.homeDataLoadedAt) {
        return true
      }
      return (Date.now() - this.homeDataLoadedAt) > HOME_DATA_CACHE_MS
    },
    refreshHomeData: function() {
      var self = this
      if (self.homeDataLoading) {
        return
      }
      self.homeDataLoading = true
      Promise.all([
        self.loadAnnouncement(),
        self.loadActivities(),
        self.loadPosts(),
        session.isLoggedIn() ? self.loadFollowingUsers() : Promise.resolve([])
      ])
        .finally(function() {
          self.homeDataLoading = false
          if (!self.listFailed) {
            self.homeDataLoadedAt = Date.now()
          }
        })
    },
    loadAnnouncement: function() {
      var self = this
      return api.getLatestAnnouncement()
        .then(function(item) {
          self.officialAnnouncement = item || null
        })
        .catch(function() {
          self.officialAnnouncement = null
        })
    },
    loadActivities: function() {
      var self = this
      return api.listFeaturedActivities()
        .then(function(list) {
          self.featuredActivities = list || []
        })
        .catch(function() {
          self.featuredActivities = []
        })
    },
    loadPosts: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
      return api.searchPosts('', {})
        .then(function(list) {
          self.allPosts = list || []
          self.listFailed = false
        })
        .catch(function() {
          return api.listRecommendations()
            .then(function(list) {
              self.allPosts = list || []
              self.listFailed = false
            })
            .catch(function() {
              self.allPosts = []
              self.listFailed = true
            })
            .finally(function() {
              self.listLoading = false
            })
        })
        .finally(function() {
          if (!self.listFailed) {
            self.listLoading = false
          }
        })
    },
    loadFollowingUsers: function() {
      var self = this
      if (!session.isLoggedIn()) {
        self.followingUsers = []
        return Promise.resolve([])
      }
      return api.listFollows('following')
        .then(function(list) {
          self.followingUsers = list || []
          return self.followingUsers
        })
        .catch(function() {
          self.followingUsers = []
          return []
        })
    },
    loadUnreadCount: function() {
      var self = this
      if (!session.isLoggedIn() || !settingsStore.isEnabled('push')) {
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
      if (!id) {
        return
      }
      uni.navigateTo({ url: '/pages/detail/index?id=' + id })
    },
    goMessages: function() {
      if (!session.isLoggedIn()) {
        uni.navigateTo({ url: '/pages/login/index' })
        return
      }
      uni.navigateTo({ url: '/pages/messages/index' })
    },
    goProfile: function() {
      uni.switchTab({ url: '/pages/profile/index' })
    },
    goPublish: function() {
      uni.switchTab({ url: '/pages/publish/index' })
    }
  }
}
</script>

<style scoped>
.home-shell {
  min-height: 100vh;
  padding: 0 0 140rpx;
  background: #f5f6f7;
}

.home-shell::before,
.home-shell::after {
  display: none;
}

.home-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: calc(env(safe-area-inset-top) + 18rpx) 24rpx 18rpx;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(18rpx);
  box-shadow: 0 10rpx 26rpx rgba(15, 23, 42, 0.04);
}

.home-content {
  padding: calc(env(safe-area-inset-top) + 116rpx) 24rpx 0;
}

.home-search-box {
  flex: 1;
  min-width: 0;
  height: 78rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #edf0f2;
  display: flex;
  align-items: center;
}

.home-search-icon {
  position: relative;
  width: 30rpx;
  height: 30rpx;
  margin-right: 16rpx;
}

.home-search-lens {
  width: 18rpx;
  height: 18rpx;
  border: 3rpx solid #98a2b3;
  border-radius: 999rpx;
}

.home-search-handle {
  position: absolute;
  right: 2rpx;
  bottom: 1rpx;
  width: 12rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: #98a2b3;
  transform: rotate(45deg);
}

.home-search-placeholder {
  color: #a1aab5;
  font-size: 24rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-message-button,
.home-avatar-button {
  position: relative;
  width: 60rpx;
  height: 60rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.home-message-bubble {
  position: relative;
  width: 28rpx;
  height: 22rpx;
  border: 3rpx solid #2563eb;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.home-message-bubble::after {
  content: "";
  position: absolute;
  right: 3rpx;
  bottom: -6rpx;
  width: 10rpx;
  height: 10rpx;
  border-right: 3rpx solid #2563eb;
  border-bottom: 3rpx solid #2563eb;
  background: #ffffff;
  transform: rotate(45deg);
  box-sizing: border-box;
}

.home-message-dot {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: #ef4444;
  box-shadow: 0 0 0 4rpx #ffffff;
}

.home-avatar-button {
  overflow: hidden;
  background: linear-gradient(135deg, #f7dcc3 0%, #e3b789 100%);
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 800;
  box-shadow: 0 8rpx 18rpx rgba(15, 23, 42, 0.08);
}

.home-avatar-image {
  width: 100%;
  height: 100%;
  display: block;
}

.home-tab-scroll {
  width: 100%;
  margin-bottom: 24rpx;
  white-space: nowrap;
}

.home-tab-row {
  display: inline-flex;
  align-items: center;
  gap: 34rpx;
  padding-right: 24rpx;
}

.home-tab-item {
  position: relative;
  padding: 8rpx 0 10rpx;
  color: #6b7280;
  font-size: 28rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.home-tab-item-active {
  color: #2563eb;
  font-weight: 700;
}

.home-tab-item-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4rpx;
  border-radius: 999rpx;
  background: #2563eb;
}

.home-section {
  margin-bottom: 34rpx;
}

.home-section-head,
.home-feed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 22rpx;
}

.home-section-title {
  color: #101828;
  font-size: 46rpx;
  font-weight: 800;
  letter-spacing: -1rpx;
}

.home-weekly-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  align-items: stretch;
}

.home-weekly-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.home-weekly-label {
  margin-bottom: 12rpx;
  color: #475467;
  font-size: 22rpx;
  font-weight: 700;
}

.home-weekly-card,
.home-weekly-empty {
  min-height: 352rpx;
  height: 352rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  box-sizing: border-box;
  background: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
}

.home-empty-card {
  min-height: 248rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  box-sizing: border-box;
  background: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
}

.home-weekly-card-note {
  background: rgba(68, 165, 255, 0.14);
  display: flex;
  flex-direction: column;
}

.home-weekly-card-activity {
  background: linear-gradient(180deg, #63aefb 0%, #2f7be5 100%);
  display: flex;
  flex-direction: column;
}

.home-weekly-note-icon {
  width: 68rpx;
  height: 68rpx;
  border-radius: 20rpx;
  background: #0f68d5;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-weekly-note-icon-text {
  font-size: 28rpx;
  font-weight: 800;
}

.home-weekly-activity-badge {
  display: inline-flex;
  align-items: center;
  min-height: 42rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 700;
}

.home-weekly-card-title {
  margin-top: 20rpx;
  color: #0f4ea5;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-weekly-card-title-light {
  color: #ffffff;
}

.home-weekly-card-copy {
  margin-top: 12rpx;
  color: #667085;
  font-size: 20rpx;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-weekly-card-copy-light {
  color: rgba(255, 255, 255, 0.9);
}

.home-weekly-card-meta {
  margin-top: auto;
  padding-top: 16rpx;
  color: #98a2b3;
  font-size: 18rpx;
}

.home-weekly-card-meta-light {
  color: rgba(255, 255, 255, 0.82);
}

.home-weekly-empty,
.home-empty-card {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #98a2b3;
  font-size: 28rpx;
  font-weight: 700;
}

.home-empty-card {
  flex-direction: column;
}

.home-feed-head {
  justify-content: flex-start;
  margin-top: 8rpx;
}

.home-feed-head-mark {
  width: 8rpx;
  height: 36rpx;
  border-radius: 999rpx;
  background: #0f68d5;
}

.home-feed-head-title {
  color: #101828;
  font-size: 40rpx;
  font-weight: 800;
}

.home-feed-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.home-feed-column {
  display: grid;
  gap: 18rpx;
  align-content: start;
}

.home-feed-card {
  overflow: hidden;
  border-radius: 26rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
}

.home-feed-media {
  position: relative;
  overflow: hidden;
  background: #e9f2ff;
}

.home-feed-media-portrait {
  height: 360rpx;
}

.home-feed-media-square {
  height: 312rpx;
}

.home-feed-media-tall {
  height: 392rpx;
}

.home-feed-media-landscape {
  height: 278rpx;
}

.home-feed-image,
.home-feed-empty-media {
  width: 100%;
  height: 100%;
}

.home-feed-empty-media {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #dbeafe 0%, #eff6ff 100%);
}

.home-feed-empty-media-text {
  color: #98a2b3;
  font-size: 28rpx;
  font-weight: 700;
}

.home-feed-badge {
  position: absolute;
  left: 14rpx;
  top: 14rpx;
  min-height: 40rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  color: #0f68d5;
  font-size: 18rpx;
  font-weight: 700;
}

.home-feed-body {
  padding: 18rpx 18rpx 16rpx;
}

.home-feed-title {
  color: #111827;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-feed-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 10rpx;
}

.home-feed-tag {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: #eef4ff;
  color: #3567b9;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 1.2;
}

.home-feed-desc {
  margin-top: 8rpx;
  color: #667085;
  font-size: 20rpx;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-feed-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-top: 16rpx;
}

.home-feed-user {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex: 1;
}

.home-feed-user-copy {
  min-width: 0;
}

.home-feed-user-name {
  color: #111827;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-feed-user-school {
  margin-top: 4rpx;
  color: #98a2b3;
  font-size: 16rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-feed-like {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  color: #667085;
  flex-shrink: 0;
}

.home-feed-like-icon {
  font-size: 18rpx;
  line-height: 1;
}

.home-feed-like-value {
  font-size: 18rpx;
  font-weight: 600;
  line-height: 1;
}

.home-feed-skeleton {
  height: 420rpx;
  border-radius: 26rpx;
  background: linear-gradient(90deg, rgba(236, 240, 244, 0.95) 0%, rgba(247, 249, 252, 1) 50%, rgba(236, 240, 244, 0.95) 100%);
}

.home-empty-title {
  color: #98a2b3;
  font-size: 32rpx;
  font-weight: 800;
}

.home-empty-copy {
  margin-top: 10rpx;
  color: #98a2b3;
  font-size: 20rpx;
  text-align: center;
}

.home-fab {
  position: fixed;
  right: 28rpx;
  bottom: calc(env(safe-area-inset-bottom) + 116rpx);
  z-index: 19;
  width: 96rpx;
  height: 96rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #2498f5 0%, #005e9f 100%);
  box-shadow: 0 18rpx 34rpx rgba(0, 94, 159, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-fab-plus {
  position: relative;
  width: 36rpx;
  height: 36rpx;
}

.home-fab-plus::before,
.home-fab-plus::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 999rpx;
  background: #ffffff;
  transform: translate(-50%, -50%);
}

.home-fab-plus::before {
  width: 36rpx;
  height: 6rpx;
}

.home-fab-plus::after {
  width: 6rpx;
  height: 36rpx;
}

@media screen and (min-width: 768px) {
  .home-content {
    max-width: 860rpx;
    margin: 0 auto;
  }
}
</style>
