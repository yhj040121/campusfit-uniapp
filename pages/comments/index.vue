<template>
  <view class="page-shell">
    <view class="page-header">
      <view class="page-title">评论列表</view>
      <view class="page-desc">查看当前穿搭的评论，并继续参与交流。</view>
    </view>

    <view class="panel-card">
      <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
    </view>

    <view v-if="comments.length">
      <view class="list-card" v-for="item in comments" :key="item.id">
        <view class="meta-left" style="align-items:flex-start;">
          <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
          <view style="flex:1;">
            <view class="meta-name">{{ item.name }}</view>
            <view class="list-copy">{{ item.text }}</view>
            <view class="list-meta">{{ item.time }} | {{ item.likes }} 赞</view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">暂无评论</view>
      <view class="text-copy">成为第一个发表评论的人吧。</view>
    </view>

    <view class="fixed-input">
      <view class="form-label">添加评论</view>
      <textarea class="form-textarea" v-model="draft" maxlength="80" placeholder="写下你的穿搭反馈"></textarea>
      <button class="btn-primary" style="margin-top:18rpx;" @click="submit">发送评论</button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

function isAuthError(error) {
  return ((error && error.message) || '').toLowerCase().indexOf('login') > -1
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
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
    this.loadComments()
  },
  methods: {
    loadComments: function() {
      var self = this
      api.listComments(self.postId)
        .then(function(list) {
          self.comments = list || []
          self.statusText = '评论列表已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
        })
        .catch(function() {
          self.comments = []
          self.statusText = '后端评论数据暂时不可用。'
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
</style>
