<template>
  <view class="page-shell my-activity-shell">
    <view v-if="!loggedIn" class="hero-card my-activity-hero">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看我的活动</view>
      <view class="hero-copy">你参与过的校园专题、挑战活动和当前绑定的发布活动，都会集中展示在这里。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">我的活动</view>
        <view class="page-title">查看我参与过的校园专题与挑战</view>
        <view class="page-desc">这里展示你已经报名的活动、当前绑定的发布专题，以及接下来可以继续参与的方向。</view>
      </view>

      <view class="hero-card my-activity-hero">
        <view class="hero-badge">活动参与概览</view>
        <view class="hero-title">把活动参与记录也收进个人中心</view>
        <view class="hero-copy">这部分根据交付文档补上前端模块，先用本地状态承接，后续接后端时可以直接延续结构。</view>
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

      <view class="status-banner status-banner-success">
        <view class="status-banner-head">
          <view>
            <view class="status-banner-title">我的活动状态</view>
            <view class="status-banner-copy">{{ activityStateText }}</view>
          </view>
          <view class="status-link" @click="manualRefresh">刷新</view>
        </view>
        <view class="status-grid two-col">
          <view class="status-item">
            <view class="status-item-label">已参与活动</view>
            <text class="status-item-value">{{ stats.joinedCount }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">进行中</view>
            <text class="status-item-value">{{ stats.ongoingCount }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">当前绑定</view>
            <text class="status-item-value">{{ selectedActivity ? '已选择' : '未选择' }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">展示来源</view>
            <text class="status-item-value">本地活动状态</text>
          </view>
        </view>
      </view>

      <view class="panel-card" v-if="selectedActivity">
        <view class="section-head" style="margin-top:0;">
          <view>
            <view class="text-main">当前发布绑定活动</view>
            <view class="section-subtitle">从发布页选择后会显示在这里</view>
          </view>
          <view class="note-stamp">SELECTED</view>
        </view>
        <view class="list-title" style="margin-top:16rpx;">{{ selectedActivity.title }}</view>
        <view class="list-copy">{{ selectedActivity.summary }}</view>
        <view class="btn-row">
          <button class="btn-secondary btn-half" @click="goActivityCenter">去活动中心</button>
          <button class="btn-ghost btn-half" @click="clearSelected">清除绑定</button>
        </view>
      </view>

      <view v-if="activities.length">
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
        <view class="text-copy">先去活动中心报名，再把内容和活动关联起来。</view>
        <button class="btn-primary" style="margin-top:20rpx;" @click="goActivityCenter">前往活动中心</button>
      </view>
    </view>
  </view>
</template>

<script>
var session = require('../../common/session.js')
var activity = require('../../common/activity.js')

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      activities: [],
      selectedActivity: null,
      stats: {
        joinedCount: 0,
        ongoingCount: 0
      }
    }
  },
  computed: {
    activityStateText: function() {
      if (this.activities.length) {
        return '你已经报名了 ' + this.activities.length + ' 个活动，可以继续去发布页绑定内容，或回到活动中心查看规则。'
      }
      return '目前还没有参与活动，去活动中心报名后，这里会自动同步展示。'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.activities = []
      this.selectedActivity = null
      this.stats = { joinedCount: 0, ongoingCount: 0 }
      return
    }
    this.refreshState()
  },
  methods: {    refreshState: function() {
      this.activities = activity.listMyActivities()
      this.selectedActivity = activity.getSelectedActivity()
      this.stats = activity.getMyActivityStats()
    },
    manualRefresh: function() {
      this.refreshState()
      uni.showToast({ title: '活动状态已刷新', icon: 'none' })
    },
    clearSelected: function() {
      activity.clearSelectedActivity()
      this.refreshState()
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
  background: rgba(87, 189, 240, 0.12);
  color: var(--campus-primary);
  font-size: 22rpx;
}
</style>

