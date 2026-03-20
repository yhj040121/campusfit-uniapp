<template>
  <view class="page-shell results-shell">
    <view class="page-header">
      <view class="campus-ribbon">搜索结果</view>
      <view class="page-title">把关键词和校园标签组合成可抄作业的结果页</view>
      <view class="page-desc">关键词“{{ keyword || '未填写' }}”，场景“{{ filters.scene || '不限' }}”，风格“{{ filters.style || '不限' }}”，预算“{{ filters.budget || '不限' }}”。</view>
    </view>

    <view class="filter-summary-card">
      <view class="summary-kicker">结果同步状态</view>
      <view class="summary-line">{{ statusText }}</view>
      <view class="summary-line">当前共找到 {{ sortedResults.length }} 条匹配内容。</view>
    </view>

    <view :class="['status-banner', resultStateClass]">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">结果页状态</view>
          <view class="status-banner-copy">{{ resultStateText }}</view>
        </view>
        <view class="status-link" @click="refreshResults">刷新结果</view>
      </view>
      <view class="status-grid two-col">
        <view class="status-item">
          <view class="status-item-label">匹配结果</view>
          <text class="status-item-value">{{ sortedResults.length }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">排序方式</view>
          <text class="status-item-value">{{ sortLabel }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">关键词</view>
          <text class="status-item-value">{{ keyword || '未填写' }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">筛选条件</view>
          <text class="status-item-value">{{ activeFilterCount }} 项</text>
        </view>
      </view>
    </view>

    <view class="section-head">
      <view>
        <view class="section-title" style="margin-top:0;">排序方式</view>
        <view class="section-subtitle">按推荐热度、最新发布时间或收藏热度浏览</view>
      </view>
      <view class="float-link" @click="goSearch">重新搜索</view>
    </view>
    <view class="chip-row">
      <view :class="['chip', sortType === 'recommended' ? 'chip-active' : 'chip-outline']" @click="sortType = 'recommended'">推荐优先</view>
      <view :class="['chip', sortType === 'latest' ? 'chip-active' : 'chip-outline']" @click="sortType = 'latest'">最新发布</view>
      <view :class="['chip', sortType === 'saved' ? 'chip-active' : 'chip-outline']" @click="sortType = 'saved'">收藏最多</view>
    </view>

    <view v-if="resultLoading">
      <view class="skeleton-card" v-for="item in 2" :key="'result-skeleton-' + item">
        <view class="skeleton-block"></view>
        <view class="skeleton-line medium"></view>
        <view class="skeleton-line"></view>
      </view>
    </view>

    <view v-else-if="resultFailed" class="status-banner status-banner-error">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">搜索结果暂时不可用</view>
          <view class="status-banner-copy">接口请求失败时，这里会提供手动刷新入口，避免结果区直接留白。</view>
        </view>
        <view class="status-link" @click="refreshResults">重新加载</view>
      </view>
    </view>

    <view v-else-if="sortedResults.length">
      <view class="look-card bulletin-card" v-for="item in sortedResults" :key="item.id" @click="goDetail(item.id)">
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
      <view class="section-title" style="margin-top:0;">暂时没有匹配结果</view>
      <view class="text-copy">可以换一个关键词，或者回到搜索页调整场景、风格和预算筛选。</view>
      <button class="btn-primary" style="margin-top:20rpx;" @click="goSearch">返回搜索页</button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')

export default {
  data: function() {
    return {
      keyword: '',
      filters: {
        scene: '',
        style: '',
        budget: ''
      },
      results: [],
      sortType: 'recommended',
      statusText: '正在同步搜索结果...',
      resultLoading: false,
      resultFailed: false
    }
  },
  computed: {
    sortedResults: function() {
      var list = (this.results || []).slice(0)
      if (this.sortType === 'saved') {
        list.sort(function(a, b) {
          return (b.saves || 0) - (a.saves || 0)
        })
        return list
      }
      if (this.sortType === 'latest') {
        list.sort(function(a, b) {
          return String(b.id).localeCompare(String(a.id))
        })
        return list
      }
      list.sort(function(a, b) {
        return ((b.likes || 0) + (b.saves || 0)) - ((a.likes || 0) + (a.saves || 0))
      })
      return list
    },
    activeFilterCount: function() {
      var total = 0
      if (this.filters.scene) {
        total += 1
      }
      if (this.filters.style) {
        total += 1
      }
      if (this.filters.budget) {
        total += 1
      }
      return total
    },
    sortLabel: function() {
      if (this.sortType === 'latest') {
        return '最新发布'
      }
      if (this.sortType === 'saved') {
        return '收藏最多'
      }
      return '推荐优先'
    },
    resultStateClass: function() {
      if (this.resultLoading) {
        return 'status-banner-warning'
      }
      if (this.resultFailed) {
        return 'status-banner-error'
      }
      return 'status-banner-success'
    },
    resultStateText: function() {
      if (this.resultLoading) {
        return '正在同步搜索关键词和筛选结果。'
      }
      if (this.resultFailed) {
        return '结果页当前未能成功连接接口，建议刷新后重试。'
      }
      if (!this.sortedResults.length) {
        return '当前筛选组合没有匹配到内容，可以回到搜索页调整条件。'
      }
      return '结果页状态正常，可以继续浏览详情或切换排序。'
    }
  },
  onLoad: function(options) {
    this.keyword = options && options.keyword ? decodeURIComponent(options.keyword) : ''
    this.filters.scene = options && options.scene ? decodeURIComponent(options.scene) : ''
    this.filters.style = options && options.style ? decodeURIComponent(options.style) : ''
    this.filters.budget = options && options.budget ? decodeURIComponent(options.budget) : ''
    this.loadResults()
  },
  methods: {
    loadResults: function() {
      var self = this
      self.resultLoading = true
      self.resultFailed = false
      api.searchPosts(self.keyword, self.filters)
        .then(function(list) {
          self.results = list || []
          self.statusText = '搜索结果已同步：' + (api.getActiveBaseUrl() || 'Spring Boot')
        })
        .catch(function() {
          self.results = []
          self.resultFailed = true
          self.statusText = '后端搜索结果暂时不可用。'
        })
        .finally(function() {
          self.resultLoading = false
        })
    },
    refreshResults: function() {
      this.loadResults()
      uni.showToast({ title: '正在刷新搜索结果', icon: 'none' })
    },
    goDetail: function(id) {
      uni.navigateTo({ url: '/pages/detail/index?id=' + id })
    },
    goSearch: function() {
      uni.switchTab({ url: '/pages/search/index' })
    }
  }
}
</script>

<style>
.mini-tag {
  display: inline-flex;
  align-items: center;
  margin-right: 12rpx;
  margin-bottom: 12rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(87, 189, 240, 0.12);
  color: var(--campus-primary);
  font-size: 22rpx;
}

.bulletin-tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 18rpx;
}

.bulletin-cover {
  position: relative;
}

.bulletin-pin {
  position: absolute;
  right: 22rpx;
  top: 20rpx;
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 8rpx 16rpx rgba(73, 183, 237, 0.18);
}
</style>
