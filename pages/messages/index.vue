<template>
  <view class="page-shell message-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看你的消息通知</view>
      <view class="hero-copy">互动提醒、评论动态、活动通知和收益消息都会汇总到这里，方便你统一查看。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">消息中心</view>
        <view class="page-title">把互动、系统和收益提醒放进同一个收件箱</view>
        <view class="page-desc">消息支持按类型筛选，也支持单条已读和全部设为已读，让首页和我的页红点状态保持同步。</view>
      </view>

      <view class="hero-card message-hero">
        <view class="hero-badge">未读提醒</view>
        <view class="hero-title">当前还有 {{ unreadCount }} 条未读</view>
        <view class="hero-copy">{{ statusText }}</view>
        <view class="hero-card-row">
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">{{ messages.length }}</text>
            <text class="hero-card-pill-label">全部消息</text>
          </view>
          <view class="hero-card-pill">
            <text class="hero-card-pill-value">{{ unreadCount }}</text>
            <text class="hero-card-pill-label">未读消息</text>
          </view>
        </view>
      </view>

      <view :class="['status-banner', messageStateClass]">
        <view class="status-banner-head">
          <view>
            <view class="status-banner-title">消息页状态</view>
            <view class="status-banner-copy">{{ messageStateText }}</view>
          </view>
          <view class="status-link" @click="refreshMessages">刷新消息</view>
        </view>
        <view class="status-grid two-col">
          <view class="status-item">
            <view class="status-item-label">消息总数</view>
            <text class="status-item-value">{{ messages.length }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">未读数量</view>
            <text class="status-item-value">{{ unreadCount }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">当前分类</view>
            <text class="status-item-value">{{ currentTab }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">同步方式</view>
            <text class="status-item-value">实时更新</text>
          </view>
        </view>
      </view>

      <view class="section-head">
        <view>
          <view class="section-title" style="margin-top:0;">消息分类</view>
          <view class="section-subtitle">点击标签切换你关心的消息类型</view>
        </view>
        <view class="float-link" :class="markingAll ? 'btn-disabled' : ''" @click="markAllRead">{{ markAllLabel }}</view>
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
            <view class="float-link" :class="activeMessageId === item.id ? 'btn-disabled' : ''">{{ item.read ? '已同步' : '点按后设为已读' }}</view>
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
      statusText: '正在同步消息列表...',
      listLoading: false,
      listFailed: false,
      activeMessageId: '',
      markingAll: false
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
    markAllLabel: function() {
      if (this.markingAll) {
        return '处理中...'
      }
      return this.unreadCount > 0 ? '全部设为已读' : '全部已读'
    },
    messageStateClass: function() {
      if (this.listLoading || this.markingAll) {
        return 'status-banner-warning'
      }
      if (this.listFailed) {
        return 'status-banner-error'
      }
      return 'status-banner-success'
    },
    messageStateText: function() {
      if (this.listLoading) {
        return '正在同步消息列表和未读状态。'
      }
      if (this.markingAll) {
        return '正在批量处理消息已读状态，请稍候。'
      }
      if (this.listFailed) {
        return '当前未能加载消息列表，建议刷新后重试。'
      }
      if (!this.messages.length) {
        return '消息中心已连接完成，当前没有新的提醒。'
      }
      return '消息列表状态正常，可继续筛选、单条已读或全部已读。'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.messages = []
      this.tabs = ['全部']
      this.currentTab = '全部'
      this.listLoading = false
      this.listFailed = false
      this.statusText = '登录后即可同步你的个人消息。'
      return
    }
    this.loadMessages()
  },
  methods: {
    loadMessages: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
      api.listMessages()
        .then(function(list) {
          self.messages = list || []
          self.tabs = ['全部']
          self.messages.forEach(function(item) {
            if (self.tabs.indexOf(item.type) === -1) {
              self.tabs.push(item.type)
            }
          })
          if (self.tabs.indexOf(self.currentTab) === -1) {
            self.currentTab = '全部'
          }
          self.statusText = '消息列表已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
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
          self.statusText = '后端消息接口暂时不可用。'
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
      if (!item || item.read || self.activeMessageId || self.markingAll) {
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
      if (self.markingAll) {
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
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style>
.message-card {
  margin-top: 16rpx;
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
