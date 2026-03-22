<template>
  <view class="page-shell my-activity-shell">
    <view v-if="!loggedIn" class="hero-card my-activity-hero">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看我的活动</view>
      <view class="hero-copy">你参与过的校园专题、挑战活动，以及当前草稿绑定的活动，都会集中展示在这里。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">我的活动</view>
        <view class="page-title">查看我参与过的校园专题与挑战</view>
        <view class="page-desc">这里展示你已经报名的活动、正在参与的主题，以及当前草稿里准备绑定的活动。</view>
      </view>

      <view class="hero-card my-activity-hero">
        <view class="hero-badge">活动参与概览</view>
        <view class="hero-title">把活动记录也收进个人中心</view>
        <view class="hero-copy">活动参与度会和发布内容一起沉淀，方便你回顾专题、继续创作和查看成长轨迹。</view>
        <view class="hero-card-row">
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">{{ stats.joinedCount }}</text>
            <text class="hero-card-pill-label">已参与</text>
          </view>
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">{{ stats.ongoingCount }}</text>
            <text class="hero-card-pill-label">进行中</text>
          </view>
        </view>
      </view>

      <view class="panel-card selected-activity-card" v-if="selectedActivity">
        <view class="section-head" style="margin-top:0;">
          <view>
            <view class="text-main">当前已选活动</view>
            <view class="section-subtitle">如果你正从发布页返回，这里会显示最新绑定项</view>
          </view>
          <view class="float-link" @click="manualRefresh">刷新</view>
        </view>
        <view class="list-title" style="margin-top:16rpx;">{{ selectedActivity.title }}</view>
        <view class="list-copy">{{ selectedActivity.summary }}</view>
        <view class="chip-row" style="margin-top:16rpx;">
          <view class="chip chip-active">{{ selectedActivity.period }}</view>
          <view class="chip chip-outline">{{ selectedActivity.status }}</view>
        </view>
        <view class="btn-row">
          <button class="btn-secondary btn-half" @click="goActivityCenter">去活动中心</button>
          <button class="btn-ghost btn-half" @click="clearSelected">清除绑定</button>
        </view>
      </view>

      <view v-if="activityLoading">
        <view class="skeleton-card" v-for="item in 2" :key="'my-activity-skeleton-' + item">
          <view class="skeleton-block"></view>
          <view class="skeleton-line medium"></view>
          <view class="skeleton-line"></view>
        </view>
      </view>

      <view v-else-if="activities.length">
        <view class="list-card activity-item" v-for="item in activities" :key="item.id">
          <view class="meta-line" style="margin-top:0;">
            <view class="cover-tag">{{ item.badge }}</view>
            <view class="side-pill side-pill-active">{{ item.status }}</view>
          </view>
          <view class="list-title" style="margin-top:18rpx;">{{ item.title }}</view>
          <view class="list-copy">{{ item.theme }}</view>
          <view class="activity-info-row">
            <view class="mini-tag">{{ item.period }}</view>
            <view class="mini-tag">{{ item.progressText }}</view>
          </view>
        </view>
      </view>

      <view v-else class="panel-card">
        <view class="section-title" style="margin-top:0;">还没有参与任何活动</view>
        <view class="text-copy">先去活动中心报名，再把穿搭内容和活动关联起来。</view>
        <button class="btn-primary" style="margin-top:20rpx;" @click="goActivityCenter">前往活动中心</button>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var activityStore = require('../../common/activity.js')

function defaultStats() {
  return {
    joinedCount: 0,
    ongoingCount: 0
  }
}

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      activities: [],
      selectedActivity: null,
      stats: defaultStats(),
      activityLoading: false,
      pageError: false
    }
  },
  computed: {},
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.selectedActivity = activityStore.getSelectedActivity()
    if (!this.loggedIn) {
      this.activities = []
      this.stats = defaultStats()
      this.pageError = false
      return
    }
    this.refreshState(false)
  },
  methods: {
    refreshState: function(showToast) {
      var self = this
      self.activityLoading = true
      self.pageError = false
      Promise.all([api.listMyActivities(), api.getMyActivitySummary()])
        .then(function(result) {
          self.activities = result[0] || []
          self.stats = result[1] || defaultStats()
          self.selectedActivity = activityStore.getSelectedActivity()
          self.pageError = false
          if (showToast) {
            uni.showToast({ title: '活动状态已刷新', icon: 'none' })
          }
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.activities = []
            self.stats = defaultStats()
            return
          }
          self.activities = []
          self.stats = defaultStats()
          self.pageError = true
          if (showToast) {
            uni.showToast({ title: error.message || '活动加载失败', icon: 'none' })
          }
        })
        .finally(function() {
          self.activityLoading = false
        })
    },
    manualRefresh: function() {
      this.refreshState(true)
    },
    clearSelected: function() {
      activityStore.clearSelectedActivity()
      this.selectedActivity = null
      uni.showToast({ title: '已清除当前绑定活动', icon: 'none' })
    },
    goActivityCenter: function() {
      uni.navigateTo({ url: '/pages/activity/index' })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style scoped>
.activity-item {
  margin-top: 18rpx;
}

.activity-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.mini-tag {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(45, 87, 217, 0.12);
  background: rgba(45, 87, 217, 0.08);
  color: var(--campus-secondary);
  font-size: 22rpx;
}

.selected-activity-card {
  padding-top: 28rpx;
  background:
    linear-gradient(135deg, rgba(201, 49, 91, 0.06), transparent 30%),
    linear-gradient(315deg, rgba(45, 87, 217, 0.06), transparent 36%),
    rgba(255, 250, 245, 0.94);
}

.activity-item {
  border-color: rgba(43, 24, 34, 0.08);
}

.activity-info-row {
  gap: 12rpx;
}

.mini-tag {
  border: 1rpx solid rgba(45, 87, 217, 0.12);
  background: rgba(45, 87, 217, 0.08);
  color: var(--campus-secondary);
}

.my-activity-shell {
  padding-top: 10rpx;
}

.my-activity-shell .page-header {
  display: none;
}

.my-activity-hero {
  margin-top: 0;
  padding: 18rpx 18rpx;
  border-radius: 28rpx;
}

.my-activity-hero .hero-badge {
  padding: 8rpx 14rpx;
  font-size: 18rpx;
}

.my-activity-hero .hero-title {
  margin-top: 10rpx;
  font-size: 36rpx;
  line-height: 1.14;
}

.my-activity-hero .hero-copy {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.45;
}

.my-activity-hero .hero-card-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.my-activity-hero .hero-card-pill {
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.12);
}

.my-activity-hero .hero-card-pill-value,
.my-activity-hero .hero-card-pill-label {
  display: inline-block;
  color: rgba(255, 255, 255, 0.92);
  font-size: 20rpx;
  line-height: 1;
}

.my-activity-hero .hero-card-pill-label {
  margin-top: 0;
  margin-left: 8rpx;
}

.selected-activity-card {
  margin-top: 14rpx;
  padding-top: 28rpx;
}

.selected-activity-card .section-subtitle {
  display: none;
}

.selected-activity-card .btn-row {
  margin-top: 14rpx;
}

.activity-item {
  margin-top: 14rpx;
}

.activity-info-row {
  gap: 8rpx;
  margin-top: 14rpx;
}

.mini-tag {
  padding: 8rpx 14rpx;
  font-size: 20rpx;
}
</style>
