<template>
  <view class="page-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">游客模式</view>
      <view class="hero-title">登录后管理账号设置</view>
      <view class="hero-copy">登录后可管理个性偏好、账号信息并安全退出。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="page-title">设置</view>
        <view class="page-desc">管理账号信息、本地偏好和后端连接状态。</view>
      </view>

      <view class="panel-card">
        <view class="setting-item">
          <view class="setting-left">
            <view class="setting-title">账号</view>
            <view class="setting-copy">{{ accountLabel }}</view>
          </view>
          <view class="float-link" @click="goEdit">编辑</view>
        </view>
        <view class="divider-line"></view>
        <view class="setting-item">
          <view class="setting-left">
            <view class="setting-title">后端</view>
            <view class="setting-copy">{{ backendLabel }}</view>
          </view>
          <view class="float-link" @click="refreshBackend">刷新</view>
        </view>
      </view>

      <view class="panel-card">
        <view class="setting-item" v-for="item in settings" :key="item.key">
          <view class="setting-left">
            <view class="setting-title">{{ item.title }}</view>
            <view class="setting-copy">{{ item.copy }}</view>
          </view>
          <view :class="['switch-pill', item.active ? 'switch-pill-active' : '']" @click="toggle(item)">{{ item.active ? '开' : '关' }}</view>
        </view>
      </view>

      <view class="panel-card">
        <view class="setting-item">
          <view class="setting-left">
            <view class="setting-title">退出登录</view>
            <view class="setting-copy">安全清除本地 token ，并返回游客模式。</view>
          </view>
          <view class="float-link" @click="logout">退出登录</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

var SETTINGS_KEY = 'campusfit_local_settings'

function defaultSettings() {
  return [
    { key: 'push', title: '推送提醒', copy: '及时接收互动与导购提醒。', active: true },
    { key: 'privacy', title: '资料隐私', copy: '将校园身份信息保持在更安全的可见范围内。', active: true },
    { key: 'recommend', title: '个性化推荐', copy: '根据你的互动行为优化内容推荐。', active: true },
    { key: 'safe', title: '理性消费提醒', copy: '在商品跳转页面保持预算意识提醒。', active: true }
  ]
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      accountLabel: '正在加载账号信息...',
      backendLabel: '正在检查后端状态...',
      settings: defaultSettings()
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.loadSettings()
    this.refreshAccount()
    this.refreshBackend()
  },
  methods: {
    loadSettings: function() {
      var stored = uni.getStorageSync(SETTINGS_KEY)
      if (stored && stored.length) {
        this.settings = stored
      } else {
        this.settings = defaultSettings()
      }
    },
    persistSettings: function() {
      uni.setStorageSync(SETTINGS_KEY, this.settings)
    },
    refreshAccount: function() {
      if (!this.loggedIn) {
        this.accountLabel = '游客模式'
        return
      }
      var user = session.getUser() || {}
      this.accountLabel = (user.nickname || '校园用户') + ' | ' + (user.phone || '未绑定手机号')
    },
    refreshBackend: function() {
      if (!this.loggedIn) {
        this.backendLabel = '登录后可检查当前后端会话状态。'
        return
      }
      this.backendLabel = api.getActiveBaseUrl() || '已连接后端服务'
      api.getCurrentUser()
        .then(function() {})
        .catch(function() {})
    },
    toggle: function(item) {
      item.active = !item.active
      this.persistSettings()
    },
    goEdit: function() {
      uni.navigateTo({ url: '/pages/edit-profile/index' })
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
          self.refreshAccount()
          self.refreshBackend()
          uni.showToast({ title: '已退出登录', icon: 'none' })
          setTimeout(function() {
            uni.switchTab({ url: '/pages/profile/index' })
          }, 350)
        })
    }
  }
}
</script>

<style>
</style>
