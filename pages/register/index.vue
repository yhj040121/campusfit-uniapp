<template>
  <view class="page-shell">
    <view class="page-header">
      <view class="page-title">完善你的校园资料</view>
      <view class="page-desc">填写基础信息后，CampusFit 将为你关联账号、内容管理和创作者收益中心。</view>
    </view>

    <view class="panel-card">
      <view class="form-label">手机号</view>
      <input class="form-input" v-model="phone" maxlength="11" placeholder="请输入手机号" />
    </view>

    <view class="panel-card">
      <view class="form-label">昵称</view>
      <input class="form-input" v-model="nickname" maxlength="20" placeholder="大家怎么称呼你？" />
    </view>

    <view class="panel-card">
      <view class="form-label">学校</view>
      <input class="form-input" v-model="schoolName" maxlength="40" placeholder="例如：华东师范大学" />
      <view class="form-label" style="margin-top:18rpx;">年级</view>
      <input class="form-input" v-model="gradeName" maxlength="20" placeholder="例如：大二" />
    </view>

    <view class="panel-card">
      <view class="form-label">个性签名</view>
      <textarea class="form-textarea" v-model="signature" maxlength="60" placeholder="写一句关于你的穿搭风格或校园生活吧。"></textarea>
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
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
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
</style>
