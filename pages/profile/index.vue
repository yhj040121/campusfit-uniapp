<template>
  <view class="page-shell profile-shell">
    <view v-if="!loggedIn" class="hero-card guest-hero">
      <view class="hero-badge profile-hero-badge">游客模式</view>
      <view class="hero-title profile-hero-title">登录后查看你的内容和消息</view>
      <view class="hero-copy profile-hero-copy">发布、收藏、活动和草稿都会集中在这里。</view>
      <button class="btn-primary profile-login-button" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="hero-card profile-hero">
        <view class="profile-hero-head">
          <view class="hero-badge profile-hero-badge">我的空间</view>
          <view class="side-pill side-pill-active profile-edit-pill" @click="go('/pages/edit-profile/index')">编辑资料</view>
        </view>
        <view class="profile-topline">
          <view class="meta-left">
            <view class="avatar profile-avatar profile-avatar-shell">
              <image v-if="effectiveAvatarUrl" class="profile-avatar-image" :src="effectiveAvatarUrl" mode="aspectFill"></image>
              <text v-else>{{ profile.avatar }}</text>
            </view>
            <view>
              <view class="hero-title profile-name">{{ profile.name }}</view>
              <view class="hero-copy profile-school">{{ displaySchool }}</view>
            </view>
          </view>
        </view>
        <view class="hero-copy profile-sign">{{ displaySign }}</view>
        <view class="profile-stat-row">
          <view class="profile-stat-chip" @click="go('/pages/follows/index')">
            <text class="profile-stat-label">关注</text>
            <text class="profile-stat-value">{{ profile.following }}</text>
          </view>
          <view class="profile-stat-chip" @click="go('/pages/follows/index')">
            <text class="profile-stat-label">粉丝</text>
            <text class="profile-stat-value">{{ profile.followers }}</text>
          </view>
          <view class="profile-stat-chip" @click="go('/pages/my-posts/index')">
            <text class="profile-stat-label">获赞</text>
            <text class="profile-stat-value">{{ profile.likes }}</text>
          </view>
        </view>
        <view class="profile-mini-actions">
          <view class="profile-mini-action" @click="go('/pages/messages/index')">
            <text class="profile-mini-action-label">消息</text>
            <text class="profile-mini-action-value">{{ displayUnreadCount }}</text>
          </view>
          <view class="profile-mini-action" @click="go('/pages/messages/index')">
            <text class="profile-mini-action-label">邀约</text>
            <text class="profile-mini-action-value">{{ profile.cooperation }}</text>
          </view>
          <view class="profile-mini-action" @click="go('/pages/my-activity/index')">
            <text class="profile-mini-action-label">活动</text>
            <text class="profile-mini-action-value">{{ activityStats.joinedCount }}</text>
          </view>
        </view>
      </view>

      <view class="panel-card income-card income-card-entry" @click="go('/pages/incentives/index')">
        <view class="income-topline">
          <view>
            <view class="section-title" style="margin-top:0;">创作激励</view>
            <view class="income-copy">收入和合作进度都在这里看。</view>
          </view>
          <view class="income-sticker">查看</view>
        </view>
        <view class="income-value">{{ profile.income }}</view>
        <view class="income-chip-row">
          <view class="income-chip">合作 {{ profile.cooperation }}</view>
          <view class="income-chip">活动 {{ activityStats.joinedCount }}</view>
        </view>
      </view>

      <view class="panel-card menu-card">
        <view class="section-head">
          <view>
            <view class="section-title" style="margin-top:0;">常用入口</view>
          </view>
        </view>
        <view class="menu-grid">
          <view class="menu-item" v-for="item in menus" :key="item.key" @click="go(item.path)">
            <view class="menu-badge" v-if="item.key === 'messages' && displayUnreadCount > 0">{{ unreadBadgeText }}</view>
            <view class="menu-badge subtle" v-else-if="item.key === 'activity' && activityStats.joinedCount > 0">{{ activityStats.joinedCount }}</view>
            <view class="menu-title">{{ item.title }}</view>
            <view class="menu-copy">{{ item.copy }}</view>
          </view>
        </view>
      </view>

      <button class="btn-ghost logout-button" @click="logout">退出登录</button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var settingsStore = require('../../common/settings.js')

