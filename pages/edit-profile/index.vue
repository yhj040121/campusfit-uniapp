<template>
  <view class="edit-profile-shell">
    <view class="edit-topbar">
      <view class="edit-topbar-back" @tap="goBack">返回</view>
      <view class="edit-topbar-title">编辑资料</view>
    </view>

    <view v-if="!loggedIn" class="edit-guest-card">
      <view class="edit-guest-badge">CampusFit</view>
      <view class="edit-guest-title">登录后再编辑你的资料</view>
      <view class="edit-guest-copy">头像、主页背景图和个人信息都会同步到你的个人主页，先登录后再继续。</view>
      <button class="action-button primary-button" hover-class="none" @tap="goLogin">去登录</button>
    </view>

    <view v-else class="edit-content">
      <view class="edit-summary-card">
        <view class="edit-summary-head">
          <view class="edit-summary-avatar-shell" @tap="chooseAvatar">
            <image v-if="form.avatarUrl" class="edit-summary-avatar-image" :src="form.avatarUrl" mode="aspectFill"></image>
            <view v-else class="edit-summary-avatar-fallback">{{ avatarPreviewText }}</view>
          </view>

          <view class="edit-summary-copygroup">
            <view class="edit-summary-kicker">PROFILE</view>
            <view class="edit-summary-title">{{ displayNickname }}</view>
            <view class="edit-summary-copy">{{ statusText }}</view>
          </view>
        </view>

        <view class="edit-summary-actions">
          <view class="edit-summary-chip" @tap="chooseAvatar">{{ avatarUploading ? '头像上传中' : '更换头像' }}</view>
          <view class="edit-summary-chip" @tap="chooseCover">{{ coverUploading ? '封面上传中' : '更换封面' }}</view>
        </view>
      </view>

      <view class="edit-cover-card">
        <image class="edit-cover-image" :src="coverPreviewUrl" mode="aspectFill"></image>
        <view class="edit-cover-overlay"></view>
        <view class="edit-cover-copy">
          <view class="edit-cover-kicker">主页封面</view>
          <view class="edit-cover-title">让个人主页第一眼更像你</view>
          <view class="edit-cover-desc">可以上传校园场景、运动日常或穿搭大片，更新后会同步到你的个人主页顶部。</view>
        </view>
      </view>

      <view class="edit-panel">
        <view class="edit-panel-head">
          <view class="edit-panel-title">基础信息</view>
          <view class="edit-panel-copy">先把昵称、性别和联系方式整理好，方便别人认识你。</view>
        </view>

        <view class="edit-field">
          <view class="edit-label">昵称</view>
          <input
            class="edit-input"
            :value="form.nickname"
            maxlength="20"
            placeholder="给自己起一个更好记的名字"
            @input="updateField('nickname', $event)"
          />
        </view>

        <view class="edit-field">
          <view class="edit-label">性别</view>
          <view class="gender-row">
            <button
              v-for="item in genderOptions"
              :key="item.value"
              class="action-button gender-chip"
              :class="{ 'gender-chip-active': form.gender === item.value }"
              hover-class="none"
              @tap="toggleGender(item.value)"
            >
              {{ item.label }}
            </button>
          </view>
          <view class="edit-hint">可以不选择，不选择时个人主页不会显示性别。</view>
        </view>

        <view class="edit-field">
          <view class="edit-label">邮箱</view>
          <input
            class="edit-input"
            :value="form.email"
            maxlength="120"
            placeholder="填写常用邮箱，便于后续联系"
            @input="updateField('email', $event)"
          />
        </view>
      </view>

      <view class="edit-panel">
        <view class="edit-panel-head">
          <view class="edit-panel-title">校园信息</view>
          <view class="edit-panel-copy">这些信息会帮助别人更快了解你的学校和生活半径。</view>
        </view>

        <view class="edit-field">
          <view class="edit-label">学校</view>
          <input
            class="edit-input"
            :value="form.schoolName"
            maxlength="100"
            placeholder="例如：浙江农林大学"
            @input="updateField('schoolName', $event)"
          />
        </view>

        <view class="edit-field-grid">
          <view class="edit-field edit-field-half">
            <view class="edit-label">年级</view>
            <input
              class="edit-input"
              :value="form.gradeName"
              maxlength="50"
              placeholder="例如：大一"
              @input="updateField('gradeName', $event)"
            />
          </view>

          <view class="edit-field edit-field-half">
            <view class="edit-label">居住地</view>
            <input
              class="edit-input"
              :value="form.locationName"
              maxlength="100"
              placeholder="例如：杭州·临安"
              @input="updateField('locationName', $event)"
            />
          </view>
        </view>
      </view>

      <view class="edit-panel">
        <view class="edit-panel-head">
          <view class="edit-panel-title">个性签名</view>
          <view class="edit-panel-copy">用一句话介绍你的穿搭偏好、运动日常，或者想让别人记住的样子。</view>
        </view>

        <view class="edit-field">
          <textarea
            class="edit-textarea"
            :value="form.signature"
            maxlength="255"
            auto-height
            placeholder="写下你的风格、兴趣，或者正在进行的校园生活片段。"
            @input="updateField('signature', $event)"
          ></textarea>
          <view class="edit-counter">{{ signatureLength }}/255</view>
        </view>
      </view>
    </view>

    <view v-if="loggedIn" class="edit-footer">
      <button
        class="action-button primary-button edit-save-button"
        :class="{ 'primary-button-disabled': saving || avatarUploading || coverUploading }"
        hover-class="none"
        @tap="save"
      >
        {{ saving ? '保存中...' : '保存资料' }}
      </button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

