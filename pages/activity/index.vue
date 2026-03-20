<template>
  <view class="page-shell activity-shell">
    <view class="page-header">
      <view class="campus-ribbon">活动中心</view>
      <view class="page-title">把校园活动和内容增长绑定在一起</view>
      <view class="page-desc">这里收纳热门专题、挑战赛和预算计划。你可以先报名参与，再把内容绑定到活动里发布。</view>
    </view>

    <view class="hero-card activity-hero">
      <view class="hero-badge">本期重点</view>
      <view class="hero-title">活动是内容增长和激励的统一入口</view>
      <view class="hero-copy">根据交付文档里的业务闭环，我们把活动入口放在前台，让用户更直观地理解“浏览内容 - 参与活动 - 获得激励”的路径。</view>
      <view class="hero-card-row">
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">{{ activities.length }}</text>
          <text class="hero-card-pill-label">活动专题</text>
        </view>
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">{{ myStats.joinedCount }}</text>
          <text class="hero-card-pill-label">已参与</text>
        </view>
      </view>
    </view>

    <view class="filter-summary-card">
      <view class="summary-kicker">选择状态</view>
      <view class="summary-line">{{ selectedActivity ? '当前已绑定活动：' + selectedActivity.title : '当前还没有绑定活动，可以先报名或直接选择。' }}</view>
      <view class="summary-line">如果你是从发布页进入，这里选择后会自动带回发布工作台。</view>
    </view>

    <view :class="['status-banner', activityStateClass]">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">活动模块状态</view>
          <view class="status-banner-copy">{{ activityStateText }}</view>
        </view>
        <view class="status-link" @click="manualRefresh">刷新状态</view>
      </view>
      <view class="status-grid two-col">
        <view class="status-item">
          <view class="status-item-label">活动数量</view>
          <text class="status-item-value">{{ activities.length }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">已报名</view>
          <text class="status-item-value">{{ myStats.joinedCount }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">进入方式</view>
          <text class="status-item-value">{{ fromPublish ? '发布页选择' : '普通浏览' }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">当前模式</view>
          <text class="status-item-value">{{ sessionLabel }}</text>
        </view>
      </view>
    </view>

    <view class="section-head">
      <view>
        <view class="section-title" style="margin-top:0;">活动列表</view>
        <view class="section-subtitle">先补齐前端活动模块，不依赖后端也能完整演示</view>
      </view>
      <view class="float-link" @click="goMyActivities">我的活动</view>
    </view>

    <view v-if="activityLoading">
      <view class="skeleton-card" v-for="item in 2" :key="'activity-skeleton-' + item">
        <view class="skeleton-block"></view>
        <view class="skeleton-line medium"></view>
        <view class="skeleton-line"></view>
      </view>
    </view>

    <view v-else-if="activities.length">
      <view class="look-card activity-card" v-for="item in activities" :key="item.id">
        <view class="look-cover activity-cover">
          <view class="cover-top">
            <view class="cover-tag">{{ item.badge }}</view>
            <view :class="['side-pill', item.joined ? 'side-pill-active' : '']">{{ item.status }}</view>
          </view>
          <view class="cover-title">{{ item.title }}</view>
          <view class="cover-copy">{{ item.summary }}</view>
        </view>

        <view class="activity-meta">
          <view class="mini-tag">{{ item.period }}</view>
          <view class="mini-tag">{{ item.scene }}</view>
        </view>

        <view class="note-box">{{ item.theme }}</view>
        <view class="note-box">参与条件：{{ item.participation }}</view>
        <view class="note-box">活动激励：{{ item.reward }}</view>

        <view class="meta-line">
          <view class="list-meta">{{ item.progressText }}</view>
          <view class="list-meta">{{ item.statusCopy }}</view>
        </view>

        <view class="btn-row">
          <button
            class="btn-secondary btn-half"
            :class="actionLoadingId === item.id ? 'btn-disabled' : ''"
            :disabled="actionLoadingId === item.id"
            @click="toggleJoin(item)"
          >
            {{ item.joined ? '退出活动' : '报名活动' }}
          </button>
          <button
            class="btn-primary btn-half"
            :class="actionLoadingId === item.id ? 'btn-disabled' : ''"
            :disabled="actionLoadingId === item.id"
            @click="selectForPublish(item)"
          >
            绑定到发布
          </button>
        </view>
      </view>
    </view>

    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">暂时还没有可展示的活动</view>
      <view class="text-copy">你可以先刷新一次本地活动状态，或者稍后再回来查看。</view>
    </view>
  </view>
</template>

<script>
var session = require('../../common/session.js')
var activity = require('../../common/activity.js')

export default {
  data: function() {
    return {
      fromPublish: false,
      activities: [],
      selectedActivity: null,
      activityLoading: false,
      actionLoadingId: '',
      myStats: {
        joinedCount: 0,
        ongoingCount: 0
      }
    }
  },
  computed: {
    activityStateClass: function() {
      return this.activityLoading ? 'status-banner-warning' : 'status-banner-success'
    },
    activityStateText: function() {
      if (this.activityLoading) {
        return '正在同步本地活动状态和发布绑定关系。'
      }
      if (this.fromPublish) {
        return '你是从发布页进入的，选择活动后会自动返回发布工作台。'
      }
      return '活动中心已经准备就绪，可继续报名、浏览或绑定到发布内容。'
    },
    sessionLabel: function() {
      return session.isLoggedIn() ? '已登录' : '游客'
    }
  },
  onLoad: function(options) {
    this.fromPublish = !!(options && String(options.pick || '') === '1')
  },
  onShow: function() {
    this.refreshState()
  },
  methods: {
    refreshState: function() {
      this.activityLoading = true
      this.activities = activity.listActivities()
      this.selectedActivity = activity.getSelectedActivity()
      this.myStats = activity.getMyActivityStats()
      this.activityLoading = false
    },
    toggleJoin: function(item) {
      var self = this
      if (self.actionLoadingId) {
        return
      }
      if (!session.isLoggedIn()) {
        this.promptLogin('登录后才能参与活动与获得活动激励。')
        return
      }
      self.actionLoadingId = item.id
      var result = activity.toggleJoin(item.id)
      this.refreshState()
      uni.showToast({ title: result.active ? '已报名活动' : '已退出活动', icon: 'none' })
      setTimeout(function() {
        self.actionLoadingId = ''
      }, 120)
    },
    selectForPublish: function(item) {
      var self = this
      if (self.actionLoadingId) {
        return
      }
      if (!session.isLoggedIn()) {
        this.promptLogin('登录后才能把内容绑定到活动中。')
        return
      }
      self.actionLoadingId = item.id
      activity.selectActivity(item.id)
      this.refreshState()
      uni.showToast({ title: '已绑定到发布页', icon: 'none' })
      if (this.fromPublish) {
        setTimeout(function() {
          uni.switchTab({ url: '/pages/publish/index' })
        }, 260)
      } else {
        setTimeout(function() {
          self.actionLoadingId = ''
        }, 120)
      }
    },
    goMyActivities: function() {
      uni.navigateTo({ url: '/pages/my-activity/index' })
    },
    manualRefresh: function() {
      this.refreshState()
      uni.showToast({ title: '已刷新活动状态', icon: 'none' })
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

<style scoped>
.activity-card {
  margin-top: 18rpx;
}

.activity-cover {
  min-height: 248rpx;
}

.cover-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.activity-meta {
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
