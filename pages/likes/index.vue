<template>
  <view class="page-shell">
    <view class="page-header">
      <view class="page-title">点赞列表</view>
      <view class="page-desc">查看为这条穿搭点赞的用户，并可以选择关注感兴趣的创作者。</view>
    </view>

    <view class="panel-card">
      <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
    </view>

    <view v-if="users.length">
      <view class="list-card" v-for="item in users" :key="item.userId || item.id">
        <view class="list-row">
          <view class="meta-left">
            <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
            <view>
              <view class="meta-name">{{ item.name }}</view>
              <view class="list-copy">{{ item.intro }}</view>
            </view>
          </view>
          <view :class="['side-pill', item.active ? 'side-pill-active' : '']" @click="toggleUser(item)">{{ buttonLabel(item) }}</view>
        </view>
      </view>
    </view>

    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">暂无点赞</view>
      <view class="text-copy">用户为这条内容点赞后，该列表将在这里显示。</view>
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
      users: [],
      statusText: '正在加载点赞用户列表...'
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
    this.loadUsers()
  },
  methods: {
    loadUsers: function() {
      var self = this
      api.listLikeUsers(self.postId)
        .then(function(list) {
          self.users = list || []
          self.statusText = '点赞列表已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
        })
        .catch(function() {
          self.users = []
          self.statusText = '后端点赞数据暂时不可用。'
        })
    },
    isSelf: function(item) {
      var current = session.getUser()
      return !!current && Number(item.userId) === Number(current.userId)
    },
    buttonLabel: function(item) {
      if (this.isSelf(item)) {
        return '我自己'
      }
      return item.active ? '已关注' : '关注'
    },
    toggleUser: function(item) {
      var targetUserId = item.userId || item.id
      if (!targetUserId || this.isSelf(item)) {
        return
      }
      if (!session.isLoggedIn()) {
        this.promptLogin('关注其他用户前请先登录')
        return
      }
      api.toggleFollow(targetUserId)
        .then(function(result) {
          item.active = !!result.active
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
          }
          uni.showToast({ title: error.message || '关注状态更新失败', icon: 'none' })
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
