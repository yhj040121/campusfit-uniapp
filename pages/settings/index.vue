<template>
  <view class="page-shell settings-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后管理账号与偏好设置</view>
      <view class="hero-copy">隐私、推送、推荐和账户信息都在这里统一管理，退出登录也会从这里完成。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">设置中心</view>
        <view class="page-title">账号、隐私与推送偏好放进同一个控制面板</view>
        <view class="page-desc">设置项会优先保存在本地，账号和后端连接状态也会在这里同步展示。</view>
      </view>

      <view class="hero-card settings-hero">
        <view class="hero-badge">账户设置</view>
        <view class="hero-title">把账号状态和推送偏好都收紧管理</view>
        <view class="hero-copy">这里既负责基础偏好切换，也承接退出登录、资料编辑和当前服务连接状态。</view>
      </view>

      <view class="panel-card">
        <view class="setting-item">
          <view class="setting-left">
            <view class="setting-title">账号信息</view>
            <view class="setting-copy">{{ accountLabel }}</view>
          </view>
          <view class="float-link" @click="goEdit">编辑资料</view>
        </view>
        <view class="divider-line"></view>
        <view class="setting-item">
          <view class="setting-left">
            <view class="setting-title">后端服务</view>
            <view class="setting-copy">{{ backendLabel }}</view>
          </view>
          <view class="float-link" @click="refreshBackend">刷新状态</view>
        </view>
      </view>

      <view class="panel-card">
        <view class="setting-item" v-for="item in settings" :key="item.key">
          <view class="setting-left">
            <view class="setting-title">{{ item.title }}</view>
            <view class="setting-copy">{{ item.copy }}</view>
          </view>
          <view :class="['switch-pill', item.active ? 'switch-pill-active' : '']" @click="toggle(item)">{{ item.active ? '已开启' : '已关闭' }}</view>
        </view>
      </view>

      <view class="panel-card">
        <view class="setting-item">
          <view class="setting-left">
            <view class="setting-title">退出登录</view>
            <view class="setting-copy">退出后会清空当前 token，并回到个人中心未登录状态。</view>
          </view>
          <view class="float-link" @click="logout">退出账号</view>
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
    { key: 'push', title: '消息推送', copy: '及时接收评论、点赞、收益与活动提醒', active: true },
    { key: 'privacy', title: '隐私可见', copy: '控制校园信息与个人资料的展示范围', active: true },
    { key: 'recommend', title: '个性化推荐', copy: '根据你的浏览和互动记录推荐内容', active: true },
    { key: 'safe', title: '理性消费提醒', copy: '导购场景下展示预算与消费提示', active: true }
  ]
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      accountLabel: '正在同步账号信息...',
      backendLabel: '正在检测服务状态...',
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
        this.accountLabel = '当前未登录'
        return
      }
      var user = session.getUser() || {}
      this.accountLabel = (user.nickname || '未命名用户') + ' | ' + (user.phone || '未绑定手机号')
    },
    refreshBackend: function() {
      if (!this.loggedIn) {
        this.backendLabel = '未登录时不校验后端连接'
        return
      }
      this.backendLabel = api.getActiveBaseUrl() || '暂未检测到服务地址'
      api.getCurrentUser().then(function() {}).catch(function() {})
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
      api.logoutUser().catch(function() { return null }).finally(function() {
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
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.setting-item + .setting-item {
  margin-top: 26rpx;
}

.setting-left {
  flex: 1;
  min-width: 0;
}

.setting-title {
  color: var(--campus-text);
  font-size: 27rpx;
  font-weight: 700;
}

.setting-copy {
  margin-top: 10rpx;
  color: var(--campus-text-soft);
  font-size: 23rpx;
  line-height: 1.7;
}
</style>
