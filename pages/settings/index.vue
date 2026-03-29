<template>
  <view class="page-shell settings-shell">
    <view v-if="!loggedIn" class="settings-hero-card">
      <view class="settings-hero-badge">需要登录</view>
      <view class="settings-hero-title">登录后管理账号与常用设置</view>
      <view class="settings-hero-copy">推送提醒、隐私展示、推荐偏好和消费提示都会集中在这里，退出登录也会在这里完成。</view>
      <button class="btn-primary settings-hero-button" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="settings-summary-card">
        <view class="settings-summary-head">
          <view class="settings-summary-profile">
            <image
              v-if="userInfo && userInfo.avatarUrl"
              class="settings-summary-avatar"
              :src="userInfo.avatarUrl"
              mode="aspectFill"
            ></image>
            <view v-else class="settings-summary-avatar settings-summary-avatar-fallback">{{ profileInitial }}</view>

            <view class="settings-summary-copygroup">
              <view class="settings-summary-kicker">SETTINGS</view>
              <view class="settings-summary-title">{{ profileName }}</view>
              <view class="settings-summary-copy">{{ profilePhone }}</view>
            </view>
          </view>

          <view class="settings-summary-badge">
            <text class="settings-summary-badge-value">{{ enabledCount }}</text>
            <text class="settings-summary-badge-label">已开启</text>
          </view>
        </view>

        <view class="settings-summary-note">{{ summaryCopy }}</view>
      </view>

      <view class="settings-section-card">
        <view class="settings-section-head">
          <view class="settings-section-kicker">消息与互动</view>
          <view class="settings-section-copy">把常用提醒和推荐偏好收在一起，减少切换成本。</view>
        </view>

        <view class="settings-list">
          <view
            v-for="item in messageSettings"
            :key="item.key"
            class="settings-item"
            @click="toggle(item)"
          >
            <view :class="['settings-item-icon', 'settings-item-icon-' + item.accent]">{{ item.badge }}</view>
            <view class="settings-item-copygroup">
              <view class="settings-item-title">{{ item.title }}</view>
              <view class="settings-item-copy">{{ item.copy }}</view>
            </view>
            <view :class="['settings-switch-pill', item.active ? 'settings-switch-pill-active' : '']">
              {{ item.active ? '已开启' : '已关闭' }}
            </view>
          </view>
        </view>
      </view>

      <view class="settings-section-card">
        <view class="settings-section-head">
          <view class="settings-section-kicker">隐私与消费提醒</view>
          <view class="settings-section-copy">这组设置会影响资料展示方式，以及导购场景下的消费提示。</view>
        </view>

        <view class="settings-list">
          <view
            v-for="item in privacySettings"
            :key="item.key"
            class="settings-item"
            @click="toggle(item)"
          >
            <view :class="['settings-item-icon', 'settings-item-icon-' + item.accent]">{{ item.badge }}</view>
            <view class="settings-item-copygroup">
              <view class="settings-item-title">{{ item.title }}</view>
              <view class="settings-item-copy">{{ item.copy }}</view>
            </view>
            <view :class="['settings-switch-pill', item.active ? 'settings-switch-pill-active' : '']">
              {{ item.active ? '已开启' : '已关闭' }}
            </view>
          </view>
        </view>
      </view>

      <view class="settings-logout-card">
        <view class="settings-logout-head">
          <view class="settings-logout-kicker">账号操作</view>
          <view class="settings-logout-copy">退出后会清空当前登录状态，下次进入需要重新登录。</view>
        </view>
        <view class="settings-logout-button" @click="logout">退出账号</view>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var settingsStore = require('../../common/settings.js')

