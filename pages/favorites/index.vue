<template>
  <view class="page-shell favorites-shell">
    <view v-if="!loggedIn" class="favorites-hero-card">
      <view class="favorites-hero-badge">需要登录</view>
      <view class="favorites-hero-title">登录后查看我的收藏</view>
      <view class="favorites-hero-copy">你收藏过的穿搭内容、商品线索和预算参考都会汇总到这里，方便之后继续回看和比较。</view>
      <button class="btn-primary favorites-hero-button" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="favorites-summary-card">
        <view class="favorites-summary-head">
          <view class="favorites-summary-copygroup">
            <view class="favorites-summary-kicker">FAVORITES</view>
            <view class="favorites-summary-title">{{ summaryTitle }}</view>
            <view class="favorites-summary-copy">{{ statusText }}</view>
          </view>
          <view class="favorites-summary-badge">
            <text class="favorites-summary-badge-value">{{ favorites.length }}</text>
            <text class="favorites-summary-badge-label">条收藏</text>
          </view>
        </view>

        <view class="favorites-summary-actions">
          <view class="favorites-summary-action" @click="refreshFavorites">刷新收藏</view>
        </view>
      </view>

      <view v-if="listLoading" class="favorites-grid">
        <view
          v-for="item in 4"
          :key="'favorite-skeleton-' + item"
          class="favorite-card favorite-card-skeleton"
        ></view>
      </view>

      <view v-else-if="listFailed" class="favorites-state-card">
        <view class="favorites-state-title">收藏列表暂时不可用</view>
        <view class="favorites-state-copy">当前接口请求失败，你可以稍后重试，也可以先去首页看看新的内容。</view>
        <view class="favorites-state-actions">
          <view class="favorites-state-button favorites-state-button-primary" @click="refreshFavorites">重新加载</view>
        </view>
      </view>

      <view v-else-if="favorites.length" class="favorites-grid">
        <view
          v-for="item in favorites"
          :key="item.id"
          class="favorite-card"
        >
          <view class="favorite-card-cover" @click="goDetail(item.id)">
            <image
              v-if="item.displayCoverUrl"
              class="favorite-card-image"
              :src="item.displayCoverUrl"
              mode="aspectFill"
            ></image>
            <view v-else class="favorite-card-fallback">
              <view class="favorite-card-fallback-title">{{ item.title || '收藏内容' }}</view>
            </view>

            <view class="favorite-card-cover-top">
              <view class="favorite-card-tag">{{ item.coverTag || item.scene || '校园穿搭' }}</view>
              <view class="favorite-card-badge">已收藏</view>
            </view>
          </view>

          <view class="favorite-card-body" @click="goDetail(item.id)">
            <view class="favorite-card-title">{{ item.title || '未命名内容' }}</view>
            <view class="favorite-card-copy">{{ item.subtitle || item.desc || '点进来继续看看这条收藏内容。' }}</view>
            <view class="favorite-card-product">{{ item.product || '商品信息待补充' }}</view>
            <view class="favorite-card-meta">{{ formatMeta(item) }}</view>
          </view>

          <view class="favorite-card-actions">
            <view class="favorite-card-action favorite-card-action-secondary" @click.stop="goDetail(item.id)">查看</view>
            <view
              :class="['favorite-card-action', 'favorite-card-action-danger', actionLoadingId === item.id ? 'btn-disabled' : '']"
              @click.stop="confirmRemove(item)"
            >
              {{ actionLoadingId === item.id ? '移除中' : '取消收藏' }}
            </view>
          </view>
        </view>
      </view>

      <view v-else class="favorites-state-card">
        <view class="favorites-state-title">还没有收藏内容</view>
        <view class="favorites-state-copy">看到喜欢的穿搭可以先收藏，之后再回来比较预算、单品和导购链接。</view>
        <view class="favorites-state-actions">
          <view class="favorites-state-button favorites-state-button-primary" @click="goDiscover">去首页看看</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var postDisplay = require('../../common/post-display.js')
