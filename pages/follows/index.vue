<template>
  <view class="page-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看关注与粉丝</view>
      <view class="hero-copy">关注与粉丝数据属于个人社交资产，登录后才能查看并管理。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="page-title">关注与粉丝</view>
        <view class="page-desc">查看你已关注的创作者，以及关注你的校园用户。</view>
      </view>

      <view class="panel-card">
        <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
      </view>

      <view class="chip-row">
        <view :class="['chip', tab === 'following' ? 'chip-active' : 'chip-outline']" @click="changeTab('following')">关注</view>
        <view :class="['chip', tab === 'fans' ? 'chip-active' : 'chip-outline']" @click="changeTab('fans')">粉丝</view>
      </view>

      <view v-if="currentList.length">
        <view class="list-card" v-for="item in currentList" :key="item.userId || item.id">
          <view class="list-row">
            <view class="meta-left">
              <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
              <view>
                <view class="meta-name">{{ item.name }}</view>
                <view class="list-copy">{{ item.intro }}</view>
              </view>
            </view>
            <view :class="['side-pill', item.active ? 'side-pill-active' : '']" @click="toggle(item)">{{ buttonLabel(item) }}</view>
          </view>
        </view>
      </view>

      <view v-else class="panel-card">
        <view class="section-title" style="margin-top:0;">暂无用户</view>
        <view class="text-copy">当你关注创作者或获得新粉丝后，这里会自动更新。</view>
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
      tab: 'following',
      following: [],
      fans: [],
      statusText: '正在加载关注与粉丝数据...'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.following = []
      this.fans = []
      this.statusText = '请登录后查看关注与粉丝数据'
      return
    }
    this.loadList('following')
    this.loadList('fans')
  },
  computed: {
    currentList: function() {
      return this.tab === 'following' ? this.following : this.fans
    }
  },
  methods: {
    changeTab: function(type) {
      this.tab = type
      if ((type === 'following' && !this.following.length) || (type === 'fans' && !this.fans.length)) {
        this.loadList(type)
      }
    },
    loadList: function(type) {
      var self = this
      api.listFollows(type)
        .then(function(list) {
          self[type] = list || []
          self.statusText = '关注与粉丝列表已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
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
          self.statusText = '后端关注数据暂时不可用。'
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
    toggle: function(item) {
      var targetUserId = item.userId || item.id
      if (!targetUserId || this.isSelf(item)) {
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
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style>
</style>
