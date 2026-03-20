<template>
  <view class="page-shell register-shell">
    <view class="page-header">
      <view class="campus-ribbon">校园资料卡</view>
      <view class="page-title">先完善你的校园身份，再开启内容互动</view>
      <view class="page-desc">注册只需要填写昵称、学校、年级和一句个性签名，后续这些内容会直接同步到个人主页和社区互动场景。</view>
    </view>

    <view class="hero-card register-hero">
      <view class="hero-badge">新用户注册</view>
      <view class="hero-title">把你的校园标签先填完整</view>
      <view class="hero-copy">这些信息会影响个人主页展示、内容发布身份以及校园场景推荐，让你的内容更容易被同校同风格用户看到。</view>
      <view class="hero-card-row">
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">1</text>
          <text class="hero-card-pill-label">创建账号</text>
        </view>
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">3</text>
          <text class="hero-card-pill-label">基础字段</text>
        </view>
      </view>
    </view>

    <view class="panel-card">
      <view class="form-label">手机号</view>
      <input class="form-input" v-model="phone" maxlength="11" placeholder="请输入手机号" />
    </view>

    <view class="panel-card">
      <view class="form-label">昵称</view>
      <input class="form-input" v-model="nickname" maxlength="20" placeholder="请输入你的昵称" />
    </view>

    <view class="panel-card">
      <view class="form-label">学校</view>
      <input class="form-input" v-model="schoolName" maxlength="40" placeholder="例如：华东师范大学" />
      <view class="form-label" style="margin-top:18rpx;">年级</view>
      <input class="form-input" v-model="gradeName" maxlength="20" placeholder="例如：大三" />
    </view>

    <view class="panel-card">
      <view class="form-label">个性签名</view>
      <textarea class="form-textarea" v-model="signature" maxlength="60" placeholder="一句话介绍你的穿搭偏好、预算观或校园日常"></textarea>
      <view class="note-box">建议写清自己的校园场景和穿搭偏好，例如“早八通勤 / 图书馆久坐 / 预算友好型搭配”。</view>
    </view>

    <button class="btn-primary" :loading="loading" @click="finish">完成注册</button>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

export default {
  data: function() {
    return {
      loading: false,
      phone: '',
      nickname: '',
      schoolName: '',
      gradeName: '',
      signature: ''
    }
  },
  onLoad: function(options) {
    this.phone = (options && options.phone) || ''
  },
  methods: {
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
      self.loading = true
      api.registerUser({
        phone: self.phone,
        nickname: self.nickname,
        schoolName: self.schoolName,
        gradeName: self.gradeName,
        signature: self.signature
      })
        .then(function(payload) {
          session.saveSession(payload)
          uni.showToast({ title: '注册成功', icon: 'none' })
          setTimeout(function() {
            uni.switchTab({ url: '/pages/profile/index' })
          }, 350)
        })
        .catch(function(error) {
          uni.showToast({ title: error.message || '注册失败', icon: 'none' })
        })
        .finally(function() {
          self.loading = false
        })
    }
  }
}
</script>

<style>
.register-hero {
  margin-bottom: 18rpx;
}
</style>