var session = require('../../common/session.js')

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).replace(/\s+/g, ' ').trim()
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
    summaryTitle: function() {
      if (!this.favorites.length) {
        return '把喜欢的穿搭收进灵感夹'
      }
      return '你已经收藏了 ' + this.favorites.length + ' 条内容'
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
    formatMeta: function(item) {
      var platform = normalizeText(item && item.platform)
      var price = normalizeText(item && item.price)
      if (platform && price) {
        return platform + ' · ' + price
      }
      if (price) {
        return price
      }
      return platform || '校园穿搭'
    },
    loadFavorites: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
      api.listFavoritePosts()
        .then(function(list) {
          self.favorites = (list || []).map(function(item) {
            return Object.assign({}, item, {
              displayCoverUrl: postDisplay.getDisplayCoverUrl(item),
              subtitle: normalizeText(item.subtitle),
              desc: normalizeText(item.desc),
              product: normalizeText(item.product),
              platform: normalizeText(item.platform),
              price: normalizeText(item.price),
              coverTag: normalizeText(item.coverTag),
              scene: normalizeText(item.scene)
            })
          })
          self.statusText = self.favorites.length
            ? '收藏内容已更新，可以继续回看和筛选。'
            : '这里会收下你喜欢的内容，方便之后回看。'
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
          self.statusText = '收藏内容暂时不可用，请稍后再试。'
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
    goDiscover: function() {
      uni.switchTab({ url: '/pages/index/index' })
    },
    confirmRemove: function(item) {
      var self = this
      if (self.actionLoadingId) {
        return
      }
      uni.showModal({
        title: '取消收藏',
        content: '确认将《' + (item.title || '这条内容') + '》从收藏列表中移除吗？',
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
          self.statusText = '已从收藏列表移除《' + (item.title || '这条内容') + '》。'
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

<style scoped>
.favorites-shell {
  min-height: 100vh;
  padding: calc(24rpx + env(safe-area-inset-top)) 24rpx calc(172rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(253, 210, 167, 0.24), transparent 34%),
    radial-gradient(circle at top right, rgba(68, 165, 255, 0.16), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f5f7fa 42%, #eef4fa 100%);
}

.favorites-hero-card,
.favorites-summary-card,
.favorite-card,
.favorites-state-card {
  border-radius: 32rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 22rpx 54rpx rgba(25, 52, 87, 0.08);
  backdrop-filter: blur(22rpx);
}

.favorites-hero-card {
  padding: 34rpx 30rpx;
}

.favorites-hero-badge {
  width: fit-content;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(68, 165, 255, 0.12);
  color: #1f63ac;
  font-size: 22rpx;
  font-weight: 700;
}

.favorites-hero-title {
  margin-top: 18rpx;
  color: #24364a;
  font-size: 42rpx;
  font-weight: 800;
  line-height: 1.18;
}

.favorites-hero-copy {
  margin-top: 14rpx;
  color: #66768b;
  font-size: 24rpx;
  line-height: 1.7;
}

.favorites-hero-button {
  margin-top: 26rpx;
}

.favorites-summary-card {
  padding: 28rpx;
}

.favorites-summary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.favorites-summary-copygroup {
  flex: 1;
  min-width: 0;
}

.favorites-summary-kicker {
  color: #1f63ac;
  font-size: 22rpx;
  font-weight: 800;
  letter-spacing: 3rpx;
}

.favorites-summary-title {
  margin-top: 10rpx;
  color: #24364a;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.16;
}

.favorites-summary-copy {
  margin-top: 12rpx;
  color: #66768b;
  font-size: 24rpx;
  line-height: 1.6;
}

.favorites-summary-badge {
  min-width: 114rpx;
  padding: 14rpx 18rpx;
  border-radius: 26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
  background: linear-gradient(145deg, #f1f8ff 0%, #d8eefe 100%);
  color: #1f63ac;
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.7);
}

.favorites-summary-badge-value {
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1;
}

.favorites-summary-badge-label {
  font-size: 20rpx;
  font-weight: 700;
  opacity: 0.82;
}

.favorites-summary-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
}

.favorites-summary-action {
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

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
  margin-top: 18rpx;
}

.favorite-card {
  overflow: hidden;
}

.favorite-card-skeleton {
  min-height: 432rpx;
  background:
    linear-gradient(90deg, rgba(238, 243, 247, 0.88) 25%, rgba(248, 251, 255, 0.98) 37%, rgba(238, 243, 247, 0.88) 63%);
  background-size: 300% 100%;
  animation: favoriteShimmer 1.4s infinite linear;
}

.favorite-card-cover {
  position: relative;
  height: 214rpx;
  background: linear-gradient(145deg, #dbe7f5 0%, #f8fbff 100%);
}

.favorite-card-image,
.favorite-card-fallback {
  width: 100%;
  height: 100%;
}

.favorite-card-fallback {
  padding: 20rpx;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(145deg, rgba(224, 235, 247, 0.98), rgba(247, 251, 255, 0.98));
}

.favorite-card-fallback-title {
  font-size: 28rpx;
  font-weight: 800;
  color: #24364a;
  line-height: 1.3;
}

.favorite-card-cover-top {
  position: absolute;
  left: 14rpx;
  right: 14rpx;
  top: 14rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.favorite-card-tag,
.favorite-card-badge {
  max-width: 52%;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  backdrop-filter: blur(12rpx);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 18rpx;
  font-weight: 700;
}

.favorite-card-tag {
  background: rgba(16, 39, 67, 0.22);
  color: #ffffff;
}

.favorite-card-badge {
  background: rgba(255, 244, 222, 0.88);
  color: #b27a0c;
}

.favorite-card-body {
  padding: 18rpx 18rpx 14rpx;
}

.favorite-card-title {
  min-height: 68rpx;
  color: #24364a;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.16;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.favorite-card-copy {
  margin-top: 10rpx;
  min-height: 62rpx;
  color: #66768b;
  font-size: 22rpx;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.favorite-card-product {
  margin-top: 12rpx;
  color: #24364a;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.favorite-card-meta {
  margin-top: 6rpx;
  color: #90a0b4;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.4;
}

.favorite-card-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  padding: 0 18rpx 18rpx;
}

.favorite-card-action {
  min-height: 60rpx;
  padding: 0 10rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21rpx;
  font-weight: 700;
}

.favorite-card-action-secondary {
  background: rgba(68, 165, 255, 0.1);
  color: #1f63ac;
}

.favorite-card-action-danger {
  background: rgba(255, 235, 237, 0.96);
  color: #df4c63;
}

.favorites-state-card {
  margin-top: 18rpx;
  padding: 34rpx 28rpx;
}

.favorites-state-title {
  color: #24364a;
  font-size: 34rpx;
  font-weight: 800;
}

.favorites-state-copy {
  margin-top: 14rpx;
  color: #66768b;
  font-size: 24rpx;
  line-height: 1.65;
}

.favorites-state-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 22rpx;
}

.favorites-state-button {
  min-height: 72rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.favorites-state-button-primary {
  background: linear-gradient(90deg, #005e9f 0%, #44a5ff 100%);
  color: #edf3ff;
}

.btn-disabled {
  opacity: 0.58;
  pointer-events: none;
}

@keyframes favoriteShimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}
</style>
