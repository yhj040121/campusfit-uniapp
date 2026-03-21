<template>
  <view class="page-shell posts-shell">
    <view v-if="!loggedIn" class="hero-card posts-hero">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看我的发布</view>
      <view class="hero-copy">这里会集中管理你已发布、审核中、已下架和被驳回的穿搭内容。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">内容管理台</view>
        <view class="page-title">把每条发布当成一张可追踪的内容便签</view>
        <view class="page-desc">查看审核状态、编辑内容，并管理上架与下架状态，让内容表现和导购转化更清楚。</view>
      </view>

      <view class="hero-card posts-hero">
        <view class="hero-badge">我的发布</view>
        <view class="hero-title">内容状态一眼看清</view>
        <view class="hero-copy">从已发布到审核中，再到下架与驳回，都会在同一块内容面板里管理。</view>
        <view class="hero-metrics">
          <view class="hero-metric">
            <text class="hero-metric-value">{{ posts.length }}</text>
            <text class="hero-metric-label">内容总数</text>
          </view>
          <view class="hero-metric">
            <text class="hero-metric-value">{{ publishedCount }}</text>
            <text class="hero-metric-label">已发布</text>
          </view>
          <view class="hero-metric">
            <text class="hero-metric-value">{{ pendingCount }}</text>
            <text class="hero-metric-label">审核中</text>
          </view>
        </view>
      </view>

      <view class="section-head" style="margin-top:18rpx;">
        <view>
          <view class="section-title" style="margin-top:0;">状态总览</view>
          <view class="section-subtitle">快速查看不同审核状态下的内容数量</view>
        </view>
        <view class="float-link" @click="refreshPosts">刷新列表</view>
      </view>

      <view class="status-overview">
        <view class="status-overview-card">
          <view class="status-overview-label">已发布</view>
          <view class="status-overview-value">{{ publishedCount }}</view>
        </view>
        <view class="status-overview-card">
          <view class="status-overview-label">审核中</view>
          <view class="status-overview-value">{{ pendingCount }}</view>
        </view>
        <view class="status-overview-card">
          <view class="status-overview-label">已下架</view>
          <view class="status-overview-value">{{ offlineCount }}</view>
        </view>
        <view class="status-overview-card">
          <view class="status-overview-label">已驳回</view>
          <view class="status-overview-value">{{ rejectedCount }}</view>
        </view>
      </view>

      <view v-if="listLoading">
        <view class="skeleton-card" v-for="item in 2" :key="'post-skeleton-' + item">
          <view class="skeleton-block"></view>
          <view class="skeleton-line medium"></view>
          <view class="skeleton-line"></view>
        </view>
      </view>

      <view v-else-if="listFailed" class="status-banner status-banner-error">
        <view class="status-banner-head">
          <view>
            <view class="status-banner-title">发布列表暂时不可用</view>
            <view class="status-banner-copy">接口请求失败时，这里会提示你手动刷新，而不是直接留白。</view>
          </view>
          <view class="status-link" @click="refreshPosts">重新加载</view>
        </view>
      </view>

      <view v-else-if="posts.length">
        <view class="look-card post-card" v-for="item in posts" :key="item.id">
          <view :class="['look-cover', 'post-cover', item.coverImageUrl ? 'has-media' : '', !item.canViewDetail ? 'look-cover-disabled' : '']" @click="handleCardClick(item)">
            <image v-if="item.coverImageUrl" class="cover-media" :src="item.coverImageUrl" mode="aspectFill"></image>
            <view class="cover-top">
              <view class="cover-tag">{{ item.coverTag }}</view>
              <view class="status-chip" :class="statusClass(item.publishStatus)">{{ item.publishStatusText }}</view>
            </view>
            <view class="cover-title">{{ item.title }}</view>
            <view class="cover-copy">{{ item.subtitle }}</view>
          </view>

          <view class="status-copy">{{ item.publishStatusDesc }}</view>
          <view class="text-copy">{{ item.desc }}</view>

          <view class="meta-line post-meta">
            <view class="stats-line">
              <view class="stat-text">点赞 {{ item.likes }}</view>
              <view class="stat-text">评论 {{ item.comments }}</view>
              <view class="stat-text">收藏 {{ item.saves }}</view>
            </view>
            <view class="float-link" v-if="item.canViewDetail">可查看详情</view>
            <view class="list-meta" v-else>当前状态暂不支持预览</view>
          </view>

          <view class="btn-row post-actions">
            <button
              class="btn-secondary"
              :class="item.canShelfDown || item.canRestore ? 'btn-half' : 'btn-full'"
              :disabled="actionLoadingId === item.id"
              @click.stop="startEdit(item)"
            >
              编辑内容
            </button>
            <button
              v-if="item.canShelfDown"
              class="btn-ghost btn-half btn-warn"
              :class="actionLoadingId === item.id ? 'btn-disabled' : ''"
              :disabled="actionLoadingId === item.id"
              @click.stop="confirmShelfDown(item)"
            >
              下架内容
            </button>
            <button
              v-else-if="item.canRestore"
              class="btn-ghost btn-half btn-success"
              :class="actionLoadingId === item.id ? 'btn-disabled' : ''"
              :disabled="actionLoadingId === item.id"
              @click.stop="confirmRestore(item)"
            >
              重新上架
            </button>
          </view>
        </view>
      </view>

      <view v-else class="panel-card empty-card">
        <view class="section-title" style="margin-top:0;">暂无发布内容</view>
        <view class="text-copy">发布第一条校园穿搭后，就可以在这里查看审核状态与内容表现。</view>
        <button class="btn-primary" style="margin-top:20rpx;" @click="goPublish">去发布</button>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