var SETTING_META = {
  push: {
    title: '消息提醒',
    copy: '及时接收评论、点赞、激励和活动通知',
    section: 'message',
    badge: '消',
    accent: 'blue'
  },
  recommend: {
    title: '个性化推荐',
    copy: '根据你的浏览和互动记录推荐内容',
    section: 'message',
    badge: '荐',
    accent: 'cyan'
  },
  privacy: {
    title: '隐私可见',
    copy: '控制校园信息与个人资料的展示范围',
    section: 'privacy',
    badge: '隐',
    accent: 'amber'
  },
  safe: {
    title: '理性消费提示',
    copy: '导购场景下展示预算与消费提醒',
    section: 'privacy',
    badge: '安',
    accent: 'rose'
  }
}

function decorateSetting(item) {
  var meta = SETTING_META[item && item.key] || {}
  return Object.assign({}, item, {
    title: meta.title || item.title || '设置项',
    copy: meta.copy || item.copy || '',
    section: meta.section || 'message',
    badge: meta.badge || '设',
    accent: meta.accent || 'blue'
  })
}

function decorateSettings(list) {
  return (list || []).map(function(item) {
    return decorateSetting(item)
  })
}

function getProfileName(userInfo) {
  if (!userInfo) {
    return '当前账号'
  }
  return userInfo.nickname || userInfo.phone || '当前账号'
}

function maskPhone(phone) {
  if (!phone) {
    return '账号信息已保存在本机'
  }
  var text = String(phone)
  if (text.length < 7) {
    return text
  }
  return text.slice(0, 3) + '****' + text.slice(-4)
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      userInfo: session.getUser() || null,
      settings: decorateSettings(settingsStore.getSettings())
    }
  },
  computed: {
    enabledCount: function() {
      return this.settings.filter(function(item) {
        return !!item.active
      }).length
    },
    summaryCopy: function() {
      return '当前已开启 ' + this.enabledCount + ' / ' + this.settings.length + ' 项常用设置，改动会优先保存在本机。'
    },
    profileName: function() {
      return getProfileName(this.userInfo)
    },
    profilePhone: function() {
      return maskPhone(this.userInfo && this.userInfo.phone)
    },
    profileInitial: function() {
      var name = this.profileName || '我'
      return name.slice(0, 1).toUpperCase()
    },
    messageSettings: function() {
      return this.settings.filter(function(item) {
        return item.section === 'message'
      })
    },
    privacySettings: function() {
      return this.settings.filter(function(item) {
        return item.section === 'privacy'
      })
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.userInfo = session.getUser() || null
    this.loadSettings()
  },
  methods: {
    loadSettings: function() {
      this.settings = decorateSettings(settingsStore.getSettings())
    },
    persistSettings: function() {
      this.settings = decorateSettings(settingsStore.saveSettings(this.settings))
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
      api.logoutUser().catch(function() {
        return null
      }).finally(function() {
        session.clearSession()
        self.loggedIn = false
        self.userInfo = null
        uni.showToast({ title: '已退出登录', icon: 'none' })
        setTimeout(function() {
          uni.switchTab({ url: '/pages/profile/index' })
        }, 350)
      })
    }
  }
}
</script>

<style scoped>
.settings-shell {
  min-height: 100vh;
  padding: calc(24rpx + env(safe-area-inset-top)) 24rpx calc(172rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(253, 210, 167, 0.24), transparent 34%),
    radial-gradient(circle at top right, rgba(68, 165, 255, 0.16), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f5f7fa 42%, #eef4fa 100%);
}

.settings-hero-card,
.settings-summary-card,
.settings-section-card,
.settings-logout-card {
  border-radius: 32rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 22rpx 54rpx rgba(25, 52, 87, 0.08);
  backdrop-filter: blur(22rpx);
}

.settings-hero-card {
  padding: 34rpx 30rpx;
}

.settings-hero-badge {
  width: fit-content;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(68, 165, 255, 0.12);
  color: #1f63ac;
  font-size: 22rpx;
  font-weight: 700;
}

.settings-hero-title {
  margin-top: 18rpx;
  color: #24364a;
  font-size: 42rpx;
  font-weight: 800;
  line-height: 1.18;
}

.settings-hero-copy {
  margin-top: 14rpx;
  color: #66768b;
  font-size: 24rpx;
  line-height: 1.7;
}

.settings-hero-button {
  margin-top: 26rpx;
}

.settings-summary-card {
  padding: 28rpx;
}

.settings-summary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.settings-summary-profile {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.settings-summary-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 28rpx;
  flex-shrink: 0;
}

.settings-summary-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #cfe3fb 0%, #e8f3ff 100%);
  color: #1f63ac;
  font-size: 32rpx;
  font-weight: 800;
}

