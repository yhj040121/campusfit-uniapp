<template>
  <view class="page-shell tags-shell">
    <view class="page-header">
      <view class="campus-ribbon">标签筛选</view>
      <view class="page-title">用场景、风格和预算把穿搭内容快速框定清楚</view>
      <view class="page-desc">标签会回写到发布页和搜索页，帮助你快速定位“在哪穿、什么风格、预算多少”这三个核心问题。</view>
    </view>

    <view class="filter-summary-card">
      <view class="summary-kicker">当前选择</view>
      <view class="summary-line">{{ statusText }}</view>
      <view class="summary-line">已选择：{{ selected.scene }} / {{ selected.style }} / {{ selected.budget }}</view>
    </view>

    <view class="panel-card">
      <view class="section-head" style="margin-top:0;">
        <view>
          <view class="section-title" style="margin-top:0;">场景</view>
          <view class="section-subtitle">先定义这套穿搭主要出现在哪类校园场景</view>
        </view>
      </view>
      <view class="chip-row">
        <view v-for="item in sceneTags" :key="item" :class="['chip', selected.scene === item ? 'chip-active' : 'chip-outline']" @click="select('scene', item)">{{ item }}</view>
      </view>
    </view>

    <view class="panel-card">
      <view class="section-head" style="margin-top:0;">
        <view>
          <view class="section-title" style="margin-top:0;">风格</view>
          <view class="section-subtitle">再标明穿搭的视觉气质与搭配路线</view>
        </view>
      </view>
      <view class="chip-row">
        <view v-for="item in styleTags" :key="item" :class="['chip', selected.style === item ? 'chip-active' : 'chip-outline']" @click="select('style', item)">{{ item }}</view>
      </view>
    </view>

    <view class="panel-card">
      <view class="section-head" style="margin-top:0;">
        <view>
          <view class="section-title" style="margin-top:0;">预算</view>
          <view class="section-subtitle">最后补上预算区间，强化理性消费导向</view>
        </view>
      </view>
      <view class="chip-row">
        <view v-for="item in budgetTags" :key="item" :class="['chip', selected.budget === item ? 'chip-active' : 'chip-outline']" @click="select('budget', item)">{{ item }}</view>
      </view>
    </view>

    <button class="btn-primary" @click="save">保存标签并返回</button>
  </view>
</template>

<script>
var api = require('../../common/api.js')

function defaultSelection() {
  return {
    scene: '图书馆',
    style: '学院风',
    budget: '100-150'
  }
}

export default {
  data: function() {
    return {
      sceneTags: ['图书馆', '早八', '社团活动', '约会'],
      styleTags: ['学院风', '通勤风', '运动休闲', '极简'],
      budgetTags: ['0-50', '50-100', '100-150', '150+'],
      selected: defaultSelection(),
      statusText: '正在同步标签选项...'
    }
  },
  onLoad: function() {
    this.restoreSelection()
    this.loadTagOptions()
  },
  methods: {
    restoreSelection: function() {
      var stored = uni.getStorageSync('campusfit_publish_tags') || []
      if (stored.length) {
        this.selected = {
          scene: stored[0] || this.selected.scene,
          style: stored[1] || this.selected.style,
          budget: stored[2] || this.selected.budget
        }
      }
    },
    loadTagOptions: function() {
      var self = this
      api.getTagOptions()
        .then(function(data) {
          self.sceneTags = data.sceneTags || self.sceneTags
          self.styleTags = data.styleTags || self.styleTags
          self.budgetTags = data.budgetTags || self.budgetTags
          self.statusText = '标签选项已同步，可以直接选择。'
        })
        .catch(function() {
          self.statusText = '后端标签接口暂时不可用，已使用本地默认选项。'
        })
    },
    select: function(type, tag) {
      this.selected[type] = tag
    },
    save: function() {
      var finalTags = [this.selected.scene, this.selected.style, this.selected.budget]
      uni.setStorageSync('campusfit_publish_tags', finalTags)
      uni.showToast({ title: '标签已保存', icon: 'none' })
      setTimeout(function() {
        uni.navigateBack()
      }, 300)
    }
  }
}
</script>

<style>
.tags-shell {
  padding-bottom: 110rpx;
}
</style>
