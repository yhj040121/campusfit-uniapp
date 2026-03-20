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

    <view class="panel-card author-card">
      <view class="author-head">
        <view class="meta-left">
          <view :class="['avatar', post.avatarClass]">{{ post.avatar }}</view>
          <view>
            <view class="meta-name">{{ post.user }}</view>
            <view class="meta-school">{{ post.school }}</view>
          </view>
        </view>
        <view
          :class="['side-pill', followed ? 'side-pill-active' : '', actionLoading ? 'btn-disabled' : '']"
          @click="toggleFollowAction"
        >
          {{ followLabel }}
        </view>
      </view>

      <view class="detail-copy-card">
        <view class="section-title detail-title">穿搭说明</view>
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
        <view
          :class="['action-chip', liked ? 'action-chip-active' : '', actionLoading ? 'btn-disabled' : '']"
          @click="toggleLikeAction"
        >
          {{ liked ? '已点赞' : '点赞' }}
        </view>
        <view
          :class="['action-chip', saved ? 'action-chip-active' : '', actionLoading ? 'btn-disabled' : '']"
          @click="toggleFavoriteAction"
        >
          {{ saved ? '已收藏' : '收藏' }}
        </view>
        <view class="action-chip" @click="goComments">评论</view>
        <view class="action-chip" @click="sharePost">分享</view>
      </view>
    </view>

    <view v-if="currentActivity" class="panel-card detail-activity-card">
      <view class="section-head" style="margin-top:0;">
        <view>
          <view class="section-title" style="margin-top:0;">所属活动</view>
          <view class="section-subtitle">这条内容正在参与校园专题活动</view>
        </view>
        <view class="note-stamp">ACTIVITY</view>
      </view>
      <view class="list-title">{{ currentActivity.title }}</view>
      <view class="list-copy">{{ currentActivity.summary }}</view>
      <view class="chip-row" style="margin-top:16rpx;">
        <view class="chip chip-active">{{ currentActivity.period }}</view>
        <view class="chip chip-outline">{{ currentActivity.status }}</view>
      </view>
      <view class="note-box">参与说明：{{ currentActivity.participation }}</view>
      <view class="note-box">活动奖励：{{ currentActivity.reward }}</view>
      <view class="btn-row">
        <button class="btn-secondary btn-half" @click="goActivityCenter">查看活动</button>
        <button
          class="btn-primary btn-half"
          :disabled="activityActionLoading"
          :class="activityActionLoading ? 'btn-disabled' : ''"
          @click="toggleJoinActivity"
        >
          {{ currentActivity.joined ? '退出活动' : '报名活动' }}
        </button>
      </view>
    </view>

    <view class="panel-card guide-card">
      <view class="section-head" style="margin-top:0;">
        <view>
          <view class="section-title" style="margin-top:0;">导购信息</view>
          <view class="section-subtitle">从穿搭灵感直接进入商品参考</view>
        </view>
        <view class="note-stamp">GUIDE</view>
      </view>
      <view class="list-title">{{ post.product }}</view>
      <view class="list-copy">{{ post.platform }}</view>
      <view class="detail-price">{{ post.price }}</view>
      <view class="note-box">理性消费提示：{{ post.guideTip }}</view>
      <view class="note-box">收益说明：{{ post.profit }}</view>
      <view class="btn-row">
        <button class="btn-secondary btn-half" @click="goLikes">查看点赞</button>
        <button class="btn-primary btn-half" @click="goProduct">前往购买</button>
      </view>
    </view>

    <view class="panel-card comment-preview-card">
      <view class="section-head" style="margin-top:0;">
        <view>
          <view class="section-title" style="margin-top:0;">评论预览</view>
          <view class="section-subtitle">先看看大家在关注什么，再进入完整评论区</view>
        </view>
        <view class="float-link" @click="goComments">全部评论</view>
      </view>
      <view v-if="previewComments.length">
        <view class="preview-item" v-for="item in previewComments" :key="item.id">
          <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
          <view class="preview-body">
            <view class="preview-name-row">
              <view class="meta-name">{{ item.name }}</view>
              <view class="meta-school">{{ item.time }}</view>
            </view>
            <view class="text-copy">{{ item.text }}</view>
          </view>
        </view>
      </view>
      <view v-else class="text-copy">还没有评论，快来留下第一条建议吧。</view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var activityStore = require('../../common/activity.js')

function emptyPost(id) {
  return {
    id: id,
    coverTag: '校园推荐',
    title: '正在加载穿搭详情',
    subtitle: '稍等一下，我们正在整理这条内容的核心亮点。',
    desc: '系统会同步穿搭描述、场景标签、导购信息和互动状态，方便你继续浏览和操作。',
    authorId: 0,
    user: 'CampusFit',
    avatar: 'C',
    avatarClass: 'soft',
    school: '校园穿搭社',
    mine: false,
    liked: false,
    favorited: false,
    followed: false,
    scene: '图书馆',
    style: '清爽通勤',
    budget: '100-150',
    likes: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    price: '预算 100-150',
    product: '浅蓝针织开衫与百褶半裙',
    platform: '淘宝 / 天猫',
    profit: '平台会根据真实导购成交统计收益，不会影响你的正常浏览。',
    guideTip: '购买前记得核对尺码、优惠和运费，保持理性消费。',
    activity: null,
    highlights: [],
    commentsPreview: []
  }
}

