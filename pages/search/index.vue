<template>
  <view class="page-shell search-shell">
    <view class="page-header">
      <view class="campus-ribbon">搜索灵感板</view>
      <view class="page-title">按场景把校园穿搭筛得更干净</view>
      <view class="page-desc">把“今天要去哪里”和“预算大概多少”说清楚，系统就能更快把适合你的内容翻出来。</view>
    </view>

    <view class="hero-card search-hero">
      <view class="hero-badge">快速检索</view>
      <view class="hero-title">关键词 + 标签筛选</view>
      <view class="hero-copy">适合先缩小范围，再去结果页做更精细的对比浏览。</view>
      <view class="search-bar search-input-bar">
        <view class="search-icon">搜</view>
        <input class="search-input" v-model="keyword" placeholder="搜索场景、单品、博主或风格" />
      </view>
      <button class="btn-primary search-submit" @click="submitSearch">立即搜索</button>
    </view>

    <view class="panel-card note-card">
      <view class="section-head">
        <view>
          <view class="text-main">筛选项同步状态</view>
          <view class="section-subtitle">标签来自后端接口</view>
        </view>
        <view class="note-stamp">FILTER</view>
      </view>
      <view class="text-copy">{{ statusText }}</view>
    </view>

    <view :class="['status-banner', searchStateClass]">
      <view class="status-banner-head">
        <view>
          <view class="status-banner-title">搜索准备度</view>
          <view class="status-banner-copy">{{ searchStateText }}</view>
        </view>
        <view class="status-link" @click="refreshFilters">刷新筛选</view>
      </view>
      <view class="status-grid two-col">
        <view class="status-item">
          <view class="status-item-label">关键词</view>
          <text class="status-item-value">{{ keyword ? '已输入' : '未输入' }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">已选筛选</view>
          <text class="status-item-value">{{ activeFilterCount }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">标签来源</view>
          <text class="status-item-value">{{ tagLoading ? '同步中' : (tagFailed ? '本地兜底' : '后端已连通') }}</text>
        </view>
        <view class="status-item">
          <view class="status-item-label">搜索动作</view>
          <text class="status-item-value">{{ canSearch ? '可搜索' : '可浏览全部' }}</text>
        </view>
      </view>
    </view>

    <view class="filter-summary-card">
      <view class="summary-kicker">当前筛选</view>
      <view class="summary-line">关键词：{{ keyword || '未设置' }}</view>
      <view class="summary-line">场景：{{ filters.scene || '不限' }}</view>
      <view class="summary-line">风格：{{ filters.style || '不限' }}</view>
      <view class="summary-line">预算：{{ filters.budget || '不限' }}</view>
    </view>

    <view class="section-head">
      <view class="section-title">搜索记录</view>
      <view class="section-subtitle">保留最近常用词</view>
    </view>
    <view class="chip-row">
      <view class="chip chip-outline" v-for="item in history" :key="item" @click="useKeyword(item)">{{ item }}</view>
    </view>

    <view class="section-head">
      <view class="section-title">热门搜索</view>
      <view class="section-subtitle">大家都在看什么</view>
    </view>
    <view class="chip-row">
      <view class="chip chip-active" v-for="item in hot" :key="item" @click="useKeyword(item)">{{ item }}</view>
    </view>

    <view class="panel-card filter-panel">
      <view class="filter-head">
        <view class="section-title" style="margin-top:0;">场景</view>
        <view class="section-subtitle">先确定你要去哪里</view>
      </view>
      <view class="chip-row">
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

    <view class="panel-card filter-panel">
      <view class="filter-head">
        <view class="section-title" style="margin-top:0;">风格</view>
        <view class="section-subtitle">决定整体氛围</view>
      </view>
      <view class="chip-row">
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

    <view class="panel-card filter-panel">
      <view class="filter-head">
        <view class="section-title" style="margin-top:0;">预算</view>
        <view class="section-subtitle">保证可执行与理性消费</view>
      </view>
      <view class="chip-row">
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
  computed: {
    activeFilterCount: function() {
      var count = 0
      if (this.filters.scene) count += 1
      if (this.filters.style) count += 1
      if (this.filters.budget) count += 1
      return count
    },
    canSearch: function() {
      return !!this.keyword || this.activeFilterCount > 0
    },
    searchStateClass: function() {
      if (this.tagLoading) {
        return 'status-banner-warning'
      }
      if (this.tagFailed) {
        return 'status-banner-info'
      }
      return 'status-banner-success'
    },
    searchStateText: function() {
      if (this.tagLoading) {
        return '正在同步后端标签项，稍等一下就能拿到最新筛选。'
      }
      if (this.tagFailed) {
        return '后端标签接口暂时不可用，当前已经切换到本地筛选项。'
      }
      if (this.canSearch) {
        return '关键词和筛选项已经准备好，可以直接前往结果页继续对比。'
      }
      return '你可以先输入关键词，也可以直接靠场景、风格和预算筛内容。'
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
          self.statusText = '筛选项已同步：' + (api.getActiveBaseUrl() || '后端服务')
          self.tagFailed = false
        })
        .catch(function() {
          self.statusText = '后端标签暂时不可用，当前显示本地筛选项。'
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

.search-hero {
  margin-top: 22rpx;
}

.search-input-bar {
  margin-top: 24rpx;
  background: rgba(255, 255, 255, 0.94);
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #233544;
}

.search-submit {
  margin-top: 18rpx;
}

.note-card,
.filter-summary-card {
  margin-top: 18rpx;
}

.section-head,
.filter-head {
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

.filter-summary-card {
  position: relative;
  overflow: hidden;
  padding: 26rpx 28rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx dashed rgba(104, 153, 188, 0.26);
  box-shadow: 0 14rpx 30rpx rgba(52, 114, 154, 0.08);
}

.filter-summary-card::before {
  content: "";
  position: absolute;
  left: 28rpx;
  top: -10rpx;
  width: 118rpx;
  height: 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 180, 107, 0.48);
}

.summary-kicker {
  color: #50a0d6;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.summary-line {
  margin-top: 12rpx;
  color: #667b8b;
  font-size: 24rpx;
}

.filter-panel {
  margin-top: 18rpx;
}
</style>
