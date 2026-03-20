<template>
  <view class="page-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">编辑资料前请先登录</view>
      <view class="hero-copy">资料编辑会关联你的真实账号数据，需要登录状态才能使用。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="page-title">编辑资料</view>
        <view class="page-desc">修改昵称、学校、年级和签名，完善你的创作者身份。</view>
      </view>

      <view class="panel-card">
        <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
      </view>

      <view class="panel-card">
        <view class="form-label">手机号</view>
        <input class="form-input" :value="form.phone" disabled />
        <view class="form-label" style="margin-top:18rpx;">昵称</view>
        <input class="form-input" v-model="form.nickname" maxlength="20" placeholder="请输入昵称" />
      </view>

      <view class="panel-card">
        <view class="form-label">学校</view>
        <input class="form-input" v-model="form.schoolName" maxlength="100" placeholder="请输入学校名称" />
        <view class="form-label" style="margin-top:18rpx;">年级</view>
        <input class="form-input" v-model="form.gradeName" maxlength="50" placeholder="请输入当前年级" />
      </view>

      <view class="panel-card">
        <view class="form-label">个性签名</view>
        <textarea class="form-textarea" v-model="form.signature" maxlength="255" placeholder="写一句关于你的穿搭风格或校园生活吧。"></textarea>
      </view>

      <button class="btn-primary" :loading="saving" @click="save">保存资料</button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

function emptyForm() {
  return {
    phone: '',
    nickname: '',
    schoolName: '',
    gradeName: '',
    signature: ''
  }
}

function isAuthError(error) {
  return ((error && error.message) || '').toLowerCase().indexOf('login') > -1
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      saving: false,
      form: emptyForm(),
      statusText: '正在加载可编辑资料...'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.form = emptyForm()
      this.statusText = '当前以游客身份浏览。'
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
            phone: profile.phone || '',
            nickname: profile.nickname || '',
            schoolName: profile.schoolName || '',
            gradeName: profile.gradeName || '',
            signature: profile.signature || ''
          }
          self.statusText = '资料已加载，可以直接编辑。'
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.form = emptyForm()
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          self.statusText = '暂时无法加载资料字段。'
        })
    },
    save: function() {
      var self = this
      if (!self.form.nickname) {
        uni.showToast({ title: '请输入昵称', icon: 'none' })
        return
      }
      self.saving = true
      api.updateMyProfile({
        nickname: self.form.nickname,
        schoolName: self.form.schoolName,
        gradeName: self.form.gradeName,
        signature: self.form.signature
      })
        .then(function() {
          session.updateUser({ nickname: self.form.nickname })
          self.statusText = '资料修改成功。'
          uni.showToast({ title: '资料已保存', icon: 'none' })
          setTimeout(function() {
            uni.navigateBack()
          }, 350)
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          uni.showToast({ title: error.message || '资料保存失败', icon: 'none' })
        })
        .finally(function() {
          self.saving = false
        })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style>
</style>
