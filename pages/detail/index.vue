<template>
  <view class="page-shell detail-shell">
    <view class="detail-topbar">
      <view class="detail-topbar-side">
        <view class="detail-icon-button" @click="goBack">
          <text class="detail-icon-text">←</text>
        </view>
      </view>

      <view class="detail-topbar-title">穿搭详情</view>

      <view class="detail-topbar-side detail-topbar-side-right">
        <view class="detail-icon-button" @click="sharePost">
          <view class="detail-share-glyph">
            <view class="detail-share-line detail-share-line-top"></view>
            <view class="detail-share-line detail-share-line-bottom"></view>
            <view class="detail-share-node detail-share-node-left"></view>
            <view class="detail-share-node detail-share-node-top"></view>
            <view class="detail-share-node detail-share-node-bottom"></view>
          </view>
        </view>
        <view class="detail-avatar-button">
          <image
            v-if="authorAvatarUrl"
            class="detail-avatar-button-image"
            :src="authorAvatarUrl"
            mode="aspectFill"
          ></image>
          <text v-else>{{ authorAvatarText }}</text>
        </view>
      </view>
    </view>

    <view class="detail-hero">
      <swiper
        class="detail-hero-swiper"
        circular
        :current="galleryCurrent"
        @change="handleGalleryChange"
      >
        <swiper-item v-for="(item, index) in galleryImages" :key="item + '-' + index">
          <view class="detail-hero-slide" @tap="previewGallery(index)">
            <image v-if="item" class="detail-hero-image" :src="item" mode="aspectFill"></image>
            <view v-else class="detail-hero-empty">
              <view class="detail-hero-empty-title">{{ post.title || '无' }}</view>
              <view class="detail-hero-empty-copy">{{ post.desc || '无' }}</view>
            </view>
          </view>
        </swiper-item>
      </swiper>
      <view class="detail-hero-count">{{ galleryCountLabel }}</view>
    </view>

    <view class="detail-main-card">
      <view class="detail-author-row">
        <view class="detail-author-main">
          <view :class="['avatar', post.avatarClass, authorAvatarUrl ? 'avatar-has-image' : '']">
            <image v-if="authorAvatarUrl" class="avatar-image" :src="authorAvatarUrl" mode="aspectFill"></image>
            <text v-else>{{ authorAvatarText }}</text>
          </view>
          <view class="detail-author-copy">
            <view class="detail-author-name">{{ post.user || '无' }}</view>
            <view class="detail-author-school">{{ post.school || '无' }}</view>
          </view>
        </view>

        <view
          :class="['detail-follow-button', followed ? 'detail-follow-button-active' : '', actionLoading ? 'detail-disabled' : '']"
          @click="toggleFollowAction"
        >
          {{ followLabel }}
        </view>
      </view>

      <view v-if="isMine" class="detail-owner-panel">
        <view class="detail-owner-copy">{{ ownerActionCopy }}</view>
        <view class="detail-owner-actions">
          <view class="detail-owner-button detail-owner-button-secondary" @click="startEdit">编辑内容</view>
          <view
            :class="['detail-owner-button', 'detail-owner-button-danger', deleteLoading ? 'detail-disabled' : '']"
            @click="confirmDelete"
          >
            {{ deleteLoading ? '删除中' : '删除内容' }}
          </view>
        </view>
      </view>

      <view class="detail-main-title">{{ post.title || '无' }}</view>
      <view v-if="getDisplaySubtitle(post)" class="detail-main-subtitle">{{ getDisplaySubtitle(post) }}</view>
      <view class="detail-meta-row">
        <view class="detail-meta-item">发布时间 {{ post.publishTime || '无' }}</view>
      </view>

      <view v-if="post.scene || post.style || post.budget" class="detail-tag-row">
        <view v-if="post.scene" class="detail-tag detail-tag-scene">{{ post.scene }}</view>
        <view v-if="post.style" class="detail-tag detail-tag-style">{{ post.style }}</view>
        <view v-if="post.budget" class="detail-tag detail-tag-budget">预算 {{ post.budget }}</view>
      </view>
      <view v-else class="detail-tag-row">
        <view class="detail-tag detail-tag-muted">无</view>
      </view>

      <view class="detail-main-desc">{{ post.desc || '无' }}</view>

      <view v-if="ownerFallbackMode" class="detail-state-text">当前展示的是我的内容管理视图，未公开内容也能在这里查看和处理。</view>
      <view v-else-if="detailFailed" class="detail-state-text">当前未获取到真实详情数据</view>
      <view v-else-if="detailLoading" class="detail-state-text">正在加载详情</view>
    </view>

    <view
      v-if="currentActivity"
      class="detail-section-card detail-activity-card detail-activity-card-clickable"
      @click="goActivityCenter"
    >
      <view class="detail-card-thumb detail-card-thumb-activity">
        <view class="detail-activity-glyph">活</view>
      </view>

      <view class="detail-card-main">
        <view class="detail-card-kicker">{{ currentActivity.badge || '关联活动' }}</view>
        <view class="detail-card-title detail-card-title-compact">{{ currentActivity.title || '无' }}</view>
        <view class="detail-card-meta">{{ currentActivity.period || currentActivity.progressText || currentActivity.statusCopy || currentActivity.status || '无' }}</view>
      </view>

      <view class="detail-card-arrow">›</view>
    </view>
    <view v-else class="detail-section-card detail-inline-empty">无</view>

    <view v-if="hasProductLink" class="detail-section-card detail-product-card" @click="goProduct">
      <view class="detail-card-thumb detail-card-thumb-product">
        <image v-if="productCoverUrl" class="detail-card-thumb-image" :src="productCoverUrl" mode="aspectFill"></image>
        <view v-else class="detail-card-thumb-placeholder">商品</view>
      </view>

      <view class="detail-card-main">
        <view class="detail-card-kicker detail-card-kicker-light">推荐</view>
        <view class="detail-card-title detail-card-title-light">{{ post.product || '无' }}</view>
        <view class="detail-card-meta detail-card-meta-light">{{ productMetaText }}</view>
      </view>

      <view class="detail-product-buy" @click.stop="goProduct">去购买</view>
    </view>

    <view id="detailComments" class="detail-section-card detail-comments-card">
      <view class="detail-section-head detail-section-head-comments">
        <view>
          <view class="detail-section-title">全部评论</view>
        </view>
        <view class="detail-section-link">共 {{ totalCommentCount }} 条评论</view>
      </view>

      <view v-if="allComments.length">
        <view class="detail-comment-block" v-for="item in allComments" :key="item.id">
          <view class="detail-comment-item">
            <view :class="['avatar', item.avatarClass, item.avatarUrl ? 'avatar-has-image' : '']">
              <image v-if="item.avatarUrl" class="avatar-image" :src="item.avatarUrl" mode="aspectFill"></image>
              <text v-else>{{ item.avatar || item.name || '评' }}</text>
            </view>

            <view class="detail-comment-body">
              <view class="detail-comment-head">
                <view class="detail-comment-name">{{ item.name || '无' }}</view>
                <view class="detail-comment-time">{{ item.time || '无' }}</view>
              </view>

              <view class="detail-comment-text">
                <text v-if="item.replyToName" class="detail-comment-reply">回复 {{ item.replyToName }}：</text>
                <text>{{ item.text || item.content || '无' }}</text>
              </view>

              <view class="detail-comment-actions">
                <view class="detail-comment-action" @click="togglePreviewCommentLike(item)">
                  {{ item.liked ? '已赞' : '点赞' }} {{ formatCount(item.likes || 0) }}
                </view>
                <view class="detail-comment-action" @click="setReplyTarget(item)">
                  {{ item.replies && item.replies.length ? ('回复 ' + item.replies.length) : '回复' }}
                </view>
              </view>
            </view>
          </view>

          <view v-if="item.replies && item.replies.length" class="detail-reply-list">
            <view class="detail-reply-card" v-for="reply in item.replies" :key="reply.id">
              <view :class="['avatar', reply.avatarClass, reply.avatarUrl ? 'avatar-has-image' : '']">
                <image v-if="reply.avatarUrl" class="avatar-image" :src="reply.avatarUrl" mode="aspectFill"></image>
                <text v-else>{{ reply.avatar || reply.name || '回' }}</text>
              </view>

              <view class="detail-comment-body">
                <view class="detail-comment-head">
                  <view class="detail-comment-name">{{ reply.name || '无' }}</view>
                  <view class="detail-comment-time">{{ reply.time || '无' }}</view>
                </view>

                <view class="detail-comment-text">
                  <text v-if="reply.replyToName" class="detail-comment-reply">回复 {{ reply.replyToName }}：</text>
                  <text>{{ reply.text || reply.content || '无' }}</text>
                </view>

                <view class="detail-comment-actions">
                  <view class="detail-comment-action" @click="togglePreviewCommentLike(reply)">
                    {{ reply.liked ? '已赞' : '点赞' }} {{ formatCount(reply.likes || 0) }}
                  </view>
                  <view class="detail-comment-action" @click="setReplyTarget(reply)">回复</view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="detail-empty-text">无</view>

      <view id="detailCommentComposer" class="detail-comment-composer">
        <view class="detail-composer-head">
          <view class="detail-composer-title">{{ replyTarget ? ('回复 ' + replyTarget.name) : '写评论' }}</view>
          <view v-if="replyTarget" class="detail-composer-clear" @click="clearReplyTarget">取消回复</view>
        </view>

        <textarea
          v-model="draft"
          class="detail-composer-textarea"
          maxlength="120"
          :placeholder="draftPlaceholder"
        ></textarea>

        <view
          :class="['detail-composer-submit', submitting ? 'detail-disabled' : '']"
          @click="submitComment"
        >
          {{ submitting ? '发送中' : (replyTarget ? '发送回复' : '发送评论') }}
        </view>
      </view>
    </view>

    <view class="detail-bottom-bar">
      <view
        :class="['detail-bottom-item', liked ? 'detail-bottom-item-active' : '', actionLoading ? 'detail-disabled' : '']"
        @click="toggleLikeAction"
      >
        <text class="detail-bottom-icon">{{ liked ? '♥' : '♡' }}</text>
        <text class="detail-bottom-text">{{ formatCount(post.likes) }}</text>
      </view>

      <view
        :class="['detail-bottom-item', saved ? 'detail-bottom-item-active' : '', actionLoading ? 'detail-disabled' : '']"
        @click="toggleFavoriteAction"
      >
        <text class="detail-bottom-icon">{{ saved ? '★' : '☆' }}</text>
        <text class="detail-bottom-text">{{ formatCount(post.saves) }}</text>
      </view>

      <view class="detail-bottom-item" @click="goComments">
        <text class="detail-bottom-icon">评</text>
        <text class="detail-bottom-text">{{ formatCount(totalCommentCount) }}</text>
      </view>

      <view class="detail-bottom-item detail-bottom-item-share" @click="sharePost">
        <view class="detail-send-glyph">
          <view class="detail-send-wing"></view>
          <view class="detail-send-tail"></view>
        </view>
        <text class="detail-bottom-text">分享</text>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var activityStore = require('../../common/activity.js')
