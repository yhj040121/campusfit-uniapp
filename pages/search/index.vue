<template>
  <view class="page-shell search-shell">
    <view class="search-entry-card">
      <view class="search-entry-box">
        <view class="search-entry-icon">搜</view>
        <input
          class="search-entry-input"
          v-model="keyword"
          placeholder="搜索校园趋势、内容或品牌"
          confirm-type="search"
          @confirm="submitSearch"
        />
      </view>
      <view class="search-entry-button" @click="submitSearch">搜索</view>
    </view>

    <view class="search-section-card">
      <view class="search-section-head">
        <view class="search-section-title">最近搜索</view>
        <view v-if="history.length" class="search-section-action" @click="clearHistory">清空</view>
      </view>

      <view v-if="history.length" class="search-chip-row">
        <view v-for="item in history" :key="item" class="search-chip search-chip-history">
          <view class="search-chip-text" @click="useKeyword(item)">{{ item }}</view>
          <view class="search-chip-remove" @click.stop="removeHistoryItem(item)">×</view>
        </view>
      </view>
      <view v-else class="search-empty-copy">还没有最近搜索，试着搜一个校园关键词吧。</view>
    </view>

    <view class="search-section-card">
      <view class="search-section-head">
        <view class="search-section-title">热门搜索</view>
        <view class="search-section-meta">大家都在看</view>
      </view>
      <view class="search-chip-row">
        <view class="search-chip search-chip-hot" v-for="item in hot" :key="item" @click="useKeyword(item)">{{ item }}</view>
      </view>
    </view>

    <view class="search-filter-card">
      <view class="search-filter-title">精准筛选</view>
      <view class="search-filter-copy">先挑场景、风格和预算，再带着条件进入搜索结果页。</view>

      <view class="search-filter-group">
        <view class="search-filter-label">场景</view>
        <view class="search-chip-row">
          <view
            v-for="item in sceneTags"
            :key="'scene-' + item"
            :class="['search-chip', filters.scene === item ? 'search-chip-active' : 'search-chip-soft']"
            @click="setFilter('scene', item)"
          >
            {{ item }}
          </view>
        </view>
      </view>

      <view class="search-filter-group">
        <view class="search-filter-label">风格</view>
        <view class="search-chip-row">
          <view
            v-for="item in styleTags"
            :key="'style-' + item"
            :class="['search-chip', filters.style === item ? 'search-chip-active' : 'search-chip-soft']"
            @click="setFilter('style', item)"
          >
            {{ item }}
          </view>
        </view>
      </view>

      <view class="search-filter-group">
        <view class="search-filter-label">预算</view>
        <view class="search-chip-row">
          <view
            v-for="item in budgetTags"
            :key="'budget-' + item"
            :class="['search-chip', filters.budget === item ? 'search-chip-active' : 'search-chip-soft']"
            @click="setFilter('budget', item)"
          >
            {{ item }}
          </view>
        </view>
      </view>

      <view class="search-filter-actions">
        <view class="search-filter-action search-filter-action-light" @click="resetFilters">重置条件</view>
        <view class="search-filter-action search-filter-action-primary" @click="submitSearch">带条件搜索</view>
      </view>
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
  return ['校园健身', '学院风', '平价穿搭', '户外运动']
}

function normalizeText(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\s+/g, ' ').trim()
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
      if (Array.isArray(stored)) this.history = stored
    },
    saveHistory: function(keyword) {
      var safeKeyword = normalizeText(keyword)
      if (!safeKeyword) return
      var list = this.history.slice(0)
      var index = list.indexOf(safeKeyword)
      if (index > -1) list.splice(index, 1)
      list.unshift(safeKeyword)
      this.history = list.slice(0, 8)
      uni.setStorageSync(SEARCH_HISTORY_KEY, this.history)
    },
    removeHistoryItem: function(keyword) {
      var list = this.history.filter(function(item) {
        return item !== keyword
      })
      this.history = list
      uni.setStorageSync(SEARCH_HISTORY_KEY, list)
    },
    clearHistory: function() {
      this.history = []
      uni.setStorageSync(SEARCH_HISTORY_KEY, [])
      uni.showToast({ title: '已清空最近搜索', icon: 'none' })
    },
    loadTagOptions: function() {
      var self = this
      api.getTagOptions()
        .then(function(data) {
          self.sceneTags = data.sceneTags || self.sceneTags
          self.styleTags = data.styleTags || self.styleTags
          self.budgetTags = data.budgetTags || self.budgetTags
        })
        .catch(function() {})
    },
    useKeyword: function(word) {
      this.keyword = word
      this.submitSearch()
    },
    setFilter: function(type, value) {
      this.filters[type] = this.filters[type] === value ? '' : value
    },
    resetFilters: function() {
      this.filters = {
        scene: '',
        style: '',
        budget: ''
      }
      uni.showToast({ title: '已重置筛选条件', icon: 'none' })
    },
    submitSearch: function() {
      var safeKeyword = normalizeText(this.keyword)
      this.saveHistory(safeKeyword)
      var query = [
        'keyword=' + encodeURIComponent(safeKeyword || ''),
        'scene=' + encodeURIComponent(this.filters.scene || ''),
        'style=' + encodeURIComponent(this.filters.style || ''),
        'budget=' + encodeURIComponent(this.filters.budget || '')
      ].join('&')
      uni.navigateTo({ url: '/pages/results/index?' + query })
    }
  }
}
</script>