var EDIT_POST_KEY = 'campusfit_edit_post_id'

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      posts: [],
      statusText: '正在加载我的发布...',
      listLoading: false,
      listFailed: false,
      actionLoadingId: ''
    }
  },
  computed: {
    publishedCount: function() {
      return this.countByStatus('PUBLISHED')
    },
    pendingCount: function() {
      return this.countByStatus('PENDING')
    },
    offlineCount: function() {
      return this.countByStatus('OFFLINE')
    },
    rejectedCount: function() {
      return this.countByStatus('REJECTED')
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.posts = []
      this.listLoading = false
      this.listFailed = false
      this.statusText = '请登录后查看我的发布。'
      return
    }
    this.loadMine()
  },
  methods: {
    countByStatus: function(status) {
      var total = 0
      for (var i = 0; i < this.posts.length; i += 1) {
        if (this.posts[i].publishStatus === status) {
          total += 1
        }
      }
      return total
    },
    loadMine: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
      api.listMyPosts()
        .then(function(list) {
          self.posts = list || []
          self.statusText = '共 ' + self.posts.length + ' 条内容，可继续管理你的发布。'
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.posts = []
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          self.posts = []
          self.listFailed = true
          self.statusText = '发布列表暂时不可用，请稍后再试。'
        })
        .finally(function() {
          self.listLoading = false
        })
    },
    refreshPosts: function() {
      if (!this.loggedIn) {
        this.goLogin()
        return
      }
      this.loadMine()
      uni.showToast({ title: '正在刷新发布列表', icon: 'none' })
    },
    statusClass: function(publishStatus) {
      if (publishStatus === 'PENDING') {
        return 'status-chip-pending'
      }
      if (publishStatus === 'REJECTED') {
        return 'status-chip-rejected'
      }
      if (publishStatus === 'OFFLINE') {
        return 'status-chip-offline'
      }
      return 'status-chip-published'
    },
    handleCardClick: function(item) {
      if (!item.canViewDetail) {
        uni.showToast({ title: item.publishStatusText + '内容暂不支持预览', icon: 'none' })
        return
      }
      this.goDetail(item.id)
    },
    goDetail: function(id) {
      uni.navigateTo({ url: '/pages/detail/index?id=' + id })
    },
    goPublish: function() {
      uni.switchTab({ url: '/pages/publish/index' })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    startEdit: function(item) {
      if (this.actionLoadingId) {
        return
      }
      uni.setStorageSync(EDIT_POST_KEY, item.id)
      uni.switchTab({ url: '/pages/publish/index' })
    },
    confirmShelfDown: function(item) {
      var self = this
      if (self.actionLoadingId) {
        return
      }
      uni.showModal({
        title: '下架确认',
        content: '确认下架《' + item.title + '》吗？下架后内容不会继续在首页和搜索中展示。',
        confirmText: '确认下架',
        cancelText: '取消',
        success: function(result) {
          if (result.confirm) {
            self.shelfDownPost(item)
          }
        }
      })
    },
    shelfDownPost: function(item) {
      var self = this
      self.actionLoadingId = item.id
      api.shelfDownPost(item.id)
        .then(function() {
          uni.showToast({ title: '已下架', icon: 'none' })
          self.loadMine()
        })
        .catch(function(error) {
          self.handleActionError(error, '下架失败')
        })
        .finally(function() {
          self.actionLoadingId = ''
        })
    },
    confirmRestore: function(item) {
      var self = this
      if (self.actionLoadingId) {
        return
      }
      uni.showModal({
        title: '重新上架确认',
        content: '确认将《' + item.title + '》重新上架吗？重新上架后内容会继续对外展示。',
        confirmText: '重新上架',
        cancelText: '取消',
        success: function(result) {
          if (result.confirm) {
            self.restorePost(item)
          }
        }
      })
    },
    restorePost: function(item) {
      var self = this
      self.actionLoadingId = item.id
      api.restorePost(item.id)
        .then(function() {
          uni.showToast({ title: '已重新上架', icon: 'none' })
          self.loadMine()
        })
        .catch(function(error) {
          self.handleActionError(error, '重新上架失败')
        })
        .finally(function() {
          self.actionLoadingId = ''
        })
    },
    handleActionError: function(error, fallbackText) {
      if (isAuthError(error)) {
        session.clearSession()
        this.loggedIn = false
        this.posts = []
        this.listLoading = false
        this.listFailed = false
        this.statusText = '登录已过期，请重新登录。'
        return
      }
      uni.showToast({ title: error.message || fallbackText, icon: 'none' })
    }
  }
}
</script>

