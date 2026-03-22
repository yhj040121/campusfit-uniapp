<template>
  <view class="page-shell register-shell">
    <view class="hero-card register-hero">
      <view class="hero-badge">注册账号</view>
      <view class="hero-title">先建立一张完整的校园身份卡</view>
      <view class="hero-copy">这一步会一次性完成头像、昵称、学校、密码和固定验证码确认。注册成功后会直接进入你的个人主页。</view>
      <view class="hero-card-row">
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">1</text>
          <text class="hero-card-pill-label">头像上传</text>
        </view>
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">2</text>
          <text class="hero-card-pill-label">校园资料</text>
        </view>
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">3</text>
          <text class="hero-card-pill-label">密码设置</text>
        </view>
      </view>
    </view>

    <view class="panel-card register-panel">
      <view class="auth-kicker">资料设置</view>
      <view class="text-main auth-main-title">注册你的 CampusFit 账号</view>
	  
      <view class="register-avatar-row">
        <view class="register-avatar-shell" @click="chooseAvatar">
          <image v-if="avatarUrl" class="register-avatar-image" :src="avatarUrl" mode="aspectFill"></image>
          <view v-else class="register-avatar-fallback">{{ avatarPreviewText }}</view>
        </view>
        <view class="register-avatar-copy">
          <view class="register-avatar-title">上传头像</view>
          <view class="register-avatar-desc">建议上传一张清晰头像，后续会显示在个人主页、评论区和关注列表里。</view>
          <button class="btn-ghost register-avatar-button" :loading="avatarUploading" @click="chooseAvatar">{{ avatarUrl ? '重新上传' : '选择头像' }}</button>
        </view>
      </view>

      <view class="form-label">手机号</view>
      <input class="form-input" v-model="phone" maxlength="11" placeholder="请输入 11 位手机号" />

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

      <view class="form-label auth-field-gap">昵称</view>
      <input class="form-input" v-model="nickname" maxlength="20" placeholder="给自己起一个穿搭昵称" />

      <view class="form-label auth-field-gap">学校</view>
      <input class="form-input" v-model="schoolName" maxlength="40" placeholder="例如：浙江农林大学" />

      <view class="form-label auth-field-gap">年级</view>
      <input class="form-input" v-model="gradeName" maxlength="20" placeholder="例如：大三" />

      <view class="form-label auth-field-gap">密码</view>
      <input class="form-input" v-model="password" password maxlength="20" placeholder="请输入 6-20 位密码" />

      <view class="form-label auth-field-gap">确认密码</view>
      <input class="form-input" v-model="confirmPassword" password maxlength="20" placeholder="请再次输入密码" />

      <view class="form-label auth-field-gap">个性签名</view>
      <textarea class="form-textarea" v-model="signature" maxlength="60" placeholder="一句话介绍你的穿搭偏好、预算观或校园日常"></textarea>

      <button class="btn-primary auth-submit" :loading="loading" @click="finish">完成注册</button>
      <button class="btn-secondary auth-secondary" @click="goLogin">已有账号，去登录</button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