function buildCommentPreview(list) {
  var result = []
  for (var i = 0; i < (list || []).length; i += 1) {
    result.push({
      id: 'preview-' + i,
      name: '同学' + (i + 1),
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
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

export default {
  data: function() {
    return {
      postId: 'look1',
      post: emptyPost('look1'),
      liked: false,
      saved: false,
      followed: false,
      isMine: false,
      currentActivity: null,
      previewComments: [],
      detailLoading: false,
      detailFailed: false,
      actionLoading: false,
      activityActionLoading: false,
      statusText: '正在准备详情内容...'
    }
  },
  computed: {
    followLabel: function() {
      if (this.isMine) {
        return '我的内容'
      }
      return this.followed ? '已关注' : '关注'
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
    this.post = emptyPost(this.postId)
    this.loadDetail()
  },
  methods: {
    loadDetail: function() {
      var self = this
      self.detailLoading = true
      self.detailFailed = false
      self.statusText = '正在同步这条穿搭的详情信息。'
      api.getPostDetail(self.postId)
        .then(function(detail) {
          self.post = detail
          self.liked = !!detail.liked
          self.saved = !!detail.favorited
          self.followed = !!detail.followed
          self.isMine = !!detail.mine
          self.currentActivity = detail.activity || null
          self.previewComments = buildCommentPreview(detail.commentsPreview || [])
          self.statusText = '内容已更新，可以继续查看导购、评论和活动信息。'
          self.detailFailed = false
        })
        .catch(function() {
          self.post = emptyPost(self.postId)
          self.currentActivity = null
          self.previewComments = []
          self.statusText = '暂时无法获取最新详情，当前展示默认内容。'
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
        self.promptLogin('登录后才能点赞这条内容。')
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
          self.handleActionError(error, '点赞状态更新失败，请稍后重试。')
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
        self.promptLogin('登录后才能收藏这条内容。')
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
          self.handleActionError(error, '收藏状态更新失败，请稍后重试。')
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
        uni.showToast({ title: '这是你自己的内容。', icon: 'none' })
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('登录后才能关注这位同学。')
        return
      }
      self.actionLoading = true
      api.toggleFollow(self.post.authorId)
        .then(function(result) {
          self.followed = !!result.active
          uni.showToast({ title: self.followed ? '已关注' : '已取消关注', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '关注状态更新失败，请稍后重试。')
        })
        .finally(function() {
          self.actionLoading = false
        })
    },
    toggleJoinActivity: function() {
      var self = this
      if (!self.currentActivity || self.activityActionLoading) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('登录后才能报名或退出活动。')
        return
      }
      self.activityActionLoading = true
      api.toggleActivityJoin(self.currentActivity.id)
        .then(function(updated) {
          self.currentActivity = updated
          var selected = activityStore.getSelectedActivity()
          if (selected && selected.id === updated.id) {
            activityStore.selectActivity(updated)
          }
          uni.showToast({ title: updated.joined ? '已报名活动' : '已退出活动', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '活动状态更新失败，请稍后重试。')
        })
        .finally(function() {
          self.activityActionLoading = false
        })
    },
    handleActionError: function(error, fallbackMessage) {
      if (isAuthError(error)) {
        session.clearSession()
        this.promptLogin('登录状态已失效，请重新登录。')
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
      uni.showToast({ title: '分享功能将在演示阶段展示。', icon: 'none' })
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
      uni.showToast({ title: '详情已刷新', icon: 'none' })
    }
  }
}
</script>

<style>
.detail-shell {
  padding-bottom: 44rpx;
}

.detail-stage {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.detail-cover {
  min-height: 360rpx;
  justify-content: flex-end;
}

.detail-price-chip {
  display: inline-flex;
  align-items: center;
  margin-top: 20rpx;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 22rpx;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.detail-stat {
  padding: 28rpx 16rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14rpx 36rpx rgba(108, 156, 196, 0.12);
  text-align: center;
}

.detail-stat-value {
  display: block;
  color: var(--campus-text);
  font-size: 36rpx;
  font-weight: 700;
}

.detail-stat-label {
  display: block;
  margin-top: 8rpx;
  color: var(--campus-muted);
  font-size: 22rpx;
}

.author-head,
.preview-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.detail-copy-card {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: rgba(245, 250, 255, 0.92);
}

.detail-title {
  margin-top: 0;
}

.detail-copy {
  margin-top: 18rpx;
  line-height: 1.8;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 24rpx;
}

.action-chip {
  min-width: 128rpx;
  padding: 18rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(229, 238, 247, 0.92);
  color: var(--campus-text);
  font-size: 24rpx;
  font-weight: 600;
  text-align: center;
}

.action-chip-active {
  background: linear-gradient(135deg, #7cccf0, #67d8b7);
  color: #ffffff;
}

.detail-activity-card,
.guide-card,
.comment-preview-card {
  margin-top: 24rpx;
}

.detail-price {
  margin-top: 18rpx;
  color: var(--campus-text);
  font-size: 34rpx;
  font-weight: 700;
}

.preview-item {
  display: flex;
  gap: 18rpx;
  padding: 20rpx 0;
}

.preview-item + .preview-item {
  border-top: 1rpx solid rgba(133, 159, 184, 0.16);
}

.preview-body {
  flex: 1;
}
</style>