function buildDefaultProfile() {
  return {
    name: '校园新同学',
    avatar: 'C',
    avatarUrl: '',
    school: 'CampusFit 校园社区',
    sign: '把校园日常场景也穿得轻盈、清爽、有预算感。',
    following: 0,
    followers: 0,
    likes: 0,
    income: '¥0.00',
    cooperation: 0
  }
}

function buildMenus() {
  return [
    { key: 'posts', title: '我的发布', copy: '管理已发布内容', path: '/pages/my-posts/index' },
    { key: 'favorites', title: '我的收藏', copy: '回看收藏线索', path: '/pages/favorites/index' },
    { key: 'activity', title: '我的活动', copy: '查看报名活动', path: '/pages/my-activity/index' },
    { key: 'follows', title: '关注 / 粉丝', copy: '管理社交关系', path: '/pages/follows/index' },
    { key: 'messages', title: '消息通知', copy: '评论点赞提醒', path: '/pages/messages/index' },
    { key: 'drafts', title: '草稿箱', copy: '继续编辑草稿', path: '/pages/drafts/index' },
    { key: 'settings', title: '设置', copy: '账号与隐私', path: '/pages/settings/index' },
    { key: 'profile', title: '编辑资料', copy: '更新头像和签名', path: '/pages/edit-profile/index' }
  ]
}

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      profile: buildDefaultProfile(),
      activityStats: {
        joinedCount: 0,
        ongoingCount: 0
      },
      unreadCount: 0,
      settingMap: settingsStore.getSettingMap(),
      menus: buildMenus()
    }
  },
  computed: {
    effectiveAvatarUrl: function() {
      var profileAvatar = (this.profile && this.profile.avatarUrl) || ''
      if (profileAvatar) {
        return profileAvatar
      }
      var user = session.getUser() || {}
      return user.avatarUrl || ''
    },
    unreadBadgeText: function() {
      return this.displayUnreadCount > 99 ? '99+' : String(this.displayUnreadCount)
    },
    pushEnabled: function() {
      return this.settingMap.push !== false
    },
    privacyEnabled: function() {
      return this.settingMap.privacy !== false
    },
    displayUnreadCount: function() {
      return this.pushEnabled ? this.unreadCount : 0
    },
    displaySchool: function() {
      return this.privacyEnabled ? this.profile.school : '校园信息已隐藏'
    },
    displaySign: function() {
      return this.privacyEnabled ? this.profile.sign : '已开启隐私保护，仅自己可见'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.settingMap = settingsStore.getSettingMap()
    this.menus = buildMenus()
    if (!this.loggedIn) {
      this.unreadCount = 0
      this.profile = buildDefaultProfile()
      this.activityStats = { joinedCount: 0, ongoingCount: 0 }
      return
    }
    this.loadProfile()
    this.loadUnreadCount()
    this.loadActivitySummary()
  },
  methods: {
    loadProfile: function() {
      var self = this
      api.getMyProfile()
        .then(function(profile) {
          var currentUser = session.getUser() || {}
          self.profile = Object.assign({}, buildDefaultProfile(), profile || {}, {
            avatarUrl: (profile && profile.avatarUrl) || currentUser.avatarUrl || ''
          })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.profile = buildDefaultProfile()
            return
          }
          self.profile = buildDefaultProfile()
        })
    },
    loadUnreadCount: function() {
      var self = this
      if (!self.pushEnabled) {
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
    loadActivitySummary: function() {
      var self = this
      api.getMyActivitySummary()
        .then(function(summary) {
          self.activityStats = summary || { joinedCount: 0, ongoingCount: 0 }
        })
        .catch(function() {
          self.activityStats = { joinedCount: 0, ongoingCount: 0 }
        })
    },
    go: function(path) {
      uni.navigateTo({ url: path })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    logout: function() {
      var self = this
      api.logoutUser()
        .catch(function() {
          return null
        })
        .finally(function() {
          session.clearSession()
          self.loggedIn = false
          self.unreadCount = 0
          self.profile = buildDefaultProfile()
          self.activityStats = { joinedCount: 0, ongoingCount: 0 }
          uni.showToast({ title: '已退出登录', icon: 'none' })
        })
    }
  }
}
</script>

<style>
.profile-shell {
  padding-bottom: 48rpx;
}

.guest-hero,
.profile-hero {
  z-index: 2;
  margin-top: 0;
  padding: 18rpx 18rpx 20rpx;
  border-radius: 28rpx;
}

.profile-hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.profile-hero-badge {
  padding: 8rpx 14rpx;
  font-size: 18rpx;
}

.profile-hero-title {
  margin-top: 10rpx;
  font-size: 36rpx;
  line-height: 1.14;
}

.profile-hero-copy {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.45;
}

.profile-login-button {
  margin-top: 18rpx;
}

.profile-topline {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 18rpx;
  margin-top: 12rpx;
}

.profile-edit-pill {
  flex-shrink: 0;
  font-size: 20rpx;
}

.profile-avatar {
  width: 84rpx;
  height: 84rpx;
  font-size: 30rpx;
}

.profile-avatar-shell {
  overflow: hidden;
  padding: 0;
}

.profile-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.profile-name,
.profile-school,
.profile-sign {
  max-width: 420rpx;
}

.profile-name {
  font-size: 40rpx;
  line-height: 1.1;
}

.profile-school {
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 1.4;
}

.profile-sign {
  margin-top: 12rpx;
  color: rgba(255, 255, 255, 0.84);
  font-size: 22rpx;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.profile-stat-row,
.profile-mini-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8rpx;
  margin-top: 14rpx;
}

.profile-stat-chip,
.profile-mini-action {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  width: 100%;
  min-height: 54rpx;
  gap: 6rpx;
  padding: 10rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.14);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
}

.profile-stat-value,
.profile-mini-action-value {
  display: inline-block;
  min-width: 22rpx;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.profile-stat-label,
.profile-mini-action-label {
  display: inline-block;
  min-width: 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 18rpx;
  line-height: 1;
  white-space: nowrap;
  text-align: left;
}

.income-card,
.menu-card {
  margin-top: 18rpx;
}

.income-card-entry:active {
  transform: scale(0.99);
}

.income-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.income-copy {
  margin-top: 8rpx;
  color: var(--campus-text-soft);
  font-size: 22rpx;
  line-height: 1.45;
}

.income-value {
  margin-top: 16rpx;
  color: var(--campus-text);
  font-size: 44rpx;
  font-weight: 700;
}

.income-sticker {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(126, 205, 179, 0.18);
  color: var(--campus-text);
  font-size: 22rpx;
  font-weight: 700;
}

.income-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 16rpx;
}

.income-chip {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 250, 245, 0.92);
  border: 1rpx solid rgba(43, 24, 34, 0.08);
  color: var(--campus-text-soft);
  font-size: 20rpx;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10rpx;
}

.menu-item {
  position: relative;
  padding: 16rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(245, 249, 253, 0.96);
}

.menu-title {
  color: var(--campus-text);
  font-size: 24rpx;
  font-weight: 700;
}

.menu-copy {
  margin-top: 4rpx;
  color: var(--campus-text-muted);
  font-size: 19rpx;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  padding-right: 18rpx;
}

.menu-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  min-width: 30rpx;
  padding: 2rpx 8rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff9c95, #ff6d8f);
  color: #ffffff;
  font-size: 17rpx;
  text-align: center;
}

.menu-badge.subtle {
  background: rgba(123, 198, 233, 0.2);
  color: var(--campus-text);
}

.logout-button {
  margin-top: 18rpx;
}

.income-card,
.menu-card {
  position: relative;
  overflow: hidden;
}

.menu-item {
  min-height: 102rpx;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.menu-item::after {
  content: "›";
  position: absolute;
  right: 14rpx;
  bottom: 14rpx;
  color: var(--campus-secondary);
  font-size: 22rpx;
  line-height: 1;
}

.menu-title {
  padding-right: 18rpx;
}
</style>
