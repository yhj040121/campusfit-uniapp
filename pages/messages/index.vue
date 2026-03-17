<template>
  <view class="page-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看消息通知</view>
      <view class="hero-copy">登录后将同步互动提醒、收益通知和合作邀约。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="page-title">消息通知</view>
        <view class="page-desc">查看来自真实后端的互动、系统和创作电商通知。</view>
      </view>

      <view class="panel-card">
        <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
      </view>

      <view class="chip-row" v-if="tabs.length > 1">
        <view v-for="item in tabs" :key="item" :class="['chip', currentTab === item ? 'chip-active' : 'chip-outline']" @click="currentTab = item">{{ item }}</view>
      </view>

      <view v-if="filtered.length">
        <view class="list-card" v-for="item in filtered" :key="item.id">
          <view class="cover-tag">{{ item.type }}</view>
          <view class="list-title" style="margin-top:16rpx;">{{ item.title }}</view>
          <view class="list-copy">{{ item.desc }}</view>
          <view class="list-meta">{{ item.time }}</view>
        </view>
      </view>

      <view v-else class="panel-card">
        <view class="section-title" style="margin-top:0;">暂无消息</view>
        <view class="text-copy">系统提醒、评论与合作通知将在这里展示。</view>
      </view>
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
      loggedIn: session.isLoggedIn(),
      tabs: ['全部'],
      currentTab: '全部',
      messages: [],
      statusText: '正在加载后端消息...'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.messages = []
      this.tabs = ['全部']
      this.currentTab = '全部'
      this.statusText = '当前以游客身份浏览。'
      return
    }
    this.loadMessages()
  },
  computed: {
    filtered: function() {
      if (this.currentTab === '全部') {
        return this.messages
      }
      var result = []
      for (var i = 0; i < this.messages.length; i += 1) {
        if (this.messages[i].type === this.currentTab) {
          result.push(this.messages[i])
        }
      }
      return result
    }
  },
  methods: {
    loadMessages: function() {
      var self = this
      api.listMessages()
        .then(function(list) {
          self.messages = list || []
          self.tabs = ['全部']
          for (var i = 0; i < self.messages.length; i += 1) {
            if (self.tabs.indexOf(self.messages[i].type) === -1) {
              self.tabs.push(self.messages[i].type)
            }
          }
          if (self.tabs.indexOf(self.currentTab) === -1) {
            self.currentTab = '全部'
          }
          self.statusText = '消息列表已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
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
          self.statusText = '后端消息数据暂时不可用。'
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
