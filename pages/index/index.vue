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
          <text class="hero-metric-value">{{ tabs.length }}</text>
          <text class="hero-metric-label">校园频道</text>
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
    <view class="grid-menu">
      <view class="grid-item activity-entry-card" v-for="item in featuredActivities" :key="item.id" @click="goActivityCenter">
        <view class="grid-kicker">{{ item.badge }}</view>
        <view class="grid-title">{{ item.title }}</view>
        <view class="grid-copy">{{ item.summary }}</view>
        <view class="list-meta">{{ item.period }} · {{ item.progressText }}</view>
      </view>
    </view>

    <view class="panel-card note-card">
      <view class="note-head">
        <view>
          <view class="text-main">系统状态</view>
          <view class="section-subtitle">联调与消息同步</view>
        </view>
        <view class="note-stamp">LIVE</view>
      </view>
      <view class="text-copy">{{ statusText }}</view>
      <view class="note-line"></view>
      <view class="text-copy">{{ unreadHint }}</view>
    </view>

    <view :class="['status-banner', homeStateClass]">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">首页内容状态</view>
          <view class="status-banner-copy">{{ homeStateText }}</view>
        </view>
        <view class="status-link" @click="refreshHome">刷新</view>
      </view>
      <view class="status-grid">
        <view class="status-item">
          <view class="status-item-label">推荐内容</view>
          <text class="status-item-value">{{ outfits.length }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">活动入口</view>
          <text class="status-item-value">{{ featuredActivities.length }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">消息状态</view>
          <text class="status-item-value">{{ sessionStateText }}</text>
        </view>
      </view>
    </view>

    <view class="section-head">
      <view class="section-title">内容频道</view>
      <view class="section-subtitle">用校园场景做第一层筛选</view>
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
          <view class="status-banner-title">推荐内容加载失败</view>
          <view class="status-banner-copy">当前已经切换到本地演示数据，你也可以再试一次，看看后端接口是否恢复。</view>
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
      <view class="section-title" style="margin-top:0;">暂无推荐内容</view>
      <view class="text-copy">后端接口连通后，推荐穿搭内容将在这里展示。</view>
    </view>

    <view class="section-head">
      <view class="section-title">快捷入口</view>
      <view class="section-subtitle">常用页面一键直达</view>
    </view>
    <view class="grid-menu">
      <view class="grid-item pinned-card" v-for="item in demos" :key="item.path" @click="goPage(item.path)">
        <view class="grid-kicker">直达</view>
        <view class="grid-title">{{ item.title }}</view>
        <view class="grid-copy">{{ item.copy }}</view>
      </view>
    </view>

    <view class="bottom-gap"></view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var activity = require('../../common/activity.js')
var session = require('../../common/session.js')

function fallbackRecommendations() {
  return [
    {
      id: 'look1',
      coverTag: '图书馆精选',
      title: '适合早八与图书馆的叠穿造型',
      subtitle: '蓝白层次清爽干净，适合学生日常路线。',
      desc: '白衬衫叠穿浅蓝针织马甲，搭配灰色百褶裙，既上镜又好穿。',
      user: '乔乔',
      avatar: 'Q',
      avatarClass: 'soft',
      school: '华东师范大学 | 大三',
      scene: '图书馆',
      style: '学院风',
      budget: '100-150',
      likes: 128,
      comments: 36,
      saves: 92
    },
    {
      id: 'look2',
      coverTag: '社团活力',
      title: '社团活动和下午校园散步穿搭',
      subtitle: '宽松版型搭配青春色彩，舒适又有活力。',
      desc: '薄荷绿连帽卫衣搭配乳白色工装裤，很适合社团招新和校园散步。',
      user: '安宁',
      avatar: 'A',
      avatarClass: 'alt',
      school: '上海大学 | 大二',
      scene: '社团活动',
      style: '运动休闲',
      budget: '50-100',
      likes: 96,
      comments: 18,
      saves: 54
    }
  ]
}

function buildDemos() {
  return [
    { title: '启动页', copy: '查看品牌入口与启动体验', path: '/pages/splash/index' },
    { title: '登录', copy: '手机号验证码登录', path: '/pages/login/index' },
    { title: '注册', copy: '完善校园身份信息', path: '/pages/register/index' },
    { title: '活动中心', copy: '查看热门专题与挑战活动', path: '/pages/activity/index' },
    { title: '搜索结果', copy: '查看筛选后的穿搭结果', path: '/pages/results/index?keyword=%E5%9B%BE%E4%B9%A6%E9%A6%86' },
    { title: '我的发布', copy: '管理已发布的穿搭内容', path: '/pages/my-posts/index' },
    { title: '消息通知', copy: '查看互动与收益提醒', path: '/pages/messages/index' }
  ]
}

export default {
  data: function() {
      return {
        tabs: ['推荐', '热门', '校园', '场景'],
        activeTab: '推荐',
        outfits: [],
        featuredActivities: [],
        listLoading: false,
        listFailed: false,
        unreadCount: 0,
        statusText: '正在连接后端服务...',
        demos: buildDemos()
      }
    },
  computed: {
    unreadBadgeText: function() {
      return this.unreadCount > 99 ? '99+' : String(this.unreadCount)
    },
    unreadHint: function() {
      if (!session.isLoggedIn()) {
        return '登录后可查看个人消息通知。'
      }
      if (this.unreadCount > 0) {
        return '当前有 ' + this.unreadCount + ' 条未读消息，点击右上角即可查看。'
      }
      return '暂无未读消息，可以安心逛逛推荐内容。'
    },
    homeStateClass: function() {
      if (this.listLoading) {
        return 'status-banner-warning'
      }
      if (this.listFailed) {
        return 'status-banner-error'
      }
      return 'status-banner-success'
    },
    homeStateText: function() {
      if (this.listLoading) {
        return '正在同步首页推荐与消息状态，稍等一下就能看到最新内容。'
      }
      if (this.listFailed) {
        return '后端推荐接口暂时不可用，当前已切换到本地演示内容。'
      }
      return '首页推荐、活动入口与消息提醒都已准备就绪，可以直接继续浏览。'
    },
    sessionStateText: function() {
      if (!session.isLoggedIn()) {
        return '游客'
      }
      return this.unreadCount > 0 ? '有未读' : '已同步'
    }
  },
  onShow: function() {
    this.loadActivities()
    this.loadRecommendations()
    this.loadUnreadCount()
  },
  methods: {
    loadActivities: function() {
      this.featuredActivities = activity.getFeaturedActivities()
    },
    loadRecommendations: function() {
      var self = this
      self.listLoading = true
      self.listFailed = false
      api.listRecommendations()
        .then(function(list) {
          self.outfits = list || []
          self.statusText = '已连接后端：' + (api.getActiveBaseUrl() || '后端服务')
          self.listFailed = false
        })
        .catch(function() {
          self.outfits = fallbackRecommendations()
          self.statusText = '后端暂时不可用，已显示本地演示推荐内容。'
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
    goPage: function(path) {
      uni.navigateTo({ url: path })
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
      uni.showToast({ title: '正在刷新首页', icon: 'none' })
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

.note-card {
  position: relative;
  overflow: hidden;
}

.note-card::after {
  content: "";
  position: absolute;
  right: -26rpx;
  top: -30rpx;
  width: 120rpx;
  height: 120rpx;
  border-radius: 28rpx;
  background: rgba(77, 171, 228, 0.08);
  transform: rotate(18deg);
}

.note-head,
.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}

.note-stamp {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(67, 198, 157, 0.14);
  color: #34a77f;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.note-line {
  height: 2rpx;
  margin: 18rpx 0 6rpx;
  background: linear-gradient(90deg, rgba(88, 186, 245, 0.2) 0%, rgba(88, 186, 245, 0) 100%);
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

.pinned-card {
  position: relative;
  overflow: hidden;
}

.pinned-card::before {
  content: "";
  position: absolute;
  right: 18rpx;
  top: 18rpx;
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: rgba(255, 180, 107, 0.84);
}

.grid-kicker {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.84);
  color: #67a7ce;
  font-size: 20rpx;
  font-weight: 700;
}
</style>
