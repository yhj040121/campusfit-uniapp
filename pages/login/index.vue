<template>
  <view class="page-shell auth-shell">
    <view class="hero-card auth-hero">
      <view class="hero-badge">账号登录</view>
      <view class="hero-copy auth-hero-copy">快速进入你的校园穿搭内容流、创作空间和校园消息中心。</view>
      <view class="hero-card-row auth-hero-row">
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">24h</text>
          <text class="hero-card-pill-label">消息同步</text>
        </view>
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">1 步</text>
          <text class="hero-card-pill-label">回到个人页</text>
        </view>
      </view>
      <view class="hero-title">欢迎回到你的校园穿搭账号</view>
      

    </view>

    <view class="panel-card auth-panel">
      <view class="auth-panel-head">
        <view class="auth-kicker">快捷登录</view>
        <view class="text-main auth-main-title">手机号、密码和验证码集中填写，登录更顺手。</view>
        <view class="text-copy auth-subtitle">把常用登录信息放在同一块区域里，减少来回查找和切换。</view>
      </view>

      <view class="form-label">手机号</view>
      <input class="form-input" v-model="phone" maxlength="11" placeholder="请输入 11 位手机号" />

      <view class="form-label auth-field-gap">密码</view>
      <input class="form-input" v-model="password" password maxlength="20" placeholder="请输入密码" />

      <view class="form-label auth-field-gap">验证码</view>
      <view class="auth-code-row">
        <input class="form-input auth-code-input" v-model="code" maxlength="6" placeholder="请输入短信验证码" />
        <button
          class="btn-ghost auth-code-button"
          :disabled="sendingCode || countdown > 0"
          :loading="sendingCode"
          @click="sendCode"
        >
          {{ sendCodeText }}
        </button>
      </view>

      <view class="note-box auth-note">
        <view class="auth-note-title">登录提示</view>
        <view class="auth-note-line">输入手机号、密码和验证码后即可完成登录，信息会集中显示在这一块，不用反复来回找。</view>
      </view>

<!--      <view class="note-box auth-note">
        <view class="auth-note-title">当前测试规则</view>
        <view class="auth-note-line">点击发送验证码后，会收到当前环境的演示验证码 040121，并自动填入输入框。</view>
        <view class="auth-note-line">历史测试账号如果还没有设置密码，请先用初始密码 campus123 登录，登录成功后会自动升级为安全存储。</view>
      </view> -->

      <button class="btn-primary auth-submit" :loading="loading" @click="submit">登录并进入</button>
      <button class="btn-secondary auth-secondary" @click="goRegister">没有账号，去注册</button>
      <view class="float-link auth-entry-link" @click="goHome">先逛首页</view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

var DEMO_LOGIN_PHONE = '18688882026'

export default {
  data: function() {
    return {
      loading: false,
      sendingCode: false,
      countdown: 0,
      codeTimer: null,
      phone: '',
      password: '',
      code: ''
    }
  },
  computed: {
    sendCodeText: function() {
      if (this.countdown > 0) {
        return this.countdown + 's 后重发'
      }
      return this.sendingCode ? '发送中...' : '发送验证码'
    }
  },
  onLoad: function(options) {
    if (options && options.phone) {
      this.phone = options.phone
    }
  },
  onUnload: function() {
    this.clearCodeTimer()
  },
  methods: {
    clearCodeTimer: function() {
      if (this.codeTimer) {
        clearInterval(this.codeTimer)
        this.codeTimer = null
      }
    },
    startCountdown: function(seconds) {
      var self = this
      var safeSeconds = Number(seconds || 60)
      if (safeSeconds <= 0) {
        safeSeconds = 60
      }
      self.clearCodeTimer()
      self.countdown = safeSeconds
      self.codeTimer = setInterval(function() {
        if (self.countdown <= 1) {
          self.clearCodeTimer()
          self.countdown = 0
          return
        }
        self.countdown -= 1
      }, 1000)
    },
    sendCode: function() {
      var self = this
      if (self.sendingCode || self.countdown > 0) {
        return
      }
      if (!/^1\d{10}$/.test(self.phone)) {
        uni.showToast({ title: '请先输入 11 位手机号', icon: 'none' })
        return
      }
      self.sendingCode = true
      api.sendAuthCode(self.phone, 'login')
        .then(function(payload) {
          self.code = (payload && payload.code) || self.code
          self.startCountdown(payload && payload.retryAfterSeconds)
          uni.showToast({ title: '验证码已发送', icon: 'none' })
        })
        .catch(function(error) {
          uni.showToast({ title: error.message || '验证码发送失败', icon: 'none' })
        })
        .finally(function() {
          self.sendingCode = false
        })
    },
    submit: function() {
      var self = this
      if (!/^1\d{10}$/.test(self.phone)) {
        uni.showToast({ title: '请输入 11 位手机号', icon: 'none' })
        return
      }
      if (!self.password || self.password.length < 6) {
        uni.showToast({ title: '请输入至少 6 位密码', icon: 'none' })
        return
      }
      if (!self.code) {
        uni.showToast({ title: '请输入验证码', icon: 'none' })
        return
      }
      self.loading = true
      api.loginUser(self.phone, self.password, self.code)
        .then(function(payload) {
          session.saveSession(payload)
          uni.showToast({ title: '登录成功', icon: 'none' })
          setTimeout(function() {
            uni.switchTab({ url: '/pages/profile/index' })
          }, 350)
        })
        .catch(function(error) {
          uni.showModal({
            title: '登录失败',
            content: error.message || '当前账号尚未注册',
            confirmText: '去注册',
            cancelText: '稍后',
            success: function(result) {
              if (result.confirm) {
                self.goRegister()
              }
            }
          })
        })
        .finally(function() {
          self.loading = false
        })
    },
    goRegister: function() {
      var nextPhone = this.phone || ''
      if (nextPhone === DEMO_LOGIN_PHONE) {
        nextPhone = ''
      }
      uni.navigateTo({ url: '/pages/register/index?phone=' + encodeURIComponent(nextPhone) })
    },
    goHome: function() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style>
.auth-shell {
  padding-top: 36rpx;
}

.auth-hero-row {
  margin-top: 26rpx;
}

.auth-panel {
  margin-top: 18rpx;
}

.auth-kicker {
  color: var(--campus-primary);
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.auth-main-title {
  margin-top: 12rpx;
}

.auth-subtitle {
  margin-bottom: 0;
}

.auth-field-gap {
  margin-top: 18rpx;
}

.auth-code-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.auth-code-input {
  flex: 1;
  min-width: 0;
}

.auth-code-button {
  width: 220rpx;
  margin: 0;
  padding: 0 18rpx;
  flex-shrink: 0;
}

.auth-code-button[disabled] {
  opacity: 0.72;
}

.auth-emphasis {
  font-weight: 700;
}

.auth-note {
  margin-top: 20rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.86) 0%, rgba(242, 248, 255, 0.92) 100%);
}

.auth-note-title {
  color: var(--campus-text);
  font-size: 24rpx;
  font-weight: 700;
}

.auth-note-line {
  margin-top: 10rpx;
  color: var(--campus-text-soft);
  font-size: 22rpx;
  line-height: 1.7;
}

.auth-submit {
  margin-top: 24rpx;
}

.auth-secondary {
  margin-top: 14rpx;
}

.auth-entry-link {
  margin-top: 20rpx;
  text-align: center;
}
</style>
