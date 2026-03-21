<template>
  <view class="page-shell drafts-shell">
    <view class="page-header">
      <view class="campus-ribbon">草稿箱</view>
      <view class="page-title">把暂时没写完的内容先收进创作抽屉里</view>
      <view class="page-desc">草稿会同步保存到当前账号，你可以随时回到发布页继续编辑，不会打断当前的创作节奏。</view>
    </view>

    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看云端草稿</view>
      <view class="hero-copy">草稿箱已经接入账号同步，登录后就能跨设备继续编辑自己的内容。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else-if="drafts.length">
      <view class="section-head" style="margin-top:18rpx;">
        <view>
          <view class="section-title" style="margin-top:0;">账号草稿</view>
          <view class="section-subtitle">{{ statusText }}</view>
        </view>
        <view class="float-link" @click="refreshDrafts">刷新</view>
      </view>

      <view class="list-card draft-card" v-for="item in drafts" :key="item.id">
        <view class="list-title">{{ item.title }}</view>
        <view class="list-copy">{{ item.note }}</view>
        <view class="chip-row" style="margin-top:16rpx;">
          <view class="chip chip-outline" v-for="tag in item.tags" :key="tag">{{ tag }}</view>
        </view>
        <view class="meta-line">
          <view class="list-meta">{{ item.savedAt || '刚刚保存' }}</view>
          <view class="float-link" @click="continueEdit(item)">继续编辑</view>
        </view>
        <view class="divider-line"></view>
        <view class="meta-line" style="margin-top:0;">
          <view class="list-meta">已同步到当前账号</view>
          <view class="float-link" @click="removeDraft(item)">{{ actionLoadingId === item.id ? '删除中...' : '删除草稿' }}</view>
        </view>
      </view>
    </view>

    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">{{ listFailed ? '草稿箱暂时不可用' : (listLoading ? '正在加载草稿...' : '还没有保存草稿') }}</view>
      <view class="text-copy">{{ statusText }}</view>
      <button v-if="listFailed" class="btn-primary" style="margin-top:20rpx;" @click="refreshDrafts">重新加载</button>
      <button v-else class="btn-primary" style="margin-top:20rpx;" @click="goPublish">去发布页</button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

var ACTIVE_DRAFT_KEY = 'campusfit_active_draft_id'
var EDIT_POST_KEY = 'campusfit_edit_post_id'

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      drafts: [],
      statusText: '正在加载草稿...',
      listLoading: false,
      listFailed: false,
      actionLoadingId: ''
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.drafts = []
      this.listLoading = false
      this.listFailed = false
      this.statusText = '请登录后查看已同步到账号的草稿。'
      return
    }
    this.loadDrafts()
  },
  methods: {
    loadDrafts: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
      api.listDrafts()
        .then(function(list) {
          self.drafts = list || []
          self.statusText = self.drafts.length
            ? '共 ' + self.drafts.length + ' 条草稿，已同步到当前账号。'
            : '可以在发布页先保存一版内容，再回到这里继续补图、改文案或调整标签。'
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.drafts = []
            self.statusText = '登录已过期，请重新登录后查看草稿。'
            return
          }
          self.drafts = []
          self.listFailed = true
          self.statusText = '草稿列表暂时不可用，请稍后重试。'
        })
        .finally(function() {
          self.listLoading = false
        })
    },
    refreshDrafts: function() {
      if (!this.loggedIn) {
        this.goLogin()
        return
      }
      this.loadDrafts()
      uni.showToast({ title: '正在刷新草稿箱', icon: 'none' })
    },
    continueEdit: function(item) {
      if (!item || !item.id || this.actionLoadingId) {
        return
      }
      uni.removeStorageSync(EDIT_POST_KEY)
      uni.setStorageSync(ACTIVE_DRAFT_KEY, item.id)
      uni.showToast({ title: '正在返回发布页', icon: 'none' })
      setTimeout(function() {
        uni.switchTab({ url: '/pages/publish/index' })
      }, 300)
    },
    removeDraft: function(item) {
      var self = this
      if (!item || !item.id || self.actionLoadingId) {
        return
      }
      self.actionLoadingId = item.id
      api.deleteDraft(item.id)
        .then(function() {
          if (uni.getStorageSync(ACTIVE_DRAFT_KEY) === item.id) {
            uni.removeStorageSync(ACTIVE_DRAFT_KEY)
          }
          self.drafts = self.drafts.filter(function(draft) {
            return draft.id !== item.id
          })
          self.statusText = self.drafts.length
            ? '共 ' + self.drafts.length + ' 条草稿，已同步到当前账号。'
            : '可以在发布页先保存一版内容，再回到这里继续补图、改文案或调整标签。'
          uni.showToast({ title: '草稿已删除', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.drafts = []
            self.statusText = '登录已过期，请重新登录后继续操作。'
            return
          }
          uni.showToast({ title: error.message || '删除草稿失败', icon: 'none' })
        })
        .finally(function() {
          self.actionLoadingId = ''
        })
    },
    goPublish: function() {
      uni.switchTab({ url: '/pages/publish/index' })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style>
.draft-card {
  margin-top: 18rpx;
}
</style>
