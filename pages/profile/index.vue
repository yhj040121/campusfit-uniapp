<template>
  <view class="page-shell profile-shell">
    <view v-if="!loggedIn" class="hero-card guest-hero">
      <view class="hero-badge">游客模式</view>
      <view class="hero-title">登录后打开你的创作者中心</view>
      <view class="hero-copy">我的发布、收藏、活动、消息和收益状态都会集中在这里，方便你管理自己的校园内容轨迹。</view>
      <view class="guest-points">
        <view class="guest-point">查看我的发布与收藏</view>
        <view class="guest-point">管理消息与活动状态</view>
        <view class="guest-point">继续编辑资料与草稿</view>
      </view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="hero-card profile-hero">
        <view class="hero-badge">创作者中心</view>
        <view class="profile-topline">
          <view class="meta-left">
            <view class="avatar profile-avatar">{{ profile.avatar }}</view>
            <view>
              <view class="hero-title profile-name">{{ profile.name }}</view>
              <view class="hero-copy profile-school">{{ profile.school }}</view>
            </view>
          </view>
          <view class="side-pill side-pill-active" @click="go('/pages/edit-profile/index')">编辑资料</view>
        </view>
        <view class="hero-copy profile-sign">{{ profile.sign }}</view>
        <view class="hero-card-row">
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">{{ unreadCount }}</text>
            <text class="hero-card-pill-label">未读消息</text>
          </view>
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">{{ profile.cooperation }}</text>
            <text class="hero-card-pill-label">合作邀约</text>
          </view>
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">{{ activityStats.joinedCount }}</text>
            <text class="hero-card-pill-label">已参与活动</text>
          </view>
        </view>
      </view>

      <view class="metric-row profile-metrics">
        <view class="metric-card">
          <view class="metric-value">{{ profile.following }}</view>
          <view class="metric-label">关注</view>
        </view>
        <view class="metric-card">
          <view class="metric-value">{{ profile.followers }}</view>
          <view class="metric-label">粉丝</view>
        </view>
        <view class="metric-card">
          <view class="metric-value">{{ profile.likes }}</view>
          <view class="metric-label">获赞</view>
        </view>
      </view>

      <view class="panel-card income-card">
        <view class="section-head">
          <view>
            <view class="section-title" style="margin-top:0;">创作者收益中心</view>
            <view class="section-subtitle">把导购分佣和合作邀约放在一起查看</view>
          </view>
          <view class="income-sticker">收益</view>
        </view>
        <view class="income-value">{{ profile.income }}</view>
        <view class="text-copy">当前共有 {{ profile.cooperation }} 条合作邀约，活动参与和导购内容会一起影响你的创作曝光。</view>
      </view>

      <view class="panel-card menu-card">
        <view class="section-head">
          <view>
            <view class="section-title">内容与社交管理</view>
            <view class="section-subtitle">把常用入口整理成一块清晰的个人工作台</view>
          </view>
        </view>
        <view class="menu-grid">
          <view class="menu-item" v-for="item in menus" :key="item.key" @click="go(item.path)">
            <view class="menu-badge" v-if="item.key === 'messages' && unreadCount > 0">{{ unreadBadgeText }}</view>
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

function buildDefaultProfile() {
  return {
    name: '校园新同学',
    avatar: 'C',
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
    { key: 'posts', title: '我的发布', copy: '查看和管理已经发布的穿搭内容', path: '/pages/my-posts/index' },
    { key: 'favorites', title: '我的收藏', copy: '回看收藏过的穿搭和商品线索', path: '/pages/favorites/index' },
    { key: 'activity', title: '我的活动', copy: '查看已报名活动和当前绑定专题', path: '/pages/my-activity/index' },
    { key: 'follows', title: '关注 / 粉丝', copy: '管理社交关系与互动对象', path: '/pages/follows/index' },
    { key: 'messages', title: '消息通知', copy: '查看评论、点赞、收益和合作提醒', path: '/pages/messages/index' },
    { key: 'drafts', title: '草稿箱', copy: '继续编辑尚未完成的内容草稿', path: '/pages/drafts/index' },
    { key: 'settings', title: '设置', copy: '管理账号、隐私与推送偏好', path: '/pages/settings/index' },
    { key: 'profile', title: '编辑资料', copy: '更新昵称、学校和个性签名', path: '/pages/edit-profile/index' }
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
      menus: buildMenus()
    }
  },
  computed: {
    unreadBadgeText: function() {
      return this.unreadCount > 99 ? '99+' : String(this.unreadCount)
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
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
          self.profile = profile || buildDefaultProfile()
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

.guest-points {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 20rpx;
}

.guest-point {
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.92);
  font-size: 24rpx;
}

.profile-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.profile-avatar {
  width: 92rpx;
  height: 92rpx;
  font-size: 34rpx;
}

.profile-name,
.profile-school,
.profile-sign {
  max-width: 420rpx;
}

.income-card,
.menu-card {
  margin-top: 24rpx;
}

.income-value {
  margin-top: 20rpx;
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

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.menu-item {
  position: relative;
  padding: 26rpx 24rpx;
  border-radius: 26rpx;
  background: rgba(245, 249, 253, 0.96);
}

.menu-title {
  color: var(--campus-text);
  font-size: 28rpx;
  font-weight: 700;
}

.menu-copy {
  margin-top: 10rpx;
  color: var(--campus-muted);
  font-size: 22rpx;
  line-height: 1.65;
}

.menu-badge {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  min-width: 40rpx;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff9c95, #ff6d8f);
  color: #ffffff;
  font-size: 20rpx;
  text-align: center;
}

.menu-badge.subtle {
  background: rgba(123, 198, 233, 0.2);
  color: var(--campus-text);
}

.logout-button {
  margin-top: 24rpx;
}
</style>