var postDisplay = require('../../common/post-display.js')
var settingsStore = require('../../common/settings.js')
var EDIT_POST_KEY = 'campusfit_edit_post_id'

function pickFirstText(value, fallback) {
  var text = String(value || '').trim()
  if (!text) {
    return fallback || '青'
  }
  return text.slice(0, 1)
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
    segments.push('预算 ' + detail.budget)
  }
  return segments.join(' · ')
}
function buildShareCopyText(post, link) {
  var detail = post || {}
  var lines = [(detail.title && String(detail.title).trim()) || '穿搭分享']
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
    lines.push('商品：' + productLine.join(' · '))
  }
  if (link) {
    lines.push('商品链接：' + link)
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

function formatCountValue(value) {
  var count = Number(value || 0)
  if (!count) {
    return '0'
  }
  if (count >= 10000) {
    return (count / 10000).toFixed(count >= 100000 ? 0 : 1) + '万'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(count >= 10000 ? 0 : 1) + '千'
  }
  return String(count)
}

function formatPriceLabel(value) {
  if (value === null || value === undefined || value === '') {
    return '无'
  }
  var amount = Number(value)
  if (!isFinite(amount)) {
    return String(value)
  }
  if (Math.floor(amount) === amount) {
    return '¥' + String(amount)
  }
  return '¥' + amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function emptyPost(id) {
  return {
    id: id || '',
    coverTag: '',
    title: '无',
    subtitle: '',
    publishTime: '',
    desc: '无',
    coverImageUrl: '',
    imageUrls: [],
    authorId: '',
    user: '无',
    avatar: '青',
    avatarUrl: '',
    avatarClass: 'soft',
    school: '无',
    mine: false,
    liked: false,
    favorited: false,
    followed: false,
    scene: '',
    style: '',
    budget: '',
    likes: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    price: '无',
    product: '无',
    platform: '无',
    productLink: '',
    profit: '无',
    guideTip: '',
    activity: null,
    highlights: [],
    commentsPreview: []
  }
}

function buildMineFallbackPost(postId, editData) {
  var source = editData || {}
  var imageUrls = Array.isArray(source.imageUrls) ? source.imageUrls.filter(Boolean) : []
  var tags = Array.isArray(source.tags) ? source.tags : []
  var currentUser = session.getUser() || {}
  var nickname = pickFirstText(currentUser.nickname, '我')
  return Object.assign({}, emptyPost(postId), {
    id: source.id || postId,
    title: source.title || '未命名内容',
    desc: source.desc || '暂无内容介绍。',
    coverImageUrl: imageUrls[0] || '',
    imageUrls: imageUrls,
    authorId: currentUser.userId || '',
    user: nickname,
    avatar: pickFirstText(nickname, '我'),
    avatarUrl: currentUser.avatarUrl || '',
    avatarClass: 'soft',
    school: '',
    mine: true,
    liked: false,
    favorited: false,
    followed: false,
    scene: tags[0] || '',
    style: tags[1] || '',
    budget: tags[2] || '',
    publishTime: '我的内容',
    price: formatPriceLabel(source.productPrice),
    product: source.productLink ? '商品链接' : '无',
    productLink: source.productLink || '',
    activity: source.activity || null
  })
}

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

function updateCommentTree(list, commentId, updater) {
  var changed = false
  var next = (list || []).map(function(item) {
    var current = item
    if (current && String(current.id) === String(commentId)) {
      changed = true
      return updater(current)
    }
    if (current && current.replies && current.replies.length) {
      var nextReplies = updateCommentTree(current.replies, commentId, updater)
      if (nextReplies !== current.replies) {
        changed = true
        return Object.assign({}, current, { replies: nextReplies })
      }
    }
    return current
  })
  return changed ? next : list
}

function countCommentTree(list) {
  var total = 0
  var source = list || []
  for (var i = 0; i < source.length; i += 1) {
    total += 1
    if (source[i] && source[i].replies && source[i].replies.length) {
      total += countCommentTree(source[i].replies)
    }
  }
  return total
}

export default {
  data: function() {
    return {
      postId: '',
      post: emptyPost(''),
      ownerEntry: false,
      ownerFallbackMode: false,
      liked: false,
      saved: false,
      followed: false,
      isMine: false,
      currentActivity: null,
      allComments: [],
      commentsLoading: false,
      draft: '',
      replyTarget: null,
      submitting: false,
      detailLoading: false,
      detailFailed: false,
      actionLoading: false,
      deleteLoading: false,
      activityActionLoading: false,
      shareLoading: false,
      shareLink: '',
      galleryCurrent: 0,
      detailRequested: false,
      settingMap: settingsStore.getSettingMap()
    }
  },
  computed: {
    followLabel: function() {
      if (this.isMine) {
        return '我的内容'
      }
      return this.followed ? '已关注' : '关注'
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
      return pickFirstText((this.post && this.post.avatar) || (this.post && this.post.user), '青')
    },
    hasProductLink: function() {
      return !!(this.post && this.post.productLink && String(this.post.productLink).trim())
    },
    productCoverUrl: function() {
      return this.galleryImages[0] || postDisplay.getDisplayCoverUrl(this.post) || ''
    },
    productMetaText: function() {
      var parts = []
      if (this.post && this.post.price) {
        parts.push(this.post.price)
      } else if (this.post && this.post.budget) {
        parts.push('预算 ' + this.post.budget)
      }
      if (this.post && this.post.platform) {
        parts.push(this.post.platform)
      }
      return parts.length ? parts.join(' · ') : '无'
    },
    totalCommentCount: function() {
      var total = countCommentTree(this.allComments)
      if (total) {
        return total
      }
      return Number((this.post && this.post.comments) || 0)
    },
    draftPlaceholder: function() {
      return this.replyTarget ? ('回复 ' + this.replyTarget.name + '...') : '写下你的评论...'
    },
    ownerActionCopy: function() {
      if (this.ownerFallbackMode) {
        return '这条内容当前未对外展示，你可以继续编辑后重新提交，或者直接删除。'
      }
      return '这是你自己的内容，可以继续编辑，也可以直接删除。'
    }
  },
  onShareAppMessage: function() {
    return {
      title: (this.post && this.post.title) || '穿搭分享',
      path: '/pages/detail/index?id=' + ((this.post && this.post.id) || this.postId || ''),
      imageUrl: (this.galleryImages && this.galleryImages[0]) || (this.post && this.post.coverImageUrl) || ''
    }
  },
  onShareTimeline: function() {
    return {
      title: (this.post && this.post.title) || '穿搭分享',
      query: 'id=' + ((this.post && this.post.id) || this.postId || ''),
      imageUrl: (this.galleryImages && this.galleryImages[0]) || (this.post && this.post.coverImageUrl) || ''
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || ''
    this.ownerEntry = !!(options && (options.mine === '1' || options.mine === 'true'))
    this.ownerFallbackMode = false
    this.post = emptyPost(this.postId)
    this.loadDetail()
  },
  onShow: function() {
    this.settingMap = settingsStore.getSettingMap()
    if (this.postId && !this.detailRequested) {
      this.loadDetail()
    }
  },
  methods: {
    formatCount: function(value) {
      return formatCountValue(value)
    },
    goBack: function() {
      var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      if (pages && pages.length > 1) {
        uni.navigateBack({ delta: 1 })
        return
      }
      uni.switchTab({ url: '/pages/index/index' })
    },
    applyResolvedDetail: function(detail, ownerFallback) {
      var merged = Object.assign({}, emptyPost(this.postId), detail || {})
      this.post = merged
      this.liked = !!merged.liked
      this.saved = !!merged.favorited
      this.followed = !!merged.followed
      this.isMine = !!merged.mine || !!ownerFallback
      this.currentActivity = merged.activity || null
      this.galleryCurrent = 0
      this.detailFailed = false
      this.ownerFallbackMode = !!ownerFallback
    },
    markDetailFailed: function() {
      this.post = emptyPost(this.postId)
      this.currentActivity = null
      this.allComments = []
      this.galleryCurrent = 0
      this.detailFailed = true
      this.detailRequested = false
      this.ownerFallbackMode = false
    },
    loadMineFallbackDetail: function() {
      var self = this
      return api.getPostForEdit(self.postId)
        .then(function(detail) {
          self.applyResolvedDetail(buildMineFallbackPost(self.postId, detail), true)
          self.loadComments()
        })
    },
    loadDetail: function() {
      var self = this
      if (!self.postId) {
        self.post = emptyPost('')
        self.currentActivity = null
        self.allComments = []
        self.detailFailed = true
        self.detailLoading = false
        self.detailRequested = false
        self.ownerFallbackMode = false
        return
      }
      self.detailRequested = true
      self.detailLoading = true
      self.detailFailed = false
      self.ownerFallbackMode = false
      self.shareLink = ''
      api.getPostDetail(self.postId)
        .then(function(detail) {
          self.applyResolvedDetail(detail, false)
          self.loadComments()
        })
        .catch(function() {
          if (self.ownerEntry && session.isLoggedIn()) {
            return self.loadMineFallbackDetail()
              .catch(function() {
                self.markDetailFailed()
              })
          }
          self.markDetailFailed()
        })
        .finally(function() {
          self.detailLoading = false
        })
    },
    loadComments: function() {
      var self = this
      if (!self.postId) {
        self.allComments = []
        return
      }
      self.commentsLoading = true
      api.listComments(self.postId)
        .then(function(list) {
          self.allComments = list || []
          self.post.comments = countCommentTree(self.allComments)
        })
        .catch(function() {
          self.allComments = []
        })
        .finally(function() {
          self.commentsLoading = false
        })
    },
    startEdit: function() {
      var targetId = this.post.id || this.postId
      if (!targetId) {
        return
      }
      uni.setStorageSync(EDIT_POST_KEY, targetId)
      uni.switchTab({ url: '/pages/publish/index' })
    },
    confirmDelete: function() {
      var self = this
      if (!self.isMine || self.deleteLoading) {
        return
      }
      var targetId = self.post.id || self.postId
      if (!targetId) {
        return
      }
      uni.showModal({
        title: '删除确认',
        content: '确认删除《' + (self.post.title || '这条内容') + '》吗？删除后将无法恢复；若已绑定合作，仅在奖励未发放前可删除。',
        confirmText: '确认删除',
        cancelText: '取消',
        success: function(result) {
          if (result.confirm) {
            self.deleteMyPost(targetId)
          }
        }
      })
    },
    deleteMyPost: function(targetId) {
      var self = this
      self.deleteLoading = true
      api.deletePost(targetId)
        .then(function() {
          uni.showToast({ title: '已删除', icon: 'none' })
          setTimeout(function() {
            var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
            if (pages && pages.length > 1) {
              uni.navigateBack({ delta: 1 })
              return
            }
            uni.switchTab({ url: '/pages/profile/index' })
          }, 260)
        })
        .catch(function(error) {
          self.handleActionError(error, '删除失败，请稍后重试。')
        })
        .finally(function() {
          self.deleteLoading = false
        })
    },
    handleGalleryChange: function(event) {
      this.galleryCurrent = (event && event.detail && typeof event.detail.current === 'number') ? event.detail.current : 0
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
      if (self.actionLoading || !self.post.id) {
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
      if (self.actionLoading || !self.post.id) {
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
      if (self.actionLoading || !self.post.authorId) {
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
      if (!self.currentActivity || !self.currentActivity.id || self.activityActionLoading) {
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
    resolveShareLink: function() {
      var self = this
      if (!self.post.id) {
        return Promise.resolve('')
      }
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
            uni.showToast({ title: successMessage || '已复制', icon: 'none' })
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
        return Promise.reject(new Error('当前环境不支持系统分享'))
      }
      var payload = {
        title: (self.post && self.post.title) || '穿搭分享',
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
        itemList.push('系统分享')
        actions.push('native')
      }
      itemList.push('复制分享文案')
      actions.push('copy-text')
      itemList.push('复制商品链接')
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
                    return self.copyShareContent(shareText, '当前环境不支持系统分享，已复制文案')
                  })
              }
              if (action === 'copy-link') {
                if (link) {
                  return self.copyShareContent(link, '商品链接已复制')
                }
                return self.copyShareContent(shareText, '暂无商品链接，已复制分享文案')
              }
              return self.copyShareContent(shareText, '分享文案已复制')
            })
            .catch(function(error) {
              uni.showToast({ title: (error && error.message) || '分享暂时不可用', icon: 'none' })
            })
            .finally(function() {
              self.shareLoading = false
            })
        }
      })
    },
    goActivityCenter: function() {
      if (!this.currentActivity || !this.currentActivity.id) {
        return
      }
      uni.navigateTo({ url: '/pages/activity-detail/index?id=' + encodeURIComponent(this.currentActivity.id) })
    },
    goComments: function() {
      uni.pageScrollTo({
        selector: '#detailCommentComposer',
        duration: 280
      })
    },
    setReplyTarget: function(item) {
      if (!item) {
        return
      }
      this.replyTarget = {
        id: item.id,
        name: item.name || item.user || '该评论'
      }
      this.goComments()
    },
    clearReplyTarget: function() {
      this.replyTarget = null
    },
    submitComment: function() {
      var self = this
      var content = String(self.draft || '').trim()
      if (self.submitting) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('发表评论前请先登录。')
        return
      }
      if (!self.post.id) {
        uni.showToast({ title: '当前帖子不可评论', icon: 'none' })
        return
      }
      if (!content) {
        uni.showToast({ title: '请输入评论内容', icon: 'none' })
        return
      }
      self.submitting = true
      api.createComment(self.post.id, {
        content: content,
        replyToCommentId: self.replyTarget ? self.replyTarget.id : ''
      })
        .then(function() {
          self.draft = ''
          self.replyTarget = null
          uni.showToast({ title: '评论已发送', icon: 'none' })
          self.loadComments()
        })
        .catch(function(error) {
          self.handleActionError(error, '评论发送失败，请稍后再试。')
        })
        .finally(function() {
          self.submitting = false
        })
    },
    togglePreviewCommentLike: function(item) {
      var self = this
      if (!item || self.actionLoading || !self.post.id || !item.id) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('登录后才能点赞评论。')
        return
      }
      self.actionLoading = true
      api.toggleCommentLike(self.post.id, item.id)
        .then(function(result) {
          self.allComments = updateCommentTree(self.allComments, item.id, function(current) {
            return Object.assign({}, current, {
              liked: !!result.active,
              likes: result.count
            })
          })
          uni.showToast({ title: result.active ? '已点赞评论' : '已取消点赞', icon: 'none' })
        })
        .catch(function(error) {
          self.handleActionError(error, '评论点赞失败，请稍后再试。')
        })
        .finally(function() {
          self.actionLoading = false
        })
    },
    goLikes: function() {
      if (!this.post.id) {
        return
      }
      uni.navigateTo({ url: '/pages/likes/index?id=' + this.post.id })
    },
    goProduct: function() {
      if (!this.post.id || !this.hasProductLink) {
        return
      }
      uni.navigateTo({ url: '/pages/product-jump/index?id=' + this.post.id })
    },
    getDisplaySubtitle: function(item) {
      return postDisplay.getDisplaySubtitle(item)
    }
  }
}
</script>
<style>
.detail-shell {
  min-height: 100vh;
  padding-bottom: calc(168rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at top left, rgba(255, 209, 102, 0.16), transparent 28%),
    linear-gradient(180deg, #f4f7fb 0%, #ffffff 54%);
}

.detail-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--status-bar-height) + 16rpx) 24rpx 16rpx;
}

