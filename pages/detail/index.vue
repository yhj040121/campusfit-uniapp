<template>
  <view class="page-shell">
    <view class="look-cover" style="min-height:320rpx; margin-bottom:20rpx;">
      <view class="cover-tag">{{ post.coverTag }}</view>
      <view class="cover-title">{{ post.title }}</view>
      <view class="cover-copy">{{ post.subtitle }}</view>
    </view>

    <view class="panel-card">
      <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
    </view>

    <view class="panel-card">
      <view class="meta-line" style="margin-top:0;">
        <view class="meta-left">
          <view :class="['avatar', post.avatarClass]">{{ post.avatar }}</view>
          <view>
            <view class="meta-name">{{ post.user }}</view>
            <view class="meta-school">{{ post.school }}</view>
          </view>
        </view>
        <view :class="['side-pill', followed ? 'side-pill-active' : '']" @click="toggleFollowAction">{{ followLabel }}</view>
      </view>

      <view class="section-title">标签</view>
      <view class="chip-row">
        <view class="chip chip-outline">{{ post.scene }}</view>
        <view class="chip chip-outline">{{ post.style }}</view>
        <view class="chip chip-outline">预算 {{ post.budget }}</view>
      </view>
      <view class="chip-row" style="margin-top:14rpx;" v-if="post.highlights && post.highlights.length">
        <view class="chip chip-active" v-for="item in post.highlights" :key="item">{{ item }}</view>
      </view>

      <view class="text-copy">{{ post.desc }}</view>
      <view class="action-row">
        <view :class="['action-btn', liked ? 'action-btn-active' : '']" @click="toggleLikeAction">{{ liked ? '已点赞' : '点赞' }}</view>
        <view class="action-btn" @click="goComments">评论</view>
        <view :class="['action-btn', saved ? 'action-btn-active' : '']" @click="toggleFavoriteAction">{{ saved ? '已收藏' : '收藏' }}</view>
        <view class="action-btn" @click="sharePost">分享</view>
      </view>
      <view class="stats-line" style="margin-top:18rpx;">
        <view class="stat-text">点赞 {{ post.likes }}</view>
        <view class="stat-text">评论 {{ post.comments }}</view>
        <view class="stat-text">收藏 {{ post.saves }}</view>
        <view class="stat-text">分享 {{ post.shares }}</view>
      </view>
    </view>

    <view class="panel-card">
      <view class="section-title" style="margin-top:0;">商品导购</view>
      <view class="product-card">
        <view class="product-price">{{ post.price }}</view>
        <view class="text-copy" style="margin-top:6rpx;">{{ post.product }} | {{ post.platform }}</view>
        <view class="note-box">理性消费提醒：{{ post.guideTip }}</view>
        <view class="note-box">平台盈利说明：{{ post.profit }}</view>
      </view>
      <view class="btn-row">
        <button class="btn-secondary btn-half" @click="goLikes">点赞列表</button>
        <button class="btn-primary btn-half" @click="goProduct">去购买</button>
      </view>
    </view>

    <view class="panel-card">
      <view class="meta-line" style="margin-top:0;">
        <view class="section-title" style="margin:0;">评论预览</view>
        <view class="float-link" @click="goComments">查看全部</view>
      </view>
      <view v-if="previewComments.length">
        <view class="list-card" v-for="item in previewComments" :key="item.id" style="box-shadow:none; background:#f7fbfe; margin-top:16rpx;">
          <view class="meta-left" style="align-items:flex-start;">
            <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
            <view>
              <view class="meta-name">{{ item.name }}</view>
              <view class="text-copy" style="margin-top:6rpx;">{{ item.text }}</view>
              <view class="list-meta">{{ item.time }} | {{ item.likes }} 赞</view>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="text-copy">还没有评论</view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
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
      previewComments: [],
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
  methods: {
    loadDetail: function() {
      var self = this
      api.getPostDetail(self.postId)
        .then(function(detail) {
          self.post = detail
          self.liked = !!detail.liked
          self.saved = !!detail.favorited
          self.followed = !!detail.followed
          self.isMine = !!detail.mine
          self.previewComments = buildCommentPreview(detail.commentsPreview || [])
          self.statusText = '详情已同步：' + (api.getActiveBaseUrl() || '后端服务')
        })
        .catch(function() {
          self.post = buildFallbackPost(self.postId)
          self.previewComments = []
          self.statusText = '后端详情暂时不可用，已显示本地演示数据。'
        })
    },
    toggleLikeAction: function() {
      var self = this
      if (!session.isLoggedIn()) {
        self.promptLogin('点赞前请先登录')
        return
      }
      api.toggleLike(self.post.id)
        .then(function(result) {
          self.liked = !!result.active
          self.post.likes = result.count
          uni.showToast({ title: self.liked ? '已点赞' : '已取消点赞', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '点赞状态更新失败')
        })
    },
    toggleFavoriteAction: function() {
      var self = this
      if (!session.isLoggedIn()) {
        self.promptLogin('收藏前请先登录')
        return
      }
      api.toggleFavorite(self.post.id)
        .then(function(result) {
          self.saved = !!result.active
          self.post.saves = result.count
          uni.showToast({ title: self.saved ? '已收藏' : '已取消收藏', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '收藏状态更新失败')
        })
    },
    toggleFollowAction: function() {
      var self = this
      if (self.isMine) {
        uni.showToast({ title: '这是你自己的内容', icon: 'none' })
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('关注前请先登录')
        return
      }
      api.toggleFollow(self.post.authorId)
        .then(function(result) {
          self.followed = !!result.active
          uni.showToast({ title: self.followed ? '已关注' : '已取消关注', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '关注状态更新失败')
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
    goComments: function() {
      uni.navigateTo({ url: '/pages/comments/index?id=' + this.post.id })
    },
    goLikes: function() {
      uni.navigateTo({ url: '/pages/likes/index?id=' + this.post.id })
    },
    goProduct: function() {
      uni.navigateTo({ url: '/pages/product-jump/index?id=' + this.post.id })
    }
  }
}
</script>

<style>
</style>
