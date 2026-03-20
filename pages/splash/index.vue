<template>
  <view class="page-shell splash-shell splash-center">
    <view class="splash-stage">
      <view class="hero-card splash-hero">
        <view class="hero-badge">校园穿搭导购</view>
        <view class="hero-title">CampusFit</view>
        <view class="hero-copy">把校园穿搭灵感、场景标签、社交互动和商品导购整理成一套轻盈的移动端闭环原型。</view>
        <view class="hero-card-row">
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">20</text>
            <text class="hero-card-pill-label">核心页面</text>
          </view>
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">完整</text>
            <text class="hero-card-pill-label">功能链路</text>
          </view>
        </view>
      </view>

      <view class="panel-card splash-panel">
        <view class="text-main">先登录，或者先去首页逛一圈</view>
        <view class="text-copy">如果你想演示完整链路，建议先登录；如果想先看首页信息流和活动中心，也可以直接进入首页浏览。</view>
        <button class="btn-primary" style="margin-top:22rpx;" @click="goLogin">去登录</button>
        <button class="btn-ghost" style="margin-top:16rpx;" @click="goHome">直接进入首页</button>
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
.splash-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.splash-stage {
  width: 100%;
}

.splash-panel {
  margin-top: 18rpx;
}
</style>
