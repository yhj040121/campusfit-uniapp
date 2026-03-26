<template>
  <view class="page-shell profile-shell">
    <view v-if="!loggedIn" class="profile-guest-card">
      <view class="profile-guest-badge">青搭</view>
      <view class="profile-guest-title">登录后查看你的个人主页</view>
      <view class="profile-guest-copy">发布、收藏、草稿、消息和创作者激励都会集中在这里，继续完善你的校园穿搭档案。</view>
      <view class="profile-guest-action" @tap="goLogin">去登录</view>
    </view>

    <view v-else>
      <view class="profile-hero">
        <image v-if="heroCoverUrl" class="profile-hero-image" :src="heroCoverUrl" mode="aspectFill"></image>
        <view class="profile-hero-overlay"></view>
        <view class="profile-hero-orb"></view>
      </view>

      <view class="profile-identity-card">
        <view class="profile-identity-avatar">
          <image v-if="effectiveAvatarUrl" class="profile-identity-avatar-image" :src="effectiveAvatarUrl" mode="aspectFill"></image>
          <text v-else>{{ profile.avatar }}</text>
        </view>
        <view class="profile-identity-name">{{ profile.name }}</view>
        <view class="profile-identity-school">{{ displaySchool }}</view>
        <view v-if="metaPills.length" class="profile-meta-row">
          <view v-for="item in metaPills" :key="item" class="profile-meta-pill">{{ item }}</view>
        </view>
        <view class="profile-identity-sign">{{ displaySign }}</view>

        <view class="profile-metric-row">
          <view class="profile-metric-item" @tap="go('/pages/follows/index')">
            <view class="profile-metric-value">{{ formatCount(profile.following) }}</view>
            <view class="profile-metric-label">关注</view>
          </view>
          <view class="profile-metric-item" @tap="go('/pages/follows/index')">
            <view class="profile-metric-value">{{ formatCount(profile.followers) }}</view>
            <view class="profile-metric-label">粉丝</view>
          </view>
          <view class="profile-metric-item" @tap="go('/pages/my-posts/index')">
            <view class="profile-metric-value">{{ formatCount(profile.likes) }}</view>
            <view class="profile-metric-label">获赞</view>
          </view>
        </view>
      </view>

      <view class="profile-income-card">
        <view class="profile-income-head">
          <view>
            <view class="profile-income-title">创作者激励</view>
            <view class="profile-income-copy">{{ incentiveSyncText }}</view>
          </view>
          <view class="profile-income-link" @tap="go('/pages/incentives/index')">查看详情</view>
        </view>

        <view class="profile-income-grid">
          <view class="profile-income-metric">
            <view class="profile-income-kicker">累计收益</view>
            <view class="profile-income-value">{{ incentiveCenter.totalAmount }}</view>
          </view>
          <view class="profile-income-metric">
            <view class="profile-income-kicker">品牌合作</view>
            <view class="profile-income-value">{{ profile.cooperation }}</view>
          </view>
        </view>

        <view v-if="incentiveCenter.canWithdraw" class="profile-income-action" :class="{ 'profile-income-action-disabled': withdrawing }" @tap="handleWithdraw">
          {{ withdrawButtonText }}
        </view>
      </view>

      <view class="profile-quick-grid">
        <view class="profile-quick-item" @tap="go('/pages/my-activity/index')">
          <view class="profile-quick-icon profile-quick-icon-activity">活</view>
          <view class="profile-quick-label">活动</view>
        </view>
        <view class="profile-quick-item" @tap="go('/pages/edit-profile/index')">
          <view class="profile-quick-icon profile-quick-icon-profile">资</view>
          <view class="profile-quick-label">资料</view>
        </view>
        <view class="profile-quick-item" :class="{ 'profile-quick-item-alert': displayUnreadCount > 0 }" @tap="go('/pages/messages/index')">
          <view :class="['profile-quick-icon', displayUnreadCount > 0 ? 'profile-quick-icon-message-active' : 'profile-quick-icon-message']">信</view>
          <view class="profile-quick-label" :class="{ 'profile-quick-label-alert': displayUnreadCount > 0 }">消息</view>
          <view v-if="displayUnreadCount > 0" class="profile-quick-badge">{{ unreadBadgeText }}</view>
        </view>
        <view class="profile-quick-item" @tap="go('/pages/settings/index')">
          <view class="profile-quick-icon profile-quick-icon-settings">设</view>
          <view class="profile-quick-label">设置</view>
        </view>
      </view>

      <view class="profile-tab-row">
        <view
          v-for="item in previewTabs"
          :key="item.key"
          :class="['profile-tab', activePreviewTab === item.key ? 'profile-tab-active' : '']"
          @tap="setPreviewTab(item.key)"
        >
          {{ item.label }}
        </view>
      </view>

      <view v-if="previewLoading" class="profile-preview-grid">
        <view v-for="item in 4" :key="item" class="profile-preview-skeleton"></view>
      </view>

      <view v-else-if="currentPreviewList.length" class="profile-preview-grid">
        <view
          v-for="item in currentPreviewList"
          :key="item.id"
          class="profile-preview-card"
          @tap="openPreview(item)"
        >
          <view
            v-if="item.kind === 'drafts'"
            class="profile-preview-delete"
            :class="{ 'profile-preview-delete-loading': previewActionLoadingId === item.id }"
            @tap.stop="removeDraftPreview(item)"
          >
            {{ previewActionLoadingId === item.id ? '删除中' : '删除' }}
          </view>
          <image v-if="item.coverUrl" class="profile-preview-image" :src="item.coverUrl" mode="aspectFill"></image>
          <view v-else class="profile-preview-fallback">
            <view class="profile-preview-fallback-title">{{ item.title }}</view>
          </view>
          <view class="profile-preview-overlay">
            <view class="profile-preview-metric">{{ item.metricText }}</view>
          </view>
        </view>
      </view>

      <view v-else class="profile-empty-card">
        <view class="profile-empty-title">{{ emptyPreviewTitle }}</view>
        <view class="profile-empty-copy">{{ emptyPreviewCopy }}</view>
        <view class="profile-empty-action" @tap="openCurrentTabPage">{{ emptyPreviewAction }}</view>
      </view>

      <view class="profile-logout" @tap="logout">退出登录</view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')