<style scoped>
.posts-shell {
  padding-top: 34rpx;
}

.campus-ribbon {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.84);
  color: #4699cf;
  font-size: 22rpx;
  letter-spacing: 2rpx;
  box-shadow: 0 12rpx 24rpx rgba(80, 150, 193, 0.1);
}

.posts-hero {
  margin-top: 20rpx;
}

.hero-metrics {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.hero-metric {
  flex: 1;
  padding: 18rpx 14rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.16);
}

.hero-metric-value {
  display: block;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 700;
}

.hero-metric-label {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.84);
  font-size: 22rpx;
}

.posts-status {
  margin-top: 18rpx;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}

.note-stamp {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(67, 198, 157, 0.14);
  color: #34a77f;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.status-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
  margin-top: 18rpx;
}

.status-overview-card {
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(109, 154, 190, 0.14);
  box-shadow: 0 12rpx 28rpx rgba(52, 114, 154, 0.08);
}

.status-overview-label {
  color: #7690a1;
  font-size: 22rpx;
}

.status-overview-value {
  margin-top: 10rpx;
  color: #243646;
  font-size: 34rpx;
  font-weight: 700;
}

.post-card {
  margin-top: 18rpx;
}

.post-cover {
  min-height: 254rpx;
}

.cover-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.look-cover-disabled {
  opacity: 0.92;
}

.status-copy {
  margin-top: 16rpx;
  padding: 14rpx 18rpx;
  border-radius: 20rpx;
  background: rgba(87, 189, 240, 0.1);
  color: #617482;
  font-size: 22rpx;
  line-height: 1.6;
}

.post-meta {
  padding-top: 14rpx;
  border-top: 1rpx solid rgba(112, 155, 188, 0.12);
}

.status-chip {
  flex-shrink: 0;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 1;
}

.status-chip-published {
  background: rgba(87, 189, 240, 0.16);
  color: #2d95c9;
}

.status-chip-pending {
  background: rgba(255, 179, 108, 0.2);
  color: #bf6b1c;
}

.status-chip-rejected {
  background: rgba(255, 95, 118, 0.14);
  color: #e35d74;
}

.status-chip-offline {
  background: rgba(120, 143, 164, 0.16);
  color: #5f7383;
}

.post-actions {
  margin-top: 18rpx;
}

.btn-full {
  width: 100%;
}

.btn-warn {
  background: rgba(255, 179, 108, 0.16);
  color: #bf6b1c;
}

.btn-success {
  background: rgba(56, 195, 154, 0.16);
  color: #1f9d7d;
}

.empty-card {
  margin-top: 20rpx;
}
</style>
