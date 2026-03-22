<template>
  <view class="page-shell comments-shell">
    <view class="section-head" style="margin-top:18rpx;">
      <view>
        <view class="section-title" style="margin-top:0;">评论区</view>
        <view class="section-subtitle">这里收纳大家对这条穿搭的反馈</view>
      </view>
      <view class="float-link" @click="loadComments">刷新评论</view>
    </view>

    <view v-if="comments.length">
      <view class="list-card comment-card" v-for="item in comments" :key="item.id">
        <view class="meta-left comment-main">
          <view :class="['avatar', item.avatarClass, item.avatarUrl ? 'avatar-has-image' : '']">
            <image v-if="item.avatarUrl" class="avatar-image" :src="item.avatarUrl" mode="aspectFill"></image>
            <text v-else>{{ item.avatar }}</text>
          </view>
          <view class="comment-body">
            <view class="meta-line" style="margin-top:0; align-items:flex-start;">
              <view>
                <view class="meta-name">{{ item.name }}</view>
                <view class="list-meta">{{ item.time }}</view>
              </view>
              <view v-if="item.mine" class="float-link" @click.stop="confirmDelete(item)">删除</view>
            </view>
            <view class="list-copy">
              <text v-if="item.replyToName" class="reply-prefix">回复 {{ item.replyToName }}：</text>
              <text>{{ item.text }}</text>
            </view>
            <view class="comment-action-row">
              <view class="comment-action" @click="toggleCommentLike(item)">{{ item.liked ? '已赞' : '点赞' }} {{ item.likes || 0 }}</view>
              <view class="comment-action" @click="setReplyTarget(item)">回复</view>
            </view>
          </view>
        </view>

        <view v-if="item.replies && item.replies.length" class="reply-list">
          <view class="reply-card" v-for="reply in item.replies" :key="reply.id">
            <view :class="['avatar', reply.avatarClass, reply.avatarUrl ? 'avatar-has-image' : '']">
              <image v-if="reply.avatarUrl" class="avatar-image" :src="reply.avatarUrl" mode="aspectFill"></image>
              <text v-else>{{ reply.avatar }}</text>
            </view>
            <view class="comment-body">
              <view class="meta-line" style="margin-top:0; align-items:flex-start;">
                <view>
                  <view class="meta-name">{{ reply.name }}</view>
                  <view class="list-meta">{{ reply.time }}</view>
                </view>
                <view v-if="reply.mine" class="float-link" @click.stop="confirmDelete(reply)">删除</view>
              </view>
              <view class="list-copy">
                <text v-if="reply.replyToName" class="reply-prefix">回复 {{ reply.replyToName }}：</text>
                <text>{{ reply.text }}</text>
              </view>
              <view class="comment-action-row">
                <view class="comment-action" @click="toggleCommentLike(reply)">{{ reply.liked ? '已赞' : '点赞' }} {{ reply.likes || 0 }}</view>
                <view class="comment-action" @click="setReplyTarget(reply)">回复</view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">还没有评论</view>
      <view class="text-copy">你可以成为第一个留下反馈的人，帮这条穿搭内容补充更多校园场景建议。</view>
    </view>

    <view class="fixed-input">
      <view class="meta-line" style="margin-top:0; align-items:center;">
        <view class="form-label" style="margin:0;">{{ replyTarget ? ('回复 ' + replyTarget.name) : '写一条评论' }}</view>
        <view v-if="replyTarget" class="float-link" @click="clearReplyTarget">取消回复</view>
      </view>
      <textarea class="form-textarea" v-model="draft" maxlength="80" :placeholder="draftPlaceholder"></textarea>
      <button class="btn-primary" style="margin-top:18rpx;" @click="submit">{{ replyTarget ? '发送回复' : '发送评论' }}</button>
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

function findCommentById(list, commentId) {
  for (var i = 0; i < (list || []).length; i += 1) {
    var item = list[i]
    if (item && String(item.id) === String(commentId)) {
      return item
    }
    if (item && item.replies && item.replies.length) {
      var reply = findCommentById(item.replies, commentId)
      if (reply) {
        return reply
      }
    }
  }
  return null
}