var DEFAULT_PROFILE_COVER = '/static/profile/default-hero.svg'
var PROFILE_REFRESH_KEY = 'campusfit_profile_refresh_token'
var GENDER_OPTIONS = [
  { value: 'male', label: '男生' },
  { value: 'female', label: '女生' }
]

function emptyForm() {
  return {
    nickname: '',
    avatarUrl: '',
    coverImageUrl: '',
    gender: '',
    email: '',
    schoolName: '',
    gradeName: '',
    locationName: '',
    signature: ''
  }
}

function trimText(value) {
  return value == null ? '' : String(value).trim()
}

function normalizeGender(value) {
  var normalized = trimText(value)
  if (normalized === 'male' || normalized === 'female') {
    return normalized
  }
  return ''
}

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

function isValidEmail(value) {
  if (!value) {
    return true
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      saving: false,
      avatarUploading: false,
      coverUploading: false,
      form: emptyForm(),
      statusText: '正在加载资料，可以直接开始编辑。',
      genderOptions: GENDER_OPTIONS
    }
  },
  computed: {
    avatarPreviewText: function() {
      var source = trimText(this.form.nickname) || 'C'
      return source.slice(0, 1).toUpperCase()
    },
    coverPreviewUrl: function() {
      return trimText(this.form.coverImageUrl) || DEFAULT_PROFILE_COVER
    },
    signatureLength: function() {
      return String(this.form.signature || '').length
    },
    displayNickname: function() {
      return trimText(this.form.nickname) || '完善你的个人资料'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.form = emptyForm()
      this.statusText = '当前未登录，请先登录后再编辑资料。'
      return
    }
    this.loadForm()
  },
  methods: {
    loadForm: function() {
      var self = this
      api.getMyProfileForEdit()
        .then(function(profile) {
          self.form = {
            nickname: trimText(profile.nickname),
            avatarUrl: trimText(profile.avatarUrl),
            coverImageUrl: trimText(profile.coverImageUrl),
            gender: normalizeGender(profile.gender),
            email: trimText(profile.email),
            schoolName: trimText(profile.schoolName),
            gradeName: trimText(profile.gradeName),
            locationName: trimText(profile.locationName),
            signature: trimText(profile.signature)
          }
          self.statusText = '资料已加载，修改后会同步到你的个人主页。'
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.form = emptyForm()
            self.statusText = '登录状态已失效，请重新登录。'
            return
          }
          self.statusText = error.message || '暂时无法加载资料，请稍后再试。'
        })
    },
    updateField: function(field, event) {
      if (!field) {
        return
      }
      var value = event && event.detail ? event.detail.value : ''
      this.form[field] = value
    },
    toggleGender: function(value) {
      this.form.gender = this.form.gender === value ? '' : value
    },
    buildPayload: function() {
      return {
        nickname: trimText(this.form.nickname),
        avatarUrl: trimText(this.form.avatarUrl),
        coverImageUrl: trimText(this.form.coverImageUrl),
        gender: normalizeGender(this.form.gender),
        email: trimText(this.form.email),
        schoolName: trimText(this.form.schoolName),
        gradeName: trimText(this.form.gradeName),
        locationName: trimText(this.form.locationName),
        signature: trimText(this.form.signature)
      }
    },
    validatePayload: function(payload) {
      if (!payload.nickname) {
        uni.showToast({ title: '请先填写昵称', icon: 'none' })
        return false
      }
      if (!isValidEmail(payload.email)) {
        uni.showToast({ title: '邮箱格式不正确', icon: 'none' })
        return false
      }
      return true
    },
    submitProfile: function(options) {
      var self = this
      var settings = Object.assign({
        successMessage: '资料已保存',
        redirectAfterSave: false,
        statusText: '资料已同步到个人主页。'
      }, options || {})
      if (self.saving || self.avatarUploading || self.coverUploading) {
        return Promise.resolve()
      }
      var payload = self.buildPayload()
      if (!self.validatePayload(payload)) {
        return Promise.resolve()
      }
      self.saving = true
      return api.updateMyProfile(payload)
        .then(function() {
          self.form = Object.assign({}, self.form, payload)
          self.statusText = settings.statusText
          session.updateUser({
            nickname: payload.nickname,
            avatarUrl: payload.avatarUrl
          })
          uni.setStorageSync(PROFILE_REFRESH_KEY, Date.now())
          if (settings.successMessage) {
            uni.showToast({ title: settings.successMessage, icon: 'none' })
          }
          if (settings.redirectAfterSave) {
            setTimeout(function() {
              uni.switchTab({ url: '/pages/profile/index' })
            }, 220)
          }
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.statusText = '登录状态已失效，请重新登录。'
            return
          }
          uni.showToast({ title: error.message || '资料保存失败', icon: 'none' })
        })
        .finally(function() {
          self.saving = false
        })
    },
    tryAutoSaveAfterImageUpload: function(label) {
      var payload = this.buildPayload()
      if (!this.validatePayload(payload)) {
        this.statusText = label + '已上传，补全资料后点击保存即可同步到主页。'
        return
      }
      this.submitProfile({
        successMessage: label + '已保存',
        redirectAfterSave: false,
        statusText: label + '已同步到个人主页。'
      })
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
              self.form.avatarUrl = trimText(payload && payload.url)
              self.avatarUploading = false
              self.tryAutoSaveAfterImageUpload('头像')
            })
            .catch(function(error) {
              uni.showToast({ title: error.message || '头像上传失败', icon: 'none' })
            })
            .finally(function() {
              self.avatarUploading = false
            })
        }
      })
    },
    chooseCover: function() {
      var self = this
      if (self.coverUploading) {
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
          self.coverUploading = true
          api.uploadProfileCoverImage(filePath)
            .then(function(payload) {
              self.form.coverImageUrl = trimText(payload && payload.url)
              self.coverUploading = false
              self.tryAutoSaveAfterImageUpload('背景图')
            })
            .catch(function(error) {
              uni.showToast({ title: error.message || '背景图上传失败', icon: 'none' })
            })
            .finally(function() {
              self.coverUploading = false
            })
        }
      })
    },
    save: function() {
      this.submitProfile({
        successMessage: '资料已保存',
        redirectAfterSave: true,
        statusText: '资料已同步到个人主页。'
      })
    },
    goBack: function() {
      var pages = getCurrentPages()
      if (pages && pages.length > 1) {
        uni.navigateBack({ delta: 1 })
        return
      }
      uni.switchTab({ url: '/pages/profile/index' })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style scoped>
.edit-profile-shell {
  min-height: 100vh;
  padding: calc(112rpx + env(safe-area-inset-top)) 24rpx calc(172rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(253, 210, 167, 0.28), transparent 32%),
    radial-gradient(circle at top right, rgba(68, 165, 255, 0.18), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f5f7fa 42%, #eef4fa 100%);
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  text-align: center;
  line-height: 1.2;
}

.action-button::after {
  border: none;
}

.edit-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100rpx + env(safe-area-inset-top));
  padding: calc(18rpx + env(safe-area-inset-top)) 24rpx 18rpx;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24rpx);
  box-shadow: 0 18rpx 40rpx rgba(22, 47, 81, 0.06);
}