var settingsStore = require('../../common/settings.js')
var postDisplay = require('../../common/post-display.js')

var ACTIVE_DRAFT_KEY = 'campusfit_active_draft_id'
var EDIT_POST_KEY = 'campusfit_edit_post_id'
var DEFAULT_PROFILE_COVER = '/static/profile/default-hero.svg'
var TAB_PAGES = {
  '/pages/index/index': true,
  '/pages/publish/index': true,
  '/pages/search/index': true,
  '/pages/profile/index': true
}

function buildAvatarFallback(name) {
  var text = ((name || '').trim()) || 'CampusFit'
  if (text.length <= 2) {
    return text.toUpperCase()
  }
  return text.slice(0, 2).toUpperCase()
}

function buildDefaultProfile() {
  return {
    name: 'CampusFit 用户',
    avatar: 'CF',
    avatarUrl: '',
    coverImageUrl: '',
    school: '',
    gender: '',
    email: '',
    locationName: '',
    sign: '',
    following: 0,
    followers: 0,
    likes: 0,
    cooperation: 0
  }
}

function buildDefaultIncentiveCenter() {
  return {
    totalAmount: '¥0.00',
    availableAmount: '¥0.00',
    availableAmountRaw: 0,
    pendingSettlementAmount: '¥0.00',
    pendingWithdrawAmount: '¥0.00',
    withdrawnAmount: '¥0.00',
    settledCount: 0,
    pendingCount: 0,
    canWithdraw: false,
    withdrawHint: ''
  }
}

function buildPreviewTabs() {
  return [
    { key: 'posts', label: '我的发布' },
    { key: 'favorites', label: '收藏' },
    { key: 'drafts', label: '草稿' }
  ]
}

function clampNumber(value) {
  var number = Number(value)
  if (!isFinite(number) || number < 0) {
    return 0
  }
  return number
}

