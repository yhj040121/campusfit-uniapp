<template>
  <view class="page-shell coop-shell">
    <view v-if="!loggedIn" class="hero-card coop-guest">
      <view class="hero-badge">合作邀请</view>
      <view class="hero-title">登录后查看合作邀请、执行进度和奖励状态</view>
      <view class="hero-copy">平台创建的合作单、已绑定内容的推进轨道、待发奖励和已发奖励记录，都会集中展示在这里。</view>
      <button class="btn-primary coop-guest-action" @click="goLogin">去登录</button>
    </view>

    <view v-else>
      <view class="hero-card coop-hero">
        <view class="hero-badge">{{ fromPublish ? '发布绑定模式' : '我的合作' }}</view>
        <view class="hero-title">{{ fromPublish ? '挑一张执行中的合作单，直接带回当前发布页' : '把邀请、执行和奖励放进同一条合作轨道里' }}</view>
        <view v-if="fromPublish" class="hero-copy">{{ heroNoteText }}</view>

        <view class="coop-hero-strip">
          <view class="coop-stat coop-stat-main">
            <view class="coop-stat-label">全部合作</view>
            <view class="coop-stat-value">{{ cooperations.length }}</view>
          </view>
          <view class="coop-stat">
            <view class="coop-stat-label">待确认</view>
            <view class="coop-stat-value">{{ pendingCount }}</view>
          </view>
          <view class="coop-stat">
            <view class="coop-stat-label">执行中</view>
            <view class="coop-stat-value">{{ runningCount }}</view>
          </view>
          <view class="coop-stat">
            <view class="coop-stat-label">待发奖励</view>
            <view class="coop-stat-value">{{ rewardReadyCount }}</view>
          </view>
        </view>
      </view>

      <view v-if="fromPublish" class="panel-card coop-mode-card">
        <view class="coop-mode-kicker">PICK MODE</view>
        <view class="coop-mode-inline">这里选中的合作单，会直接带回当前发布页</view>
      </view>

      <scroll-view class="coop-filter-scroll" scroll-x enable-flex show-scrollbar="false">
        <view class="coop-filter-row">
          <view
            v-for="tab in filterTabs"
            :key="tab.key"
            :class="['coop-filter-pill', filterKey === tab.key ? 'coop-filter-pill-active' : '']"
            @tap="setFilter(tab.key)"
          >
            <text class="coop-filter-label">{{ tab.label }}</text>
            <text class="coop-filter-count">{{ tab.count }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="action-row coop-toolbar">
        <button class="btn-secondary coop-toolbar-button" :disabled="loading" @click="loadCooperations(true)">
          {{ loading ? '刷新中...' : '刷新合作单' }}
        </button>
        <button class="btn-secondary coop-toolbar-button coop-toolbar-button-ghost" @click="goPublish">
          {{ fromPublish ? '返回发布页' : '去发布页' }}
        </button>
      </view>

      <view v-if="loading && !cooperations.length" class="skeleton-stack">
        <view v-for="item in 3" :key="'coop-skeleton-' + item" class="skeleton-card coop-skeleton-card"></view>
      </view>

      <view v-else-if="visibleCooperations.length" class="coop-list">
        <view
          v-for="item in visibleCooperations"
          :key="item.id"
          :class="['panel-card', 'coop-card', 'coop-card-' + stageTone(item), isSelectedForPublish(item) ? 'coop-card-selected' : '']"
        >
          <view class="coop-card-top">
            <view class="coop-card-route">
              <view class="coop-route-code">{{ item.displayCode }}</view>
              <view class="coop-route-stage">{{ stageCode(item) }}</view>
            </view>
            <view :class="['coop-status-chip', 'coop-status-chip-' + stageTone(item)]">{{ item.status }}</view>
          </view>

          <view class="coop-card-title-row">
            <view class="coop-card-title-wrap">
              <view class="coop-brand-pill">{{ item.merchantName || '合作品牌' }}</view>
              <view class="coop-card-title">{{ item.title }}</view>
            </view>
            <view v-if="isSelectedForPublish(item)" class="coop-selected-badge">当前已绑定</view>
          </view>

          <view class="coop-metric-grid">
            <view class="coop-metric coop-metric-highlight">
              <view class="coop-metric-label">奖励金额</view>
              <view class="coop-metric-value">{{ item.rewardAmount || '¥0.00' }}</view>
            </view>
            <view class="coop-metric">
              <view class="coop-metric-label">内容目标</view>
              <view class="coop-metric-value">{{ item.approvedPostCount }}/{{ item.targetPostCount }}</view>
            </view>
            <view class="coop-metric">
              <view class="coop-metric-label">点赞目标</view>
              <view class="coop-metric-value">{{ likeTargetText(item) }}</view>
            </view>
            <view class="coop-metric">
              <view class="coop-metric-label">截止时间</view>
              <view class="coop-metric-value coop-metric-value-time">{{ deadlineText(item) }}</view>
            </view>
          </view>

          <view class="coop-rail">
            <view class="coop-rail-head">
              <view class="coop-rail-title">执行轨道</view>
              <view class="coop-rail-copy">{{ progressSecondary(item) }}</view>
            </view>
            <view class="coop-progress-track">
              <view class="coop-progress-fill" :style="{ width: item.progressPercent + '%' }"></view>
            </view>
            <view class="coop-rail-foot">
              <text>{{ progressPrimary(item) }}</text>
            </view>
          </view>

          <view class="button-row coop-actions">
            <button
              v-if="item.canAccept"
              class="btn-primary btn-half coop-action-primary"
              :class="actionKey === 'accept-' + item.id ? 'btn-disabled' : ''"
              @click="acceptCooperation(item)"
            >
              {{ actionKey === 'accept-' + item.id ? '确认中...' : '确认合作' }}
            </button>

            <button
              v-if="item.canPublish"
              class="btn-primary btn-half coop-action-publish"
              :class="[isSelectedForPublish(item) ? 'coop-action-selected' : '', actionKey ? 'btn-disabled' : '']"
              @click="pickForPublish(item)"
            >
              {{ publishActionText(item) }}
            </button>

            <button
              v-if="isPendingInvite(item)"
              class="btn-secondary btn-half coop-action-danger"
              :class="actionKey === 'reject-' + item.id ? 'btn-disabled' : ''"
              @click="abandonItem(item)"
            >
              {{ actionKey === 'reject-' + item.id ? '处理中...' : '拒绝合作' }}
            </button>

            <button
              v-else-if="item.canAbandon"
              class="btn-secondary btn-half coop-action-danger"
              :class="actionKey === 'abandon-' + item.id ? 'btn-disabled' : ''"
              @click="abandonItem(item)"
            >
              {{ actionKey === 'abandon-' + item.id ? '处理中...' : '放弃合作' }}
            </button>
          </view>
        </view>
      </view>

      <view v-else class="panel-card coop-empty">
        <view class="coop-mode-kicker">{{ cooperations.length ? 'EMPTY FILTER' : 'NO COOPERATION' }}</view>
        <view class="coop-mode-title">{{ emptyTitle }}</view>
        <view class="coop-mode-copy">{{ emptyCopy }}</view>
        <view class="action-row coop-toolbar coop-empty-actions">
          <button
            v-if="cooperations.length && filterKey !== 'all'"
            class="btn-secondary coop-toolbar-button"
            @click="setFilter('all')"
          >
            查看全部合作
          </button>
          <button class="btn-secondary coop-toolbar-button coop-toolbar-button-ghost" @click="goPublish">
            {{ fromPublish ? '返回发布页' : '去发布页' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var cooperationStore = require('../../common/cooperation.js')

function clampNumber(value) {
  var number = Number(value)
  if (!isFinite(number) || number < 0) {
    return 0
  }
  return number
}

function firstText() {
  for (var i = 0; i < arguments.length; i += 1) {
    var value = arguments[i]
    if (value === null || value === undefined) {
      continue
    }
    value = String(value).trim()
    if (value) {
      return value
    }
  }
  return ''
}

function formatCooperationCode(value) {
  var numeric = Number(value || 0)
  if (!isFinite(numeric) || numeric <= 0) {
    return 'COOP'
  }
  return 'COOP-' + String(Math.round(numeric)).padStart(6, '0')
}

function normalizeCooperation(item) {
  var targetPostCount = Math.max(clampNumber(item && item.targetPostCount) || 1, 1)
  var approvedPostCount = clampNumber(item && item.approvedPostCount)
  var targetLikeCount = clampNumber(item && item.targetLikeCount)
  var approvedLikeCount = clampNumber(item && item.approvedLikeCount)
  var postRatio = targetPostCount > 0 ? approvedPostCount / targetPostCount : 1
  var likeRatio = targetLikeCount > 0 ? approvedLikeCount / targetLikeCount : 1

  return {
    id: firstText(item && item.id),
    displayCode: formatCooperationCode(item && item.id),
    title: firstText(item && item.title, '未命名合作单'),
    merchantName: firstText(item && item.merchantName, '合作品牌'),
    desc: firstText(item && item.desc),
    status: firstText(item && item.status, '待确认'),
    statusCode: clampNumber(item && item.statusCode),
    rewardAmount: firstText(item && item.rewardAmount, '¥0.00'),
    targetPostCount: targetPostCount,
    approvedPostCount: approvedPostCount,
    submittedPostCount: clampNumber(item && item.submittedPostCount),
    targetLikeCount: targetLikeCount,
    approvedLikeCount: approvedLikeCount,
    deadlineAt: firstText(item && item.deadlineAt, '-'),
    canAccept: !!(item && item.canAccept),
    accepted: !!(item && item.accepted),
    canPublish: !!(item && item.canPublish),
    canAbandon: !!(item && item.canAbandon),
    rewardReady: !!(item && item.rewardReady),
    rewardIssued: !!(item && item.rewardIssued),
    ruleText: firstText(item && item.ruleText, '以后台配置的合作要求为准。'),
    progressText: firstText(item && item.progressText, '等待合作进度更新'),
    progressPercent: Math.max(0, Math.min(100, Math.round(Math.min(postRatio, likeRatio) * 100)))
  }
}

function buildAcceptConfirmContent(item) {
  var lines = [
    '合作要求：' + firstText(item && item.desc, '请按卡片展示的合作要求执行。'),
    '达标条件：' + firstText(item && item.ruleText, '以后台配置的合作要求为准。'),
    '奖励金额：' + firstText(item && item.rewardAmount, '¥0.00'),
    '截止时间：' + (item && item.deadlineAt && item.deadlineAt !== '-' ? item.deadlineAt : '待更新')
  ]
  lines.push('确认后即可去发布页绑定内容，并开始累计合作进度。')
  return lines.join('\n\n')
}

function isPendingInvite(item) {
  return !!(item && item.canAccept && !item.accepted && !item.canPublish)
}

function isRewardReady(item) {
  return !!(item && item.rewardReady && !item.rewardIssued)
}

function isFinished(item) {
  return !!(item && (item.rewardIssued || item.statusCode === 4))
}

function isRunning(item) {
  return !!(item && !isPendingInvite(item) && !isRewardReady(item) && !isFinished(item) && item.canPublish)
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      fromPublish: false,
      loading: false,
      actionKey: '',
      filterKey: 'all',
      selectedCooperationId: '',
      cooperations: []
    }
  },
  computed: {
    pendingCount: function() {
      return this.cooperations.filter(function(item) { return isPendingInvite(item) }).length
    },
    runningCount: function() {
      return this.cooperations.filter(function(item) { return isRunning(item) }).length
    },
    rewardReadyCount: function() {
      return this.cooperations.filter(function(item) { return isRewardReady(item) }).length
    },
    finishedCount: function() {
      return this.cooperations.filter(function(item) { return isFinished(item) }).length
    },
    filterTabs: function() {
      return [
        { key: 'all', label: '全部', count: this.cooperations.length },
        { key: 'pending', label: '待确认', count: this.pendingCount },
        { key: 'running', label: '执行中', count: this.runningCount },
        { key: 'ready', label: '待发奖励', count: this.rewardReadyCount },
        { key: 'finished', label: '已结束', count: this.finishedCount }
      ]
    },
    visibleCooperations: function() {
      var self = this
      return this.cooperations.filter(function(item) {
        if (self.filterKey === 'pending') return isPendingInvite(item)
        if (self.filterKey === 'running') return isRunning(item)
        if (self.filterKey === 'ready') return isRewardReady(item)
        if (self.filterKey === 'finished') return isFinished(item)
        return true
      })
    },
    heroNoteText: function() {
      if (this.fromPublish) {
        return this.selectedCooperationId
          ? '你已经绑定过一张合作单，重新选择会覆盖当前绑定。'
          : '选择一张执行中的合作单后，发布页会自动带上这条合作要求。'
      }
      if (this.pendingCount > 0) return '你还有待确认的合作邀请，先确认再去发布页绑定内容会更顺畅。'
      if (this.rewardReadyCount > 0) return '已有合作达到发奖条件，等后台发奖后会自动进入已发奖励状态。'
      return '执行中的合作会持续累计通过内容和点赞进度，记得按要求继续发布。'
    },
    emptyTitle: function() {
      return this.cooperations.length && this.filterKey !== 'all' ? '当前筛选下还没有合作单' : '还没有合作单'
    },
    emptyCopy: function() {
      return this.cooperations.length && this.filterKey !== 'all'
        ? '你可以切回全部合作继续查看，或者等待新的合作状态进入这个分组。'
        : '管理员创建合作单后，这里会展示待确认、执行中、待发奖励和已结束的全部状态。'
    }
  },
  onLoad: function(options) {
    this.fromPublish = !!(options && String(options.pick || '') === '1')
    this.filterKey = this.fromPublish ? 'running' : 'all'
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.syncSelectedCooperation()
    if (!this.loggedIn) {
      this.cooperations = []
      return
    }
    this.loadCooperations(false)
  },
  methods: {
    syncSelectedCooperation: function() {
      var selected = cooperationStore.getSelectedCooperation()
      this.selectedCooperationId = selected && selected.id ? String(selected.id) : ''
    },
    setFilter: function(key) {
      this.filterKey = key || 'all'
    },
    loadCooperations: function(showToast) {
      var self = this
      if (!self.loggedIn) return
      self.loading = true
      api.listMyCooperations()
        .then(function(list) {
          self.cooperations = (list || []).map(normalizeCooperation)
          var selected = cooperationStore.getSelectedCooperation()
          if (selected && selected.id) {
            var stillPublishable = false
            for (var i = 0; i < self.cooperations.length; i += 1) {
              if (self.cooperations[i].id === selected.id && self.cooperations[i].canPublish) {
                stillPublishable = true
                break
              }
            }
            if (!stillPublishable) cooperationStore.clearSelectedCooperation()
          }
          self.syncSelectedCooperation()
          if (showToast) {
            uni.showToast({ title: '合作单已刷新', icon: 'none' })
          }
        })
        .catch(function(error) {
          uni.showToast({ title: error.message || '合作单加载失败', icon: 'none' })
        })
        .finally(function() {
          self.loading = false
        })
    },
    stageTone: function(item) {
      if (item.rewardIssued) return 'finished'
      if (item.statusCode === 4) return 'danger'
      if (item.rewardReady) return 'ready'
      if (item.canPublish) return 'running'
      if (item.canAccept) return 'pending'
      return 'neutral'
    },
    stageCode: function(item) {
      if (item.rewardIssued) return 'PAID'
      if (item.statusCode === 4) return 'CLOSED'
      if (item.rewardReady) return 'READY'
      if (item.canPublish) return 'LIVE'
      if (item.canAccept) return 'INVITE'
      return 'TRACK'
    },
    likeTargetText: function(item) {
      return item.targetLikeCount > 0 ? (item.approvedLikeCount + '/' + item.targetLikeCount) : '无点赞门槛'
    },
    deadlineText: function(item) {
      return item.deadlineAt && item.deadlineAt !== '-' ? item.deadlineAt : '待更新'
    },
    progressPrimary: function(item) {
      return '已提交 ' + item.submittedPostCount + ' 篇 · 已通过 ' + item.approvedPostCount + '/' + item.targetPostCount
    },
    progressSecondary: function(item) {
      if (item.rewardIssued) return '奖励已发放'
      if (item.rewardReady) return '等待后台发奖'
      if (item.canPublish) {
        return item.targetLikeCount > 0 ? ('点赞 ' + item.approvedLikeCount + '/' + item.targetLikeCount) : '可继续绑定发布'
      }
      return '确认后可开始绑定'
    },
    nextActionCopy: function(item) {
      if (item.rewardIssued) return '这张合作单已经完成发奖，可以把它当作一条已结项记录留在合作页里。'
      if (item.statusCode === 4) return '这条合作已经结束，不会再继续累计新的发布内容和奖励进度。'
      if (item.rewardReady) return '合作要求已经达标，接下来只需要等待后台确认发放奖励。'
      if (item.canPublish) {
        return this.fromPublish
          ? '如果要带回当前发布页，现在就可以直接绑定这张合作单。'
          : '下一步就是去发布页继续绑定内容，让通过审核的内容累计到这张合作单上。'
      }
      return '先确认合作要求，确认后这张合作单才会进入执行中，并出现在发布页可绑定列表。'
    },
    publishActionText: function(item) {
      if (this.isSelectedForPublish(item)) {
        return '已绑定到当前发布'
      }
      return this.fromPublish ? '绑定到当前发布' : '去发布绑定'
    },
    isPendingInvite: function(item) {
      return isPendingInvite(item)
    },
    isSelectedForPublish: function(item) {
      return !!(this.fromPublish && this.selectedCooperationId && String(item && item.id) === this.selectedCooperationId)
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    goPublish: function() {
      if (this.fromPublish) {
        var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
        if (pages && pages.length > 1) {
          uni.navigateBack({ delta: 1 })
          return
        }
      }
      uni.switchTab({ url: '/pages/publish/index' })
    },
    pickForPublish: function(item) {
      if (!item || !item.canPublish) {
        uni.showToast({ title: '该合作单当前不能继续绑定发布', icon: 'none' })
        return
      }
      cooperationStore.selectCooperation(item)
      this.syncSelectedCooperation()
      if (this.fromPublish) {
        var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
        if (pages && pages.length > 1) {
          uni.navigateBack({ delta: 1 })
          return
        }
      }
      uni.switchTab({ url: '/pages/publish/index' })
    },
    acceptCooperation: function(item) {
      var self = this
      if (!item || !item.id || self.actionKey) return

      uni.showModal({
        title: '确认合作前请先查看要求',
        content: buildAcceptConfirmContent(item),
        confirmText: '确认合作',
        cancelText: '再看看',
        success: function(result) {
          if (!result.confirm) return
          self.actionKey = 'accept-' + item.id
          api.acceptCooperation(item.id)
            .then(function(response) {
              var normalized = normalizeCooperation(response)
              self.cooperations = self.cooperations.map(function(current) {
                return current.id === normalized.id ? normalized : current
              })
              uni.showToast({ title: '合作已确认', icon: 'none' })
            })
            .catch(function(error) {
              uni.showToast({ title: error.message || '合作确认失败', icon: 'none' })
            })
            .finally(function() {
              self.actionKey = ''
            })
        }
      })
    },
    abandonItem: function(item) {
      var self = this
      var rejectingInvite = self.isPendingInvite(item)
      if (!item || !item.id || (!rejectingInvite && !item.canAbandon) || self.actionKey) return

      uni.showModal({
        title: rejectingInvite ? '拒绝合作' : '放弃合作',
        content: rejectingInvite
          ? '拒绝后这条合作邀请不会进入执行中，确定继续吗？'
          : '放弃后将不能再绑定新内容，确定继续吗？',
        confirmText: rejectingInvite ? '确认拒绝' : '确认放弃',
        cancelText: '再想想',
        success: function(result) {
          if (!result.confirm) return
          self.actionKey = (rejectingInvite ? 'reject-' : 'abandon-') + item.id
          api.abandonCooperation(item.id)
            .then(function(updated) {
              var normalized = normalizeCooperation(updated)
              self.cooperations = self.cooperations.map(function(current) {
                return current.id === normalized.id ? normalized : current
              })
              var selected = cooperationStore.getSelectedCooperation()
              if (selected && selected.id === normalized.id) {
                cooperationStore.clearSelectedCooperation()
              }
              self.syncSelectedCooperation()
              uni.showToast({ title: rejectingInvite ? '已拒绝合作' : '已放弃合作', icon: 'none' })
            })
            .catch(function(error) {
              uni.showToast({ title: error.message || (rejectingInvite ? '拒绝合作失败' : '放弃合作失败'), icon: 'none' })
            })
            .finally(function() {
              self.actionKey = ''
            })
        }
      })
    }
  }
}
</script>

<style scoped>
.coop-shell {
  --coop-ink: #182536;
  --coop-ink-soft: #2a425f;
  --coop-muted: #6f8095;
  --coop-faint: #98a7bc;
  --coop-surface: rgba(255, 255, 255, 0.95);
  --coop-line: rgba(255, 255, 255, 0.78);
  --coop-primary: #0d5c94;
  --coop-running: #2da682;
  --coop-ready: #d2931a;
  --coop-finished: #455fd0;
  --coop-danger: #cf5b72;
  min-height: 100vh;
  padding-top: 12rpx;
  padding-bottom: calc(132rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 0% 0%, rgba(96, 190, 255, 0.18), transparent 34%),
    radial-gradient(circle at 100% 10%, rgba(255, 212, 137, 0.18), transparent 26%),
    linear-gradient(180deg, #f5f9ff 0%, #eef4fb 40%, #eaf0f7 100%);
  font-family: "Avenir Next", "DIN Alternate", "PingFang SC", sans-serif;
}

.coop-shell .hero-card,
.coop-shell .panel-card {
  border-radius: 28rpx;
  border: 2rpx solid var(--coop-line);
  box-shadow: 0 18rpx 36rpx rgba(21, 44, 76, 0.07);
  backdrop-filter: blur(18rpx);
}

.coop-shell .hero-card {
  padding: 22rpx;
}

.coop-shell .hero-badge {
  min-height: 40rpx;
  padding: 0 16rpx;
  font-size: 18rpx;
}

.coop-shell .hero-title {
  margin-top: 12rpx;
  font-size: 42rpx;
  line-height: 1.18;
}

.coop-shell .hero-copy {
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 1.45;
}

.coop-guest,
.coop-hero,
.coop-card {
  position: relative;
  overflow: hidden;
}

.coop-guest::after,
.coop-hero::after {
  content: '';
  position: absolute;
  right: -80rpx;
  top: -60rpx;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
}

.coop-guest {
  background: linear-gradient(135deg, #0b5b90 0%, #1a78bd 52%, #73c6ff 100%);
}

.coop-hero {
  background:
    linear-gradient(132deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 32%, transparent 33%),
    linear-gradient(135deg, #103d67 0%, #145d96 46%, #6cc6ff 100%);
}

.coop-guest-action {
  margin-top: 18rpx;
}

.coop-hero-strip {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10rpx;
}

.coop-stat {
  min-height: 84rpx;
  padding: 16rpx 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.14);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
}

.coop-stat-main {
  background: rgba(255, 255, 255, 0.2);
}

.coop-stat-label {
  color: rgba(237, 247, 255, 0.78);
  font-size: 20rpx;
  font-weight: 700;
}

.coop-stat-value {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1;
}

.coop-mode-card,
.coop-empty {
  margin-top: 14rpx;
  padding: 18rpx 20rpx;
  background: var(--coop-surface);
}

.coop-mode-kicker {
  color: var(--coop-faint);
  font-size: 18rpx;
  font-weight: 800;
  letter-spacing: 3rpx;
}

.coop-mode-inline,
.coop-mode-copy {
  margin-top: 8rpx;
  color: var(--coop-muted);
  font-size: 22rpx;
  line-height: 1.5;
}

.coop-filter-scroll {
  margin-top: 14rpx;
  white-space: nowrap;
}

.coop-filter-row {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding-right: 18rpx;
}

.coop-filter-pill {
  min-width: 132rpx;
  padding: 14rpx 18rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  background: rgba(255, 255, 255, 0.76);
  border: 2rpx solid rgba(255, 255, 255, 0.9);
}

.coop-filter-pill-active {
  background: linear-gradient(135deg, #0d5c94 0%, #67c4ff 100%);
  border-color: transparent;
}

.coop-filter-label {
  color: var(--coop-ink-soft);
  font-size: 21rpx;
  font-weight: 700;
}

.coop-filter-count {
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 10rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(13, 92, 148, 0.08);
  color: var(--coop-primary);
  font-size: 18rpx;
  font-weight: 800;
}

.coop-filter-pill-active .coop-filter-label,
.coop-filter-pill-active .coop-filter-count {
  color: #ffffff;
}

.coop-filter-pill-active .coop-filter-count {
  background: rgba(255, 255, 255, 0.18);
}

.coop-toolbar,
.coop-empty-actions {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10rpx;
}

.coop-toolbar-button {
  width: 100%;
  min-height: 76rpx;
}

.coop-toolbar-button-ghost {
  background: rgba(255, 255, 255, 0.76);
  color: var(--coop-ink-soft);
  border-color: rgba(255, 255, 255, 0.9);
}

.coop-list,
.skeleton-stack {
  margin-top: 14rpx;
  display: grid;
  gap: 14rpx;
}

.coop-skeleton-card {
  min-height: 360rpx;
}

.coop-card {
  padding: 20rpx;
  background: var(--coop-surface);
  display: grid;
  gap: 14rpx;
}

.coop-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 8rpx;
  background: linear-gradient(90deg, rgba(13, 92, 148, 0.92), rgba(103, 196, 255, 0.92));
}

.coop-card-running::before {
  background: linear-gradient(90deg, rgba(45, 166, 130, 0.96), rgba(114, 217, 186, 0.92));
}

.coop-card-ready::before {
  background: linear-gradient(90deg, rgba(210, 147, 26, 0.96), rgba(255, 212, 109, 0.92));
}

.coop-card-finished::before {
  background: linear-gradient(90deg, rgba(69, 95, 208, 0.96), rgba(132, 149, 238, 0.92));
}

.coop-card-danger::before {
  background: linear-gradient(90deg, rgba(207, 91, 114, 0.96), rgba(240, 151, 171, 0.92));
}

.coop-card-selected {
  border-color: rgba(13, 92, 148, 0.24);
  box-shadow: 0 18rpx 36rpx rgba(13, 92, 148, 0.12);
}

.coop-card-top,
.coop-card-title-row,
.coop-rail-head,
.coop-rail-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.coop-card-route,
.coop-card-title-wrap {
  display: grid;
  gap: 6rpx;
}

.coop-route-code {
  color: var(--coop-faint);
  font-size: 18rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
}

.coop-route-stage {
  color: var(--coop-ink-soft);
  font-size: 20rpx;
  font-weight: 800;
  letter-spacing: 1rpx;
}

.coop-status-chip,
.coop-selected-badge,
.coop-brand-pill {
  min-height: 40rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: 800;
  white-space: nowrap;
}

.coop-status-chip-pending,
.coop-status-chip-neutral {
  background: rgba(124, 143, 166, 0.12);
  color: #667b91;
}

.coop-status-chip-running {
  background: rgba(45, 166, 130, 0.14);
  color: #1c8565;
}

.coop-status-chip-ready {
  background: rgba(210, 147, 26, 0.14);
  color: #aa7310;
}

.coop-status-chip-finished {
  background: rgba(69, 95, 208, 0.13);
  color: #3f57b5;
}

.coop-status-chip-danger {
  background: rgba(207, 91, 114, 0.13);
  color: #b24c61;
}

.coop-brand-pill {
  width: fit-content;
  background: rgba(13, 92, 148, 0.08);
  color: var(--coop-primary);
}

.coop-selected-badge {
  flex-shrink: 0;
  background: rgba(13, 92, 148, 0.12);
  color: var(--coop-primary);
}

.coop-card-title {
  color: var(--coop-ink);
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -1rpx;
  word-break: break-word;
}

.coop-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10rpx;
}

.coop-metric {
  min-height: 96rpx;
  padding: 16rpx;
  border-radius: 20rpx;
  background: rgba(236, 245, 255, 0.82);
  display: grid;
  align-content: center;
  gap: 10rpx;
}

.coop-metric-highlight {
  background: linear-gradient(135deg, rgba(13, 92, 148, 0.1), rgba(103, 196, 255, 0.14));
}

.coop-metric-label {
  color: var(--coop-faint);
  font-size: 19rpx;
  font-weight: 700;
}

.coop-metric-value {
  color: var(--coop-ink-soft);
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.25;
  word-break: break-word;
}

.coop-metric-value-time {
  font-size: 24rpx;
}

.coop-rail {
  padding: 16rpx;
  border-radius: 20rpx;
  background: rgba(247, 250, 255, 0.94);
  border: 2rpx solid rgba(13, 92, 148, 0.06);
  display: grid;
  gap: 10rpx;
}

.coop-rail-title {
  color: var(--coop-ink-soft);
  font-size: 22rpx;
  font-weight: 800;
}

.coop-rail-copy,
.coop-rail-foot {
  color: var(--coop-muted);
  font-size: 20rpx;
  line-height: 1.4;
  flex-wrap: wrap;
}

.coop-progress-track {
  height: 12rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(13, 92, 148, 0.08);
}

.coop-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0d5c94 0%, #67c4ff 100%);
}

.coop-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10rpx;
}

.coop-actions .btn-half {
  width: 100%;
}

.coop-actions .btn-half:only-child {
  grid-column: 1 / -1;
}

.coop-actions .btn-primary,
.coop-actions .btn-secondary {
  width: 100%;
  min-height: 74rpx;
  height: auto;
  line-height: 1.35;
  padding: 14rpx 16rpx;
  box-sizing: border-box;
}

.coop-action-primary {
  box-shadow: 0 18rpx 34rpx rgba(13, 92, 148, 0.18);
}

.coop-action-publish {
  background: linear-gradient(135deg, #124a78 0%, #2f8fcb 52%, #7fd1ff 100%);
}

.coop-action-selected {
  box-shadow: 0 0 0 2rpx rgba(255, 255, 255, 0.66), 0 18rpx 34rpx rgba(13, 92, 148, 0.18);
}

.coop-action-danger {
  color: #b24c61;
  border-color: rgba(207, 91, 114, 0.22);
  background: rgba(207, 91, 114, 0.06);
}
</style>