.detail-topbar-title {
  position: absolute;
  left: 50%;
  top: calc(var(--status-bar-height) + 28rpx);
  transform: translateX(-50%);
  color: #1f2f47;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1;
  pointer-events: none;
}

.detail-topbar-side {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 120rpx;
}

.detail-topbar-side-right {
  justify-content: flex-end;
  margin-left: auto;
}

.detail-icon-button,
.detail-avatar-button {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.12);
  color: #2457c6;
  backdrop-filter: blur(12rpx);
}

.detail-icon-text {
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1;
}

.detail-share-glyph {
  position: relative;
  width: 28rpx;
  height: 28rpx;
}

.detail-share-line {
  position: absolute;
  left: 8rpx;
  width: 14rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: #707070;
  transform-origin: left center;
}

.detail-share-line-top {
  top: 8rpx;
  transform: rotate(-30deg);
}

.detail-share-line-bottom {
  top: 18rpx;
  transform: rotate(30deg);
}

.detail-share-node {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #707070;
}

.detail-share-node-left {
  left: 2rpx;
  top: 10rpx;
}

.detail-share-node-top {
  right: 2rpx;
  top: 2rpx;
}

.detail-share-node-bottom {
  right: 2rpx;
  bottom: 2rpx;
}

.detail-avatar-button {
  overflow: hidden;
  font-size: 24rpx;
  font-weight: 700;
}

