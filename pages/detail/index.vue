<template>
  <view class="page-shell detail-shell">
    <view class="detail-stage">
      <view class="look-cover detail-cover">
        <view class="cover-tag">{{ post.coverTag }}</view>
        <view class="cover-title">{{ post.title }}</view>
        <view class="cover-copy">{{ post.subtitle }}</view>
        <view class="detail-price-chip">{{ post.price }}</view>
      </view>
      <view class="detail-stats">
        <view class="detail-stat">
          <text class="detail-stat-value">{{ post.likes }}</text>
          <text class="detail-stat-label">点赞</text>
        </view>
        <view class="detail-stat">
          <text class="detail-stat-value">{{ post.comments }}</text>
          <text class="detail-stat-label">评论</text>
        </view>
        <view class="detail-stat">
          <text class="detail-stat-value">{{ post.saves }}</text>
          <text class="detail-stat-label">收藏</text>
        </view>
      </view>
    </view>

    <view v-if="detailLoading" class="status-banner status-banner-warning">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">详情加载中</view>
          <view class="status-banner-copy">正在同步穿搭详情、互动状态和活动归属信息。</view>
        </view>
      </view>
    </view>

    <view v-else-if="detailFailed" class="status-banner status-banner-error">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">详情接口暂时不可用</view>
          <view class="status-banner-copy">当前已切换为本地演示内容，你也可以重新刷新一次。</view>
        </view>
        <view class="status-link" @click="refreshDetail">重试</view>
      </view>
    </view>

    <view class="panel-card detail-status">
      <view class="section-head" style="margin-top:0;">
        <view>
          <view class="section-subtitle">同步状态</view>
          <view class="text-copy" style="margin-top: 0;">{{ statusText }}</view>
        </view>
        <view class="float-link" @click="refreshDetail">刷新详情</view>
      </view>
    </view>

    <view class="panel-card author-card">
      <view class="author-head">
        <view class="meta-left">
          <view :class="['avatar', post.avatarClass]">{{ post.avatar }}</view>
          <view>
            <view class="meta-name">{{ post.user }}</view>
            <view class="meta-school">{{ post.school }}</view>
          </view>
        </view>
        <view :class="['side-pill', followed ? 'side-pill-active' : '', actionLoading ? 'btn-disabled' : '']" @click="toggleFollowAction">{{ followLabel }}</view>
      </view>

      <view class="detail-copy-card">
        <view class="section-title detail-title">穿搭亮点</view>
        <view class="chip-row">
          <view class="chip chip-outline">{{ post.scene }}</view>
          <view class="chip chip-outline">{{ post.style }}</view>
          <view class="chip chip-outline">预算 {{ post.budget }}</view>
        </view>
        <view class="chip-row detail-highlight-row" v-if="post.highlights && post.highlights.length">
          <view class="chip chip-active" v-for="item in post.highlights" :key="item">{{ item }}</view>
        </view>
        <view class="text-copy detail-copy">{{ post.desc }}</view>
      </view>

      <view class="action-row detail-actions">
        <view :class="['action-chip', liked ? 'action-chip-active' : '', actionLoading ? 'btn-disabled' : '']" @click="toggleLikeAction">{{ liked ? '已点赞' : '点赞' }}</view>
        <view class="action-chip" @click="goComments">评论</view>
        <view :class="['action-chip', saved ? 'action-chip-active' : '', actionLoading ? 'btn-disabled' : '']" @click="toggleFavoriteAction">{{ saved ? '已收藏' : '收藏' }}</view>
        <view class="action-chip" @click="sharePost">分享</view>
      </view>
    </view>

    <view v-if="currentActivity" class="panel-card activity-panel">
      <view class="section-head">
        <view>
          <view class="section-title" style="margin-top:0;">活动归属</view>
          <view class="section-subtitle">把内容消费、活动参与和激励表达串在同一页</view>
        </view>
        <view class="note-stamp activity-stamp">EVENT</view>
      </view>
      <view class="list-title" style="margin-top:18rpx;">{{ currentActivity.title }}</view>
      <view class="list-copy">{{ currentActivity.summary }}</view>
      <view class="chip-row detail-highlight-row">
        <view class="chip chip-outline">{{ currentActivity.period }}</view>
        <view class="chip chip-active">{{ currentActivity.status }}</view>
      </view>
      <view class="note-box">参与方式：{{ currentActivity.participation }}</view>
      <view class="note-box">活动激励：{{ currentActivity.reward }}</view>
      <view class="btn-row">
        <button class="btn-secondary btn-half" @click="goActivityCenter">查看活动</button>
        <button class="btn-primary btn-half" @click="toggleJoinActivity">{{ currentActivity.joined ? '退出活动' : '报名活动' }}</button>
      </view>
    </view>

    <view class="panel-card commerce-card">
      <view class="section-head commerce-head">
        <view>
          <view class="section-title" style="margin-top:0;">商品导购</view>
          <view class="section-subtitle">从种草到跳转购买的理性导购链路</view>
        </view>
        <view class="note-stamp">GUIDE</view>
      </view>
      <view class="product-card commerce-product">
        <view class="product-price">{{ post.price }}</view>
        <view class="text-main" style="margin-top:10rpx;">{{ post.product }}</view>
        <view class="text-copy" style="margin-top:8rpx;">{{ post.platform }}</view>
        <view class="note-box">理性消费提醒：{{ post.guideTip }}</view>
        <view class="note-box">平台盈利说明：{{ post.profit }}</view>
      </view>
      <view class="btn-row">
        <button class="btn-secondary btn-half" @click="goLikes">点赞列表</button>
        <button class="btn-primary btn-half" @click="goProduct">去购买</button>
      </view>
    </view>

    <view class="panel-card comment-board">
      <view class="section-head">
        <view>
          <view class="section-title" style="margin-top:0;">评论预览</view>
          <view class="section-subtitle">看看大家在意哪些场景和单品</view>
        </view>
        <view class="float-link" @click="goComments">查看全部</view>
      </view>
      <view v-if="previewComments.length">
        <view class="list-card comment-card" v-for="item in previewComments" :key="item.id">
          <view class="meta-left" style="align-items:flex-start;">
            <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
            <view class="comment-content">
              <view class="meta-name">{{ item.name }}</view>
              <view class="text-copy" style="margin-top:6rpx;">{{ item.text }}</view>
              <view class="list-meta">{{ item.time }} | {{ item.likes }} 赞</view>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="text-copy">还没有评论，快来占个前排。</view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var activity = require('../../common/activity.js')