function formatCompactCount(value) {
  var amount = clampNumber(value)
  if (amount >= 10000) {
    return (amount / 10000).toFixed(amount >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'w'
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(amount >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k'
  }
  return String(Math.round(amount))
}

function formatDraftTime(value) {
  if (!value) {
    return '刚刚保存'
  }
  return String(value).replace('T', ' ').slice(0, 16)
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

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

function getGenderLabel(value) {
  var map = {
    female: '女生',
    male: '男生'
  }
  return map[value] || ''
}

function normalizePreviewPosts(list, kind) {
  var source = Array.isArray(list) ? list : []
  return source.slice(0, 6).map(function(item, index) {
    var metricBase = item && (item.likeCount || item.likes || item.favoriteCount || item.collectCount)
    return {
      id: firstText(item && item.id, kind + '-' + index),
      kind: kind,
      title: firstText(item && item.title, item && item.desc, '未命名内容'),
      coverUrl: postDisplay.getDisplayCoverUrl(item),
      metricText: metricBase ? formatCompactCount(metricBase) + ' 赞' : (kind === 'favorites' ? '已收藏' : '我的发布'),
      source: item || {}
    }
  })
}

function normalizeDraftPreviews(list) {
  var source = Array.isArray(list) ? list : []
  return source.slice(0, 6).map(function(item, index) {
    var tagCount = Array.isArray(item && item.tags) ? item.tags.length : 0
    return {
      id: firstText(item && item.id, 'draft-' + index),
      kind: 'drafts',
      title: firstText(item && item.title, '未命名草稿'),
      coverUrl: postDisplay.getDisplayCoverUrl(item),
      metricText: tagCount ? tagCount + ' 个标签' : formatDraftTime(item && item.savedAt),
      source: item || {}
    }
  })
}

function mergeProfile(remote) {
  var localUser = session.getUser() || {}
  var profile = Object.assign({}, buildDefaultProfile(), remote || {})
  profile.name = firstText(profile.name, localUser.nickname, 'CampusFit 用户')
  profile.avatarUrl = firstText(profile.avatarUrl, localUser.avatarUrl)
  profile.coverImageUrl = firstText(profile.coverImageUrl)
  profile.avatar = firstText(profile.avatar, buildAvatarFallback(profile.name))
  profile.school = firstText(profile.school)
  profile.gender = firstText(profile.gender)
  profile.email = firstText(profile.email)
  profile.locationName = firstText(profile.locationName)
  profile.sign = firstText(profile.sign)
  profile.following = clampNumber(profile.following)
  profile.followers = clampNumber(profile.followers)
  profile.likes = clampNumber(profile.likes)
  profile.cooperation = clampNumber(profile.cooperation)
  return profile
}

function mergeIncentiveCenter(remote) {
  var center = Object.assign({}, buildDefaultIncentiveCenter(), remote || {})
  center.totalAmount = firstText(center.totalAmount, center.availableAmount, '¥0.00')
  center.availableAmount = firstText(center.availableAmount, center.totalAmount, '¥0.00')
  center.availableAmountRaw = clampNumber(center.availableAmountRaw)
  center.pendingSettlementAmount = firstText(center.pendingSettlementAmount, '¥0.00')
  center.pendingWithdrawAmount = firstText(center.pendingWithdrawAmount, '¥0.00')
  center.withdrawnAmount = firstText(center.withdrawnAmount, '¥0.00')
  center.settledCount = clampNumber(center.settledCount)
  center.pendingCount = clampNumber(center.pendingCount)
  center.canWithdraw = !!center.canWithdraw
  center.withdrawHint = firstText(center.withdrawHint)
  return center
}

function resetPreviewState(instance) {
  instance.postPreviews = []
  instance.favoritePreviews = []
  instance.draftPreviews = []
  instance.previewActionLoadingId = ''
  instance.previewLoading = false
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      settingMap: settingsStore.getSettingMap(),
      profile: buildDefaultProfile(),
      incentiveCenter: buildDefaultIncentiveCenter(),
      unreadCount: 0,
      previewLoading: false,
      previewActionLoadingId: '',
      withdrawing: false,
      activePreviewTab: 'posts',
      previewTabs: buildPreviewTabs(),
      postPreviews: [],
      favoritePreviews: [],
      draftPreviews: []
    }
  },
  computed: {
    effectiveAvatarUrl: function() {
      return firstText(this.profile.avatarUrl)
    },
    privacyEnabled: function() {
      return this.settingMap.privacy !== false
    },
    displaySchool: function() {
      if (!this.privacyEnabled && this.profile.school) {
        return '已开启隐私保护'
      }
      return firstText(this.profile.school, '完善学校信息，让同校同学更快找到你')
    },
    displaySign: function() {
      return firstText(this.profile.sign, '分享校园穿搭、运动日常和真实体验。')
    },
    metaPills: function() {
      var items = []
      var gender = getGenderLabel(this.profile.gender)
      if (gender) {
        items.push(gender)
      }
      if (this.profile.locationName) {
        items.push(this.profile.locationName)
      }
      return items
    },
    heroCoverUrl: function() {
      return firstText(this.profile.coverImageUrl, DEFAULT_PROFILE_COVER)
    },
    currentPreviewList: function() {
      if (this.activePreviewTab === 'favorites') {
        return this.favoritePreviews
      }
      if (this.activePreviewTab === 'drafts') {
        return this.draftPreviews
      }
      return this.postPreviews
    },
    emptyPreviewTitle: function() {
      if (this.activePreviewTab === 'favorites') {
        return '还没有收藏内容'
      }
      if (this.activePreviewTab === 'drafts') {
        return '还没有保存草稿'
      }
      return '还没有发布内容'
    },
    emptyPreviewCopy: function() {
      if (this.activePreviewTab === 'favorites') {
        return '看到喜欢的穿搭、测评或活动，点一下收藏，就会在这里沉淀成你的灵感库。'
      }
      if (this.activePreviewTab === 'drafts') {
        return '发布页里先保存一版内容，之后回到这里就能继续补标题、图片和标签。'
      }
      return '从第一条校园穿搭开始，慢慢把你的个人主页搭建起来。'
    },
    emptyPreviewAction: function() {
      if (this.activePreviewTab === 'favorites') {
        return '去首页看看'
      }
      if (this.activePreviewTab === 'drafts') {
        return '去发布页'
      }
      return '去发布'
    },
    displayUnreadCount: function() {
      if (this.settingMap.push === false) {
        return 0
      }
      return clampNumber(this.unreadCount)
    },
    unreadBadgeText: function() {
      return this.displayUnreadCount > 99 ? '99+' : String(this.displayUnreadCount)
    },
    incentiveSyncText: function() {
      if (this.incentiveCenter.withdrawHint) {
        return this.incentiveCenter.withdrawHint
      }
      if (this.incentiveCenter.pendingCount > 0) {
        return '还有 ' + this.incentiveCenter.pendingCount + ' 笔收益待结算'
      }
      if (this.incentiveCenter.settledCount > 0) {
        return '已结算 ' + this.incentiveCenter.settledCount + ' 笔合作收益'
      }
      return '收益会在合作完成后自动同步到这里'
    },
    withdrawButtonText: function() {
      if (this.withdrawing) {
        return '提交中...'
      }
      if (this.incentiveCenter.canWithdraw) {
        return '提现收益'
      }
      return this.incentiveCenter.withdrawHint || '暂无可提余额'
    }
  },
  onShow: function() {
    this.refreshPage()
  },
  methods: {
    formatCount: function(value) {
      return formatCompactCount(value)
    },
    refreshPage: function() {
      this.loggedIn = session.isLoggedIn()
      this.settingMap = settingsStore.getSettingMap()
      if (!this.loggedIn) {
        this.profile = buildDefaultProfile()
        this.incentiveCenter = buildDefaultIncentiveCenter()
        this.unreadCount = 0
        resetPreviewState(this)
        return
      }
      this.loadProfile()
      this.loadIncentiveCenter()
      this.loadUnreadCount()
      this.loadPreviewData()
    },
    loadProfile: function() {
      var self = this
      return api.getMyProfile()
        .then(function(data) {
          self.profile = mergeProfile(data)
        })
        .catch(function(error) {
          self.handleRequestError(error, '个人资料加载失败')
        })
    },
    loadIncentiveCenter: function() {
      var self = this
      return api.getMyIncentiveCenter()
        .then(function(data) {
          self.incentiveCenter = mergeIncentiveCenter(data)
        })
        .catch(function(error) {
          self.handleRequestError(error, '激励中心暂时不可用')
        })
    },
    loadUnreadCount: function() {
      var self = this
      return api.getUnreadMessageCount()
        .then(function(data) {
          self.unreadCount = clampNumber(data && (data.unreadCount || data.count || data.total))
        })
        .catch(function(error) {
          self.handleRequestError(error, '未读消息加载失败', true)
        })
    },
    loadPreviewData: function() {
      var self = this
      self.previewLoading = true
      return Promise.all([
        api.listMyPosts(),
        api.listFavoritePosts(),
        api.listDrafts()
      ])
        .then(function(result) {
          self.postPreviews = normalizePreviewPosts(result[0], 'posts')
          self.favoritePreviews = normalizePreviewPosts(result[1], 'favorites')
          self.draftPreviews = normalizeDraftPreviews(result[2])
        })
        .catch(function(error) {
          self.handleRequestError(error, '个人内容加载失败')
          resetPreviewState(self)
        })
        .finally(function() {
          self.previewLoading = false
        })
    },
    handleRequestError: function(error, message, silent) {
      if (isAuthError(error)) {
        session.clearSession()
        this.loggedIn = false
        this.profile = buildDefaultProfile()
        this.incentiveCenter = buildDefaultIncentiveCenter()
        this.unreadCount = 0
        resetPreviewState(this)
        if (!silent) {
          uni.showToast({ title: '登录状态已失效，请重新登录', icon: 'none' })
        }
        return
      }
      if (!silent && message) {
        uni.showToast({ title: error.message || message, icon: 'none' })
      }
    },
    setPreviewTab: function(key) {
      this.activePreviewTab = key
    },
    openPreview: function(item) {
      if (!item || !item.source) {
        return
      }
      if (this.previewActionLoadingId && this.previewActionLoadingId === item.id) {
        return
      }
      if (item.kind === 'drafts') {
        uni.removeStorageSync(EDIT_POST_KEY)
        uni.setStorageSync(ACTIVE_DRAFT_KEY, item.source.id)
        uni.showToast({ title: '正在回到发布页继续编辑', icon: 'none' })
        setTimeout(function() {
          uni.switchTab({ url: '/pages/publish/index' })
        }, 300)
        return
      }
      var id = item.source.id
      if (!id) {
        return
      }
      uni.navigateTo({ url: '/pages/detail/index?id=' + encodeURIComponent(id) })
    },
    removeDraftPreview: function(item) {
      var self = this
      if (!item || item.kind !== 'drafts' || !item.source || !item.source.id || self.previewActionLoadingId) {
        return
      }
      uni.showModal({
        title: '删除草稿',
        content: '删除后将无法恢复，确认删除这条草稿吗？',
        confirmText: '删除',
        cancelText: '取消',
        success: function(result) {
          if (!result.confirm) {
            return
          }
          self.previewActionLoadingId = item.id
          api.deleteDraft(item.source.id)
            .then(function() {
              if (uni.getStorageSync(ACTIVE_DRAFT_KEY) === item.source.id) {
                uni.removeStorageSync(ACTIVE_DRAFT_KEY)
              }
              self.draftPreviews = self.draftPreviews.filter(function(draft) {
                return draft.id !== item.id
              })
              uni.showToast({ title: '草稿已删除', icon: 'none' })
            })
            .catch(function(error) {
              if (isAuthError(error)) {
                session.clearSession()
                self.loggedIn = false
                self.profile = buildDefaultProfile()
                self.incentiveCenter = buildDefaultIncentiveCenter()
                self.unreadCount = 0
                resetPreviewState(self)
                uni.showToast({ title: '登录状态已失效，请重新登录', icon: 'none' })
                return
              }
              uni.showToast({ title: error.message || '删除草稿失败', icon: 'none' })
            })
            .finally(function() {
              self.previewActionLoadingId = ''
            })
        }
      })
    },
    openCurrentTabPage: function() {
      if (this.activePreviewTab === 'favorites') {
        this.go('/pages/favorites/index')
        return
      }
      if (this.activePreviewTab === 'drafts') {
        uni.switchTab({ url: '/pages/publish/index' })
        return
      }
      uni.switchTab({ url: '/pages/publish/index' })
    },
    handleWithdraw: function() {
      var self = this
      if (!self.loggedIn) {
        self.goLogin()
        return
      }
      if (self.withdrawing) {
        return
      }
      if (!self.incentiveCenter.canWithdraw) {
        uni.showToast({ title: self.incentiveCenter.withdrawHint || '当前暂无可提收益', icon: 'none' })
        return
      }
      uni.showModal({
        title: '申请提现',
        content: '本次将申请提现 ' + self.incentiveCenter.availableAmount + '，确认继续吗？',
        confirmText: '确认',
        success: function(result) {
          if (!result.confirm) {
            return
          }
          self.withdrawing = true
          api.requestIncentiveWithdraw()
            .then(function() {
              uni.showToast({ title: '提现申请已提交', icon: 'none' })
              self.loadIncentiveCenter()
            })
            .catch(function(error) {
              self.handleRequestError(error, '提现申请失败')
            })
            .finally(function() {
              self.withdrawing = false
            })
        }
      })
    },
    go: function(url) {
      if (!url) {
        return
      }
      if (TAB_PAGES[url]) {
        uni.switchTab({ url: url })
        return
      }
      uni.navigateTo({ url: url })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    logout: function() {
      session.clearSession()
      this.loggedIn = false
      this.profile = buildDefaultProfile()
      this.incentiveCenter = buildDefaultIncentiveCenter()
      this.unreadCount = 0
      resetPreviewState(this)
      uni.showToast({ title: '已退出登录', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.profile-shell {
  min-height: 100vh;
  padding: calc(28rpx + env(safe-area-inset-top)) 32rpx calc(176rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at top left, rgba(253, 210, 167, 0.28), transparent 34%),
    radial-gradient(circle at top right, rgba(68, 165, 255, 0.18), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f5f6f7 44%, #eef4fa 100%);
  box-sizing: border-box;
}

.profile-guest-card,
.profile-identity-card,
.profile-empty-card {
  background: rgba(255, 255, 255, 0.84);
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 28rpx 56rpx rgba(25, 52, 87, 0.07);
  backdrop-filter: blur(28rpx);
}

.profile-guest-card {
  margin-top: 0;
  border-radius: 36rpx;
  padding: 44rpx 40rpx;
}

.profile-guest-badge {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(68, 165, 255, 0.14);
  color: #005e9f;
  font-size: 22rpx;
  font-weight: 700;
}

.profile-guest-title {
  margin-top: 28rpx;
  font-size: 42rpx;
  font-weight: 800;
  color: #24364a;
  line-height: 1.3;
}

.profile-guest-copy {
  margin-top: 20rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #66768b;
}

.profile-guest-action,
.profile-empty-action,
.profile-income-action,
.profile-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-weight: 700;
}

.profile-guest-action {
  margin-top: 32rpx;
  height: 96rpx;
  background: linear-gradient(90deg, #005e9f 0%, #44a5ff 100%);
  color: #edf3ff;
  font-size: 28rpx;
  box-shadow: 0 20rpx 40rpx rgba(0, 94, 159, 0.22);
}

.profile-hero {
  position: relative;
  height: 360rpx;
  margin: 0 -32rpx 0;
  overflow: hidden;
  background: linear-gradient(135deg, #6bb6ff 0%, #1e65ad 70%, #164c88 100%);
}

.profile-hero-image {
  width: 100%;
  height: 100%;
}

.profile-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(7, 31, 60, 0.08) 0%, rgba(7, 31, 60, 0.62) 100%);
}

.profile-hero-orb {
  position: absolute;
  right: -80rpx;
  bottom: -70rpx;
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  filter: blur(22rpx);
}

.profile-identity-card {
  position: relative;
  margin-top: -92rpx;
  border-radius: 40rpx;
  padding: 40rpx 36rpx 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-identity-avatar {
  width: 176rpx;
  height: 176rpx;
  margin-top: -120rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 10rpx solid rgba(255, 255, 255, 0.96);
  background: linear-gradient(135deg, #e2ecf8, #f6fbff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1f4680;
  font-size: 54rpx;
  font-weight: 800;
  box-shadow: 0 18rpx 36rpx rgba(24, 48, 86, 0.12);
}

.profile-identity-avatar-image {
  width: 100%;
  height: 100%;
}

.profile-identity-name {
  margin-top: 20rpx;
  font-size: 44rpx;
  font-weight: 800;
  color: #223247;
}

.profile-identity-school {
  margin-top: 12rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #005e9f;
}

.profile-meta-row {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14rpx;
}

.profile-meta-pill {
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(68, 165, 255, 0.12);
  color: #1f5c98;
  font-size: 22rpx;
  font-weight: 700;
}

.profile-identity-sign {
  margin-top: 20rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: #66768b;
}

.profile-metric-row {
  width: 100%;
  margin-top: 34rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.profile-metric-item {
  padding: 12rpx 0;
}

.profile-metric-value {
  font-size: 36rpx;
  font-weight: 800;
  color: #223247;
}

.profile-metric-label {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #7b8798;
  letter-spacing: 2rpx;
}

.profile-income-card {
  position: relative;
  margin-top: 32rpx;
  padding: 36rpx;
  border-radius: 40rpx;
  color: #edf3ff;
  overflow: hidden;
  background: linear-gradient(135deg, #005e9f 0%, #1678c8 52%, #44a5ff 100%);
  box-shadow: 0 28rpx 56rpx rgba(0, 94, 159, 0.2);
}

.profile-income-card::after {
  content: '';
  position: absolute;
  right: -68rpx;
  bottom: -88rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  filter: blur(20rpx);
}

.profile-income-head,
.profile-income-grid {
  position: relative;
  z-index: 1;
}

.profile-income-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.profile-income-title {
  font-size: 34rpx;
  font-weight: 700;
}

.profile-income-copy {
  margin-top: 10rpx;
  max-width: 420rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: rgba(237, 243, 255, 0.76);
}

.profile-income-link {
  flex-shrink: 0;
  padding: 16rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  font-size: 22rpx;
  font-weight: 700;
}

.profile-income-grid {
  margin-top: 28rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.profile-income-metric {
  padding: 28rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(18rpx);
}

.profile-income-kicker {
  font-size: 22rpx;
  color: rgba(237, 243, 255, 0.76);
}

.profile-income-value {
  margin-top: 12rpx;
  font-size: 40rpx;
  font-weight: 800;
}

.profile-income-action {
  position: relative;
  z-index: 1;
  margin-top: 24rpx;
  height: 92rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #005e9f;
  font-size: 28rpx;
  box-shadow: 0 16rpx 32rpx rgba(11, 37, 70, 0.12);
}

.profile-income-action-disabled {
  opacity: 0.72;
}

.profile-quick-grid {
  margin-top: 32rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18rpx;
}

.profile-quick-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.profile-quick-item-alert {
  transform: translateY(-2rpx);
}

.profile-quick-icon {
  width: 108rpx;
  height: 108rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.86);
  border: 2rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 18rpx 34rpx rgba(25, 52, 87, 0.07);
  color: #005e9f;
  font-size: 34rpx;
  font-weight: 800;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.profile-quick-icon-activity {
  background: linear-gradient(135deg, rgba(196, 245, 228, 0.98), rgba(232, 251, 245, 0.96));
  color: #1b6b58;
}

.profile-quick-icon-profile {
  background: linear-gradient(135deg, rgba(232, 241, 255, 0.98), rgba(247, 250, 255, 0.96));
  color: #1f63ac;
}

.profile-quick-icon-message {
  background: linear-gradient(135deg, rgba(230, 245, 255, 0.98), rgba(245, 251, 255, 0.96));
  color: #166f9f;
}

.profile-quick-icon-message-active {
  position: relative;
  background: linear-gradient(135deg, #1f7cd8 0%, #46b0ff 100%);
  color: #edf7ff;
  border-color: transparent;
  box-shadow: 0 22rpx 40rpx rgba(0, 94, 159, 0.2);
}

.profile-quick-icon-message-active::after {
  content: '';
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #ff5e7a;
  box-shadow: 0 0 0 6rpx rgba(255, 94, 122, 0.16);
}

.profile-quick-icon-settings {
  background: linear-gradient(135deg, rgba(239, 243, 250, 0.98), rgba(249, 251, 255, 0.96));
  color: #4c6785;
}

.profile-quick-label {
  font-size: 22rpx;
  font-weight: 700;
  color: #6b7788;
}

.profile-quick-label-alert {
  color: #1f63ac;
}

.profile-quick-badge {
  position: absolute;
  top: -8rpx;
  right: 10rpx;
  min-width: 38rpx;
  height: 38rpx;
  padding: 0 10rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fb5151;
  color: #ffefee;
  font-size: 18rpx;
  font-weight: 700;
  box-shadow: 0 10rpx 24rpx rgba(179, 27, 37, 0.22);
}

.profile-tab-row {
  margin-top: 40rpx;
  padding: 0 8rpx;
  display: flex;
  gap: 40rpx;
  border-bottom: 2rpx solid rgba(117, 119, 120, 0.12);
}

.profile-tab {
  position: relative;
  padding: 0 0 22rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #7a8698;
}

.profile-tab-active {
  color: #005e9f;
}

.profile-tab-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #005e9f 0%, #44a5ff 100%);
}

.profile-preview-grid {
  margin-top: 28rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.profile-preview-card,
.profile-preview-skeleton {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 28rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18rpx 40rpx rgba(25, 52, 87, 0.06);
}

.profile-preview-skeleton {
  background:
    linear-gradient(90deg, rgba(238, 243, 247, 0.88) 25%, rgba(248, 251, 255, 0.98) 37%, rgba(238, 243, 247, 0.88) 63%);
  background-size: 300% 100%;
  animation: profileShimmer 1.4s infinite linear;
}

.profile-preview-image {
  width: 100%;
  height: 100%;
}

.profile-preview-delete {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88rpx;
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: rgba(15, 23, 42, 0.46);
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 700;
  backdrop-filter: blur(12rpx);
}

.profile-preview-delete-loading {
  background: rgba(0, 94, 159, 0.82);
}

.profile-preview-fallback {
  width: 100%;
  height: 100%;
  padding: 24rpx;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(135deg, rgba(219, 232, 246, 0.98), rgba(246, 250, 255, 0.98));
}

.profile-preview-fallback-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #264061;
  line-height: 1.5;
}

.profile-preview-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 52rpx 20rpx 20rpx;
  background: linear-gradient(180deg, rgba(12, 15, 16, 0) 0%, rgba(12, 15, 16, 0.65) 100%);
}

.profile-preview-metric {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 700;
}

.profile-empty-card {
  margin-top: 28rpx;
  border-radius: 36rpx;
  padding: 42rpx 36rpx;
}

.profile-empty-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #24364a;
}

.profile-empty-copy {
  margin-top: 16rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: #67788d;
}

.profile-empty-action {
  margin-top: 28rpx;
  height: 88rpx;
  border-radius: 28rpx;
  background: linear-gradient(90deg, #005e9f 0%, #44a5ff 100%);
  color: #edf3ff;
  font-size: 27rpx;
  box-shadow: 0 18rpx 36rpx rgba(0, 94, 159, 0.2);
}

.profile-logout {
  margin-top: 32rpx;
  height: 92rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.76);
  border: 2rpx solid rgba(255, 255, 255, 0.88);
  color: #6b7788;
  font-size: 28rpx;
  box-shadow: 0 18rpx 34rpx rgba(25, 52, 87, 0.06);
}

@keyframes profileShimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