.detail-avatar-button-image {
  width: 100%;
  height: 100%;
  display: block;
}

.detail-hero {
  position: relative;
}

.detail-hero-swiper {
  height: 920rpx;
}

.detail-hero-slide,
.detail-hero-empty {
  width: 100%;
  height: 100%;
}

.detail-hero-slide {
  overflow: hidden;
  border-radius: 0 0 44rpx 44rpx;
  background: #eef3f9;
}

.detail-hero-image {
  width: 100%;
  height: 100%;
}

.detail-hero-empty {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 180rpx 38rpx 54rpx;
  background:
    linear-gradient(180deg, rgba(34, 86, 199, 0.14) 0%, rgba(34, 86, 199, 0.04) 100%),
    linear-gradient(135deg, #f3efe7 0%, #f7fbff 100%);
}

.detail-hero-empty-title {
  color: #1f2f47;
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1.22;
}

.detail-hero-empty-copy {
  margin-top: 16rpx;
  color: #667085;
  font-size: 26rpx;
  line-height: 1.7;
}

.detail-hero-count {
  position: absolute;
  right: 28rpx;
  bottom: 24rpx;
  z-index: 5;
  min-width: 104rpx;
  height: 50rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.4);
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
  backdrop-filter: blur(12rpx);
}

.detail-main-card {
  position: relative;
  z-index: 6;
  margin: -72rpx 24rpx 0;
  padding: 30rpx 28rpx 26rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 24rpx 56rpx rgba(15, 23, 42, 0.12);
}