var session = require('../../common/session.js')

function buildFallbackPost(id) {
  return {
    id: id,
    coverTag: '校园精选',
    title: '清爽日常的校园穿搭灵感',
    subtitle: '干净利落的版型，适合大学生日常场景。',
    desc: '围绕常见学生预算与校园生活路线，快速参考好穿又好搭的选择。',
    authorId: 0,
    user: '校园创作者',
    avatar: 'C',
    avatarClass: 'soft',
    school: 'CampusFit 社区',
    mine: false,
    liked: false,
    favorited: false,
    followed: false,
    scene: '校园日常',
    style: '极简清爽',
    budget: '100-150',
    likes: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    price: '￥39',
    product: '校园入门套装',
    platform: '外部电商平台',
    profit: '用户完成有效订单后，平台与创作者可能获得导购佣金。',
    guideTip: '请结合自身需要与预算进行理性消费。',
    highlights: ['校园通用', '预算友好', '日常好搭'],
    commentsPreview: []
  }
}

function buildCommentPreview(list) {
  var result = []
  for (var i = 0; i < list.length; i += 1) {
    result.push({
      id: 'preview-' + i,
      name: '用户' + (i + 1),
      avatar: String(i + 1),
      avatarClass: i % 2 === 0 ? 'soft' : 'alt',
      text: list[i],
      time: (i + 2) + '分钟前',
      likes: Math.max(2, 12 - i * 2)
    })
  }
  return result
}

function isAuthError(error) {
  return ((error && error.message) || '').toLowerCase().indexOf('login') > -1
}

