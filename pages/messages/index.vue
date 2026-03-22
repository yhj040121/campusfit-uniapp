<template>
  <view class="page-shell message-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看你的消息通知</view>
      <view class="hero-copy">互动提醒、评论动态、活动通知和公告更新都会汇总到这里，方便你统一查看。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">消息中心</view>
        <view class="page-title">把互动、系统和活动提醒放进同一个收件箱</view>
        <view class="page-desc">消息支持按类型筛选，也支持单条删除、删除已读和全部设为已读，让首页和我的页红点状态保持同步。</view>
      </view>

      <view class="hero-card message-hero">
        <view class="hero-badge">未读提醒</view>
        <view class="hero-title">当前还有 {{ unreadCount }} 条未读</view>
        <view class="hero-copy">{{ heroStatusText }}</view>
        <view class="hero-card-row">
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">{{ messages.length }}</text>
            <text class="hero-card-pill-label">全部消息</text>
          </view>
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">{{ heroUnreadCount }}</text>
            <text class="hero-card-pill-label">未读消息</text>
          </view>
        </view>
      </view>

      <view class="section-head">
        <view>
          <view class="section-title" style="margin-top:0;">消息分类</view>
          <view class="section-subtitle">点击标签切换你关心的消息类型</view>
        </view>
        <view class="float-link" @click="refreshMessages">刷新消息</view>
      </view>

      <view class="message-toolbar">
        <view
          class="float-link"
          :class="markingAll ? 'btn-disabled' : ''"
          @click="markAllRead"
        >
          {{ markAllLabel }}
        </view>
        <view
          class="float-link message-toolbar-danger"
          :class="deletingRead ? 'btn-disabled' : ''"
          @click="confirmDeleteRead"
        >
          {{ deleteReadLabel }}
        </view>
      </view>

      <view class="chip-row" v-if="tabs.length > 1">
        <view
          v-for="item in tabs"
          :key="item"
          :class="['chip', currentTab === item ? 'chip-active' : 'chip-outline']"
          @click="currentTab = item"
        >
          {{ item }}
        </view>
      </view>

      <view v-if="listLoading">
        <view class="skeleton-card" v-for="item in 2" :key="'message-skeleton-' + item">
          <view class="skeleton-block"></view>
          <view class="skeleton-line medium"></view>
          <view class="skeleton-line"></view>
        </view>
      </view>

      <view v-else-if="listFailed" class="status-banner status-banner-error">
        <view class="status-banner-head">
          <view>
            <view class="status-banner-title">消息接口暂时不可用</view>
            <view class="status-banner-copy">接口失败时，这里会提供重试入口，避免消息区直接空白。</view>
          </view>
          <view class="status-link" @click="refreshMessages">重新加载</view>
        </view>
      </view>

      <view v-else-if="filtered.length">
        <view class="list-card message-card" v-for="item in filtered" :key="item.id" @click="markRead(item)">
          <view class="meta-line" style="margin-top:0; align-items:flex-start;">
            <view :class="['side-pill', item.read ? '' : 'side-pill-active']">{{ item.read ? '已读' : '未读' }}</view>
            <view class="list-meta">{{ item.time }}</view>
          </view>
          <view class="list-title" style="margin-top:18rpx;">{{ item.title }}</view>
          <view class="list-copy">{{ item.desc }}</view>
          <view class="message-footer">
            <view class="mini-tag">{{ item.type }}</view>
            <view class="message-action-group">
              <view class="float-link" :class="activeMessageId === item.id ? 'btn-disabled' : ''">{{ item.read ? '已同步' : '点按后设为已读' }}</view>
              <view
                class="float-link message-delete-link"
                :class="deletingMessageId === item.id ? 'btn-disabled' : ''"
                @click.stop="confirmDeleteMessage(item)"
              >
                {{ deletingMessageId === item.id ? '删除中...' : '删除消息' }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="panel-card">
        <view class="section-title" style="margin-top:0;">当前分类暂无消息</view>
        <view class="text-copy">可以切换到其他分类，或者稍后再回来查看。</view>
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
      return this.readCount > 0 ? '删除已读' : '暂无已读'
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
        uni.showToast({ title: '已经全部读完啦', icon: 'none' })
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
        title: '删除已读消息',
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
  padding-top: 10rpx;
}

.message-shell .page-header {
  display: none;
}

.message-hero {
  margin-top: 0;
  padding: 18rpx 18rpx;
  border-radius: 28rpx;
}

.message-hero .hero-badge {
  padding: 8rpx 14rpx;
  font-size: 18rpx;
}

.message-hero .hero-title {
  margin-top: 10rpx;
  font-size: 36rpx;
  line-height: 1.14;
}

.message-hero .hero-copy {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.45;
}

.message-hero .hero-card-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.message-hero .hero-card-pill {
  flex: 0 0 auto;
  min-height: 0;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.12);
}

.message-hero .hero-card-pill-value,
.message-hero .hero-card-pill-label {
  display: inline-block;
  color: rgba(255, 255, 255, 0.92);
  font-size: 20rpx;
  line-height: 1;
}

.message-hero .hero-card-pill-label {
  margin-top: 0;
  margin-left: 8rpx;
}

.message-shell .section-head {
  align-items: center;
}

.message-shell .section-subtitle {
  display: none;
}

.message-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin: 10rpx 0 14rpx;
}

.message-toolbar-danger,
.message-delete-link {
  color: var(--campus-danger);
}

.message-card {
  margin-top: 14rpx;
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-top: 14rpx;
}

.message-action-group {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex-wrap: wrap;
  justify-content: flex-end;
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
</style>