.detail-author-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.detail-author-main {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
  flex: 1;
}

.detail-author-copy {
  min-width: 0;
}

.avatar {
  width: 74rpx;
  height: 74rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dbeafe, #f0f9ff);
  color: #2457c6;
  font-size: 28rpx;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-has-image {
  background: #ffffff;
}

.avatar-image {
  width: 100%;
  height: 100%;
  display: block;
}
.detail-author-name {
  color: #243246;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-author-school {
  margin-top: 6rpx;
  color: #7a8597;
  font-size: 22rpx;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-follow-button {
  min-width: 132rpx;
  height: 66rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #5daeff 0%, #2a80f4 100%);
  box-shadow: 0 12rpx 24rpx rgba(42, 128, 244, 0.22);
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.detail-follow-button-active {
  background: #edf4ff;
  box-shadow: none;
  color: #2a80f4;
}

.detail-owner-panel {
  margin-top: 20rpx;
  padding: 22rpx 24rpx;
  border-radius: 28rpx;
  background: linear-gradient(180deg, rgba(236, 244, 255, 0.92) 0%, rgba(245, 249, 255, 0.92) 100%);
  border: 1rpx solid rgba(42, 128, 244, 0.12);
}

.detail-owner-copy {
  color: #56708d;
  font-size: 24rpx;
  line-height: 1.6;
}

.detail-owner-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 18rpx;
}

.detail-owner-button {
  flex: 1;
  min-height: 74rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.detail-owner-button-secondary {
  background: rgba(42, 128, 244, 0.12);
  color: #2a80f4;
}

.detail-owner-button-danger {
  background: rgba(255, 236, 237, 0.96);
  color: #df4c63;
}

.detail-main-title {
  margin-top: 18rpx;
  color: #1f2937;
  font-size: 50rpx;
  font-weight: 800;
  line-height: 1.15;
}

.detail-main-subtitle {
  margin-top: 10rpx;
  color: #2f6ec9;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.5;
}

.detail-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
}

.detail-meta-item {
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1.4;
}

.detail-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.detail-tag {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 21rpx;
  font-weight: 700;
  line-height: 1.2;
}

.detail-tag-scene {
  background: #dff6ee;
  color: #22916b;
}

.detail-tag-style {
  background: #edf1f6;
  color: #677487;
}

.detail-tag-budget {
  background: #ffe89a;
  color: #856300;
}

.detail-tag-muted {
  background: #f3f4f6;
  color: #9ca3af;
}

.detail-main-desc {
  margin-top: 20rpx;
  color: #667085;
  font-size: 28rpx;
  line-height: 1.72;
}

.detail-state-text {
  margin-top: 18rpx;
  color: #98a2b3;
  font-size: 22rpx;
  line-height: 1.5;
}

.detail-section-card {
  margin: 22rpx 24rpx 0;
  padding: 30rpx 28rpx;
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.97);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 18rpx 42rpx rgba(15, 23, 42, 0.08);
}

.detail-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.detail-section-title {
  color: #1f2937;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.2;
}

.detail-section-subtitle {
  margin-top: 8rpx;
  color: #98a2b3;
  font-size: 22rpx;
  line-height: 1.5;
}

.detail-section-stamp {
  min-width: 88rpx;
  height: 48rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(42, 128, 244, 0.1);
  color: #2a80f4;
  font-size: 20rpx;
  font-weight: 700;
}

.detail-card-title {
  margin-top: 22rpx;
  color: #253447;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.3;
}

.detail-card-copy {
  margin-top: 12rpx;
  color: #667085;
  font-size: 24rpx;
  line-height: 1.7;
}

.detail-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.detail-chip {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.2;
}

.detail-chip-blue {
  background: rgba(42, 128, 244, 0.12);
  color: #2a80f4;
}

.detail-chip-plain {
  background: #edf1f6;
  color: #677487;
}

.detail-note-row {
  margin-top: 16rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: #f8fafc;
}

.detail-note-label {
  display: block;
  color: #475467;
  font-size: 21rpx;
  font-weight: 700;
}

.detail-note-value {
  display: block;
  margin-top: 8rpx;
  color: #667085;
  font-size: 23rpx;
  line-height: 1.7;
}
.detail-button-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 22rpx;
}

