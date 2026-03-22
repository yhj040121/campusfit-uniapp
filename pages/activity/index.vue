<template>
  <view class="page-shell activity-shell">
    <view class="hero-card activity-hero">
      <view class="activity-hero-head">
        <view class="hero-badge activity-hero-badge">活动中心</view>
      </view>
      <view class="hero-title activity-hero-title">先报名，再绑定到发布</view>
      <view class="hero-copy activity-hero-copy">把活动入口、报名状态和发布绑定放在同一页处理。</view>
      <view class="activity-hero-chips">
        <view class="activity-hero-chip">{{ activities.length }} 专题</view>
        <view class="activity-hero-chip">{{ myStats.joinedCount }} 已参与</view>
      </view>
    </view>

    <view v-if="selectedActivity || fromPublish" class="panel-card activity-inline-card">
      <view class="activity-inline-copy">
        {{ selectedActivity ? '当前已选择活动：' + selectedActivity.title : '当前从发布页进入，选择活动后会自动返回发布页。' }}
      </view>
      <view class="float-link" @click="manualRefresh">刷新活动</view>
    </view>

    <view class="section-head">
      <view class="section-title" style="margin-top:0;">活动列表</view>
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
      <view class="text-copy">你可以稍后再回来查看，也可以先去首页继续浏览穿搭内容。</view>
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
      fromPublish: false,
      activities: [],
      selectedActivity: null,
      activityLoading: false,
      actionLoadingId: '',
      pageError: false,
      myStats: defaultStats()
    }
  },
  computed: {},
  onLoad: function(options) {
    this.fromPublish = !!(options && String(options.pick || '') === '1')
  },
  onShow: function() {
    this.refreshState(false)
  },
  methods: {
    refreshState: function(showToast) {
      var self = this
      self.activityLoading = true
      self.pageError = false
      self.selectedActivity = activityStore.getSelectedActivity()

      var tasks = [api.listActivities()]
      if (session.isLoggedIn()) {
        tasks.push(api.getMyActivitySummary())
      } else {
        tasks.push(Promise.resolve(defaultStats()))
      }

      Promise.all(tasks)
        .then(function(result) {
          self.activities = result[0] || []
          self.myStats = result[1] || defaultStats()
          self.selectedActivity = activityStore.getSelectedActivity()
          self.pageError = false
          if (showToast) {
            uni.showToast({ title: '活动列表已刷新', icon: 'none' })
          }
        })
        .catch(function(error) {
          self.activities = []
          self.myStats = defaultStats()
          self.pageError = true
          if (showToast) {
            uni.showToast({ title: error.message || '活动加载失败', icon: 'none' })
          }
        })
        .finally(function() {
          self.activityLoading = false
        })
    },
    toggleJoin: function(item) {
      var self = this
      if (self.actionLoadingId) {
        return
      }
      if (!session.isLoggedIn()) {
        this.promptLogin('登录后才能参与活动和获得活动激励。')
        return
      }
      self.actionLoadingId = item.id
      api.toggleActivityJoin(item.id)
        .then(function(updated) {
          if (self.selectedActivity && self.selectedActivity.id === updated.id) {
            activityStore.selectActivity(updated)
            self.selectedActivity = activityStore.getSelectedActivity()
          }
          self.refreshState(false)
          uni.showToast({ title: updated.joined ? '已报名活动' : '已退出活动', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.promptLogin('登录状态已失效，请重新登录后再参与活动。')
            return
          }
          uni.showToast({ title: error.message || '活动操作失败', icon: 'none' })
        })
        .finally(function() {
          self.actionLoadingId = ''
        })
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
      activityStore.selectActivity(item)
      self.selectedActivity = activityStore.getSelectedActivity()
      uni.showToast({ title: '已绑定到发布页', icon: 'none' })
      if (this.fromPublish) {
        setTimeout(function() {
          uni.switchTab({ url: '/pages/publish/index' })
        }, 260)
      }
    },
    goMyActivities: function() {
      uni.navigateTo({ url: '/pages/my-activity/index' })
    },
    manualRefresh: function() {
      this.refreshState(true)
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
.activity-shell {
  padding-top: 10rpx;
}

.activity-hero {
  margin-top: 0;
  padding: 18rpx 18rpx;
  border-radius: 28rpx;
}

.activity-hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.activity-hero-badge {
  padding: 8rpx 14rpx;
  font-size: 18rpx;
}

.activity-hero-title {
  margin-top: 10rpx;
  font-size: 36rpx;
  line-height: 1.14;
}

.activity-hero-copy {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.45;
}

.activity-hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.activity-hero-chip {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.12);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
  font-size: 20rpx;
  font-weight: 700;
}

.activity-card {
  margin-top: 14rpx;
}

.activity-inline-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-top: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
}

.activity-inline-copy {
  flex: 1;
  color: var(--campus-text-soft);
  font-size: 22rpx;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(45, 87, 217, 0.12);
  background: rgba(45, 87, 217, 0.08);
  color: var(--campus-secondary);
  font-size: 20rpx;
}

.activity-card,
.activity-inline-card {
  border-color: rgba(43, 24, 34, 0.08);
}

.activity-inline-card {
  background:
    linear-gradient(135deg, rgba(201, 49, 91, 0.06), transparent 30%),
    linear-gradient(315deg, rgba(45, 87, 217, 0.06), transparent 36%),
    rgba(255, 250, 245, 0.94);
}

.activity-inline-copy {
  color: var(--campus-text);
}

.activity-cover {
  min-height: 244rpx;
  padding-top: 26rpx;
}

.cover-top {
  align-items: center;
}

.activity-meta {
  gap: 10rpx;
}

.mini-tag {
  border: 1rpx solid rgba(45, 87, 217, 0.12);
  background: rgba(45, 87, 217, 0.08);
  color: var(--campus-secondary);
}
</style>
