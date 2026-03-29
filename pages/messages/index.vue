<template>
  <view class="page-shell message-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看你的消息通知</view>
      <view class="hero-copy">互动提醒、评论动态、活动通知和公告更新都会汇总到这里，方便你统一查看。</view>
      <button class="btn-primary" style="margin-top: 24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="message-summary-card">
        <view class="message-summary-head">
          <view class="message-summary-copygroup">
            <view class="message-summary-kicker">消息中心</view>
            <view class="message-summary-title">{{ summaryTitle }}</view>
            <view class="message-summary-copy">{{ heroStatusText }}</view>
          </view>
          <view :class="['message-summary-badge', unreadCount ? 'message-summary-badge-active' : '']">
            {{ unreadBadgeText }}
          </view>
        </view>

        <view class="message-summary-metrics">
          <view class="message-summary-metric">
            <view class="message-summary-metric-value">{{ messages.length }}</view>
            <view class="message-summary-metric-label">全部</view>
          </view>
          <view class="message-summary-metric">
            <view class="message-summary-metric-value">{{ heroUnreadCount }}</view>
            <view class="message-summary-metric-label">未读</view>
          </view>
          <view class="message-summary-metric">
            <view class="message-summary-metric-value">{{ readCount }}</view>
            <view class="message-summary-metric-label">已读</view>
          </view>
        </view>

        <view class="message-toolbar">
          <view class="message-toolbar-button" @click="refreshMessages">刷新</view>
          <view
            :class="['message-toolbar-button', markingAll ? 'btn-disabled' : '']"
            @click="markAllRead"
          >
            {{ markAllLabel }}
          </view>
          <view
            :class="['message-toolbar-button', 'message-toolbar-button-danger', deletingRead ? 'btn-disabled' : '']"
            @click="confirmDeleteRead"
          >
            {{ deleteReadLabel }}
          </view>
        </view>
      </view>

      <view v-if="tabs.length > 1" class="message-tab-row">
        <view
          v-for="item in tabs"
          :key="item"
          :class="['message-tab-chip', currentTab === item ? 'message-tab-chip-active' : '']"
          @click="currentTab = item"
        >
          {{ item }}
        </view>
      </view>

      <view v-if="listLoading" class="message-list">
        <view v-for="item in 4" :key="'message-skeleton-' + item" class="message-skeleton-card"></view>
      </view>

      <view v-else-if="listFailed" class="message-state-card">
        <view class="message-state-title">消息列表暂时不可用</view>
        <view class="message-state-copy">当前接口请求失败，你可以稍后重试，也可以先回到别的页面继续浏览。</view>
        <view class="message-state-actions">
          <view class="message-state-button message-state-button-primary" @click="refreshMessages">重新加载</view>
        </view>
      </view>

      <view v-else-if="filtered.length" class="message-list">
        <view class="message-card" v-for="item in filtered" :key="item.id" @click="markRead(item)">
          <view class="message-card-head">
            <view class="message-card-meta">
              <view :class="['message-state-pill', item.read ? '' : 'message-state-pill-active']">
                {{ item.read ? '已读' : '未读' }}
              </view>
              <view class="message-type-pill">{{ item.type }}</view>
            </view>
            <view class="message-card-time">{{ item.time }}</view>
          </view>

          <view class="message-card-title">{{ item.title }}</view>
          <view class="message-card-copy">{{ item.desc }}</view>

          <view class="message-card-footer">
            <view class="message-card-hint">{{ item.read ? '消息已同步' : '点卡片后设为已读' }}</view>
            <view
              :class="['message-delete-link', deletingMessageId === item.id ? 'btn-disabled' : '']"
              @click.stop="confirmDeleteMessage(item)"
            >
              {{ deletingMessageId === item.id ? '删除中...' : '删除' }}
            </view>
          </view>
        </view>
      </view>

      <view v-else class="message-state-card">
        <view class="message-state-title">当前分类暂无消息</view>
        <view class="message-state-copy">可以切换到其他分类，或者稍后再回来看看。</view>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var settingsStore = require('../../common/settings.js')

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
      statusText: '正在加载消息列表...',
      listLoading: false,
      listFailed: false,
      activeMessageId: '',
      deletingMessageId: '',
      markingAll: false,
      deletingRead: false,
      settingMap: settingsStore.getSettingMap()
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
    },
    pushEnabled: function() {
      return this.settingMap.push !== false
    },
    heroUnreadCount: function() {
      return this.pushEnabled ? this.unreadCount : 0
    },
    heroStatusText: function() {
      return this.pushEnabled ? this.statusText : '消息推送已关闭，你仍然可以手动查看历史消息。'
    },
    readCount: function() {
      return this.messages.length - this.unreadCount
    },
    markAllLabel: function() {
      if (this.markingAll) {
        return '处理中...'
      }
      return this.unreadCount > 0 ? '全部设为已读' : '全部已读'
    },
    deleteReadLabel: function() {
      if (this.deletingRead) {
        return '删除中...'
      }
      return this.readCount > 0 ? '清理已读' : '暂无已读'
    },
    unreadBadgeText: function() {
      if (!this.unreadCount) {
        return '0'
      }
      return this.unreadCount > 99 ? '99+' : String(this.unreadCount)
    },
    summaryTitle: function() {
      if (!this.pushEnabled) {
        return '消息提醒当前已关闭'
      }
      if (!this.unreadCount) {
        return '现在没有未读消息'
      }
      return '你有 ' + this.unreadCount + ' 条未读消息'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.settingMap = settingsStore.getSettingMap()
    if (!this.loggedIn) {
      this.messages = []
      this.tabs = ['全部']
      this.currentTab = '全部'
      this.listLoading = false
      this.listFailed = false
      this.statusText = '登录后即可查看你的个人消息。'
      return
    }
    this.loadMessages()
  },
  methods: {
    syncTabs: function() {
      var nextTabs = ['全部']
      this.messages.forEach(function(item) {
        if (nextTabs.indexOf(item.type) === -1) {
          nextTabs.push(item.type)
        }
      })
      this.tabs = nextTabs
      if (nextTabs.indexOf(this.currentTab) === -1) {
        this.currentTab = '全部'
      }
    },
    loadMessages: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
      api.listMessages()
        .then(function(list) {
          self.messages = list || []
          self.syncTabs()
          self.statusText = '消息列表已更新。'
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.messages = []
            self.tabs = ['全部']
            self.currentTab = '全部'
            self.statusText = '登录已过期，请重新登录后查看消息。'
            return
          }
          self.messages = []
          self.tabs = ['全部']
          self.currentTab = '全部'
          self.listFailed = true
          self.statusText = '消息暂时不可用，请稍后再试。'
        })
        .finally(function() {
          self.listLoading = false
        })
    },
    refreshMessages: function() {
      if (!this.loggedIn) {
        this.goLogin()
        return
      }
      this.loadMessages()
      uni.showToast({ title: '正在刷新消息列表', icon: 'none' })
    },
    markRead: function(item) {
      var self = this
      if (!item || item.read || self.activeMessageId || self.markingAll || self.deletingMessageId || self.deletingRead) {
        return
      }
      self.activeMessageId = item.id
      api.markMessageRead(item.id)
        .then(function(updated) {
          if (updated) {
            item.read = true
            self.statusText = '消息已设为已读。'
          }
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.statusText = '登录已过期，请重新登录后查看消息。'
            return
          }
          uni.showToast({ title: error.message || '操作失败', icon: 'none' })
        })
        .finally(function() {
          self.activeMessageId = ''
        })
    },
    markAllRead: function() {
      var self = this
      if (self.markingAll || self.deletingRead) {
        return
      }
      if (!self.unreadCount) {
        uni.showToast({ title: '已经全部读完了', icon: 'none' })
        return
      }
      self.markingAll = true
      api.markAllMessagesRead()
        .then(function(count) {
          self.messages = self.messages.map(function(item) {
            item.read = true
            return item
          })
          self.statusText = '已将 ' + (count || 0) + ' 条消息设为已读。'
          uni.showToast({ title: '已全部设为已读', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.statusText = '登录已过期，请重新登录后查看消息。'
            return
          }
          uni.showToast({ title: error.message || '操作失败', icon: 'none' })
        })
        .finally(function() {
          self.markingAll = false
        })
    },
    confirmDeleteMessage: function(item) {
      var self = this
      if (!item || self.deletingMessageId || self.markingAll || self.deletingRead) {
        return
      }
      uni.showModal({
        title: '删除消息',
        content: '确认删除这条消息吗？删除后将不会再出现在消息中心。',
        confirmText: '确认删除',
        cancelText: '取消',
        success: function(result) {
          if (result.confirm) {
            self.deleteMessage(item)
          }
        }
      })
    },
    deleteMessage: function(item) {
      var self = this
      self.deletingMessageId = item.id
      api.deleteMessage(item.id)
        .then(function() {
          self.messages = self.messages.filter(function(current) {
            return current.id !== item.id
          })
          self.syncTabs()
          self.statusText = '消息已删除。'
          uni.showToast({ title: '删除成功', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.statusText = '登录已过期，请重新登录后查看消息。'
            return
          }
          uni.showToast({ title: error.message || '删除失败', icon: 'none' })
        })
        .finally(function() {
          self.deletingMessageId = ''
        })
    },
    confirmDeleteRead: function() {
      var self = this
      if (self.deletingRead || self.markingAll) {
        return
      }
      if (!self.readCount) {
        uni.showToast({ title: '当前没有已读消息', icon: 'none' })
        return
      }
      uni.showModal({
        title: '清理已读',
        content: '确认删除全部已读消息吗？未读消息会被保留。',
        confirmText: '确认删除',
        cancelText: '取消',
        success: function(result) {
          if (result.confirm) {
            self.deleteReadMessages()
          }
        }
      })
    },
    deleteReadMessages: function() {
      var self = this
      self.deletingRead = true
      api.deleteReadMessages()
        .then(function(count) {
          self.messages = self.messages.filter(function(item) {
            return !item.read
          })
          self.syncTabs()
          self.statusText = '已删除 ' + (count || 0) + ' 条已读消息。'
          uni.showToast({ title: '已删除已读消息', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.statusText = '登录已过期，请重新登录后查看消息。'
            return
          }
          uni.showToast({ title: error.message || '删除失败', icon: 'none' })
        })
        .finally(function() {
          self.deletingRead = false
        })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style>
.message-shell {
  min-height: 100vh;
  padding-top: 12rpx;
  padding-bottom: calc(96rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at top left, rgba(253, 210, 167, 0.2), transparent 32%),
    radial-gradient(circle at top right, rgba(68, 165, 255, 0.14), transparent 26%),
    linear-gradient(180deg, #f8fbff 0%, #f5f7fa 44%, #eef4fa 100%);
}

.message-summary-card,
.message-card,
.message-state-card {
  border-radius: 32rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24rpx 52rpx rgba(25, 52, 87, 0.07);
  backdrop-filter: blur(22rpx);
}

.message-summary-card {
  padding: 28rpx;
}

.message-summary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.message-summary-copygroup {
  flex: 1;
  min-width: 0;
}

.message-summary-kicker {
  color: #1f63ac;
  font-size: 22rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
}

.message-summary-title {
  margin-top: 10rpx;
  color: #24364a;
  font-size: 42rpx;
  font-weight: 800;
  line-height: 1.18;
}

.message-summary-copy {
  margin-top: 12rpx;
  color: #66768b;
  font-size: 24rpx;
  line-height: 1.6;
}

.message-summary-badge {
  min-width: 84rpx;
  height: 84rpx;
  padding: 0 18rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(235, 241, 248, 0.96);
  color: #6a7a8d;
  font-size: 28rpx;
  font-weight: 800;
  flex-shrink: 0;
}

.message-summary-badge-active {
  background: linear-gradient(135deg, #1f7cd8 0%, #46b0ff 100%);
  color: #edf7ff;
  box-shadow: 0 16rpx 34rpx rgba(31, 124, 216, 0.22);
}

.message-summary-metrics {
  margin-top: 22rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.message-summary-metric {
  padding: 18rpx 16rpx;
  border-radius: 24rpx;
  background: rgba(242, 247, 253, 0.96);
}

.message-summary-metric-value {
  color: #24364a;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1;
}

.message-summary-metric-label {
  margin-top: 8rpx;
  color: #7b8798;
  font-size: 20rpx;
  font-weight: 700;
}

.message-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.message-toolbar-button {
  min-height: 60rpx;
  padding: 0 20rpx;
  border-radius: 18rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(68, 165, 255, 0.1);
  color: #1f63ac;
  font-size: 22rpx;
  font-weight: 700;
}

.message-toolbar-button-danger {
  background: rgba(255, 235, 237, 0.96);
  color: #df4c63;
}

.message-tab-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 18rpx 0 4rpx;
}

.message-tab-chip {
  min-height: 58rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.84);
  border: 2rpx solid rgba(68, 165, 255, 0.12);
  color: #7a8698;
  font-size: 22rpx;
  font-weight: 700;
}

.message-tab-chip-active {
  background: linear-gradient(90deg, #005e9f 0%, #44a5ff 100%);
  border-color: transparent;
  color: #edf3ff;
  box-shadow: 0 14rpx 28rpx rgba(0, 94, 159, 0.16);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 18rpx;
}

.message-card {
  padding: 24rpx;
}

.message-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.message-card-meta {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-wrap: wrap;
}

.message-state-pill,
.message-type-pill {
  min-height: 44rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 19rpx;
  font-weight: 700;
}

.message-state-pill {
  background: rgba(233, 239, 247, 0.96);
  color: #6b7788;
}

.message-state-pill-active {
  background: rgba(68, 165, 255, 0.14);
  color: #1f63ac;
}

.message-type-pill {
  background: rgba(244, 246, 250, 0.96);
  color: #596579;
}

.message-card-time {
  color: #90a0b4;
  font-size: 20rpx;
  font-weight: 700;
  white-space: nowrap;
}

.message-card-title {
  margin-top: 16rpx;
  color: #24364a;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.3;
}

.message-card-copy {
  margin-top: 12rpx;
  color: #66768b;
  font-size: 24rpx;
  line-height: 1.6;
}

.message-card-footer {
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid rgba(117, 119, 120, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.message-card-hint {
  color: #90a0b4;
  font-size: 21rpx;
  font-weight: 700;
}

.message-delete-link {
  min-height: 48rpx;
  padding: 0 14rpx;
  border-radius: 14rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 235, 237, 0.96);
  color: #df4c63;
  font-size: 21rpx;
  font-weight: 700;
}

.message-state-card {
  margin-top: 18rpx;
  padding: 34rpx 28rpx;
}

.message-state-title {
  color: #24364a;
  font-size: 34rpx;
  font-weight: 800;
}

.message-state-copy {
  margin-top: 14rpx;
  color: #66768b;
  font-size: 24rpx;
  line-height: 1.65;
}

.message-state-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 22rpx;
}

.message-state-button {
  min-height: 72rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.message-state-button-primary {
  background: linear-gradient(90deg, #005e9f 0%, #44a5ff 100%);
  color: #edf3ff;
}

.message-skeleton-card {
  height: 188rpx;
  border-radius: 32rpx;
  background:
    linear-gradient(90deg, rgba(238, 243, 247, 0.88) 25%, rgba(248, 251, 255, 0.98) 37%, rgba(238, 243, 247, 0.88) 63%);
  background-size: 300% 100%;
  animation: messageShimmer 1.4s infinite linear;
}

.btn-disabled {
  opacity: 0.58;
}

@keyframes messageShimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
