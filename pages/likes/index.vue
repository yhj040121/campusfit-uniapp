<template>
  <view class="page-shell likes-shell">
    <view class="page-header">
      <view class="campus-ribbon">点赞列表</view>
      <view class="page-title">看看是谁为这条穿搭按下了喜欢</view>
      <view class="page-desc">除了查看点赞用户，你也可以在这里继续关注感兴趣的校园穿搭创作者。</view>
    </view>

    <view class="filter-summary-card">
      <view class="summary-kicker">同步状态</view>
      <view class="summary-line">{{ statusText }}</view>
    </view>

    <view :class="['status-banner', likeStateClass]">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">点赞列表状态</view>
          <view class="status-banner-copy">{{ likeStateText }}</view>
        </view>
        <view class="status-link" @click="refreshUsers">刷新列表</view>
      </view>
      <view class="status-grid two-col">
        <view class="status-item">
          <view class="status-item-label">点赞人数</view>
          <text class="status-item-value">{{ users.length }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">当前内容</view>
          <text class="status-item-value">{{ postId }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">支持操作</view>
          <text class="status-item-value">查看 / 继续关注</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">当前模式</view>
          <text class="status-item-value">{{ actionLoadingId ? '处理中' : '可浏览' }}</text>
        </view>
      </view>
    </view>

    <view v-if="listLoading">
      <view class="skeleton-card" v-for="item in 2" :key="'like-skeleton-' + item">
        <view class="skeleton-block"></view>
        <view class="skeleton-line medium"></view>
        <view class="skeleton-line"></view>
      </view>
    </view>

    <view v-else-if="listFailed" class="status-banner status-banner-error">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">点赞列表暂时不可用</view>
          <view class="status-banner-copy">接口失败时可以手动刷新，方便继续演示点赞关系链路。</view>
        </view>
        <view class="status-link" @click="refreshUsers">重新加载</view>
      </view>
    </view>

    <view v-else-if="users.length">
      <view class="list-card like-card" v-for="item in users" :key="item.userId || item.id">
        <view class="list-row">
          <view class="meta-left">
            <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
            <view>
              <view class="meta-name">{{ item.name }}</view>
              <view class="list-copy">{{ item.intro }}</view>
            </view>
          </view>
          <view :class="['side-pill', item.active ? 'side-pill-active' : '', actionLoadingId === (item.userId || item.id) ? 'btn-disabled' : '']" @click="toggleUser(item)">{{ buttonLabel(item) }}</view>
        </view>
      </view>
    </view>

    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">还没有点赞用户</view>
      <view class="text-copy">当更多人点赞这条内容后，这里会出现点赞用户列表。</view>
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
      users: [],
      statusText: '正在加载点赞用户列表...',
      listLoading: false,
      listFailed: false,
      actionLoadingId: ''
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
    this.loadUsers()
  },
  computed: {
    likeStateClass: function() {
      if (this.listLoading || this.actionLoadingId) {
        return 'status-banner-warning'
      }
      if (this.listFailed) {
        return 'status-banner-error'
      }
      return 'status-banner-success'
    },
    likeStateText: function() {
      if (this.listLoading) {
        return '正在同步当前内容的点赞用户列表。'
      }
      if (this.actionLoadingId) {
        return '正在更新关注状态，请稍候。'
      }
      if (this.listFailed) {
        return '当前未能获取点赞数据，建议手动刷新。'
      }
      if (!this.users.length) {
        return '这条内容暂时还没有收到新的点赞。'
      }
      return '点赞列表状态正常，可以继续关注感兴趣的用户。'
    }
  },
  methods: {
    loadUsers: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
      api.listLikeUsers(self.postId)
        .then(function(list) {
          self.users = list || []
          self.statusText = '点赞列表已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
        })
        .catch(function() {
          self.users = []
          self.listFailed = true
          self.statusText = '后端点赞数据暂时不可用。'
        })
        .finally(function() {
          self.listLoading = false
        })
    },
    refreshUsers: function() {
      this.loadUsers()
      uni.showToast({ title: '正在刷新点赞列表', icon: 'none' })
    },
    isSelf: function(item) {
      var current = session.getUser()
      return !!current && Number(item.userId) === Number(current.userId)
    },
    buttonLabel: function(item) {
      var targetId = item.userId || item.id
      if (this.isSelf(item)) {
        return '我自己'
      }
      if (this.actionLoadingId === targetId) {
        return '处理中'
      }
      return item.active ? '已关注' : '关注'
    },
    toggleUser: function(item) {
      var targetUserId = item.userId || item.id
      var self = this
      if (!targetUserId || this.isSelf(item) || self.actionLoadingId) {
        return
      }
      if (!session.isLoggedIn()) {
        this.promptLogin('关注其他用户前请先登录')
        return
      }
      self.actionLoadingId = targetUserId
      api.toggleFollow(targetUserId)
        .then(function(result) {
          item.active = !!result.active
          self.statusText = '关注状态已更新。'
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
          }
          uni.showToast({ title: error.message || '关注状态更新失败', icon: 'none' })
        })
        .finally(function() {
          self.actionLoadingId = ''
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
.like-card {
  margin-top: 16rpx;
}
</style>
