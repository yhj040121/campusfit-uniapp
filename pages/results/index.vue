<template>
  <view class="page-shell">
    <view class="page-header">
      <view class="page-title">搜索结果</view>
      <view class="page-desc">关键词：{{ keyword || '全部穿搭' }} | 场景：{{ filters.scene || '不限' }} | 风格：{{ filters.style || '不限' }} | 预算：{{ filters.budget || '不限' }}</view>
    </view>

    <view class="panel-card">
      <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
    </view>

    <view class="chip-row">
      <view :class="['chip', sortType === 'recommended' ? 'chip-active' : 'chip-outline']" @click="sortType = 'recommended'">推荐</view>
      <view :class="['chip', sortType === 'latest' ? 'chip-active' : 'chip-outline']" @click="sortType = 'latest'">最新</view>
      <view :class="['chip', sortType === 'saved' ? 'chip-active' : 'chip-outline']" @click="sortType = 'saved'">收藏最多</view>
    </view>

    <view v-if="sortedResults.length">
      <view class="look-card" v-for="item in sortedResults" :key="item.id" @click="goDetail(item.id)">
        <view class="look-cover">
          <view class="cover-tag">{{ item.coverTag }}</view>
          <view class="cover-title">{{ item.title }}</view>
          <view class="cover-copy">{{ item.subtitle }}</view>
        </view>
        <view class="text-main" style="margin-top:18rpx; font-size:28rpx;">{{ item.scene }} | {{ item.style }} | 预算 {{ item.budget }}</view>
        <view class="text-copy">{{ item.desc }}</view>
        <view class="meta-line">
          <view class="meta-left">
            <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
            <view>
              <view class="meta-name">{{ item.user }}</view>
              <view class="meta-school">{{ item.school }}</view>
            </view>
          </view>
          <view class="stats-line">
            <view class="stat-text">点赞 {{ item.likes }}</view>
            <view class="stat-text">评论 {{ item.comments }}</view>
            <view class="stat-text">收藏 {{ item.saves }}</view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">暂无匹配结果</view>
      <view class="text-copy">可以尝试其他关键词，或适当放宽筛选条件。</view>
    </view>

    <button class="btn-secondary" style="margin-top:16rpx;" @click="loadMore">加载更多</button>
  </view>
</template>

<script>
var api = require('../../common/api.js')

function fallbackResults() {
  return []
}

function matchFilter(item, filters) {
  if (filters.scene && item.scene !== filters.scene) {
    return false
  }
  if (filters.style && item.style !== filters.style) {
    return false
  }
  if (filters.budget && item.budget !== filters.budget) {
    return false
  }
  return true
}

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
      statusText: '正在加载后端搜索结果...'
    }
  },
  computed: {
    filteredResults: function() {
      var result = []
      for (var i = 0; i < this.results.length; i += 1) {
        if (matchFilter(this.results[i], this.filters)) {
          result.push(this.results[i])
        }
      }
      return result
    },
    sortedResults: function() {
      var list = this.filteredResults.slice(0)
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
      api.searchPosts(self.keyword)
        .then(function(list) {
          self.results = list || []
          self.statusText = '已同步后端搜索结果：' + (api.getActiveBaseUrl() || '后端服务')
        })
        .catch(function() {
          self.results = fallbackResults()
          self.statusText = '后端搜索暂时不可用，暂时无法加载更多内容。'
        })
    },
    goDetail: function(id) {
      uni.navigateTo({ url: '/pages/detail/index?id=' + id })
    },
    loadMore: function() {
      uni.showToast({ title: '演示版暂只展示当前批次结果', icon: 'none' })
    }
  }
}
</script>

<style>
</style>
