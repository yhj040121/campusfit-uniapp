<template>
  <view class="page-shell comments-shell">
    <view class="page-header">
      <view class="campus-ribbon">评论列表</view>
      <view class="page-title">把大家对穿搭的反馈收进同一块讨论区</view>
      <view class="page-desc">支持发表评论，也支持删除你自己刚发出的评论，让详情页的互动链路更完整。</view>
    </view>

    <view class="section-head" style="margin-top:18rpx;">
      <view>
        <view class="section-title" style="margin-top:0;">评论区</view>
        <view class="section-subtitle">这里收纳大家对这条穿搭的反馈</view>
      </view>
      <view class="float-link" @click="loadComments">刷新评论</view>
    </view>

    <view v-if="comments.length">
      <view class="list-card comment-card" v-for="item in comments" :key="item.id">
        <view class="meta-left" style="align-items:flex-start;">
          <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
          <view style="flex:1; min-width:0;">
            <view class="meta-line" style="margin-top:0; align-items:flex-start;">
              <view>
                <view class="meta-name">{{ item.name }}</view>
                <view class="list-meta">{{ item.time }} · {{ item.likes }} 赞</view>
              </view>
              <view v-if="item.mine" class="float-link" @click.stop="confirmDelete(item)">删除</view>
            </view>
            <view class="list-copy">{{ item.text }}</view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">还没有评论</view>
      <view class="text-copy">你可以成为第一个留下反馈的人，帮这条穿搭内容补充更多校园场景建议。</view>
    </view>

    <view class="fixed-input">
      <view class="form-label">写一条评论</view>
      <textarea class="form-textarea" v-model="draft" maxlength="80" :placeholder="draftPlaceholder"></textarea>
      <button class="btn-primary" style="margin-top:18rpx;" @click="submit">发送评论</button>
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
      postId: 'look1',
      comments: [],
      draft: '',
      statusText: '正在加载评论...'
    }
  },
  computed: {
    draftPlaceholder: function() {
      return '写下你的穿搭反馈或搭配建议'
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
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
        })
        .catch(function() {
          self.comments = []
          self.statusText = '评论暂时不可用，请稍后再试。'
        })
    },
    submit: function() {
      var self = this
      if (!session.isLoggedIn()) {
        self.promptLogin('发表评论前请先登录')
        return
      }
      if (!self.draft) {
        uni.showToast({ title: '请输入评论内容', icon: 'none' })
        return
      }
      api.createComment(self.postId, self.draft)
        .then(function(comment) {
          self.comments.unshift(comment)
          self.draft = ''
          self.statusText = '评论已发送并同步到列表。'
          uni.showToast({ title: '评论已发送', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.promptLogin('登录已过期，请重新登录')
            return
          }
          uni.showToast({ title: error.message || '评论发送失败', icon: 'none' })
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
          self.comments = self.comments.filter(function(comment) {
            return comment.id !== item.id
          })
          self.statusText = '评论已删除。'
          uni.showToast({ title: '删除成功', icon: 'none' })
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
.comment-card {
  margin-top: 16rpx;
}
</style>
