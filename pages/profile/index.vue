<template>
  <view class="page-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">游客模式</view>
      <view class="hero-title">登录后解锁你的创作者中心</view>
      <view class="hero-copy">登录后，你可以查看我的发布、收藏、消息、粉丝，以及来自真实后端的创作者收益数据。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="hero-card">
        <view class="hero-badge">个人主页</view>
        <view class="meta-line" style="margin-top:18rpx;">
          <view class="meta-left">
            <view class="avatar">{{ profile.avatar }}</view>
            <view>
              <view class="hero-title" style="margin-top:0; font-size:38rpx;">{{ profile.name }}</view>
              <view class="hero-copy" style="margin-top:8rpx; font-size:24rpx;">{{ profile.school }}</view>
            </view>
          </view>
          <view class="side-pill side-pill-active" @click="go('/pages/edit-profile/index')">编辑资料</view>
        </view>
        <view class="hero-copy">{{ profile.sign }}</view>
      </view>

      <view class="panel-card">
        <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
      </view>

      <view class="metric-row">
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

      <view class="panel-card" style="margin-top:18rpx;">
        <view class="section-title" style="margin-top:0;">创作者收益中心</view>
        <view class="text-main">预计累计收益 {{ profile.income }}</view>
        <view class="text-copy">当前共有 {{ profile.cooperation }} 条合作记录，可在后台继续跟踪佣金与合作进度。</view>
      </view>

      <view class="section-title">内容与社交管理</view>
      <view class="grid-menu">
        <view class="grid-item" v-for="item in menus" :key="item.path" @click="go(item.path)">
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
    income: '$0.00',
    cooperation: 0
  }
}

function buildMenus() {
  return [
    { title: '我的发布', copy: '查看已发布的穿搭内容', path: '/pages/my-posts/index' },
    { title: '我的收藏', copy: '管理已收藏的穿搭与商品', path: '/pages/favorites/index' },
    { title: '关注 / 粉丝', copy: '查看你的社交关系与创作者连接', path: '/pages/follows/index' },
    { title: '消息通知', copy: '互动、收益与合作提醒', path: '/pages/messages/index' },
    { title: '草稿箱', copy: '继续编辑未完成的穿搭草稿', path: '/pages/drafts/index' },
    { title: '设置', copy: '账号、隐私与推送设置', path: '/pages/settings/index' },
    { title: '编辑资料', copy: '修改昵称、学校与个性签名', path: '/pages/edit-profile/index' },
    { title: '启动页', copy: '再次查看品牌启动页', path: '/pages/splash/index' }
  ]
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      profile: buildDefaultProfile(),
      statusText: '正在同步个人资料...',
      menus: buildMenus()
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.menus = buildMenus()
    if (!this.loggedIn) {
      this.statusText = '当前以游客身份浏览。'
      this.profile = buildDefaultProfile()
      return
    }
    this.loadProfile()
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
          self.profile = buildDefaultProfile()
          self.statusText = '已退出登录。'
          uni.showToast({ title: '已退出登录', icon: 'none' })
        })
    }
  }
}
</script>

<style>
</style>
