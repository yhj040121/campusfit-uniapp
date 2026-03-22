<template>
  <view class="page-shell follows-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看关注与粉丝</view>
      <view class="hero-copy">这里会集中展示你关注的人和关注你的用户，方便继续互动和建立校园穿搭连接。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">社交关系</view>
        <view class="page-title">关注与粉丝都放进同一块关系面板里管理</view>
        <view class="page-desc">你可以切换查看关注列表与粉丝列表，并在这里继续关注你感兴趣的校园穿搭创作者。</view>
      </view>

      <view class="section-head" style="margin-top:18rpx;">
        <view>
          <view class="section-title" style="margin-top:0;">关系列表</view>
          <view class="section-subtitle">切换查看关注和粉丝，继续建立内容连接</view>
        </view>
        <view class="float-link" @click="refreshCurrentTab">刷新列表</view>
      </view>

      <view class="chip-row">
        <view :class="['chip', tab === 'following' ? 'chip-active' : 'chip-outline']" @click="changeTab('following')">关注</view>
        <view :class="['chip', tab === 'fans' ? 'chip-active' : 'chip-outline']" @click="changeTab('fans')">粉丝</view>
      </view>

      <view v-if="listLoading">
        <view class="skeleton-card" v-for="item in 2" :key="'follow-skeleton-' + item">
          <view class="skeleton-block"></view>
          <view class="skeleton-line medium"></view>
          <view class="skeleton-line"></view>
        </view>
      </view>

      <view v-else-if="listFailed" class="status-banner status-banner-error">
        <view class="status-banner-head">
          <view>
            <view class="status-banner-title">关系列表暂时不可用</view>
            <view class="status-banner-copy">当前未能同步关注或粉丝数据，可以手动刷新当前列表。</view>
          </view>
          <view class="status-link" @click="refreshCurrentTab">重新加载</view>
        </view>
      </view>

      <view v-else-if="currentList.length">
        <view class="list-card follow-card" v-for="item in currentList" :key="item.userId || item.id">
          <view class="list-row">
            <view class="meta-left">
              <view :class="['avatar', item.avatarClass, item.avatarUrl ? 'avatar-has-image' : '']">
                <image v-if="item.avatarUrl" class="avatar-image" :src="item.avatarUrl" mode="aspectFill"></image>
                <text v-else>{{ item.avatar }}</text>
              </view>
              <view>
                <view class="meta-name">{{ item.name }}</view>
                <view class="list-copy">{{ item.intro }}</view>
              </view>
            </view>
            <view :class="['side-pill', item.active ? 'side-pill-active' : '', actionLoadingId === (item.userId || item.id) ? 'btn-disabled' : '']" @click="toggle(item)">{{ buttonLabel(item) }}</view>
          </view>
        </view>
      </view>

      <view v-else class="panel-card">
        <view class="section-title" style="margin-top:0;">当前列表为空</view>
        <view class="text-copy">可以先去首页或详情页互动，慢慢建立自己的校园穿搭关系网络。</view>
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
      tab: 'following',
      following: [],
      fans: [],
      statusText: '正在加载关注与粉丝数据...',
      listLoading: false,
      listFailed: false,
      actionLoadingId: ''
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.following = []
      this.fans = []
      this.listLoading = false
      this.listFailed = false
      this.statusText = '请登录后查看关注与粉丝数据。'
      return
    }
    this.loadList(this.tab)
  },
  computed: {
    currentList: function() {
      return this.tab === 'following' ? this.following : this.fans
    }
  },
  methods: {
    changeTab: function(type) {
      if (this.tab === type && this.currentList.length) {
        return
      }
      this.tab = type
      this.loadList(type)
    },
    loadList: function(type) {
      var self = this
      self.listLoading = true
      self.listFailed = false
      api.listFollows(type)
        .then(function(list) {
          self[type] = list || []
          self.statusText = (type === 'following' ? '关注' : '粉丝') + '列表已更新。'
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.following = []
            self.fans = []
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          self[type] = []
          self.listFailed = true
          self.statusText = '当前列表暂时不可用，请稍后重试。'
        })
        .finally(function() {
          self.listLoading = false
        })
    },
    refreshCurrentTab: function() {
      if (!this.loggedIn) {
        this.goLogin()
        return
      }
      this.loadList(this.tab)
      uni.showToast({ title: '正在刷新关系列表', icon: 'none' })
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
    toggle: function(item) {
      var targetUserId = item.userId || item.id
      var self = this
      if (!targetUserId || this.isSelf(item) || self.actionLoadingId) {
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
          self.statusText = '关注状态更新失败，请稍后重试。'
        })
        .finally(function() {
          self.actionLoadingId = ''
        })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style>
.follows-shell {
  padding-top: 10rpx;
}

.follows-shell .page-header {
  display: none;
}

.follows-shell .section-head {
  align-items: center;
}

.follow-card {
  margin-top: 14rpx;
}
</style>
