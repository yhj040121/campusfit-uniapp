<template>
  <view class="page-shell auth-shell">
    <view class="hero-card auth-hero">
      <view class="hero-badge">校园身份登录</view>
      <view class="hero-title">欢迎回到 CampusFit</view>
      <view class="hero-copy">使用手机号验证码快速登录。当前演示验证码为 <text class="auth-emphasis">2468</text>，登录后可继续发布、收藏、评论和参与活动。</view>
      <view class="hero-metrics">
        <view class="hero-metric">
          <text class="hero-metric-value">1 步</text>
          <text class="hero-metric-label">快速登录</text>
        </view>
        <view class="hero-metric">
          <text class="hero-metric-value">同步</text>
          <text class="hero-metric-label">账号状态</text>
        </view>
      </view>
    </view>

    <view class="panel-card auth-panel">
      <view class="section-head" style="margin-top:0;">
        <view>
          <view class="text-main">验证码登录</view>
          <view class="section-subtitle">登录后会同步你的个人资料、消息和互动记录</view>
        </view>
        <view class="note-stamp">AUTH</view>
      </view>

      <view class="form-label">手机号</view>
      <input class="form-input" v-model="phone" maxlength="11" placeholder="请输入手机号" />

      <view class="form-label" style="margin-top:18rpx;">验证码</view>
      <view class="btn-row auth-code-row" style="align-items:flex-end;">
        <input class="form-input btn-half" v-model="code" maxlength="6" placeholder="请输入验证码" />
        <button class="btn-secondary btn-half" @click="sendCode">{{ codeText }}</button>
      </view>

      <view class="note-box">演示环境无需真实短信，直接输入验证码 2468 即可完成登录。</view>

      <button class="btn-primary" style="margin-top:24rpx;" :loading="loading" @click="submit">登录并进入</button>
      <button class="btn-ghost" style="margin-top:16rpx;" @click="goRegister">还没有账号？先完善资料</button>
      <view class="float-link auth-entry-link" @click="goHome">暂时先逛首页</view>
    </view>

    <view class="panel-card auth-tips">
      <view class="summary-kicker">登录后可用</view>
      <view class="summary-line">发布穿搭、收藏商品、查看消息通知与我的活动。</view>
      <view class="summary-line">如果账号不存在，系统会引导你去完善资料并完成注册。</view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

export default {
  data: function() {
    return {
      timer: null,
      countdown: 0,
      loading: false,
      phone: '18688882026',
      code: '2468'
    }
  },
  computed: {
    codeText: function() {
      return this.countdown > 0 ? this.countdown + ' 秒后重发' : '获取验证码'
    }
  },
  onUnload: function() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },
  methods: {
    sendCode: function() {
      var self = this
      if (self.countdown > 0) {
        return
      }
      uni.showToast({ title: '演示验证码：2468', icon: 'none' })
      self.countdown = 60
      self.timer = setInterval(function() {
        self.countdown -= 1
        if (self.countdown <= 0) {
          clearInterval(self.timer)
          self.timer = null
        }
      }, 1000)
    },
    submit: function() {
      var self = this
      if (!/^1\d{10}$/.test(self.phone)) {
        uni.showToast({ title: '请输入 11 位手机号', icon: 'none' })
        return
      }
      if (!self.code) {
        uni.showToast({ title: '请输入验证码', icon: 'none' })
        return
      }
      self.loading = true
      api.loginUser(self.phone, self.code)
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
      uni.navigateTo({ url: '/pages/register/index?phone=' + encodeURIComponent(this.phone || '') })
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

.auth-emphasis {
  font-weight: 700;
}

.auth-panel,
.auth-tips {
  margin-top: 18rpx;
}

.auth-entry-link {
  margin-top: 20rpx;
  text-align: center;
}
</style>
