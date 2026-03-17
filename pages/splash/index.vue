<template>
  <view class="page-shell" style="display:flex; align-items:center; justify-content:center; min-height:100vh;">
    <view style="width:100%;">
      <view class="hero-card" style="padding:42rpx 34rpx;">
        <view class="hero-badge">校园穿搭社交导购</view>
        <view class="hero-title">CampusFit</view>
        <view class="hero-copy">发现真实的校园穿搭灵感，按场景和预算快速获取日常搭配方案。</view>
      </view>
      <view class="panel-card">
        <view class="text-main">年轻、清爽、充满校园感</view>
        <view class="text-copy">该原型包含 20 个页面，覆盖内容信息流、社交互动、电商跳转、个人中心和平台盈利展示。</view>
        <button class="btn-primary" style="margin-top:22rpx;" @click="goLogin">进入登录</button>
        <button class="btn-ghost" style="margin-top:16rpx;" @click="goHome">前往首页</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    goHome: function() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style>
</style>
