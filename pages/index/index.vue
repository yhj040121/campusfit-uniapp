<template>
  <view class="page-shell home-shell">
    <view class="page-header home-header">
      <view class="home-header-copy">
        <view class="campus-ribbon">CampusFit 校园穿搭</view>
        <view class="page-title">把校园日常穿成一张会被收藏的公告</view>
        <view class="page-desc">围绕早八、图书馆、社团活动和约会场景，把真实穿搭、预算建议和导购线索整理成轻盈好逛的信息流。</view>
      </view>
      <view class="icon-action home-message" @click="goMessages">
        消息
        <view v-if="unreadCount > 0" :class="unreadCount > 9 ? 'badge-count' : 'badge-dot'">{{ unreadBadgeText }}</view>
      </view>
    </view>

    <view class="hero-card home-hero">
      <view class="hero-badge">校园公告栏</view>
      <view class="hero-title">本周值得抄作业的清爽穿搭</view>
      <view class="hero-copy">把“好看”和“适合大学生日常”同时做好：看得快、筛得准、买得理性。</view>
      <view class="hero-metrics">
        <view class="hero-metric">
          <text class="hero-metric-value">{{ outfits.length }}</text>
          <text class="hero-metric-label">推荐内容</text>
        </view>
        <view class="hero-metric">
          <text class="hero-metric-value">{{ featuredActivities.length }}</text>
          <text class="hero-metric-label">热门活动</text>
        </view>
        <view class="hero-metric">
          <text class="hero-metric-value">{{ unreadCount }}</text>
          <text class="hero-metric-label">未读提醒</text>
        </view>
      </view>
    </view>

    <view class="search-bar home-search" @click="goSearch">
      <view class="search-icon">搜</view>
      <view class="search-text">搜索场景、单品、博主或预算</view>
      <view class="search-enter">去发现</view>
    </view>

    <view class="section-head">
      <view>
        <view class="section-title">热门活动</view>
        <view class="section-subtitle">把活动与内容推荐放到同一屏里</view>
      </view>
      <view class="float-link" @click="goActivityCenter">查看全部</view>
    </view>
    <view class="grid-menu" v-if="featuredActivities.length">
      <view class="grid-item activity-entry-card" v-for="item in featuredActivities" :key="item.id" @click="goActivityCenter">
        <view class="grid-kicker">{{ item.badge }}</view>
        <view class="grid-title">{{ item.title }}</view>
        <view class="grid-copy">{{ item.summary }}</view>
        <view class="list-meta">{{ item.period }} · {{ item.progressText }}</view>
      </view>
    </view>

    <view class="section-head">
      <view>
        <view class="section-title">内容频道</view>
        <view class="section-subtitle">用校园场景做第一层筛选</view>
      </view>
      <view class="float-link" @click="refreshHome">刷新内容</view>
    </view>
    <view class="chip-row channel-row">
      <view
        v-for="item in tabs"
        :key="item"
        :class="['chip', activeTab === item ? 'chip-active' : 'chip-outline']"
        @click="activeTab = item"
      >
        {{ item }}
      </view>
    </view>

    <view class="feature-note">
      <view class="feature-label">本周专题</view>
      <view class="feature-title">适合校园高频场景的清爽春季穿搭</view>
      <view class="feature-copy">重点关注“图书馆久坐也舒适”“社团合照更出片”“百元预算也显干净”这三类真实需求。</view>
    </view>

    <view class="section-head">
      <view class="section-title">穿搭信息流</view>
      <view class="section-subtitle">像翻公告栏一样浏览校园灵感</view>
    </view>
    <view v-if="listLoading">
      <view class="skeleton-card" v-for="item in 2" :key="'skeleton-' + item">
        <view class="skeleton-block"></view>
        <view class="skeleton-line medium"></view>
        <view class="skeleton-line"></view>
        <view class="skeleton-line short"></view>
      </view>
    </view>
    <view v-else-if="listFailed" class="status-banner status-banner-error">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">推荐内容暂时没有加载出来</view>
          <view class="status-banner-copy">可以稍后再试一次，或先通过搜索与活动中心继续浏览。</view>
        </view>
        <view class="status-link" @click="refreshHome">重试</view>
      </view>
    </view>
    <view v-else-if="outfits.length">
      <view class="look-card bulletin-card" v-for="item in outfits" :key="item.id" @click="goDetail(item.id)">
        <view class="look-cover bulletin-cover">
          <view class="cover-tag">{{ item.coverTag }}</view>
          <view class="cover-title">{{ item.title }}</view>
          <view class="cover-copy">{{ item.subtitle }}</view>
          <view class="bulletin-pin"></view>
        </view>
        <view class="bulletin-tags">
          <view class="mini-tag">{{ item.scene }}</view>
          <view class="mini-tag">{{ item.style }}</view>
          <view class="mini-tag">预算 {{ item.budget }}</view>
        </view>
        <view class="text-copy">{{ item.desc }}</view>
        <view class="meta-line bulletin-meta">
          <view class="meta-left">
            <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
            <view>
              <view class="meta-name">{{ item.user }}</view>
              <view class="meta-school">{{ item.school }}</view>
            </view>
          </view>
          <view class="stats-line">
            <view class="stat-text">赞 {{ item.likes }}</view>
            <view class="stat-text">评 {{ item.comments }}</view>
            <view class="stat-text">藏 {{ item.saves }}</view>
          </view>
        </view>
      </view>
    </view>
    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">暂时还没有推荐内容</view>
      <view class="text-copy">先去搜索页按场景筛选，或者看看当前正在进行的活动专题。</view>
    </view>

    <view class="bottom-gap"></view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

