<template>
  <view class="page-shell search-shell">
    <view class="hero-card search-hero">
      <view class="search-hero-head">
        <view class="hero-badge search-hero-badge">快速搜索</view>
      </view>
      <view class="hero-title search-hero-title">先选场景，再搜关键词</view>
      <view class="hero-copy search-hero-copy">缩小范围后再去结果页继续挑。</view>
      <view class="search-bar search-input-bar">
        <view class="search-icon">搜</view>
        <input class="search-input" v-model="keyword" placeholder="搜索场景、单品、博主或风格" />
        <view class="search-submit-inline" @click="submitSearch">搜索</view>
      </view>
    </view>

    <view class="filter-summary-card search-summary-card">
      <view class="search-summary-head">
        <view class="summary-kicker">当前筛选</view>
        <view class="float-link" @click="refreshFilters">刷新筛选</view>
      </view>
      <view v-if="summaryItems.length" class="chip-row search-summary-row">
        <view class="search-summary-chip" v-for="item in summaryItems" :key="item">{{ item }}</view>
      </view>
      <view v-else class="summary-empty">还没开始筛选，先选场景或输入关键词。</view>
    </view>

    <view class="section-head">
      <view class="section-title">搜索记录</view>
      <view class="section-subtitle search-section-meta">最近使用</view>
    </view>
    <view class="chip-row history-row">
      <view class="chip chip-outline" v-for="item in history" :key="item" @click="useKeyword(item)">{{ item }}</view>
    </view>

    <view class="section-head">
      <view class="section-title">热门搜索</view>
      <view class="section-subtitle search-section-meta">大家在看</view>
    </view>
    <view class="chip-row hot-row">
      <view class="chip chip-active" v-for="item in hot" :key="item" @click="useKeyword(item)">{{ item }}</view>
    </view>

    <view class="panel-card filter-panel filter-panel-scene">
      <view class="filter-head">
        <view class="section-title" style="margin-top:0;">场景</view>
      </view>
      <view class="chip-row filter-chip-row">
        <view
          v-for="item in sceneTags"
          :key="item"
          :class="['chip', filters.scene === item ? 'chip-active' : 'chip-outline']"
          @click="setFilter('scene', item)"
        >
          {{ item }}
        </view>
      </view>
    </view>

    <view class="panel-card filter-panel filter-panel-style">
      <view class="filter-head">
        <view class="section-title" style="margin-top:0;">风格</view>
      </view>
      <view class="chip-row filter-chip-row">
        <view
          v-for="item in styleTags"
          :key="item"
          :class="['chip', filters.style === item ? 'chip-active' : 'chip-outline']"
          @click="setFilter('style', item)"
        >
          {{ item }}
        </view>
      </view>
    </view>

    <view class="panel-card filter-panel filter-panel-budget">
      <view class="filter-head">
        <view class="section-title" style="margin-top:0;">预算</view>
      </view>
      <view class="chip-row filter-chip-row">
        <view
          v-for="item in budgetTags"
          :key="item"
          :class="['chip', filters.budget === item ? 'chip-active' : 'chip-outline']"
          @click="setFilter('budget', item)"
        >
          {{ item }}
        </view>
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
      tagLoading: false,
      tagFailed: false,
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
  computed: {
    canSearch: function() {
      return !!this.keyword || !!this.filters.scene || !!this.filters.style || !!this.filters.budget
    },
    summaryItems: function() {
      var list = []
      if (this.keyword) {
        list.push('关键词 ' + this.keyword)
      }
      if (this.filters.scene) {
        list.push('场景 ' + this.filters.scene)
      }
      if (this.filters.style) {
        list.push('风格 ' + this.filters.style)
      }
      if (this.filters.budget) {
        list.push('预算 ' + this.filters.budget)
      }
      return list
    }
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
      self.tagLoading = true
      self.tagFailed = false
      api.getTagOptions()
        .then(function(data) {
          self.sceneTags = data.sceneTags || self.sceneTags
          self.styleTags = data.styleTags || self.styleTags
          self.budgetTags = data.budgetTags || self.budgetTags
          self.tagFailed = false
        })
        .catch(function() {
          self.tagFailed = true
        })
        .finally(function() {
          self.tagLoading = false
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
    },
    refreshFilters: function() {
      this.loadTagOptions()
      uni.showToast({ title: '正在刷新筛选项', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.search-shell {
  padding-top: 10rpx;
}

.search-hero {
  margin-top: 0;
  padding: 18rpx 18rpx;
  border-radius: 28rpx;
}

.search-hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.search-hero-badge {
  padding: 8rpx 14rpx;
  font-size: 18rpx;
}

.search-hero-title {
  margin-top: 10rpx;
  font-size: 36rpx;
  line-height: 1.14;
}

.search-hero-copy {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.4;
}

.search-input-bar {
  margin-top: 16rpx;
  gap: 12rpx;
  padding: 10rpx 10rpx 10rpx 16rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.94);
}

.search-input {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: #233544;
}

.search-submit-inline {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92rpx;
  height: 64rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, rgba(201, 49, 91, 0.96), rgba(45, 87, 217, 0.92));
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
}

.filter-summary-card {
  margin-top: 14rpx;
}

.section-head,
.filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
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

.filter-summary-card {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx dashed rgba(104, 153, 188, 0.26);
  box-shadow: 0 10rpx 22rpx rgba(52, 114, 154, 0.06);
}

.summary-kicker {
  color: #50a0d6;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.search-summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.filter-panel {
  margin-top: 18rpx;
}

.search-summary-card {
  padding-top: 18rpx;
}

.search-summary-row {
  gap: 10rpx;
  margin-top: 12rpx;
}

.search-summary-chip {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 250, 245, 0.94);
  border: 1rpx solid rgba(43, 24, 34, 0.08);
  color: var(--campus-text-soft);
  font-size: 20rpx;
}

.summary-empty {
  margin-top: 12rpx;
  color: var(--campus-text-muted);
  font-size: 22rpx;
  line-height: 1.5;
}

.search-section-meta {
  color: var(--campus-text-muted);
  font-size: 20rpx;
}

.history-row,
.hot-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-right: 0;
  margin-bottom: 0;
}

.history-row .chip,
.hot-row .chip {
  margin: 0;
  min-height: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  flex: 0 0 auto;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 1.35;
}

.filter-panel {
  padding-top: 22rpx;
}

.filter-chip-row {
  gap: 10rpx;
}

.filter-chip-row .chip {
  margin-right: 0;
  margin-bottom: 0;
  min-height: 0;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
}
</style>