.edit-topbar-back {
  position: absolute;
  left: 24rpx;
  bottom: 18rpx;
  min-width: 96rpx;
  height: 60rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.96);
  color: #36506f;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 28rpx rgba(25, 52, 87, 0.06);
}

.edit-topbar-title {
  font-size: 36rpx;
  font-weight: 800;
  line-height: 1;
  color: #223247;
}

.edit-content,
.edit-guest-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.edit-summary-card,
.edit-cover-card,
.edit-panel,
.edit-guest-card {
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 2rpx solid rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24rpx);
  box-shadow: 0 22rpx 54rpx rgba(25, 52, 87, 0.08);
}

.edit-summary-card,
.edit-panel {
  padding: 28rpx 24rpx;
}

.edit-summary-head {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.edit-summary-avatar-shell {
  width: 112rpx;
  height: 112rpx;
  border-radius: 32rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(145deg, #d9e8f8 0%, #f8fbff 100%);
  box-shadow: 0 16rpx 30rpx rgba(25, 52, 87, 0.08);
}

.edit-summary-avatar-image {
  width: 100%;
  height: 100%;
}

.edit-summary-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1f4680;
  font-size: 42rpx;
  font-weight: 800;
}

.edit-summary-copygroup {
  flex: 1;
  min-width: 0;
}

.edit-summary-kicker {
  color: #1f63ac;
  font-size: 22rpx;
  font-weight: 800;
  letter-spacing: 3rpx;
}

.edit-summary-title {
  margin-top: 8rpx;
  color: #223247;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.18;
}

.edit-summary-copy {
  margin-top: 10rpx;
  color: #66768b;
  font-size: 22rpx;
  line-height: 1.55;
}

.edit-summary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.edit-summary-chip {
  min-height: 60rpx;
  padding: 0 20rpx;
  border-radius: 18rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(68, 165, 255, 0.1);
  color: #1f63ac;
  font-size: 22rpx;
  font-weight: 700;
}

.edit-cover-card {
  position: relative;
  overflow: hidden;
  min-height: 280rpx;
}

.edit-cover-image {
  width: 100%;
  height: 280rpx;
}

.edit-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(8, 38, 67, 0.08) 0%, rgba(8, 38, 67, 0.58) 100%);
}

