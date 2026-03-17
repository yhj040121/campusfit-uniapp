<template>
  <view class="page-shell">
    <view class="page-header">
      <view class="page-title">标签选择</view>
      <view class="page-desc">选择场景、风格和预算标签，用于标记穿搭内容并提升搜索准确度。</view>
    </view>

    <view class="panel-card">
      <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
    </view>

    <view class="panel-card">
      <view class="form-label">场景</view>
      <view class="chip-row" style="margin-top:16rpx;">
        <view v-for="item in sceneTags" :key="item" :class="['chip', selected.scene === item ? 'chip-active' : 'chip-outline']" @click="select('scene', item)">{{ item }}</view>
      </view>
    </view>

    <view class="panel-card">
      <view class="form-label">风格</view>
      <view class="chip-row" style="margin-top:16rpx;">
        <view v-for="item in styleTags" :key="item" :class="['chip', selected.style === item ? 'chip-active' : 'chip-outline']" @click="select('style', item)">{{ item }}</view>
      </view>
    </view>

    <view class="panel-card">
      <view class="form-label">预算</view>
      <view class="chip-row" style="margin-top:16rpx;">
        <view v-for="item in budgetTags" :key="item" :class="['chip', selected.budget === item ? 'chip-active' : 'chip-outline']" @click="select('budget', item)">{{ item }}</view>
      </view>
    </view>

    <button class="btn-primary" @click="save">保存所选标签</button>
  </view>
</template>

<script>
var api = require('../../common/api.js')

function defaultSelection() {
  return {
    scene: '早八',
    style: '学院风',
    budget: '100-150'
  }
}

export default {
  data: function() {
    return {
      sceneTags: ['早八', '图书馆', '社团活动', '约会'],
      styleTags: ['学院风', '极简', '运动休闲', '甜酷'],
      budgetTags: ['0-50', '50-100', '100-150', '150+'],
      selected: defaultSelection(),
      statusText: '正在加载可选标签...'
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
          self.statusText = '标签选项已同步。'
        })
        .catch(function() {
          self.statusText = '后端标签暂时不可用，已显示本地默认选项。'
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
</style>
