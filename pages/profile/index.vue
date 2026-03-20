<template>
  <view class="page-shell profile-shell">
    <view v-if="!loggedIn" class="hero-card guest-hero">
      <view class="hero-badge">游客模式</view>
      <view class="hero-title">登录后解锁你的创作者中心</view>
      <view class="hero-copy">查看真实收益、消息红点、我的发布与社交互动，把校园灵感沉淀成你自己的风格名片。</view>
      <view class="guest-points">
        <view class="guest-point">创作者收益中心</view>
        <view class="guest-point">消息与粉丝提醒</view>
        <view class="guest-point">内容管理与草稿继续编辑</view>
      </view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="hero-card profile-hero">
        <view class="hero-badge">个人主页</view>
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
          <text class="hero-card-pill-label">合作记录</text>
        </view>
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">{{ activityStats.joinedCount }}</text>
          <text class="hero-card-pill-label">我的活动</text>
        </view>
      </view>
      </view>

      <view class="panel-card profile-status">
        <view class="section-head">
          <view>
            <view class="text-main">同步状态</view>
            <view class="section-subtitle">账号与提醒</view>
          </view>
          <view class="note-stamp">SYNC</view>
        </view>
        <view class="text-copy">{{ statusText }}</view>
        <view class="text-copy" style="margin-top:8rpx;">{{ unreadHint }}</view>
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
            <view class="section-subtitle">导购佣金与品牌合作</view>
          </view>
          <view class="income-sticker">收入看板</view>
        </view>
        <view class="income-value">{{ profile.income }}</view>
        <view class="text-copy">当前共有 {{ profile.cooperation }} 条合作记录，可在后台继续跟踪佣金与合作进度。</view>
      </view>

      <view class="section-head">
        <view class="section-title">内容与社交管理</view>
        <view class="section-subtitle">常用入口整理成便签卡片</view>
      </view>
      <view class="grid-menu">
        <view class="grid-item grid-item-badge profile-menu-card" v-for="item in menus" :key="item.path" @click="go(item.path)">
          <view v-if="item.key === 'messages' && unreadCount > 0" class="badge-count">{{ unreadBadgeText }}</view>
          <view class="menu-initial">{{ item.title.slice(0, 2) }}</view>
          <view class="grid-title">{{ item.title }}</view>
          <view class="grid-copy">{{ item.copy }}</view>
        </view>
      </view>

      <button class="btn-ghost" style="margin-top:24rpx;" @click="logout">退出登录</button>
    </view>

    <view class="bottom-gap"></view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var activity = require('../../common/activity.js')
var session = require('../../common/session.js')

function buildDefaultProfile() {
  return {
    name: '校园创作者',
    avatar: 'C',
    school: 'CampusFit 社区',
    sign: '分享真实的校园穿搭与理性导购推荐。',
    following: 0,
    followers: 0,
    likes: 0,
    income: '￥0.00',
    cooperation: 0
  }
}

function buildMenus() {
  return [
    { key: 'posts', title: '我的发布', copy: '查看已发布的穿搭内容', path: '/pages/my-posts/index' },
    { key: 'favorites', title: '我的收藏', copy: '管理已收藏的穿搭与商品', path: '/pages/favorites/index' },
    { key: 'activity', title: '我的活动', copy: '查看已报名的专题活动与挑战进度', path: '/pages/my-activity/index' },
    { key: 'follows', title: '关注 / 粉丝', copy: '查看你的社交关系与创作者连接', path: '/pages/follows/index' },
    { key: 'messages', title: '消息通知', copy: '互动、收益与合作提醒', path: '/pages/messages/index' },
    { key: 'drafts', title: '草稿箱', copy: '继续编辑未完成的穿搭草稿', path: '/pages/drafts/index' },
    { key: 'settings', title: '设置', copy: '账号、隐私与推送设置', path: '/pages/settings/index' },
    { key: 'profile', title: '编辑资料', copy: '修改昵称、学校与个性签名', path: '/pages/edit-profile/index' },
    { key: 'splash', title: '启动页', copy: '再次查看品牌启动页', path: '/pages/splash/index' }
  ]
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      profile: buildDefaultProfile(),
      activityStats: activity.getMyActivityStats(),
      unreadCount: 0,
      statusText: '正在同步个人资料...',
      menus: buildMenus()
    }
  },
  computed: {
    unreadBadgeText: function() {
      return this.unreadCount > 99 ? '99+' : String(this.unreadCount)
    },
    unreadHint: function() {
      if (this.unreadCount > 0) {
        return '未读消息 ' + this.unreadCount + ' 条，记得查看「消息通知」。'
      }
      return '暂无未读消息。'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.menus = buildMenus()
    this.activityStats = activity.getMyActivityStats()
    if (!this.loggedIn) {
      this.statusText = '当前以游客身份浏览。'
      this.unreadCount = 0
      this.profile = buildDefaultProfile()
      return
    }
    this.loadProfile()
    this.loadUnreadCount()
  },
  methods: {
    loadProfile: function() {
      var self = this
      api.getMyProfile()
        .then(function(profile) {
          self.profile = profile || buildDefaultProfile()
          self.statusText = '个人资料已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
        })
        .catch(function(error) {
          if ((error.message || '').toLowerCase().indexOf('login') > -1) {
            session.clearSession()
            self.loggedIn = false
            self.profile = buildDefaultProfile()
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          self.profile = buildDefaultProfile()
          self.statusText = '后端暂时不可用，已显示本地演示数据。'
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
          self.statusText = '已退出登录。'
          uni.showToast({ title: '已退出登录', icon: 'none' })
        })
    }
  }
}
</script>

<style scoped>
.profile-shell {
  padding-top: 30rpx;
}

.guest-hero,
.profile-hero {
  margin-top: 6rpx;
}

.guest-points {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 22rpx;
}

.guest-point {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.9);
  font-size: 22rpx;
}

.profile-topline,
.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}

.profile-avatar {
  width: 84rpx;
  height: 84rpx;
  margin-right: 20rpx;
  line-height: 84rpx;
  font-size: 30rpx;
}

.profile-name {
  margin-top: 0;
  font-size: 38rpx;
}

.profile-school {
  margin-top: 8rpx;
  font-size: 24rpx;
}

.profile-sign {
  margin-top: 20rpx;
}

.hero-card-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 22rpx;
}

.hero-card-pill {
  flex: 1;
  min-width: 160rpx;
  padding: 18rpx 16rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.16);
}

.hero-card-pill-value {
  display: block;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 700;
}

.hero-card-pill-label {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.84);
  font-size: 22rpx;
}

.profile-status,
.profile-metrics,
.income-card {
  margin-top: 16rpx;
}

.note-stamp {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(67, 198, 157, 0.14);
  color: #34a77f;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.income-sticker {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(255, 180, 107, 0.18);
  color: #d18a45;
  font-size: 20rpx;
  font-weight: 700;
}

.income-value {
  margin-top: 16rpx;
  color: #243646;
  font-size: 44rpx;
  font-weight: 700;
}

.profile-menu-card {
  position: relative;
  overflow: hidden;
}

.profile-menu-card::after {
  content: "";
  position: absolute;
  right: -12rpx;
  top: -20rpx;
  width: 90rpx;
  height: 90rpx;
  border-radius: 24rpx;
  background: rgba(87, 189, 240, 0.08);
  transform: rotate(16deg);
}

.menu-initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54rpx;
  height: 54rpx;
  border-radius: 18rpx;
  background: rgba(87, 189, 240, 0.12);
  color: #4a9fd5;
  font-size: 22rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}
</style>
