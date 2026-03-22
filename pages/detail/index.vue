<template>
  <view class="page-shell detail-shell">
    <view class="detail-stage">
      <view class="gallery-card">
        <view class="gallery-head">
          <view class="gallery-kicker">{{ post.coverTag || 'LOOKBOOK' }}</view>
          <view class="gallery-count">{{ galleryCountLabel }}</view>
        </view>

        <swiper
          class="gallery-swiper"
          circular
          :current="galleryCurrent"
          @change="handleGalleryChange"
        >
          <swiper-item v-for="(item, index) in galleryImages" :key="item + '-' + index">
            <view class="gallery-slide" @tap="previewGallery(index)">
              <image v-if="item" class="gallery-image" :src="item" mode="aspectFill"></image>
              <view v-else class="gallery-empty">
                <view class="gallery-empty-kicker">OOTD</view>
                <view class="gallery-empty-title">{{ post.title }}</view>
                <view class="gallery-empty-copy">{{ post.subtitle }}</view>
              </view>
            </view>
          </swiper-item>
        </swiper>

        <view class="gallery-hint">TAP TO ZOOM / SWIPE TO BROWSE</view>

        <scroll-view
          v-if="galleryImages.length > 1"
          class="thumb-strip"
          scroll-x="true"
          scroll-with-animation="true"
        >
          <view class="thumb-row">
            <view
              v-for="(item, index) in galleryImages"
              :key="'thumb-' + index"
              :class="['thumb-item', galleryCurrent === index ? 'thumb-item-active' : '']"
              @tap="setGalleryCurrent(index)"
            >
              <image class="thumb-image" :src="item" mode="aspectFill"></image>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="detail-head-card">
        <view class="detail-topline">
          <view class="detail-price-chip">{{ post.price }}</view>
        </view>
        <view class="detail-title">{{ post.title }}</view>
        <view v-if="getDisplaySubtitle(post)" class="detail-subtitle">{{ getDisplaySubtitle(post) }}</view>
        <view class="detail-tag-row">
          <view class="detail-meta-chip">{{ post.scene }}</view>
          <view class="detail-meta-chip">{{ post.style }}</view>
          <view class="detail-meta-chip">预算 {{ post.budget }}</view>
        </view>
        <view class="chip-row detail-highlight-row" v-if="post.highlights && post.highlights.length">
          <view class="chip chip-active" v-for="item in post.highlights" :key="item">{{ item }}</view>
        </view>
        <view class="detail-intro">{{ post.desc }}</view>
        <view class="detail-summary-row">
          <view class="detail-stat-inline">
            <text class="detail-stat-inline-value">{{ post.likes }}</text>
            <text class="detail-stat-inline-label">点赞</text>
          </view>
          <view class="detail-stat-inline">
            <text class="detail-stat-inline-value">{{ post.comments }}</text>
            <text class="detail-stat-inline-label">评论</text>
          </view>
          <view class="detail-stat-inline">
            <text class="detail-stat-inline-value">{{ post.saves }}</text>
            <text class="detail-stat-inline-label">收藏</text>
          </view>
        </view>
      </view>
    </view>

    <view class="panel-card author-card">
      <view class="author-head">
        <view class="meta-left">
          <view :class="['avatar', post.avatarClass, authorAvatarUrl ? 'avatar-has-image' : '']">
            <image v-if="authorAvatarUrl" class="avatar-image" :src="authorAvatarUrl" mode="aspectFill"></image>
            <text v-else>{{ authorAvatarText }}</text>
          </view>
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
      <view class="section-head detail-panel-head">
        <view>
          <view class="section-title detail-panel-title">所属活动</view>
          <view class="section-subtitle detail-panel-subtitle">这条内容正在参与校园专题活动</view>
        </view>
        <view class="note-stamp">ACTIVITY</view>
      </view>
      <view class="list-title">{{ currentActivity.title }}</view>
      <view class="list-copy">{{ currentActivity.summary }}</view>
      <view class="chip-row detail-panel-chips">
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
      <view class="section-head detail-panel-head">
        <view>
          <view class="section-title detail-panel-title">导购信息</view>
          <view class="section-subtitle detail-panel-subtitle">从穿搭灵感直接进入商品参考</view>
        </view>
        <view class="note-stamp">GUIDE</view>
      </view>
      <view class="list-title">{{ post.product }}</view>
      <view class="list-copy">{{ post.platform }}</view>
      <view class="detail-price">{{ post.price }}</view>
      <view v-if="showSafeReminder" class="note-box">理性消费提示：{{ post.guideTip }}</view>
      <view class="note-box">激励说明：{{ post.profit }}</view>
      <view class="btn-row">
        <button class="btn-secondary btn-half" @click="goLikes">查看点赞</button>
        <button class="btn-primary btn-half" @click="goProduct">查看商品</button>
      </view>
    </view>

    <view class="panel-card comment-preview-card">
      <view class="section-head detail-panel-head">
        <view>
          <view class="section-title detail-panel-title">评论预览</view>
          <view class="section-subtitle detail-panel-subtitle">先看看大家在关注什么，再进入完整评论区</view>
        </view>
        <view class="float-link" @click="goComments">全部评论</view>
      </view>
      <view v-if="previewComments.length">
        <view class="preview-item" v-for="item in previewComments" :key="item.id">
          <view :class="['avatar', item.avatarClass, item.avatarUrl ? 'avatar-has-image' : '']">
            <image v-if="item.avatarUrl" class="avatar-image" :src="item.avatarUrl" mode="aspectFill"></image>
            <text v-else>{{ item.avatar }}</text>
          </view>
          <view class="preview-body">
            <view class="preview-name-row">
              <view class="meta-name">{{ item.name }}</view>
              <view class="meta-school">{{ item.time }}</view>
            </view>
            <view class="text-copy">
              <text v-if="item.replyToName" class="preview-reply-prefix">回复 {{ item.replyToName }}：</text>
              <text>{{ item.text }}</text>
            </view>
            <view class="preview-action-row">
              <view class="preview-action" @click="togglePreviewCommentLike(item)">
                {{ item.liked ? '已赞' : '点赞' }} {{ item.likes || 0 }}
              </view>
              <view class="preview-action" @click="replyPreviewComment(item)">回复</view>
            </view>
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
var postDisplay = require('../../common/post-display.js')
var settingsStore = require('../../common/settings.js')