.detail-button {
  height: 76rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.detail-button-light {
  background: #eef4ff;
  color: #2a80f4;
}

.detail-button-primary {
  background: linear-gradient(135deg, #5daeff 0%, #2a80f4 100%);
  color: #ffffff;
  box-shadow: 0 12rpx 24rpx rgba(42, 128, 244, 0.18);
}

.detail-button-disabled {
  background: #eff2f6;
  color: #98a2b3;
}

.detail-activity-card,
.detail-product-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.detail-activity-card-clickable {
  padding: 22rpx 24rpx;
}

.detail-inline-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #98a2b3;
  font-size: 26rpx;
  font-weight: 700;
}

.detail-card-thumb {
  width: 84rpx;
  height: 84rpx;
  border-radius: 18rpx;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-card-thumb-activity {
  background: linear-gradient(135deg, rgba(42, 128, 244, 0.14), rgba(56, 189, 248, 0.18));
}

.detail-card-thumb-product {
  background: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.08);
}

.detail-card-thumb-image {
  width: 100%;
  height: 100%;
  display: block;
}

.detail-card-thumb-placeholder {
  color: #5b6b82;
  font-size: 22rpx;
  font-weight: 700;
}

.detail-activity-glyph {
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.78);
  color: #2a80f4;
  font-size: 26rpx;
  font-weight: 800;
  box-shadow: inset 0 0 0 2rpx rgba(42, 128, 244, 0.08);
}