.edit-cover-copy {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 24rpx;
  z-index: 1;
}

.edit-cover-kicker {
  display: inline-flex;
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  color: #edf3ff;
  font-size: 20rpx;
  font-weight: 700;
}

.edit-cover-title {
  margin-top: 16rpx;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.26;
  color: #ffffff;
}

.edit-cover-desc {
  margin-top: 10rpx;
  max-width: 560rpx;
  font-size: 22rpx;
  line-height: 1.65;
  color: rgba(237, 243, 255, 0.84);
}

.edit-panel {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.edit-panel-head {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.edit-panel-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #223247;
}

.edit-panel-copy {
  color: #6a788a;
  font-size: 22rpx;
  line-height: 1.6;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.edit-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.edit-field-half {
  min-width: 0;
}

.edit-label {
  font-size: 24rpx;
  font-weight: 700;
  color: #516175;
}

.edit-input,
.edit-textarea {
  width: 100%;
  box-sizing: border-box;
  border: none;
  outline: none;
  padding: 24rpx 22rpx;
  border-radius: 24rpx;
  background: rgba(245, 248, 252, 0.94);
  box-shadow: inset 0 0 0 2rpx rgba(191, 208, 226, 0.26);
  color: #223247;
  font-size: 26rpx;
}

.edit-input {
  height: 84rpx;
}

.edit-hint {
  font-size: 21rpx;
  line-height: 1.65;
  color: #8391a3;
}

.gender-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.gender-chip {
  min-width: 144rpx;
  height: 68rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: rgba(239, 244, 250, 0.92);
  color: #526277;
  font-size: 24rpx;
  font-weight: 700;
}

.gender-chip-active {
  background: linear-gradient(90deg, #005e9f 0%, #44a5ff 100%);
  color: #edf3ff;
  box-shadow: 0 14rpx 28rpx rgba(0, 94, 159, 0.18);
}

.edit-textarea {
  min-height: 180rpx;
  line-height: 1.7;
}

.edit-counter {
  align-self: flex-end;
  font-size: 20rpx;
  color: #8a95a6;
}

.edit-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 25;
  padding: 16rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(248, 251, 255, 0) 0%, rgba(248, 251, 255, 0.92) 28%, rgba(248, 251, 255, 0.98) 100%);
  backdrop-filter: blur(18rpx);
}

.primary-button {
  height: 92rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #005e9f 0%, #44a5ff 100%);
  color: #edf3ff;
  font-size: 28rpx;
  font-weight: 800;
  box-shadow: 0 22rpx 44rpx rgba(0, 94, 159, 0.22);
}

.primary-button-disabled {
  opacity: 0.72;
}

.edit-save-button {
  width: 100%;
}

.edit-guest-card {
  margin-top: 18rpx;
  padding: 38rpx 32rpx;
}

.edit-guest-badge {
  display: inline-flex;
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(68, 165, 255, 0.14);
  color: #005e9f;
  font-size: 22rpx;
  font-weight: 700;
}

.edit-guest-title {
  margin-top: 22rpx;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.3;
  color: #24364a;
}

.edit-guest-copy {
  margin-top: 18rpx;
  margin-bottom: 28rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6a788a;
}
</style>