function pickFirstText(value, fallback) {
  var text = String(value || '').trim()
  if (!text) {
    return fallback || 'C'
  }
  return text.slice(0, 1).toUpperCase()
}

function resolveAuthorAvatarUrl(post, isMine) {
  var detail = post || {}
  var candidates = [
    detail.avatarUrl,
    detail.authorAvatarUrl,
    detail.userAvatarUrl,
    detail.creatorAvatarUrl,
    detail.userAvatar
  ]
  for (var i = 0; i < candidates.length; i += 1) {
    if (candidates[i]) {
      return candidates[i]
    }
  }
  var currentUser = session.getUser() || {}
  var sameAuthor = !!isMine
  if (!sameAuthor && detail.authorId && currentUser.userId) {
    sameAuthor = String(detail.authorId) === String(currentUser.userId)
  }
  if (sameAuthor && currentUser.avatarUrl) {
    return currentUser.avatarUrl
  }
  return ''
}

function buildShareMetaLine(post) {
  var detail = post || {}
  var segments = []
  if (detail.scene) {
    segments.push(detail.scene)
  }
  if (detail.style) {
    segments.push(detail.style)
  }
  if (detail.budget) {
    segments.push('\u9884\u7b97 ' + detail.budget)
  }
  return segments.join(' \u00b7 ')
}