.detail-card-main {
  min-width: 0;
  flex: 1;
}

.detail-card-kicker {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: #eef7f2;
  color: #5f7f6b;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 1;
}

.detail-card-kicker-light {
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.84);
}

.detail-card-title-compact {
  margin-top: 10rpx;
  font-size: 30rpx;
}

.detail-card-title-light {
  margin-top: 10rpx;
  color: #ffffff;
  font-size: 30rpx;
}

.detail-card-meta {
  margin-top: 8rpx;
  color: #667085;
  font-size: 22rpx;
  line-height: 1.4;
}

.detail-card-meta-light {
  color: rgba(255, 255, 255, 0.78);
}

.detail-card-arrow {
  color: #98a2b3;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1;
}

.detail-product-card {
  background: linear-gradient(135deg, #0a4f98 0%, #0e6cbe 100%);
  border: 0;
  box-shadow: 0 18rpx 42rpx rgba(12, 88, 163, 0.24);
}

.detail-product-buy {
  min-width: 112rpx;
  height: 62rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #1c63b8;
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.detail-guide-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 22rpx;
}

.detail-guide-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #5daeff 0%, #2a80f4 100%);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 800;
  flex-shrink: 0;
}

.detail-guide-copy {
  min-width: 0;
  flex: 1;
}

