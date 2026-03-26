<template>
  <view class="page-shell settings-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后管理账号与偏好设置</view>
      <view class="hero-copy">隐私、推送、推荐和消费提醒都会集中在这里，退出登录也会从这里完成。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">设置中心</view>
        <view class="page-title">账号、隐私与推送偏好放进同一个控制面板</view>
        <view class="page-desc">设置项会优先保存在本地，账号信息和使用状态也会在这里统一展示。</view>
      </view>

      <view class="hero-card settings-hero">
        <view class="hero-badge">偏好设置</view>
        <view class="hero-title">把常用开关收在一个更轻的面板里</view>
        <view class="hero-copy">这里只保留日常会用到的设置项，减少信息干扰。</view>
      </view>

      <view class="panel-card settings-list-card">
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
<!--            <view class="setting-copy">退出后会清空当前 token，并回到个人中心未登录状态。</view> -->
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
var settingsStore = require('../../common/settings.js')

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      settings: settingsStore.getSettings()
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.loadSettings()
  },
  methods: {
    loadSettings: function() {
      this.settings = settingsStore.getSettings()
    },
    persistSettings: function() {
      this.settings = settingsStore.saveSettings(this.settings)
    },
    toggle: function(item) {
      item.active = !item.active
      this.persistSettings()
      uni.showToast({ title: this.getToggleToast(item), icon: 'none' })
    },
    getToggleToast: function(item) {
      if (item.key === 'push') {
        return item.active ? '消息提醒已恢复' : '消息红点与未读提醒已关闭'
      }
      if (item.key === 'privacy') {
        return item.active ? '个人资料已恢复展示' : '个人资料已切换为隐藏'
      }
      if (item.key === 'recommend') {
        return item.active ? '已恢复个性化推荐' : '首页将改为更基础的推荐方式'
      }
      if (item.key === 'safe') {
        return item.active ? '理性消费提示已开启' : '理性消费提示已关闭'
      }
      return item.active ? '设置已开启' : '设置已关闭'
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    logout: function() {
      var self = this
      api.logoutUser().catch(function() { return null }).finally(function() {
        session.clearSession()
        self.loggedIn = false
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
.settings-shell {
  padding-top: 10rpx;
}

.settings-shell .page-header {
  display: none;
}

.settings-hero {
  margin-top: 0;
  padding: 18rpx 18rpx;
  border-radius: 28rpx;
}

.settings-hero .hero-badge {
  padding: 8rpx 14rpx;
  font-size: 18rpx;
}

.settings-hero .hero-title {
  margin-top: 10rpx;
  font-size: 36rpx;
  line-height: 1.14;
}

.settings-hero .hero-copy {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.45;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.setting-item + .setting-item {
  margin-top: 0;
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(43, 24, 34, 0.08);
}

.setting-left {
  flex: 1;
  min-width: 0;
}

.setting-title {
  color: var(--campus-text);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.3;
}

.setting-copy {
  margin-top: 4rpx;
  color: var(--campus-text-soft);
  font-size: 20rpx;
  line-height: 1.45;
}

.settings-list-card {
  padding-top: 14rpx;
  padding-bottom: 14rpx;
}

.settings-shell .switch-pill {
  min-width: 108rpx;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  font-size: 21rpx;
  font-weight: 700;
  line-height: 1.2;
  box-sizing: border-box;
  white-space: nowrap;
}

.settings-shell {
  min-height: 100vh;
  padding-top: 12rpx;
  padding-bottom: calc(88rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at top left, rgba(253, 210, 167, 0.24), transparent 34%),
    radial-gradient(circle at top right, rgba(68, 165, 255, 0.16), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f5f6f7 46%, #eef4fa 100%);
}

.settings-shell .hero-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1e74bf 0%, #3f8fe1 52%, #6aaef8 100%);
  box-shadow: 0 24rpx 52rpx rgba(23, 76, 132, 0.16);
}

.settings-shell .hero-card::after {
  content: '';
  position: absolute;
  right: -72rpx;
  top: -56rpx;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  filter: blur(16rpx);
}

.settings-shell .hero-badge,
.settings-shell .hero-title,
.settings-shell .hero-copy {
  position: relative;
  z-index: 1;
}

.settings-shell .hero-badge {
  background: rgba(255, 255, 255, 0.16);
  color: #eef6ff;
}

.settings-shell .hero-title {
  color: #ffffff;
}

.settings-shell .hero-copy {
  color: rgba(238, 246, 255, 0.84);
}

.settings-shell .panel-card {
  border-radius: 32rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 24rpx 52rpx rgba(25, 52, 87, 0.07);
  backdrop-filter: blur(24rpx);
}

.settings-shell .setting-item + .setting-item {
  border-top-color: rgba(191, 208, 226, 0.38);
}

.settings-shell .setting-title {
  color: #223247;
}

.settings-shell .setting-copy {
  color: #6a788a;
}

.settings-shell .switch-pill {
  border: 2rpx solid rgba(68, 165, 255, 0.14);
  background: rgba(255, 255, 255, 0.84);
  color: #6a788a;
}

.settings-shell .switch-pill-active {
  background: linear-gradient(90deg, #005e9f 0%, #44a5ff 100%);
  color: #edf3ff;
  border-color: transparent;
  box-shadow: 0 14rpx 28rpx rgba(0, 94, 159, 0.16);
}

.settings-shell .float-link {
  padding: 14rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(68, 165, 255, 0.1);
  color: #1f63ac;
}
</style>