.settings-summary-copygroup {
  flex: 1;
  min-width: 0;
}

.settings-summary-kicker {
  color: #1f63ac;
  font-size: 22rpx;
  font-weight: 800;
  letter-spacing: 3rpx;
}

.settings-summary-title {
  margin-top: 8rpx;
  color: #24364a;
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1.16;
}

.settings-summary-copy {
  margin-top: 10rpx;
  color: #66768b;
  font-size: 24rpx;
  line-height: 1.55;
}

.settings-summary-badge {
  min-width: 116rpx;
  padding: 14rpx 18rpx;
  border-radius: 26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
  background: linear-gradient(145deg, #f1f8ff 0%, #d8eefe 100%);
  color: #1f63ac;
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.7);
}

.settings-summary-badge-value {
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1;
}

.settings-summary-badge-label {
  font-size: 20rpx;
  font-weight: 700;
  opacity: 0.82;
}

.settings-summary-note {
  margin-top: 20rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(68, 165, 255, 0.08);
  color: #5e6f84;
  font-size: 22rpx;
  line-height: 1.6;
}

.settings-section-card,
.settings-logout-card {
  margin-top: 18rpx;
  padding: 26rpx 24rpx;
}

.settings-section-head {
  margin-bottom: 14rpx;
}

.settings-section-kicker,
.settings-logout-kicker {
  color: #24364a;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.2;
}

.settings-section-copy,
.settings-logout-copy {
  margin-top: 10rpx;
  color: #6a788a;
  font-size: 22rpx;
  line-height: 1.6;
}

.settings-list {
  display: flex;
  flex-direction: column;
}

.settings-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
}

.settings-item + .settings-item {
  border-top: 1rpx solid rgba(191, 208, 226, 0.38);
}

.settings-item-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 800;
  flex-shrink: 0;
}

.settings-item-icon-blue {
  background: rgba(68, 165, 255, 0.12);
  color: #1f63ac;
}

.settings-item-icon-cyan {
  background: rgba(84, 210, 208, 0.14);
  color: #177d88;
}

.settings-item-icon-amber {
  background: rgba(255, 236, 193, 0.8);
  color: #a5710b;
}

.settings-item-icon-rose {
  background: rgba(255, 228, 234, 0.88);
  color: #c4586c;
}

.settings-item-copygroup {
  flex: 1;
  min-width: 0;
}

.settings-item-title {
  color: #223247;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 1.35;
}

.settings-item-copy {
  margin-top: 6rpx;
  color: #6a788a;
  font-size: 21rpx;
  line-height: 1.55;
}

.settings-switch-pill {
  min-width: 116rpx;
  padding: 14rpx 18rpx;
  border-radius: 999rpx;
  border: 2rpx solid rgba(68, 165, 255, 0.14);
  background: rgba(255, 255, 255, 0.84);
  color: #6a788a;
  font-size: 21rpx;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  box-sizing: border-box;
  flex-shrink: 0;
}

.settings-switch-pill-active {
  background: linear-gradient(90deg, #005e9f 0%, #44a5ff 100%);
  color: #edf3ff;
  border-color: transparent;
  box-shadow: 0 14rpx 28rpx rgba(0, 94, 159, 0.16);
}

.settings-logout-button {
  margin-top: 22rpx;
  min-height: 76rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 235, 237, 0.98);
  color: #df4c63;
  font-size: 24rpx;
  font-weight: 800;
}
</style>
