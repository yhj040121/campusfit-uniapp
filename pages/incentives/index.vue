<template>
  <view class="page-shell incentive-shell">
    <view v-if="!loggedIn" class="hero-card incentive-hero">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后查看创作激励与提现进度</view>
      <view class="hero-copy">这里会集中展示你的结算金额、待结算记录、提现申请状态，以及最近的激励明细。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">创作激励</view>
        <view class="page-title">把激励、结算和提现放到同一个工作台</view>
        <view class="page-desc">CampusFit 采用“商家推广费 -> 平台服务费 + 奖金池 -> 创作者激励”的模式。这里展示的是平台激励结算，不是电商成交佣金。</view>
      </view>

      <view v-if="pageLoading">
        <view class="skeleton-card" v-for="item in 3" :key="'incentive-skeleton-' + item">
          <view class="skeleton-block"></view>
          <view class="skeleton-line medium"></view>
          <view class="skeleton-line"></view>
        </view>
      </view>

      <view v-else-if="pageError" class="panel-card">
        <view class="section-title" style="margin-top:0;">激励中心暂时不可用</view>
        <view class="text-copy">接口失败时，这里会保留刷新入口，避免页面空白，也避免把默认值误看成真实余额。</view>
        <button class="btn-primary" style="margin-top:20rpx;" @click="loadCenter(true)">重新加载</button>
      </view>

      <view v-else>
        <view class="hero-card incentive-hero">
          <view class="hero-badge">激励总览</view>
          <view class="hero-title">{{ center.totalAmount }}</view>
          <view class="hero-copy">已结算金额可申请提现，待结算记录会在月结算完成后自动转入可提现余额。</view>
          <view class="hero-card-row">
            <view class="hero-card-pill">
              <text class="hero-card-pill-value">{{ center.settledCount }}</text>
              <text class="hero-card-pill-label">已结算笔数</text>
            </view>
            <view class="hero-card-pill">
              <text class="hero-card-pill-value">{{ center.pendingCount }}</text>
              <text class="hero-card-pill-label">待结算笔数</text>
            </view>
          </view>
        </view>

        <view class="status-grid two-col incentive-stats">
          <view class="status-item">
            <view class="status-item-label">可提现</view>
            <text class="status-item-value">{{ center.availableAmount }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">待结算</view>
            <text class="status-item-value">{{ center.pendingSettlementAmount }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">提现中</view>
            <text class="status-item-value">{{ center.pendingWithdrawAmount }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">已提现</view>
            <text class="status-item-value">{{ center.withdrawnAmount }}</text>
          </view>
        </view>

        <view class="panel-card withdraw-card">
          <view class="section-head" style="margin-top:0;">
            <view>
              <view class="section-title" style="margin-top:0;">提现申请</view>
              <view class="section-subtitle">首版采用平台审核后线下打款的模式，先把申请与进度跑通</view>
            </view>
            <view class="float-link" @click="loadCenter(true)">刷新</view>
          </view>
          <view class="withdraw-amount">{{ center.availableAmount }}</view>
          <view class="text-copy">{{ center.withdrawHint }}</view>
          <view class="note-box withdraw-note">
            本次会按当前可提现余额提交申请。若你刚收到新的结算，请先刷新页面，避免金额未同步。
          </view>
          <view class="btn-row">
            <button class="btn-primary btn-half" :class="withdrawDisabled ? 'btn-disabled' : ''" @click="submitWithdraw">{{ withdrawButtonText }}</button>
            <button class="btn-secondary btn-half" @click="goMessages">消息通知</button>
          </view>
        </view>

        <view class="panel-card" v-if="center.withdrawRequests.length">
          <view class="section-head" style="margin-top:0;">
            <view>
              <view class="section-title" style="margin-top:0;">提现进度</view>
              <view class="section-subtitle">申请记录会按时间倒序展示</view>
            </view>
          </view>
          <view class="list-card withdraw-request-item" v-for="item in center.withdrawRequests" :key="item.requestId">
            <view class="meta-line" style="margin-top:0;">
              <view :class="['side-pill', item.statusCode === 0 ? 'side-pill-active' : '']">{{ item.status }}</view>
              <view class="list-meta">{{ item.createdAt }}</view>
            </view>
            <view class="list-title" style="margin-top:16rpx;">{{ item.amount }}</view>
            <view class="list-copy">{{ item.remark }}</view>
            <view class="request-meta">
              <view class="mini-tag">申请时间 {{ item.createdAt }}</view>
              <view class="mini-tag" v-if="item.processedAt !== '-'">处理时间 {{ item.processedAt }}</view>
            </view>
          </view>
        </view>

        <view class="panel-card">
          <view class="section-head" style="margin-top:0;">
            <view>
              <view class="section-title" style="margin-top:0;">结算记录</view>
              <view class="section-subtitle">最近 20 条记录会展示在这里，便于回看内容表现与结算节奏</view>
            </view>
          </view>
          <view v-if="center.settlementRecords.length">
            <view class="list-card settlement-item" v-for="item in center.settlementRecords" :key="item.recordId">
              <view class="meta-line" style="margin-top:0;">
                <view :class="['side-pill', item.statusCode === 1 ? 'side-pill-active' : '']">{{ item.status }}</view>
                <view class="list-meta">{{ item.createdAt }}</view>
              </view>
              <view class="list-row" style="margin-top:18rpx;">
                <view class="settlement-main">
                  <view class="list-title">{{ item.type }}</view>
                  <view class="list-copy">{{ item.postTitle }}</view>
                </view>
                <view class="settlement-amount">{{ item.amount }}</view>
              </view>
            </view>
          </view>
          <view v-else class="panel-card settlement-empty">
            <view class="section-title" style="margin-top:0;">还没有激励记录</view>
            <view class="text-copy">当你的内容进入平台结算后，这里会展示对应的激励明细。</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

function buildDefaultCenter() {
  return {
    totalAmount: '¥0.00',
    availableAmount: '¥0.00',
    availableAmountRaw: '0.00',
    pendingSettlementAmount: '¥0.00',
    pendingWithdrawAmount: '¥0.00',
    withdrawnAmount: '¥0.00',
    settledCount: 0,
    pendingCount: 0,
    canWithdraw: false,
    withdrawHint: '当前暂无可提现余额，待结算记录会在月结算完成后自动转入可提现。',
    settlementRecords: [],
    withdrawRequests: []
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
      center: buildDefaultCenter(),
      pageLoading: false,
      pageError: false,
      submitting: false
    }
  },
  computed: {
    withdrawDisabled: function() {
      return !this.center.canWithdraw || this.submitting
    },
    withdrawButtonText: function() {
      if (this.submitting) {
        return '提交中...'
      }
      if (!this.center.canWithdraw) {
        return '当前不可提现'
      }
      return '申请提现'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    if (!this.loggedIn) {
      this.center = buildDefaultCenter()
      this.pageLoading = false
      this.pageError = false
      return
    }
    this.loadCenter(false)
  },
  methods: {
    loadCenter: function(showToast) {
      var self = this
      self.pageLoading = true
      self.pageError = false
      api.getMyIncentiveCenter()
        .then(function(result) {
          self.center = result || buildDefaultCenter()
          self.pageError = false
          if (showToast) {
            uni.showToast({ title: '激励状态已刷新', icon: 'none' })
          }
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.center = buildDefaultCenter()
            return
          }
          self.center = buildDefaultCenter()
          self.pageError = true
          if (showToast) {
            uni.showToast({ title: error.message || '激励加载失败', icon: 'none' })
          }
        })
        .finally(function() {
          self.pageLoading = false
        })
    },
    submitWithdraw: function() {
      var self = this
      if (self.withdrawDisabled) {
        return
      }
      uni.showModal({
        title: '提交提现申请',
        content: '将按当前可提现余额 ' + self.center.availableAmount + ' 提交申请，平台审核后会线下打款。是否继续？',
        success: function(result) {
          if (!result.confirm) {
            return
          }
          self.confirmWithdraw()
        }
      })
    },
    confirmWithdraw: function() {
      var self = this
      self.submitting = true
      api.requestIncentiveWithdraw(self.center.availableAmountRaw)
        .then(function() {
          uni.showToast({ title: '提现申请已提交', icon: 'none' })
          self.loadCenter(false)
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.center = buildDefaultCenter()
            return
          }
          uni.showToast({ title: error.message || '提交失败', icon: 'none' })
        })
        .finally(function() {
          self.submitting = false
        })
    },
    goMessages: function() {
      uni.navigateTo({ url: '/pages/messages/index' })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    }
  }
}
</script>

<style scoped>
.incentive-stats {
  margin-bottom: 20rpx;
}

.withdraw-card {
  margin-bottom: 22rpx;
}

.withdraw-amount {
  margin-top: 8rpx;
  color: var(--campus-text);
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1.18;
}

.withdraw-note {
  margin-top: 16rpx;
}

.withdraw-request-item,
.settlement-item {
  margin-top: 16rpx;
}

.request-meta {
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

.settlement-main {
  min-width: 0;
  padding-right: 20rpx;
  flex: 1;
}

.settlement-amount {
  color: var(--campus-text);
  font-size: 32rpx;
  font-weight: 700;
  white-space: nowrap;
}

.settlement-empty {
  margin-top: 12rpx;
  margin-bottom: 0;
}

.withdraw-card {
  padding-top: 24rpx;
  background:
    linear-gradient(135deg, rgba(201, 49, 91, 0.07), transparent 30%),
    linear-gradient(315deg, rgba(45, 87, 217, 0.07), transparent 36%),
    rgba(255, 250, 245, 0.94);
}

.withdraw-amount {
  font-size: 56rpx;
  font-family: var(--campus-font-data);
}

.withdraw-request-item,
.settlement-item {
  border-color: rgba(43, 24, 34, 0.08);
}

.mini-tag {
  border: 1rpx solid rgba(45, 87, 217, 0.12);
  background: rgba(45, 87, 217, 0.08);
  color: var(--campus-secondary);
}

.settlement-amount {
  color: var(--campus-text);
  font-family: var(--campus-font-data);
}
</style>
