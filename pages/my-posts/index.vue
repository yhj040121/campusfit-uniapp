<template>
  <view class="page-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看我的发布</view>
      <view class="hero-copy">你的发布列表属于个人创作者账号。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="page-title">我的发布</view>
        <view class="page-desc">管理已发布的穿搭内容，并查看互动表现。</view>
      </view>

      <view class="panel-card">
        <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
      </view>

      <view v-if="posts.length">
        <view class="look-card" v-for="item in posts" :key="item.id">
          <view class="look-cover" @click="goDetail(item.id)">
            <view class="cover-tag">{{ item.coverTag }}</view>
            <view class="cover-title">{{ item.title }}</view>
            <view class="cover-copy">{{ item.subtitle }}</view>
          </view>
          <view class="text-copy">{{ item.desc }}</view>
          <view class="meta-line">
            <view class="stats-line">
              <view class="stat-text">点赞 {{ item.likes }}</view>
              <view class="stat-text">评论 {{ item.comments }}</view>
              <view class="stat-text">收藏 {{ item.saves }}</view>
            </view>
            <view class="side-pill">已发布</view>
          </view>
          <view class="btn-row" style="margin-top:18rpx;">
            <button class="btn-secondary btn-half" @click.stop="startEdit(item)">编辑内容</button>
            <button class="btn-ghost btn-half" @click.stop="confirmDelete(item)">删除内容</button>
          </view>
        </view>
      </view>

      <view v-else class="panel-card">
        <view class="section-title" style="margin-top:0;">暂无发布内容</view>
        <view class="text-copy">发布第一条校园穿搭后，将显示在这里。</view>
        <button class="btn-primary" style="margin-top:20rpx;" @click="goPublish">去发布</button>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

var EDIT_POST_KEY = 'campusfit_edit_post_id'

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      posts: [],
      statusText: '正在加载我的发布...'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.posts = []
      this.statusText = '请登录后查看我的发布'
      return
    }
    this.loadMine()
  },
  methods: {
    loadMine: function() {
      var self = this
      api.listMyPosts()
        .then(function(list) {
          self.posts = list || []
          self.statusText = '发布列表已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.posts = []
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          self.posts = []
          self.statusText = '后端发布列表暂时不可用。'
        })
    },
    goDetail: function(id) {
      uni.navigateTo({ url: '/pages/detail/index?id=' + id })
    },
    goPublish: function() {
      uni.switchTab({ url: '/pages/publish/index' })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    startEdit: function(item) {
      uni.setStorageSync(EDIT_POST_KEY, item.id)
      uni.switchTab({ url: '/pages/publish/index' })
    },
    confirmDelete: function(item) {
      var self = this
      uni.showModal({
        title: '删除确认',
        content: '确认删除《' + item.title + '》吗？删除后将不再展示。',
        confirmText: '确认删除',
        cancelText: '取消',
        success: function(result) {
          if (result.confirm) {
            self.deletePost(item)
          }
        }
      })
    },
    deletePost: function(item) {
      var self = this
      api.deletePost(item.id)
        .then(function() {
          self.posts = self.posts.filter(function(post) {
            return post.id !== item.id
          })
          self.statusText = '已删除《' + item.title + '》'
          uni.showToast({ title: '删除成功', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.posts = []
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          uni.showToast({ title: error.message || '删除失败', icon: 'none' })
        })
    }
  }
}
</script>

<style>
</style>
