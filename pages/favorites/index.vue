<template>
  <view class="page-shell favorites-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看我的收藏</view>
      <view class="hero-copy">你收藏过的穿搭内容、商品线索和预算参考都会汇总到这里，方便之后继续回看。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">收藏清单</view>
        <view class="page-title">把想回看的穿搭和商品入口放进自己的灵感夹</view>
        <view class="page-desc">这里会集中展示你已经收藏的内容，后续可以继续查看详情，也能直接取消收藏。</view>
      </view>

      <view class="filter-summary-card">
        <view class="summary-kicker">收藏状态</view>
        <view class="summary-line">{{ statusText }}</view>
      </view>

      <view :class="['status-banner', favoriteStateClass]">
        <view class="status-banner-head">
          <view>
            <view class="status-banner-title">收藏页状态</view>
            <view class="status-banner-copy">{{ favoriteStateText }}</view>
          </view>
          <view class="status-link" @click="refreshFavorites">刷新收藏</view>
        </view>
        <view class="status-grid two-col">
          <view class="status-item">
            <view class="status-item-label">收藏内容</view>
            <text class="status-item-value">{{ favorites.length }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">当前模式</view>
            <text class="status-item-value">{{ actionLoadingId ? '处理中' : '可浏览' }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">同步来源</view>
            <text class="status-item-value">后端收藏列表</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">支持操作</view>
            <text class="status-item-value">查看 / 取消收藏</text>
          </view>
        </view>
      </view>

      <view v-if="listLoading">
        <view class="skeleton-card" v-for="item in 2" :key="'favorite-skeleton-' + item">
          <view class="skeleton-block"></view>
          <view class="skeleton-line medium"></view>
          <view class="skeleton-line"></view>
        </view>
      </view>

      <view v-else-if="listFailed" class="status-banner status-banner-error">
        <view class="status-banner-head">
          <view>
            <view class="status-banner-title">收藏列表暂时不可用</view>
            <view class="status-banner-copy">接口失败时，这里会保留刷新入口，不会让页面直接空掉。</view>
          </view>
          <view class="status-link" @click="refreshFavorites">重新加载</view>
        </view>
      </view>

      <view v-else-if="favorites.length">
        <view class="look-card favorite-card" v-for="item in favorites" :key="item.id">
          <view class="look-cover" @click="goDetail(item.id)">
            <view class="cover-tag">{{ item.coverTag }}</view>
            <view class="cover-title">{{ item.title }}</view>
            <view class="cover-copy">{{ item.subtitle }}</view>
          </view>
          <view class="product-card favorite-product">
            <view class="text-main">{{ item.product }}</view>
            <view class="text-copy">{{ item.platform }} · {{ item.price }}</view>
          </view>
          <view class="btn-row" style="margin-top:18rpx;">
            <button class="btn-secondary btn-half" :disabled="actionLoadingId === item.id" @click.stop="goDetail(item.id)">查看详情</button>
            <button class="btn-ghost btn-half" :class="actionLoadingId === item.id ? 'btn-disabled' : ''" :disabled="actionLoadingId === item.id" @click.stop="confirmRemove(item)">取消收藏</button>
          </view>
        </view>
      </view>

      <view v-else class="panel-card">
        <view class="section-title" style="margin-top:0;">还没有收藏内容</view>
        <view class="text-copy">看到喜欢的穿搭可以先收藏，之后再回来比较预算、单品和导购链接。</view>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      favorites: [],
      statusText: '正在加载收藏内容...',
      listLoading: false,
      listFailed: false,
      actionLoadingId: ''
    }
  },
  computed: {
    favoriteStateClass: function() {
      if (this.listLoading || this.actionLoadingId) {
        return 'status-banner-warning'
      }
      if (this.listFailed) {
        return 'status-banner-error'
      }
      return 'status-banner-success'
    },
    favoriteStateText: function() {
      if (this.listLoading) {
        return '正在同步收藏列表和商品信息。'
      }
      if (this.actionLoadingId) {
        return '正在更新收藏状态，请稍候。'
      }
      if (this.listFailed) {
        return '当前未能读取收藏列表，建议刷新后重试。'
      }
      if (!this.favorites.length) {
        return '收藏夹已经准备好，现在还没有内容被加入。'
      }
      return '收藏列表状态正常，可以继续查看详情或取消收藏。'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.favorites = []
      this.listLoading = false
      this.listFailed = false
      this.statusText = '请登录后查看我的收藏。'
      return
    }
    this.loadFavorites()
  },
  methods: {
    loadFavorites: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
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
          self.listFailed = true
          self.statusText = '后端收藏列表暂时不可用。'
        })
        .finally(function() {
          self.listLoading = false
        })
    },
    refreshFavorites: function() {
      if (!this.loggedIn) {
        this.goLogin()
        return
      }
      this.loadFavorites()
      uni.showToast({ title: '正在刷新收藏列表', icon: 'none' })
    },
    goDetail: function(id) {
      uni.navigateTo({ url: '/pages/detail/index?id=' + id })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    confirmRemove: function(item) {
      var self = this
      if (self.actionLoadingId) {
        return
      }
      uni.showModal({
        title: '取消收藏',
        content: '确认将《' + item.title + '》从收藏列表中移除吗？',
        confirmText: '确认移除',
        cancelText: '取消',
        success: function(result) {
          if (result.confirm) {
            self.removeFavorite(item)
          }
        }
      })
    },
    removeFavorite: function(item) {
      var self = this
      self.actionLoadingId = item.id
      api.toggleFavorite(item.id)
        .then(function() {
          self.favorites = self.favorites.filter(function(post) {
            return post.id !== item.id
          })
          self.statusText = '已从收藏列表移除《' + item.title + '》。'
          uni.showToast({ title: '已取消收藏', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.favorites = []
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          uni.showToast({ title: error.message || '取消收藏失败', icon: 'none' })
        })
        .finally(function() {
          self.actionLoadingId = ''
        })
    }
  }
}
</script>

<style>
.favorite-card {
  margin-top: 18rpx;
}

.favorite-product {
  margin-top: 18rpx;
}
</style>