export default {
  data: function() {
    return {
      loading: false,
      avatarUploading: false,
      sendingCode: false,
      countdown: 0,
      codeTimer: null,
      phone: '',
      code: '',
      nickname: '',
      schoolName: '',
      gradeName: '',
      password: '',
      confirmPassword: '',
      signature: '',
      avatarUrl: ''
    }
  },
  computed: {
    avatarPreviewText: function() {
      var source = this.nickname || 'C'
      return source.slice(0, 1).toUpperCase()
    },
    sendCodeText: function() {
      if (this.countdown > 0) {
        return this.countdown + 's 后重发'
      }
      return this.sendingCode ? '发送中...' : '发送验证码'
    }
  },
  onLoad: function(options) {
    this.phone = (options && options.phone) || ''
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
        uni.showToast({ title: '请先输入正确手机号', icon: 'none' })
        return
      }
      self.sendingCode = true
      setTimeout(function() {
        self.startCountdown(60)
        uni.showToast({ title: '验证码已发送，请输入 040121', icon: 'none' })
        self.sendingCode = false
      }, 350)
    },
    chooseAvatar: function() {
      var self = this
      if (self.avatarUploading) {
        return
      }
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed', 'original'],
        sourceType: ['album', 'camera'],
        success: function(result) {
          var filePath = result.tempFilePaths && result.tempFilePaths[0]
          if (!filePath) {
            return
          }
          self.avatarUploading = true
          api.uploadAvatarImage(filePath)
            .then(function(payload) {
              self.avatarUrl = payload.url || ''
              uni.showToast({ title: '头像已上传', icon: 'none' })
            })
            .catch(function(error) {
              uni.showToast({ title: error.message || '头像上传失败', icon: 'none' })
            })
            .finally(function() {
              self.avatarUploading = false
            })
        },
        fail: function() {
          self.avatarUploading = false
        }
      })
    },
    finish: function() {
      var self = this
      if (!/^1\d{10}$/.test(self.phone)) {
        uni.showToast({ title: '请输入正确手机号', icon: 'none' })
        return
      }
      if (!self.nickname) {
        uni.showToast({ title: '请输入昵称', icon: 'none' })
        return
      }
      if (!self.password || self.password.length < 6) {
        uni.showToast({ title: '请输入至少 6 位密码', icon: 'none' })
        return
      }
      if (self.password !== self.confirmPassword) {
        uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
        return
      }
      if (!self.code) {
        uni.showToast({ title: '请输入验证码 040121', icon: 'none' })
        return
      }
      self.loading = true
      api.registerUser({
        phone: self.phone,
        code: self.code,
        password: self.password,
        confirmPassword: self.confirmPassword,
        nickname: self.nickname,
        schoolName: self.schoolName,
        gradeName: self.gradeName,
        signature: self.signature,
        avatarUrl: self.avatarUrl
      })
        .then(function(payload) {
          session.saveSession(payload)
          uni.showToast({ title: '注册成功', icon: 'none' })
          setTimeout(function() {
            uni.switchTab({ url: '/pages/profile/index' })
          }, 350)
        })
        .catch(function(error) {
          var message = error.message || '注册失败'
          if (message.indexOf('已经注册') > -1) {
            uni.showModal({
              title: '手机号已注册',
              content: message,
              confirmText: '去登录',
              cancelText: '我知道了',
              success: function(result) {
                if (result.confirm) {
                  self.goLogin()
                }
              }
            })
            return
          }
          uni.showToast({ title: message, icon: 'none' })
        })
        .finally(function() {
          self.loading = false
        })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index?phone=' + encodeURIComponent(this.phone || '') })
    }
  }
}
</script>

<style>
.register-shell {
  padding-bottom: 44rpx;
}

.register-hero {
  margin-bottom: 18rpx;
}

.register-panel {
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

.register-avatar-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 22rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  background:
    linear-gradient(135deg, rgba(201, 49, 91, 0.06), transparent 32%),
    linear-gradient(315deg, rgba(45, 87, 217, 0.06), transparent 36%),
    rgba(255, 250, 245, 0.94);
}

.register-avatar-shell {
  width: 132rpx;
  height: 132rpx;
  border-radius: 38rpx;
  overflow: hidden;
  background: linear-gradient(135deg, #ef6288 0%, #345fe0 100%);
  box-shadow: 0 16rpx 30rpx rgba(201, 49, 91, 0.16);
}

.register-avatar-image {
  width: 100%;
  height: 100%;
}

.register-avatar-fallback {
  width: 100%;
  height: 100%;
  color: #ffffff;
  text-align: center;
  line-height: 132rpx;
  font-size: 48rpx;
  font-weight: 700;
}

.register-avatar-copy {
  flex: 1;
}

.register-avatar-title {
  color: var(--campus-text);
  font-size: 28rpx;
  font-weight: 700;
}

.register-avatar-desc {
  margin-top: 10rpx;
  color: var(--campus-text-soft);
  font-size: 22rpx;
  line-height: 1.7;
}

.register-avatar-button {
  margin-top: 16rpx;
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

.register-note {
  margin-top: 22rpx;
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
</style>
