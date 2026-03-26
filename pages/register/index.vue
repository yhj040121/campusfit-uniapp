<template>
  <view class="page-shell register-shell">
    <view class="auth-header">
      <view class="auth-brand">注册账号</view>
      <view class="auth-title">注册 青搭</view>
      <!-- <view class="auth-subtitle">只需填写核心信息，其他资料可稍后补充。</view> -->
    </view>

    <view class="panel-card register-panel">
      <view class="register-section-label">核心信息</view>

      <view class="form-label">手机号</view>
      <input
        class="form-input register-input"
        v-model="phone"
        maxlength="11"
        placeholder="请输入 11 位手机号"
      />

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

      <view class="form-label auth-field-gap">昵称</view>
      <input
        class="form-input register-input"
        v-model="nickname"
        maxlength="20"
        placeholder="请输入昵称"
      />

      <view class="form-label auth-field-gap">密码</view>
      <input
        class="form-input register-input"
        v-model="password"
        password
        maxlength="20"
        placeholder="请输入 6-20 位密码"
      />

      <view class="form-label auth-field-gap">确认密码</view>
      <input
        class="form-input register-input"
        v-model="confirmPassword"
        password
        maxlength="20"
        placeholder="请再次输入密码"
      />

      <view class="register-optional-toggle" @click="toggleOptionalFields">
        <view class="register-optional-main">
          <view class="register-optional-title">补充个人资料</view>
          <view class="register-optional-copy">头像、性别、邮箱、学校、居住地等</view>
        </view>
        <view class="register-optional-action">{{ showOptionalFields ? '收起' : '选填' }}</view>
      </view>

      <view v-if="showOptionalFields" class="register-optional-fields">
        <view class="register-avatar-row">
          <view class="register-avatar-shell" @click="chooseAvatar">
            <image v-if="avatarUrl" class="register-avatar-image" :src="avatarUrl" mode="aspectFill"></image>
            <view v-else class="register-avatar-fallback">{{ avatarPreviewText }}</view>
          </view>
          <view class="register-avatar-copy">
            <view class="register-avatar-title">头像</view>
            <view class="register-avatar-desc">上传后会用于个人主页和互动场景展示。</view>
          </view>
          <button class="register-avatar-button" :loading="avatarUploading" @click="chooseAvatar">
            {{ avatarUrl ? '重新上传' : '上传头像' }}
          </button>
        </view>

        <view class="form-label auth-field-gap">性别</view>
        <view class="register-gender-row">
          <view
            class="register-gender-pill"
            :class="gender === 'male' ? 'register-gender-pill-active' : ''"
            @click="toggleGender('male')"
          >
            男
          </view>
          <view
            class="register-gender-pill"
            :class="gender === 'female' ? 'register-gender-pill-active' : ''"
            @click="toggleGender('female')"
          >
            女
          </view>
        </view>

        <view class="form-label auth-field-gap">邮箱</view>
        <input
          class="form-input register-input"
          v-model="email"
          maxlength="120"
          placeholder="请输入常用邮箱"
        />

        <view class="form-label auth-field-gap">学校</view>
        <input
          class="form-input register-input"
          v-model="schoolName"
          maxlength="40"
          placeholder="请输入学校名称"
        />

        <view class="form-label auth-field-gap">年级</view>
        <input
          class="form-input register-input"
          v-model="gradeName"
          maxlength="20"
          placeholder="请输入年级"
        />

        <view class="form-label auth-field-gap">居住地</view>
        <input
          class="form-input register-input"
          v-model="locationName"
          maxlength="60"
          placeholder="例如：杭州 临安"
        />

        <view class="form-label auth-field-gap">个性签名</view>
        <textarea
          class="form-textarea register-textarea"
          v-model="signature"
          maxlength="60"
          placeholder="简单介绍一下自己"
        ></textarea>
      </view>

      <button class="btn-primary auth-submit" :loading="loading" @click="finish">注册并进入</button>

      <view class="auth-footer">
        <text class="auth-footer-link" @click="goLogin">已有账号，去登录</text>
      </view>
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
      showOptionalFields: false,
      phone: '',
      code: '',
      nickname: '',
      password: '',
      confirmPassword: '',
      avatarUrl: '',
      gender: '',
      email: '',
      schoolName: '',
      gradeName: '',
      locationName: '',
      signature: ''
    }
  },
  computed: {
    avatarPreviewText: function() {
      var source = this.nickname || 'C'
      return source.slice(0, 1).toUpperCase()
    },
    sendCodeText: function() {
      if (this.countdown > 0) {
        return this.countdown + 's'
      }
      return this.sendingCode ? '发送中' : '发送验证码'
    }
  },
  onLoad: function(options) {
    this.phone = (options && options.phone) || ''
  },
  onUnload: function() {
    this.clearCodeTimer()
  },
  methods: {
    toggleOptionalFields: function() {
      this.showOptionalFields = !this.showOptionalFields
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
        uni.showToast({ title: '请先输入正确手机号', icon: 'none' })
        return
      }
      self.sendingCode = true
      api.sendAuthCode(self.phone, 'register')
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
    chooseAvatar: function() {
      var self = this
      if (self.avatarUploading) {
        return
      }
      self.showOptionalFields = true
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
    toggleGender: function(value) {
      this.showOptionalFields = true
      this.gender = this.gender === value ? '' : value
    },
    finish: function() {
      var self = this
      if (!/^1\d{10}$/.test(self.phone)) {
        uni.showToast({ title: '请输入正确手机号', icon: 'none' })
        return
      }
      if (!self.code) {
        uni.showToast({ title: '请输入验证码', icon: 'none' })
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
      if (self.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(self.email)) {
        uni.showToast({ title: '邮箱格式不正确', icon: 'none' })
        return
      }

      self.loading = true
      api.registerUser({
        phone: self.phone,
        code: self.code,
        password: self.password,
        confirmPassword: self.confirmPassword,
        nickname: self.nickname,
        avatarUrl: self.avatarUrl,
        gender: self.gender || undefined,
        email: self.email || undefined,
        schoolName: self.schoolName || undefined,
        gradeName: self.gradeName || undefined,
        locationName: self.locationName || undefined,
        signature: self.signature || undefined
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
      uni.navigateTo({
        url: '/pages/login/index?mode=password&phone=' + encodeURIComponent(this.phone || '')
      })
    }
  }
}
</script>

<style scoped>
.register-shell {
  min-height: 100vh;
  padding: 28rpx 28rpx 100rpx;
  background: #f6f8fb;
}

.register-shell::before,
.register-shell::after {
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

.register-panel {
  padding: 28rpx;
  border-radius: 32rpx;
  border: 1rpx solid rgba(16, 24, 40, 0.06);
  background: #ffffff;
  box-shadow: 0 12rpx 36rpx rgba(16, 24, 40, 0.06);
}

.register-section-label {
  margin-bottom: 8rpx;
  color: #1570ef;
  font-size: 24rpx;
  font-weight: 700;
}

.auth-field-gap {
  margin-top: 18rpx;
}

.register-input,
.register-textarea {
  margin-top: 8rpx;
  border-color: #d0d5dd;
  background: #ffffff;
  box-shadow: none;
}

.auth-code-row {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
  padding: 10rpx;
  border: 1rpx solid #d0d5dd;
  border-radius: 24rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.auth-code-input {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0 18rpx 0 12rpx;
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
  min-height: 68rpx;
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

.register-optional-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 24rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid #eaecf0;
  border-bottom: 1rpx solid #eaecf0;
}

.register-optional-main {
  flex: 1;
}

.register-optional-title {
  color: #101828;
  font-size: 28rpx;
  font-weight: 700;
}

.register-optional-copy {
  margin-top: 8rpx;
  color: #667085;
  font-size: 22rpx;
  line-height: 1.6;
}

.register-optional-action {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #f2f4f7;
  color: #344054;
  font-size: 22rpx;
  font-weight: 700;
}

.register-optional-fields {
  padding-top: 6rpx;
}

.register-avatar-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 18rpx;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #eaecf0;
}

.register-avatar-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  overflow: hidden;
  background: #1570ef;
  color: #ffffff;
}

.register-avatar-image {
  width: 100%;
  height: 100%;
}

.register-avatar-fallback {
  color: #ffffff;
  font-size: 36rpx;
  font-weight: 700;
}

.register-avatar-copy {
  flex: 1;
  min-width: 0;
}

.register-avatar-title {
  color: #101828;
  font-size: 28rpx;
  font-weight: 700;
}

.register-avatar-desc {
  margin-top: 8rpx;
  color: #667085;
  font-size: 22rpx;
  line-height: 1.6;
}

.register-avatar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 164rpx;
  min-height: 72rpx;
  margin: 0;
  padding: 0 18rpx;
  border: 1rpx solid #d0d5dd;
  border-radius: 18rpx;
  background: #ffffff;
  color: #344054;
  font-size: 22rpx;
  font-weight: 700;
  box-shadow: none;
}

.register-gender-row {
  display: flex;
  gap: 12rpx;
  margin-top: 8rpx;
}

.register-gender-pill {
  min-width: 120rpx;
  padding: 20rpx 0;
  border: 1rpx solid #d0d5dd;
  border-radius: 18rpx;
  color: #344054;
  font-size: 26rpx;
  font-weight: 700;
  text-align: center;
  box-sizing: border-box;
}

.register-gender-pill-active {
  border-color: #1570ef;
  background: rgba(21, 112, 239, 0.08);
  color: #1570ef;
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
  margin-top: 24rpx;
}

.auth-footer-link {
  color: #1570ef;
  font-size: 24rpx;
  line-height: 1;
}

@media (max-width: 360px) {
  .register-avatar-row {
    flex-direction: column;
    align-items: stretch;
  }

  .register-avatar-button {
    width: 100%;
  }
}
</style>