export default {
  data: function() {
    return {
      postId: 'look1',
      post: buildFallbackPost('look1'),
      liked: false,
      saved: false,
      followed: false,
      isMine: false,
      currentActivity: null,
      previewComments: [],
      detailLoading: false,
      detailFailed: false,
      actionLoading: false,
      statusText: '正在加载穿搭详情...'
    }
  },
  computed: {
    followLabel: function() {
      if (this.isMine) {
        return '我的'
      }
      return this.followed ? '已关注' : '关注'
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
    this.post = buildFallbackPost(this.postId)
    this.loadDetail()
  },
  onShow: function() {
    if (this.postId) {
      this.currentActivity = activity.getPostActivity(this.postId, this.post)
    }
  },
  methods: {
    loadDetail: function() {
      var self = this
      self.detailLoading = true
      self.detailFailed = false
      api.getPostDetail(self.postId)
        .then(function(detail) {
          self.post = detail
          self.liked = !!detail.liked
          self.saved = !!detail.favorited
          self.followed = !!detail.followed
          self.isMine = !!detail.mine
          self.currentActivity = activity.getPostActivity(self.postId, detail)
          self.previewComments = buildCommentPreview(detail.commentsPreview || [])
          self.statusText = '详情已同步：' + (api.getActiveBaseUrl() || '后端服务')
          self.detailFailed = false
        })
        .catch(function() {
          self.post = buildFallbackPost(self.postId)
          self.currentActivity = activity.getPostActivity(self.postId, self.post)
          self.previewComments = []
          self.statusText = '后端详情暂时不可用，已显示本地演示数据。'
          self.detailFailed = true
        })
        .finally(function() {
          self.detailLoading = false
        })
    },
    toggleLikeAction: function() {
      var self = this
      if (self.actionLoading) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('点赞前请先登录')
        return
      }
      self.actionLoading = true
      api.toggleLike(self.post.id)
        .then(function(result) {
          self.liked = !!result.active
          self.post.likes = result.count
          uni.showToast({ title: self.liked ? '已点赞' : '已取消点赞', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '点赞状态更新失败')
        })
        .finally(function() {
          self.actionLoading = false
        })
    },
    toggleFavoriteAction: function() {
      var self = this
      if (self.actionLoading) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('收藏前请先登录')
        return
      }
      self.actionLoading = true
      api.toggleFavorite(self.post.id)
        .then(function(result) {
          self.saved = !!result.active
          self.post.saves = result.count
          uni.showToast({ title: self.saved ? '已收藏' : '已取消收藏', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '收藏状态更新失败')
        })
        .finally(function() {
          self.actionLoading = false
        })
    },
    toggleFollowAction: function() {
      var self = this
      if (self.actionLoading) {
        return
      }
      if (self.isMine) {
        uni.showToast({ title: '这是你自己的内容', icon: 'none' })
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('关注前请先登录')
        return
      }
      self.actionLoading = true
      api.toggleFollow(self.post.authorId)
        .then(function(result) {
          self.followed = !!result.active
          uni.showToast({ title: self.followed ? '已关注' : '已取消关注', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '关注状态更新失败')
        })
        .finally(function() {
          self.actionLoading = false
        })
    },
    handleActionError: function(error, fallbackMessage) {
      if (isAuthError(error)) {
        session.clearSession()
        this.promptLogin('登录已过期，请重新登录')
        return
      }
      uni.showToast({ title: error.message || fallbackMessage, icon: 'none' })
    },
    promptLogin: function(message) {
      uni.showModal({
        title: '需要登录',
        content: message,
        confirmText: '去登录',
        cancelText: '稍后',
        success: function(result) {
          if (result.confirm) {
            uni.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
    },
    sharePost: function() {
      uni.showToast({ title: '演示模式下展示分享动作', icon: 'none' })
    },
    toggleJoinActivity: function() {
      if (!this.currentActivity) {
        return
      }
      if (!session.isLoggedIn()) {
        this.promptLogin('登录后才能参与专题活动')
        return
      }
      var result = activity.toggleJoin(this.currentActivity.id)
      this.currentActivity = result.activity
      uni.showToast({ title: result.active ? '已报名活动' : '已退出活动', icon: 'none' })
    },
    goActivityCenter: function() {
      uni.navigateTo({ url: '/pages/activity/index' })
    },
    goComments: function() {
      uni.navigateTo({ url: '/pages/comments/index?id=' + this.post.id })
    },
    goLikes: function() {
      uni.navigateTo({ url: '/pages/likes/index?id=' + this.post.id })
    },
    goProduct: function() {
      uni.navigateTo({ url: '/pages/product-jump/index?id=' + this.post.id })
    },
    refreshDetail: function() {
      this.loadDetail()
      uni.showToast({ title: '正在刷新详情', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.detail-shell {
  padding-top: 30rpx;
}

.detail-stage {
  margin-bottom: 16rpx;
}

.detail-cover {
  min-height: 340rpx;
  box-shadow: 0 18rpx 34rpx rgba(61, 132, 175, 0.14);
}

.detail-price-chip {
  position: absolute;
  right: 22rpx;
  bottom: 22rpx;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #2e9fd8;
  font-size: 24rpx;
  font-weight: 700;
}

.detail-stats {
  display: flex;
  gap: 14rpx;
  margin-top: -24rpx;
  padding: 0 18rpx;
}

.detail-stat {
  flex: 1;
  padding: 22rpx 12rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid rgba(112, 155, 188, 0.12);
  box-shadow: 0 12rpx 28rpx rgba(61, 132, 175, 0.08);
  text-align: center;
}

.detail-stat-value {
  display: block;
  color: #253646;
  font-size: 30rpx;
  font-weight: 700;
}

.detail-stat-label {
  display: block;
  margin-top: 8rpx;
  color: #7d91a2;
  font-size: 21rpx;
}

.detail-status,
.author-card,
.activity-panel,
.commerce-card,
.comment-board {
  margin-top: 16rpx;
}

.author-head,
.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}

.detail-copy-card {
  margin-top: 22rpx;
  padding: 22rpx;
  border-radius: 26rpx;
  background: rgba(247, 251, 254, 0.88);
}

.detail-title {
  margin-top: 0;
}

.detail-highlight-row {
  margin-top: 14rpx;
}

.detail-copy {
  margin-top: 18rpx;
}

.detail-actions {
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-top: 22rpx;
}

.action-chip {
  padding: 16rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(87, 189, 240, 0.1);
  color: #4699cf;
  font-size: 24rpx;
  font-weight: 600;
}

.action-chip-active {
  background: linear-gradient(135deg, #58bdf0 0%, #67d9af 100%);
  color: #ffffff;
  box-shadow: 0 12rpx 24rpx rgba(73, 183, 237, 0.18);
}

.commerce-head .note-stamp {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 180, 107, 0.16);
  color: #d78a3b;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.activity-stamp {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(87, 189, 240, 0.14);
  color: #4a9fd5;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.commerce-product {
  margin-top: 10rpx;
}

.comment-card {
  margin-top: 16rpx;
  background: rgba(247, 251, 254, 0.84);
  box-shadow: none;
}

.comment-content {
  flex: 1;
  min-width: 0;
}
</style>
