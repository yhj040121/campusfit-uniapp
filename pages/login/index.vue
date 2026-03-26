<template>
  <view class="page-shell auth-shell">
    <view class="auth-header">
      <view class="auth-brand">青搭</view>
      <view class="auth-title">欢迎登录</view>
      <view class="auth-subtitle">选择一种方式继续</view>
    </view>

    <view class="panel-card auth-panel">
      <view class="auth-mode-switch">
        <view
          class="auth-mode-pill"
          :class="loginMode === 'code' ? 'auth-mode-pill-active' : ''"
          @click="setLoginMode('code')"
        >
          验证码登录
        </view>
        <view
          class="auth-mode-pill"
          :class="loginMode === 'password' ? 'auth-mode-pill-active' : ''"
          @click="setLoginMode('password')"
        >
          密码登录
        </view>
      </view>

      <!-- <view class="auth-mode-copy">只需填写当前登录方式对应的一项凭证。</view> -->

      <view class="form-label">手机号</view>
      <input
        class="form-input auth-input"
        v-model="phone"
        maxlength="11"
        placeholder="请输入 11 位手机号"
      />

      <template v-if="loginMode === 'code'">
        <view class="form-label auth-field-gap">验证码</view>
        <view class="auth-code-row">
          <input
            class="form-input auth-code-input"
            v-model="code"
            maxlength="6"
            placeholder="请输入验证码"
          />
          <view class="auth-code-divider"></view>
          <button
            class="auth-code-button"
            :disabled="sendingCode || countdown > 0"
            :loading="sendingCode"
            @click="sendCode"
          >
            {{ sendCodeText }}
          </button>
        </view>
      </template>

      <template v-else>
        <view class="form-label auth-field-gap">密码</view>
        <input
          class="form-input auth-input"
          v-model="password"
          password
          maxlength="20"
          placeholder="请输入密码"
        />
      </template>

      <button class="btn-primary auth-submit" :loading="loading" @click="submit">
        {{ submitButtonText }}
      </button>

      <view class="auth-footer">
        <text class="auth-footer-link" @click="goRegister">注册账号</text>
        <text class="auth-footer-divider">·</text>
        <text class="auth-footer-link" @click="goHome">先逛首页</text>
      </view>
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
      loginMode: 'code',
      phone: '',
      password: '',
      code: ''
    }
  },
  computed: {
    sendCodeText: function() {
      if (this.countdown > 0) {
        return this.countdown + 's'
      }
      return this.sendingCode ? '发送中' : '发送验证码'
    },
    submitButtonText: function() {
      return this.loginMode === 'code' ? '验证码登录' : '密码登录'
    }
  },
  onLoad: function(options) {
    if (options && options.phone) {
      this.phone = options.phone
    }
    if (options && options.mode === 'password') {
      this.loginMode = 'password'
    }
  },
  onUnload: function() {
    this.clearCodeTimer()
  },
  methods: {
    setLoginMode: function(mode) {
      if (mode !== 'code' && mode !== 'password') {
        return
      }
      this.loginMode = mode
    },
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
      if (self.loginMode === 'code') {
        if (!self.code) {
          uni.showToast({ title: '请输入验证码', icon: 'none' })
          return
        }
      } else if (!self.password || self.password.length < 6) {
        uni.showToast({ title: '请输入至少 6 位密码', icon: 'none' })
        return
      }

      self.loading = true
      api.loginUser({
        phone: self.phone,
        loginType: self.loginMode,
        password: self.loginMode === 'password' ? self.password : undefined,
        code: self.loginMode === 'code' ? self.code : undefined
      })
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

<style scoped>
.auth-shell {
  min-height: 100vh;
  padding: 28rpx 28rpx 100rpx;
  background: #f6f8fb;
}

.auth-shell::before,
.auth-shell::after {
  display: none;
}

.auth-header {
  padding: 18rpx 6rpx 28rpx;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(37, 99, 235, 0.08);
  color: var(--campus-primary);
  font-size: 22rpx;
  font-weight: 700;
}

.auth-title {
  margin-top: 22rpx;
  color: #101828;
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1.18;
}

.auth-subtitle {
  margin-top: 12rpx;
  color: #667085;
  font-size: 26rpx;
  line-height: 1.6;
}

.auth-panel {
  padding: 28rpx;
  border-radius: 32rpx;
  border: 1rpx solid rgba(16, 24, 40, 0.06);
  background: #ffffff;
  box-shadow: 0 12rpx 36rpx rgba(16, 24, 40, 0.06);
}

.auth-mode-switch {
  display: flex;
  gap: 12rpx;
  padding: 10rpx;
  border-radius: 24rpx;
  background: #f2f4f7;
}

.auth-mode-pill {
  flex: 1;
  padding: 20rpx 0;
  border-radius: 18rpx;
  color: #667085;
  font-size: 26rpx;
  font-weight: 700;
  text-align: center;
}

.auth-mode-pill-active {
  background: #ffffff;
  color: #1570ef;
  box-shadow: 0 8rpx 20rpx rgba(16, 24, 40, 0.08);
}

.auth-mode-copy {
  margin: 18rpx 0 8rpx;
  color: #667085;
  font-size: 22rpx;
  line-height: 1.6;
}

.auth-field-gap {
  margin-top: 18rpx;
}

.auth-input {
  margin-top: 8rpx;
  border-color: #d0d5dd;
  background: #ffffff;
  box-shadow: none;
}

.auth-code-row {
  display: flex;
  align-items: center;
  height: 88rpx;
  margin-top: 8rpx;
  padding: 0 10rpx 0 22rpx;
  border: 1rpx solid #d0d5dd;
  border-radius: 24rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.auth-code-input {
  flex: 1;
  height: 100%;
  min-width: 0;
  margin: 0;
  padding: 0 18rpx 0 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.auth-code-divider {
  width: 1rpx;
  height: 44rpx;
  background: #e4e7ec;
  flex-shrink: 0;
}

.auth-code-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 188rpx;
  height: 68rpx;
  margin: 0;
  margin-left: 14rpx;
  border-radius: 18rpx;
  background: #1570ef;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: none;
}

.auth-code-button[disabled] {
  opacity: 0.64;
}

.auth-submit {
  margin-top: 28rpx;
  background: #1570ef;
  box-shadow: none;
}

.auth-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18rpx;
  margin-top: 24rpx;
}

.auth-footer-link {
  color: #1570ef;
  font-size: 24rpx;
  line-height: 1;
}

.auth-footer-divider {
  color: #98a2b3;
  font-size: 22rpx;
  line-height: 1;
}

</style>