export default {
  data: function() {
    return {
      postId: 'look1',
      comments: [],
      draft: '',
      statusText: '正在加载评论...',
      replyTarget: null,
      pendingReplyCommentId: '',
      actionLoadingId: '',
      submitting: false
    }
  },
  computed: {
    draftPlaceholder: function() {
      return this.replyTarget ? ('回复 ' + this.replyTarget.name + '...') : '写下你的穿搭反馈或搭配建议'
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
    this.pendingReplyCommentId = (options && options.replyCommentId) || ''
    this.loadComments()
  },
  onShow: function() {
    if (this.postId) {
      this.loadComments()
    }
  },
  methods: {
    loadComments: function() {
      var self = this
      api.listComments(self.postId)
        .then(function(list) {
          self.comments = list || []
          self.statusText = '评论列表已更新，可以继续浏览和互动。'
          if (self.pendingReplyCommentId) {
            var pending = findCommentById(self.comments, self.pendingReplyCommentId)
            if (pending) {
              self.setReplyTarget(pending)
            }
            self.pendingReplyCommentId = ''
          }
        })
        .catch(function() {
          self.comments = []
          self.statusText = '评论暂时不可用，请稍后再试。'
        })
    },
    setReplyTarget: function(item) {
      if (!item) {
        return
      }
      this.replyTarget = {
        id: item.id,
        name: item.name
      }
    },
    clearReplyTarget: function() {
      this.replyTarget = null
    },
    submit: function() {
      var self = this
      if (self.submitting) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('发表评论前请先登录')
        return
      }
      if (!self.draft) {
        uni.showToast({ title: '请输入评论内容', icon: 'none' })
        return
      }
      self.submitting = true
      api.createComment(self.postId, {
        content: self.draft,
        replyToCommentId: self.replyTarget ? self.replyTarget.id : ''
      })
        .then(function() {
          self.draft = ''
          self.replyTarget = null
          self.statusText = '评论已发送并同步到列表。'
          uni.showToast({ title: '评论已发送', icon: 'none' })
          self.loadComments()
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.promptLogin('登录已过期，请重新登录')
            return
          }
          uni.showToast({ title: error.message || '评论发送失败', icon: 'none' })
        })
        .finally(function() {
          self.submitting = false
        })
    },
    toggleCommentLike: function(item) {
      var self = this
      if (!item || self.actionLoadingId) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('点赞评论前请先登录')
        return
      }
      self.actionLoadingId = item.id
      api.toggleCommentLike(self.postId, item.id)
        .then(function(result) {
          self.comments = updateCommentTree(self.comments, item.id, function(current) {
            return Object.assign({}, current, {
              liked: !!result.active,
              likes: result.count
            })
          })
          uni.showToast({ title: result.active ? '已点赞评论' : '已取消点赞', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.promptLogin('登录已过期，请重新登录')
            return
          }
          uni.showToast({ title: error.message || '评论点赞失败', icon: 'none' })
        })
        .finally(function() {
          self.actionLoadingId = ''
        })
    },
    confirmDelete: function(item) {
      var self = this
      uni.showModal({
        title: '删除评论',
        content: '确认删除这条评论吗？删除后将不可恢复。',
        confirmText: '确认删除',
        cancelText: '取消',
        success: function(result) {
          if (result.confirm) {
            self.deleteComment(item)
          }
        }
      })
    },
    deleteComment: function(item) {
      var self = this
      api.deleteComment(self.postId, item.id)
        .then(function() {
          self.statusText = '评论已删除。'
          self.replyTarget = self.replyTarget && String(self.replyTarget.id) === String(item.id) ? null : self.replyTarget
          uni.showToast({ title: '删除成功', icon: 'none' })
          self.loadComments()
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.promptLogin('登录已过期，请重新登录')
            return
          }
          uni.showToast({ title: error.message || '删除失败', icon: 'none' })
        })
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
    }
  }
}
</script>

<style>
.comments-shell {
  padding-top: 10rpx;
  padding-bottom: 320rpx;
}

.comments-shell .section-head {
  align-items: center;
}

.comment-card {
  margin-top: 14rpx;
}

.comment-main {
  align-items: flex-start;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.reply-prefix {
  color: var(--campus-secondary);
}

.comment-action-row {
  display: flex;
  gap: 20rpx;
  margin-top: 14rpx;
}

.comment-action {
  color: var(--campus-text-muted);
  font-size: 22rpx;
  font-weight: 600;
}

.reply-list {
  margin-top: 18rpx;
  margin-left: 82rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.reply-card {
  display: flex;
  gap: 16rpx;
  padding: 18rpx;
  border-radius: 22rpx;
  background: rgba(244, 248, 252, 0.92);
}

.fixed-input .form-label {
  margin-bottom: 10rpx;
}

.fixed-input .form-textarea {
  min-height: 180rpx;
}
</style>