function buildShareCopyText(post, link) {
  var detail = post || {}
  var lines = [detail.title || 'CampusFit \u7a7f\u642d\u5206\u4eab']
  var metaLine = buildShareMetaLine(detail)
  if (metaLine) {
    lines.push(metaLine)
  }
  if (detail.desc) {
    lines.push(detail.desc)
  }
  var productLine = []
  if (detail.product) {
    productLine.push(detail.product)
  }
  if (detail.price) {
    productLine.push(detail.price)
  }
  if (productLine.length) {
    lines.push('\u5546\u54c1\uff1a' + productLine.join(' \u00b7 '))
  }
  if (link) {
    lines.push('\u5546\u54c1\u94fe\u63a5\uff1a' + link)
  }
  return lines.join('\n')
}

function getCurrentShareUrl(postId) {
  if (typeof window !== 'undefined' && window.location && window.location.href) {
    return window.location.href
  }
  if (postId) {
    return '/pages/detail/index?id=' + postId
  }
  return ''
}

function emptyPost(id) {
  return {
    id: id,
    coverTag: '\u6821\u56ed\u63a8\u8350',
    title: '\u6b63\u5728\u52a0\u8f7d\u7a7f\u642d\u8be6\u60c5',
    subtitle: '\u7a0d\u7b49\u4e00\u4e0b\uff0c\u6211\u4eec\u6b63\u5728\u6574\u7406\u8fd9\u6761\u5185\u5bb9\u7684\u6838\u5fc3\u4eae\u70b9\u3002',
    desc: '\u7cfb\u7edf\u4f1a\u540c\u6b65\u7a7f\u642d\u63cf\u8ff0\u3001\u573a\u666f\u6807\u7b7e\u3001\u5bfc\u8d2d\u4fe1\u606f\u548c\u4e92\u52a8\u72b6\u6001\uff0c\u65b9\u4fbf\u4f60\u7ee7\u7eed\u6d4f\u89c8\u548c\u64cd\u4f5c\u3002',
    coverImageUrl: '',
    imageUrls: [],
    authorId: 0,
    user: 'CampusFit',
    avatar: 'C',
    avatarUrl: '',
    avatarClass: 'soft',
    school: '\u6821\u56ed\u7a7f\u642d\u793e',
    mine: false,
    liked: false,
    favorited: false,
    followed: false,
    scene: '\u56fe\u4e66\u9986',
    style: '\u6e05\u723d\u901a\u52e4',
    budget: '100-150',
    likes: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    price: '\u9884\u7b97 100-150',
    product: '\u6d45\u84dd\u9488\u7ec7\u5f00\u886b\u4e0e\u767e\u8936\u534a\u88d9',
    platform: '\u6dd8\u5b9d / \u5929\u732b',
    profit: '\u5546\u5bb6\u63a8\u5e7f\u8d39\u4f1a\u6309\u5e73\u53f0\u89c4\u5219\u62c6\u5206\u4e3a\u670d\u52a1\u8d39\u548c\u6fc0\u52b1\u6c60\uff0c\u521b\u4f5c\u8005\u6fc0\u52b1\u4e3b\u8981\u53c2\u8003\u4e92\u52a8\u3001\u8d28\u91cf\u4e0e\u5408\u89c4\u8868\u73b0\u3002',
    guideTip: '\u8bf7\u7ed3\u5408\u9884\u7b97\u3001\u4f7f\u7528\u9891\u7387\u548c\u573a\u666f\u9700\u6c42\u7406\u6027\u9009\u8d2d\u3002',
    activity: null,
    highlights: [],
    commentsPreview: []
  }
}

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('\u767b\u5f55') > -1
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
      shareLoading: false,
      shareLink: '',
      galleryCurrent: 0,
      settingMap: settingsStore.getSettingMap(),
      statusText: '\u6b63\u5728\u51c6\u5907\u8be6\u60c5\u5185\u5bb9...'
    }
  },
  computed: {
    followLabel: function() {
      if (this.isMine) {
        return '\u6211\u7684\u5185\u5bb9'
      }
      return this.followed ? '\u5df2\u5173\u6ce8' : '\u5173\u6ce8'
    },
    galleryImages: function() {
      var source = []
      var imageUrls = this.post && this.post.imageUrls ? this.post.imageUrls : []
      for (var i = 0; i < imageUrls.length; i += 1) {
        if (imageUrls[i]) {
          source.push(imageUrls[i])
        }
      }
      if (!source.length && this.post && this.post.coverImageUrl) {
        source.push(this.post.coverImageUrl)
      }
      return source.length ? source : ['']
    },
    galleryCountLabel: function() {
      var images = this.galleryImages
      if (!images.length) {
        return '1 / 1'
      }
      return String(this.galleryCurrent + 1) + ' / ' + String(images.length)
    },
    showSafeReminder: function() {
      return this.settingMap.safe !== false
    },
    authorAvatarUrl: function() {
      return resolveAuthorAvatarUrl(this.post, this.isMine)
    },
    authorAvatarText: function() {
      return pickFirstText((this.post && this.post.avatar) || (this.post && this.post.user), 'C')
    }
  },
  onShareAppMessage: function() {
    return {
      title: (this.post && this.post.title) || 'CampusFit \u7a7f\u642d\u5206\u4eab',
      path: '/pages/detail/index?id=' + ((this.post && this.post.id) || this.postId || 'look1'),
      imageUrl: (this.galleryImages && this.galleryImages[0]) || (this.post && this.post.coverImageUrl) || ''
    }
  },
  onShareTimeline: function() {
    return {
      title: (this.post && this.post.title) || 'CampusFit \u7a7f\u642d\u5206\u4eab',
      query: 'id=' + ((this.post && this.post.id) || this.postId || 'look1'),
      imageUrl: (this.galleryImages && this.galleryImages[0]) || (this.post && this.post.coverImageUrl) || ''
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
    this.post = emptyPost(this.postId)
    this.loadDetail()
  },
  onShow: function() {
    this.settingMap = settingsStore.getSettingMap()
    if (this.postId) {
      this.loadDetail()
    }
  },
  methods: {
    loadDetail: function() {
      var self = this
      self.detailLoading = true
      self.detailFailed = false
      self.shareLink = ''
      self.statusText = '\u6b63\u5728\u540c\u6b65\u8fd9\u6761\u7a7f\u642d\u7684\u8be6\u60c5\u4fe1\u606f\u3002'
      api.getPostDetail(self.postId)
        .then(function(detail) {
          self.post = detail
          self.liked = !!detail.liked
          self.saved = !!detail.favorited
          self.followed = !!detail.followed
          self.isMine = !!detail.mine
          self.currentActivity = detail.activity || null
          self.previewComments = detail.commentsPreview || []
          self.galleryCurrent = 0
          self.statusText = '\u5185\u5bb9\u5df2\u66f4\u65b0\uff0c\u53ef\u4ee5\u7ee7\u7eed\u67e5\u770b\u5bfc\u8d2d\u3001\u8bc4\u8bba\u548c\u6d3b\u52a8\u4fe1\u606f\u3002'
          self.detailFailed = false
        })
        .catch(function() {
          self.post = emptyPost(self.postId)
          self.currentActivity = null
          self.previewComments = []
          self.galleryCurrent = 0
          self.statusText = '\u6682\u65f6\u65e0\u6cd5\u83b7\u53d6\u6700\u65b0\u8be6\u60c5\uff0c\u5f53\u524d\u5c55\u793a\u9ed8\u8ba4\u5185\u5bb9\u3002'
          self.detailFailed = true
        })
        .finally(function() {
          self.detailLoading = false
        })
    },
    handleGalleryChange: function(event) {
      this.galleryCurrent = (event && event.detail && typeof event.detail.current === 'number') ? event.detail.current : 0
    },
    setGalleryCurrent: function(index) {
      this.galleryCurrent = index
    },
    previewGallery: function(index) {
      var images = this.galleryImages
      if (!images.length || !images[0]) {
        return
      }
      uni.previewImage({
        current: images[index] || images[0],
        urls: images
      })
    },
    toggleLikeAction: function() {
      var self = this
      if (self.actionLoading) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('\u767b\u5f55\u540e\u624d\u80fd\u70b9\u8d5e\u8fd9\u6761\u5185\u5bb9\u3002')
        return
      }
      self.actionLoading = true
      api.toggleLike(self.post.id)
        .then(function(result) {
          self.liked = !!result.active
          self.post.likes = result.count
          uni.showToast({ title: self.liked ? '\u5df2\u70b9\u8d5e' : '\u5df2\u53d6\u6d88\u70b9\u8d5e', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '\u70b9\u8d5e\u72b6\u6001\u66f4\u65b0\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002')
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
        self.promptLogin('\u767b\u5f55\u540e\u624d\u80fd\u6536\u85cf\u8fd9\u6761\u5185\u5bb9\u3002')
        return
      }
      self.actionLoading = true
      api.toggleFavorite(self.post.id)
        .then(function(result) {
          self.saved = !!result.active
          self.post.saves = result.count
          uni.showToast({ title: self.saved ? '\u5df2\u6536\u85cf' : '\u5df2\u53d6\u6d88\u6536\u85cf', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '\u6536\u85cf\u72b6\u6001\u66f4\u65b0\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002')
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
        uni.showToast({ title: '\u8fd9\u662f\u4f60\u81ea\u5df1\u7684\u5185\u5bb9\u3002', icon: 'none' })
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('\u767b\u5f55\u540e\u624d\u80fd\u5173\u6ce8\u8fd9\u4f4d\u540c\u5b66\u3002')
        return
      }
      self.actionLoading = true
      api.toggleFollow(self.post.authorId)
        .then(function(result) {
          self.followed = !!result.active
          uni.showToast({ title: self.followed ? '\u5df2\u5173\u6ce8' : '\u5df2\u53d6\u6d88\u5173\u6ce8', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '\u5173\u6ce8\u72b6\u6001\u66f4\u65b0\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002')
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
        self.promptLogin('\u767b\u5f55\u540e\u624d\u80fd\u62a5\u540d\u6216\u9000\u51fa\u6d3b\u52a8\u3002')
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
          uni.showToast({ title: updated.joined ? '\u5df2\u62a5\u540d\u6d3b\u52a8' : '\u5df2\u9000\u51fa\u6d3b\u52a8', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '\u6d3b\u52a8\u72b6\u6001\u66f4\u65b0\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002')
        })
        .finally(function() {
          self.activityActionLoading = false
        })
    },
    handleActionError: function(error, fallbackMessage) {
      if (isAuthError(error)) {
        session.clearSession()
        this.promptLogin('\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u3002')
        return
      }
      uni.showToast({ title: error.message || fallbackMessage, icon: 'none' })
    },
    promptLogin: function(message) {
      uni.showModal({
        title: '\u9700\u8981\u767b\u5f55',
        content: message,
        confirmText: '\u53bb\u767b\u5f55',
        cancelText: '\u7a0d\u540e',
        success: function(result) {
          if (result.confirm) {
            uni.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
    },
    resolveShareLink: function() {
      var self = this
      if (self.shareLink) {
        return Promise.resolve(self.shareLink)
      }
      return api.getProductJumpInfo(self.post.id)
        .then(function(detail) {
          self.shareLink = (detail && detail.jumpUrl) || ''
          return self.shareLink
        })
        .catch(function() {
          self.shareLink = ''
          return ''
        })
    },
    canUseNativeShare: function() {
      return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    },
    copyShareContent: function(text, successMessage) {
      return new Promise(function(resolve, reject) {
        uni.setClipboardData({
          data: text,
          success: function() {
            uni.showToast({ title: successMessage || '\u5df2\u590d\u5236', icon: 'none' })
            resolve()
          },
          fail: function(error) {
            reject(error)
          }
        })
      })
    },
    openNativeShare: function(link) {
      var self = this
      if (!self.canUseNativeShare()) {
        return Promise.reject(new Error('native-share-unavailable'))
      }
      var payload = {
        title: (self.post && self.post.title) || 'CampusFit \u7a7f\u642d\u5206\u4eab',
        text: buildShareCopyText(self.post, link)
      }
      var currentUrl = getCurrentShareUrl(self.post && self.post.id)
      if (currentUrl) {
        payload.url = currentUrl
      } else if (link) {
        payload.url = link
      }
      return navigator.share(payload)
    },
    sharePost: function() {
      var self = this
      if (self.shareLoading) {
        return
      }
      var itemList = []
      var actions = []
      if (self.canUseNativeShare()) {
        itemList.push('\u7cfb\u7edf\u5206\u4eab')
        actions.push('native')
      }
      itemList.push('\u590d\u5236\u5206\u4eab\u6587\u6848')
      actions.push('copy-text')
      itemList.push('\u590d\u5236\u5546\u54c1\u94fe\u63a5')
      actions.push('copy-link')

      uni.showActionSheet({
        itemList: itemList,
        success: function(result) {
          var action = actions[result.tapIndex]
          if (!action) {
            return
          }
          self.shareLoading = true
          self.resolveShareLink()
            .then(function(link) {
              var shareText = buildShareCopyText(self.post, link)
              if (action === 'native') {
                return self.openNativeShare(link)
                  .catch(function(error) {
                    if (error && error.name === 'AbortError') {
                      return
                    }
                    return self.copyShareContent(shareText, '\u5f53\u524d\u73af\u5883\u4e0d\u652f\u6301\u7cfb\u7edf\u5206\u4eab\uff0c\u5df2\u590d\u5236\u6587\u6848')
                  })
              }
              if (action === 'copy-link') {
                if (link) {
                  return self.copyShareContent(link, '\u5546\u54c1\u94fe\u63a5\u5df2\u590d\u5236')
                }
                return self.copyShareContent(shareText, '\u6682\u65e0\u5546\u54c1\u94fe\u63a5\uff0c\u5df2\u590d\u5236\u5206\u4eab\u6587\u6848')
              }
              return self.copyShareContent(shareText, '\u5206\u4eab\u6587\u6848\u5df2\u590d\u5236')
            })
            .catch(function(error) {
              uni.showToast({ title: (error && error.message) || '\u5206\u4eab\u6682\u65f6\u4e0d\u53ef\u7528', icon: 'none' })
            })
            .finally(function() {
              self.shareLoading = false
            })
        }
      })
    },
    goActivityCenter: function() {
      uni.navigateTo({ url: '/pages/activity/index' })
    },
    goComments: function() {
      uni.navigateTo({ url: '/pages/comments/index?id=' + this.post.id })
    },
    togglePreviewCommentLike: function(item) {
      var self = this
      if (!item || self.actionLoading) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('\u767b\u5f55\u540e\u624d\u80fd\u70b9\u8d5e\u8bc4\u8bba\u3002')
        return
      }
      self.actionLoading = true
      api.toggleCommentLike(self.post.id, item.id)
        .then(function(result) {
          for (var i = 0; i < self.previewComments.length; i += 1) {
            if (self.previewComments[i] && self.previewComments[i].id === item.id) {
              self.previewComments.splice(i, 1, Object.assign({}, self.previewComments[i], {
                liked: !!result.active,
                likes: result.count
              }))
              break
            }
          }
          uni.showToast({ title: result.active ? '\u5df2\u70b9\u8d5e\u8bc4\u8bba' : '\u5df2\u53d6\u6d88\u70b9\u8d5e', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '\u8bc4\u8bba\u70b9\u8d5e\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002')
        })
        .finally(function() {
          self.actionLoading = false
        })
    },
    replyPreviewComment: function(item) {
      if (!item) {
        return
      }
      uni.navigateTo({ url: '/pages/comments/index?id=' + this.post.id + '&replyCommentId=' + item.id })
    },
    goLikes: function() {
      uni.navigateTo({ url: '/pages/likes/index?id=' + this.post.id })
    },
    goProduct: function() {
      uni.navigateTo({ url: '/pages/product-jump/index?id=' + this.post.id })
    },
    refreshDetail: function() {
      this.loadDetail()
      uni.showToast({ title: '\u8be6\u60c5\u5df2\u5237\u65b0', icon: 'none' })
    },
    getDisplaySubtitle: function(item) {
      return postDisplay.getDisplaySubtitle(item)
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
  gap: 22rpx;
}

.gallery-card,
.detail-head-card {
  padding: 24rpx;
  border-radius: 34rpx;
  border: 1rpx solid rgba(109, 154, 190, 0.14);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--campus-shadow-md);
}

.gallery-head,
.detail-label-row,
.author-head,
.preview-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.gallery-kicker,
.detail-label {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(45, 87, 217, 0.12);
  background: rgba(45, 87, 217, 0.08);
  color: var(--campus-secondary);
  font-size: 21rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.gallery-count {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(32, 49, 66, 0.08);
  color: var(--campus-text);
  font-size: 22rpx;
  font-weight: 600;
}

.gallery-swiper {
  height: 820rpx;
  margin-top: 18rpx;
}

.gallery-slide,
.gallery-empty {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 28rpx;
}

.gallery-slide {
  background:
    radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.2), transparent 26%),
    linear-gradient(140deg, rgba(255, 239, 231, 0.96) 0%, rgba(238, 244, 255, 0.96) 100%);
}

.gallery-image {
  width: 100%;
  height: 100%;
}

.gallery-empty {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 34rpx;
  background: linear-gradient(160deg, rgba(201, 49, 91, 0.18) 0%, rgba(45, 87, 217, 0.2) 100%);
  box-sizing: border-box;
}

.gallery-empty-kicker {
  color: rgba(32, 49, 66, 0.64);
  font-size: 22rpx;
  letter-spacing: 3rpx;
}

.gallery-empty-title {
  margin-top: 18rpx;
  color: var(--campus-text);
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1.22;
}

.gallery-empty-copy {
  margin-top: 12rpx;
  color: var(--campus-text-soft);
  font-size: 24rpx;
  line-height: 1.74;
}

.gallery-hint {
  margin-top: 16rpx;
  color: var(--campus-text-muted);
  font-size: 20rpx;
  letter-spacing: 2rpx;
}

.thumb-strip {
  margin-top: 20rpx;
  white-space: nowrap;
}

.thumb-row {
  display: inline-flex;
  gap: 14rpx;
}

.thumb-item {
  width: 136rpx;
  height: 176rpx;
  padding: 4rpx;
  border-radius: 24rpx;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.72);
}

.thumb-item-active {
  background: linear-gradient(135deg, #ef6288 0%, #345fe0 100%);
  box-shadow: 0 12rpx 24rpx rgba(201, 49, 91, 0.18);
}

.thumb-image {
  width: 100%;
  height: 100%;
  border-radius: 20rpx;
}

.detail-head-card {
  padding: 30rpx;
}

.detail-price-chip {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 180, 107, 0.16);
  color: #b86a1f;
  font-size: 22rpx;
  font-weight: 600;
}

.detail-title {
  margin-top: 18rpx;
  color: var(--campus-text);
  font-size: 44rpx;
  font-weight: 700;
  line-height: 1.22;
}

.detail-subtitle {
  margin-top: 12rpx;
  color: var(--campus-text-soft);
  font-size: 26rpx;
  line-height: 1.74;
}

.detail-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.detail-meta-chip {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(76, 169, 230, 0.1);
  color: #4a9acf;
  font-size: 22rpx;
  font-weight: 600;
}

.detail-highlight-row {
  margin-top: 20rpx;
}

.detail-intro {
  margin-top: 20rpx;
  color: var(--campus-text-soft);
  font-size: 25rpx;
  line-height: 1.86;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.detail-stat {
  padding: 28rpx 16rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(109, 154, 190, 0.1);
  box-shadow: var(--campus-shadow-sm);
  text-align: center;
}

.detail-stat-value {
  display: block;
  color: var(--campus-text);
  font-size: 38rpx;
  font-weight: 700;
}

.detail-stat-label {
  display: block;
  margin-top: 8rpx;
  color: var(--campus-text-muted);
  font-size: 22rpx;
}

.author-card,
.detail-activity-card,
.guide-card,
.comment-preview-card {
  margin-top: 24rpx;
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

.detail-panel-head {
  margin-top: 0;
}

.detail-panel-title {
  margin-top: 0;
}

.detail-panel-subtitle {
  margin-bottom: 0;
}

.detail-panel-chips {
  margin-top: 16rpx;
}

.note-stamp {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(67, 198, 157, 0.12);
  color: var(--campus-secondary);
  font-size: 21rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
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

.preview-reply-prefix {
  color: var(--campus-secondary);
}

.preview-action-row {
  display: flex;
  gap: 18rpx;
  margin-top: 12rpx;
}

.preview-action {
  color: var(--campus-text-muted);
  font-size: 22rpx;
  font-weight: 600;
}

.detail-stage {
  display: grid;
  gap: 20rpx;
}

.gallery-card {
  padding: 20rpx;
  border-radius: 38rpx;
  background:
    linear-gradient(135deg, rgba(201, 49, 91, 0.04), transparent 28%),
    linear-gradient(315deg, rgba(45, 87, 217, 0.05), transparent 36%),
    rgba(255, 250, 245, 0.92);
  border: 1rpx solid rgba(43, 24, 34, 0.08);
  box-shadow: var(--campus-shadow-md);
}

.gallery-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.gallery-kicker,
.gallery-count,
.gallery-hint {
  font-family: var(--campus-font-data);
}

.thumb-item {
  background: rgba(255, 251, 247, 0.84);
  border: 1rpx solid rgba(43, 24, 34, 0.08);
}

.thumb-item-active {
  background: linear-gradient(135deg, rgba(201, 49, 91, 0.2), rgba(45, 87, 217, 0.18));
  box-shadow: 0 12rpx 24rpx rgba(201, 49, 91, 0.12);
}

.detail-head-card {
  position: relative;
  padding-top: 24rpx;
}

.detail-title {
  line-height: 1.14;
}

.detail-stats {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-stat:last-child {
  grid-column: 1 / -1;
}

.detail-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-chip {
  min-width: auto;
  padding-left: 0;
  padding-right: 0;
}

.author-card,
.detail-activity-card,
.guide-card,
.comment-preview-card {
  padding: 26rpx;
}

.preview-item {
  gap: 16rpx;
}

.detail-stage {
  gap: 16rpx;
}

.detail-head-card {
  padding: 20rpx 20rpx 18rpx;
  border-radius: 28rpx;
}

.detail-topline {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8rpx;
}

.detail-price-chip {
  padding: 8rpx 14rpx;
  font-size: 20rpx;
}

.detail-title {
  margin-top: 0;
  font-size: 38rpx;
  line-height: 1.14;
}

.detail-subtitle {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.5;
}

.detail-tag-row {
  gap: 8rpx;
  margin-top: 12rpx;
}

.detail-meta-chip {
  padding: 8rpx 14rpx;
  font-size: 20rpx;
}

.detail-highlight-row {
  margin-top: 12rpx;
}

.detail-intro {
  margin-top: 12rpx;
  font-size: 22rpx;
  line-height: 1.58;
}

.detail-summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 14rpx;
}

.detail-stat-inline {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(45, 87, 217, 0.08);
  border: 1rpx solid rgba(45, 87, 217, 0.12);
}

.detail-stat-inline-value {
  color: var(--campus-text);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1;
}

.detail-stat-inline-label {
  margin-left: 6rpx;
  color: var(--campus-text-soft);
  font-size: 19rpx;
  line-height: 1;
}

.author-card {
  margin-top: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 26rpx;
}

.author-head {
  align-items: center;
}

.avatar-has-image {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 10rpx 20rpx rgba(43, 24, 34, 0.08);
}

.avatar-image {
  width: 100%;
  height: 100%;
  display: block;
}

.detail-actions {
  gap: 10rpx;
  margin-top: 14rpx;
}

.action-chip {
  min-height: 64rpx;
  padding: 0 12rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  line-height: 1;
}
</style>
