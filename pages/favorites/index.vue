<template>
  <view class="page-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看我的收藏</view>
      <view class="hero-copy">已收藏的穿搭与商品导购内容都与你的个人账号关联。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="page-title">我的收藏</view>
        <view class="page-desc">查看你已保存的穿搭与商品导购，方便后续参考。</view>
      </view>

      <view class="panel-card">
        <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
      </view>

      <view v-if="favorites.length">
        <view class="look-card" v-for="item in favorites" :key="item.id" @click="goDetail(item.id)">
          <view class="look-cover">
            <view class="cover-tag">{{ item.coverTag }}</view>
            <view class="cover-title">{{ item.title }}</view>
            <view class="cover-copy">{{ item.subtitle }}</view>
          </view>
          <view class="text-copy">{{ item.product }} | {{ item.price }}</view>
          <view class="meta-line">
            <view class="stats-line">
              <view class="stat-text">平台 {{ item.platform }}</view>
            </view>
            <view class="side-pill side-pill-active">已收藏</view>
          </view>
        </view>
      </view>

      <view v-else class="panel-card">
        <view class="section-title" style="margin-top:0;">暂无收藏</view>
        <view class="text-copy">当你收藏穿搭或商品导购后，内容将显示在这里。</view>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

function isAuthError(error) {
  return ((error && error.message) || '').toLowerCase().indexOf('login') > -1
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      favorites: [],
      statusText: '正在加载收藏内容...'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.favorites = []
      this.statusText = '请登录后查看我的收藏'
      return
    }
    this.loadFavorites()
  },
  methods: {
    loadFavorites: function() {
      var self = this
      api.listFavoritePosts()
        .then(function(list) {
          self.favorites = list || []
          self.statusText = '收藏列表已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.favorites = []
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          self.favorites = []
          self.statusText = '后端收藏列表暂时不可用。'
        })
    },
    goDetail: function(id) {
      uni.navigateTo({ url: '/pages/detail/index?id=' + id })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style>
</style>
