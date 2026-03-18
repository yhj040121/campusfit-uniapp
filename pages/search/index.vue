<template>
  <view class="page-shell">
    <view class="page-header">
      <view class="page-title">搜索与筛选</view>
      <view class="page-desc">通过关键词结合场景、风格与预算，快速找到想看的校园穿搭内容。</view>
    </view>

    <view class="search-bar">
      <view class="search-icon">S</view>
      <input style="flex:1; font-size:26rpx;" v-model="keyword" placeholder="搜索场景、单品、博主或风格" />
    </view>
    <button class="btn-primary" style="margin-top:18rpx;" @click="submitSearch">立即搜索</button>

    <view class="panel-card">
      <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
    </view>

    <view class="section-title">历史搜索</view>
    <view class="chip-row">
      <view class="chip chip-outline" v-for="item in history" :key="item" @click="useKeyword(item)">{{ item }}</view>
    </view>

    <view class="section-title">热门搜索</view>
    <view class="chip-row">
      <view class="chip chip-active" v-for="item in hot" :key="item" @click="useKeyword(item)">{{ item }}</view>
    </view>

    <view class="section-title">场景</view>
    <view class="chip-row">
      <view v-for="item in sceneTags" :key="item" :class="['chip', filters.scene === item ? 'chip-active' : 'chip-outline']" @click="setFilter('scene', item)">{{ item }}</view>
    </view>

    <view class="section-title">风格</view>
    <view class="chip-row">
      <view v-for="item in styleTags" :key="item" :class="['chip', filters.style === item ? 'chip-active' : 'chip-outline']" @click="setFilter('style', item)">{{ item }}</view>
    </view>

    <view class="section-title">预算</view>
    <view class="chip-row">
      <view v-for="item in budgetTags" :key="item" :class="['chip', filters.budget === item ? 'chip-active' : 'chip-outline']" @click="setFilter('budget', item)">{{ item }}</view>
    </view>

    <view class="panel-card">
      <view class="text-main">当前筛选</view>
      <view class="text-copy">关键词?{{ keyword || '未设置' }} | 场景?{{ filters.scene || '不限' }} | 风格?{{ filters.style || '不限' }} | 预算?{{ filters.budget || '不限' }}</view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')

var SEARCH_HISTORY_KEY = 'campusfit_search_history'

function defaultHistory() {
  return ['图书馆', '早八', '社团活动']
}

function defaultHot() {
  return ['春季校园', '学院风', '平价穿搭', '图书馆穿搭']
}

export default {
  data: function() {
    return {
      keyword: '',
      history: defaultHistory(),
      hot: defaultHot(),
      sceneTags: ['早八', '图书馆', '社团活动', '约会'],
      styleTags: ['学院风', '极简', '运动休闲', '甜酷'],
      budgetTags: ['50-100', '100-150', '150-200', '200+'],
      statusText: '正在同步后端标签选项...',
      filters: {
        scene: '',
        style: '',
        budget: ''
      }
    }
  },
  onShow: function() {
    this.restoreHistory()
    this.loadTagOptions()
  },
  methods: {
    restoreHistory: function() {
      var stored = uni.getStorageSync(SEARCH_HISTORY_KEY)
      if (stored && stored.length) {
        this.history = stored
      }
    },
    saveHistory: function(keyword) {
      if (!keyword) {
        return
      }
      var list = this.history.slice(0)
      var index = list.indexOf(keyword)
      if (index > -1) {
        list.splice(index, 1)
      }
      list.unshift(keyword)
      this.history = list.slice(0, 8)
      uni.setStorageSync(SEARCH_HISTORY_KEY, this.history)
    },
    loadTagOptions: function() {
      var self = this
      api.getTagOptions()
        .then(function(data) {
          self.sceneTags = data.sceneTags || self.sceneTags
          self.styleTags = data.styleTags || self.styleTags
          self.budgetTags = data.budgetTags || self.budgetTags
          self.statusText = '筛选项已同步：' + (api.getActiveBaseUrl() || '后端服务')
        })
        .catch(function() {
          self.statusText = '后端标签暂时不可用，当前显示本地筛选项。'
        })
    },
    useKeyword: function(word) {
      this.keyword = word
    },
    setFilter: function(type, value) {
      this.filters[type] = this.filters[type] === value ? '' : value
    },
    submitSearch: function() {
      this.saveHistory(this.keyword)
      var query = [
        'keyword=' + encodeURIComponent(this.keyword || ''),
        'scene=' + encodeURIComponent(this.filters.scene || ''),
        'style=' + encodeURIComponent(this.filters.style || ''),
        'budget=' + encodeURIComponent(this.filters.budget || '')
      ].join('&')
      uni.navigateTo({ url: '/pages/results/index?' + query })
    }
  }
}
</script>

<style>
</style>
