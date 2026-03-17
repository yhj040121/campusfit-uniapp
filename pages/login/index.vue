<template>
  <view class="page-shell">
    <view class="hero-card">
      <view class="hero-badge">手机号验证码登录</view>
      <view class="hero-title">欢迎回到 CampusFit</view>
      <view class="hero-copy">使用演示验证码 <text style="font-weight:700;">2468</text> 即可登录，并同步你的个人资料。</view>
    </view>

    <view class="panel-card">
      <view class="form-label">手机号</view>
      <input class="form-input" v-model="phone" maxlength="11" placeholder="请输入手机号" />
      <view class="form-label" style="margin-top:18rpx;">验证码</view>
      <view class="btn-row" style="align-items:flex-end;">
        <input class="form-input btn-half" v-model="code" maxlength="6" placeholder="请输入验证码" />
        <button class="btn-secondary btn-half" @click="sendCode">{{ codeText }}</button>
      </view>
      <button class="btn-primary" style="margin-top:24rpx;" :loading="loading" @click="submit">登录</button>
      <button class="btn-ghost" style="margin-top:16rpx;" @click="goRegister">去注册</button>
      <view class="float-link" style="margin-top:18rpx; text-align:center;" @click="goHome">继续浏览首页</view>
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
      return this.countdown > 0 ? this.countdown + '秒' : '发送验证码'
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
        uni.showToast({ title: '请输入正确的 11 位手机号', icon: 'none' })
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
            content: error.message || '当前无法登录',
            confirmText: '去注册',
            cancelText: '关闭',
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
</style>