<style scoped>
.search-shell { min-height: 100vh; padding-top: calc(var(--status-bar-height) + 18rpx); padding-bottom: calc(120rpx + env(safe-area-inset-bottom)); background: radial-gradient(circle at 10% 0%, rgba(255,213,103,0.16), transparent 24%), radial-gradient(circle at 92% 2%, rgba(68,165,255,0.14), transparent 28%), linear-gradient(180deg, #f7f8fa 0%, #f5f6f7 48%, #f8f3eb 100%); }
.search-shell::before { top: 90rpx; right: -70rpx; width: 220rpx; height: 220rpx; background: radial-gradient(circle, rgba(68,165,255,0.16) 0%, rgba(68,165,255,0) 72%); }
.search-shell::after { bottom: 120rpx; left: -90rpx; width: 260rpx; height: 260rpx; background: radial-gradient(circle, rgba(177,239,216,0.22) 0%, rgba(177,239,216,0) 72%); }
.search-entry-card { display: grid; grid-template-columns: minmax(0, 1fr) 128rpx; gap: 12rpx; margin-bottom: 22rpx; }
.search-entry-box { display: flex; align-items: center; height: 82rpx; padding: 0 22rpx; border-radius: 28rpx; background: rgba(255,255,255,0.82); box-shadow: 0 16rpx 30rpx rgba(44,47,48,0.06); backdrop-filter: blur(22rpx); }
.search-entry-icon { width: 34rpx; height: 34rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; background: rgba(0,94,159,0.08); color: #005e9f; font-size: 18rpx; font-weight: 800; margin-right: 12rpx; flex-shrink: 0; }
.search-entry-input { flex: 1; min-width: 0; color: #2c2f30; font-size: 26rpx; font-weight: 700; }
.search-entry-button { display: flex; align-items: center; justify-content: center; border-radius: 28rpx; background: linear-gradient(135deg, #005e9f 0%, #44a5ff 100%); color: #edf3ff; font-size: 24rpx; font-weight: 700; box-shadow: 0 16rpx 28rpx rgba(0,94,159,0.18); }
.search-section-card,.search-filter-card { margin-bottom: 18rpx; padding: 26rpx; border-radius: 30rpx; background: rgba(255,255,255,0.82); box-shadow: 0 18rpx 42rpx rgba(44,47,48,0.05); backdrop-filter: blur(20rpx); }
.search-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; margin-bottom: 16rpx; }
.search-section-title,.search-filter-title { color: #1f2937; font-size: 30rpx; font-weight: 800; }
.search-section-action { min-width: 76rpx; height: 44rpx; padding: 0 14rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; background: rgba(0,94,159,0.08); color: #005e9f; font-size: 20rpx; font-weight: 700; }
.search-section-meta,.search-filter-copy,.search-empty-copy { color: #7c7f88; font-size: 22rpx; line-height: 1.6; }
.search-chip-row { display: flex; flex-wrap: wrap; gap: 12rpx; }
.search-chip { min-height: 56rpx; padding: 0 22rpx; border-radius: 999rpx; display: inline-flex; align-items: center; justify-content: center; font-size: 22rpx; font-weight: 700; }
.search-chip-soft,.search-chip-hot { background: rgba(239,241,242,0.92); color: #595c5d; border: 1rpx solid rgba(171,173,174,0.18); }
.search-chip-hot { background: rgba(255,255,255,0.9); color: #596579; }
.search-chip-active { background: linear-gradient(135deg, #005e9f 0%, #44a5ff 100%); color: #edf3ff; box-shadow: 0 14rpx 24rpx rgba(0,94,159,0.16); }
.search-chip-history { padding-right: 10rpx; background: rgba(239,241,242,0.92); color: #596579; border: 1rpx solid rgba(171,173,174,0.18); }
.search-chip-text { padding-left: 6rpx; padding-right: 10rpx; }
.search-chip-remove { width: 36rpx; height: 36rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.82); color: #8a8d91; font-size: 22rpx; font-weight: 700; }
.search-filter-copy { margin-top: 8rpx; }
.search-filter-group { margin-top: 20rpx; }
.search-filter-label { margin-bottom: 12rpx; color: #1f2937; font-size: 24rpx; font-weight: 700; }
.search-filter-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12rpx; margin-top: 24rpx; }
.search-filter-action { height: 72rpx; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 700; }
.search-filter-action-light { background: rgba(224,227,228,0.72); color: #595c5d; }
.search-filter-action-primary { background: linear-gradient(135deg, #005e9f 0%, #44a5ff 100%); color: #edf3ff; box-shadow: 0 18rpx 28rpx rgba(0,94,159,0.18); }
</style>
