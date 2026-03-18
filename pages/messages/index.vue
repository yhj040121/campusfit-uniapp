<template>
  <view class="page-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看消息通知</view>
      <view class="hero-copy">互动提醒、合作邀约、收益通知都会在这里更新。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="page-title">消息通知</view>
        <view class="page-desc">查看系统、互动、评论与合作相关的最新动态。</view>
      </view>

      <view class="panel-card">
        <view class="meta-line" style="margin-top:0; align-items:flex-start;">
          <view>
            <view class="text-main" style="margin-top:0;">未读消息 {{ unreadCount }} 条</view>
            <view class="text-copy">{{ statusText }}</view>
          </view>
          <view v-if="unreadCount" class="float-link" @click="markAllRead">全部设为已读</view>
        </view>
      </view>

      <view class="chip-row" v-if="tabs.length > 1">
        <view
          v-for="item in tabs"
          :key="item"
          :class="['chip', currentTab === item ? 'chip-active' : 'chip-outline']"
          @click="currentTab = item"
        >
          {{ item }}
        </view>
      </view>

      <view v-if="filtered.length">
        <view class="list-card" v-for="item in filtered" :key="item.id" @click="markRead(item)">
          <view class="meta-line" style="margin-top:0;">
            <view :class="['cover-tag', item.read ? '' : 'side-pill-active']">{{ item.read ? '已读' : '未读' }}</view>
            <view class="meta-school">{{ item.time }}</view>
          </view>
          <view class="list-title" style="margin-top:16rpx;">{{ item.title }}</view>
          <view class="list-copy">{{ item.desc }}</view>
          <view class="text-copy">{{ item.type }}</view>
        </view>
      </view>

      <view v-else class="panel-card">
        <view class="section-title" style="margin-top:0;">暂无消息</view>
        <view class="text-copy">你收到的系统提醒和互动消息会展示在这里。</view>
      </view>
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
      loggedIn: session.isLoggedIn(),
      tabs: ['全部'],
      currentTab: '全部',
      messages: [],
      statusText: '正在加载后端消息...'
    }
  },
  computed: {
    filtered: function() {
      if (this.currentTab === '全部') {
        return this.messages
      }
      return this.messages.filter(function(item) {
        return item.type === this.currentTab
      }, this)
    },
    unreadCount: function() {
      return this.messages.filter(function(item) {
        return !item.read
      }).length
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.messages = []
      this.tabs = ['全部']
      this.currentTab = '全部'
      this.statusText = '请登录后查看消息通知'
      return
    }
    this.loadMessages()
  },
  methods: {
    loadMessages: function() {
      var self = this
      api.listMessages()
        .then(function(list) {
          self.messages = list || []
          self.tabs = ['全部']
          self.messages.forEach(function(item) {
            if (self.tabs.indexOf(item.type) === -1) {
              self.tabs.push(item.type)
            }
          })
          if (self.tabs.indexOf(self.currentTab) === -1) {
            self.currentTab = '全部'
          }
          self.statusText = '消息已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.messages = []
            self.tabs = ['全部']
            self.currentTab = '全部'
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          self.messages = []
          self.tabs = ['全部']
          self.currentTab = '全部'
          self.statusText = '后端消息服务暂时不可用。'
        })
    },
    markRead: function(item) {
      var self = this
      if (!item || item.read) {
        return
      }
      api.markMessageRead(item.id)
        .then(function(updated) {
          if (updated) {
            item.read = true
            self.statusText = '已标记为已读'
          }
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          uni.showToast({ title: error.message || '标记失败', icon: 'none' })
        })
    },
    markAllRead: function() {
      var self = this
      api.markAllMessagesRead()
        .then(function(count) {
          self.messages = self.messages.map(function(item) {
            item.read = true
            return item
          })
          self.statusText = '已将 ' + (count || 0) + '条' + ' 消息标记为已读'
          uni.showToast({ title: '操作成功', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          uni.showToast({ title: error.message || '操作失败', icon: 'none' })
        })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style>
</style>