.detail-price-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 20rpx;
}

.detail-price-block {
  padding: 20rpx;
  border-radius: 24rpx;
  background: #f7f9fc;
}

.detail-price-label {
  color: #98a2b3;
  font-size: 20rpx;
  font-weight: 700;
}

.detail-price-value {
  margin-top: 10rpx;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.35;
  word-break: break-all;
}

.detail-price-value-muted {
  color: #596579;
  font-size: 24rpx;
}

.detail-section-head-comments {
  align-items: center;
}

.detail-section-link {
  color: #2a80f4;
  font-size: 22rpx;
  font-weight: 700;
  white-space: nowrap;
}

.detail-comment-block + .detail-comment-block {
  border-top: 1rpx solid rgba(148, 163, 184, 0.12);
}

.detail-comment-item {
  display: flex;
  gap: 16rpx;
  padding: 22rpx 0;
}

.detail-comment-body {
  flex: 1;
  min-width: 0;
}

.detail-comment-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.detail-comment-name {
  color: #253447;
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1.3;
}

.detail-comment-time {
  color: #98a2b3;
  font-size: 20rpx;
  line-height: 1.3;
  flex-shrink: 0;
}

.detail-comment-text {
  margin-top: 10rpx;
  color: #667085;
  font-size: 23rpx;
  line-height: 1.72;
  word-break: break-word;
}

.detail-comment-reply {
  color: #2a80f4;
}

.detail-comment-actions {
  display: flex;
  gap: 18rpx;
  margin-top: 12rpx;
}

.detail-comment-action {
  color: #7d8798;
  font-size: 21rpx;
  font-weight: 700;
}

.detail-reply-list {
  margin: -4rpx 0 8rpx 86rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.detail-reply-card {
  display: flex;
  gap: 16rpx;
  padding: 18rpx;
  border-radius: 22rpx;
  background: rgba(244, 248, 252, 0.96);
}

.detail-comment-composer {
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(148, 163, 184, 0.12);
}

.detail-composer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.detail-composer-title {
  color: #253447;
  font-size: 24rpx;
  font-weight: 700;
}

.detail-composer-clear {
  color: #2a80f4;
  font-size: 22rpx;
  font-weight: 700;
}

.detail-composer-textarea {
  width: 100%;
  min-height: 160rpx;
  margin-top: 14rpx;
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  box-sizing: border-box;
  background: #f8fafc;
  color: #253447;
  font-size: 24rpx;
  line-height: 1.7;
}

.detail-composer-submit {
  margin-top: 16rpx;
  height: 72rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #5daeff 0%, #2a80f4 100%);
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 24rpx rgba(42, 128, 244, 0.16);
}

.detail-empty-text {
  margin-top: 18rpx;
  color: #98a2b3;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 1.5;
}

.detail-bottom-bar {
  position: fixed;
  left: 20rpx;
  right: 20rpx;
  bottom: 18rpx;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  padding: 16rpx 18rpx calc(16rpx + env(safe-area-inset-bottom));
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -4rpx 12rpx rgba(15, 23, 42, 0.02), 0 18rpx 46rpx rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(20rpx);
}

.detail-bottom-item {
  min-height: 86rpx;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.detail-bottom-item-active {
  background: rgba(42, 128, 244, 0.08);
}

.detail-bottom-item-share {
  background: #edf4ff;
  color: #2a80f4;
}

.detail-bottom-icon {
  color: #64748b;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1;
}

.detail-send-glyph {
  position: relative;
  width: 40rpx;
  height: 28rpx;
}

.detail-send-wing {
  position: absolute;
  top: 2rpx;
  left: 8rpx;
  width: 0;
  height: 0;
  border-top: 12rpx solid transparent;
  border-bottom: 12rpx solid transparent;
  border-left: 24rpx solid #2a55d8;
}

.detail-send-tail {
  position: absolute;
  left: 6rpx;
  top: 11rpx;
  width: 14rpx;
  height: 5rpx;
  border-radius: 999rpx;
  background: #2a55d8;
}

.detail-bottom-item-active .detail-bottom-icon,
.detail-bottom-item-share .detail-bottom-icon {
  color: #2a80f4;
}

.detail-bottom-text {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1;
}

.detail-bottom-item-active .detail-bottom-text,
.detail-bottom-item-share .detail-bottom-text {
  color: #2a80f4;
}

.detail-disabled {
  opacity: 0.55;
}
</style>