export default {
  data: function() {
    return {
      tabs: ['推荐', '热门', '校园', '场景'],
      activeTab: '推荐',
      outfits: [],
      featuredActivities: [],
      listLoading: false,
      listFailed: false,
      unreadCount: 0
    }
  },
  computed: {
    unreadBadgeText: function() {
      return this.unreadCount > 99 ? '99+' : String(this.unreadCount)
    }
  },
  onShow: function() {
    this.loadActivities()
    this.loadRecommendations()
    this.loadUnreadCount()
  },
  methods: {
    loadActivities: function() {
      var self = this
      api.listFeaturedActivities()
        .then(function(list) {
          self.featuredActivities = list || []
        })
        .catch(function() {
          self.featuredActivities = []
        })
    },
    loadRecommendations: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
      api.listRecommendations()
        .then(function(list) {
          self.outfits = list || []
          self.listFailed = false
        })
        .catch(function() {
          self.outfits = []
          self.listFailed = true
        })
        .finally(function() {
          self.listLoading = false
        })
    },
    loadUnreadCount: function() {
      var self = this
      if (!session.isLoggedIn()) {
        self.unreadCount = 0
        return
      }
      api.getUnreadMessageCount()
        .then(function(count) {
          self.unreadCount = Number(count || 0)
        })
        .catch(function() {
          self.unreadCount = 0
        })
    },
    goSearch: function() {
      uni.switchTab({ url: '/pages/search/index' })
    },
    goActivityCenter: function() {
      uni.navigateTo({ url: '/pages/activity/index' })
    },
    goDetail: function(id) {
      uni.navigateTo({ url: '/pages/detail/index?id=' + id })
    },
    goMessages: function() {
      if (!session.isLoggedIn()) {
        uni.navigateTo({ url: '/pages/login/index' })
        return
      }
      uni.navigateTo({ url: '/pages/messages/index' })
    },
    refreshHome: function() {
      this.loadActivities()
      this.loadRecommendations()
      this.loadUnreadCount()
      uni.showToast({ title: '首页已刷新', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.home-shell {
  padding-top: 34rpx;
}

.campus-ribbon {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.84);
  color: #4699cf;
  font-size: 22rpx;
  letter-spacing: 2rpx;
  box-shadow: 0 12rpx 24rpx rgba(80, 150, 193, 0.1);
}

.home-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.home-header-copy {
  flex: 1;
  min-width: 0;
}

.home-message {
  margin-top: 12rpx;
  width: 96rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 24rpx;
}

.home-hero {
  margin-top: 20rpx;
}

.hero-metrics {
  display: flex;
  gap: 16rpx;
  margin-top: 26rpx;
}

.hero-metric {
  flex: 1;
  padding: 18rpx 14rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10rpx);
}

.hero-metric-value {
  display: block;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 700;
}

.hero-metric-label {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.84);
  font-size: 22rpx;
}

.home-search {
  margin-top: -8rpx;
}

.activity-entry-card {
  position: relative;
  overflow: hidden;
}

.activity-entry-card::after {
  content: "";
  position: absolute;
  right: -16rpx;
  top: -18rpx;
  width: 90rpx;
  height: 90rpx;
  border-radius: 24rpx;
  background: rgba(103, 217, 175, 0.14);
  transform: rotate(18deg);
}

.search-enter {
  margin-left: auto;
  color: #46a0da;
  font-size: 22rpx;
  font-weight: 600;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}

.channel-row {
  margin-top: 12rpx;
}

.feature-note {
  position: relative;
  margin: 26rpx 0 14rpx;
  padding: 28rpx 28rpx 26rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx dashed rgba(106, 156, 192, 0.28);
  box-shadow: 0 14rpx 30rpx rgba(52, 114, 154, 0.08);
}

.feature-note::before {
  content: "";
  position: absolute;
  left: 26rpx;
  top: -10rpx;
  width: 110rpx;
  height: 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 180, 107, 0.5);
}

.feature-label {
  color: #4a9fd5;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.feature-title {
  margin-top: 14rpx;
  color: #243646;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.42;
}

.feature-copy {
  margin-top: 12rpx;
  color: #637888;
  font-size: 24rpx;
  line-height: 1.74;
}

.bulletin-card {
  overflow: hidden;
}

.bulletin-cover {
  min-height: 274rpx;
}

.bulletin-pin {
  position: absolute;
  right: 22rpx;
  top: 22rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 0 0 8rpx rgba(255, 255, 255, 0.18);
}

.bulletin-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.mini-tag {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(76, 169, 230, 0.1);
  color: #4a9acf;
  font-size: 22rpx;
}

.bulletin-meta {
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(112, 155, 188, 0.12);
}
</style>
