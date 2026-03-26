<template>
  <view class="page-shell tags-shell">
    <view class="tags-topbar">
      <view class="tags-topbar-inner">
        <button class="tags-back-button" @click="goBack">
          <text class="tags-back-icon">←</text>
        </button>
        <text class="tags-topbar-title">选择标签</text>
        <view class="tags-topbar-spacer"></view>
      </view>
    </view>

    <scroll-view class="tags-scroll" scroll-y="true" show-scrollbar="false">
      <view class="tags-content">
        <view class="tags-hero-card">
          <view class="tags-hero-kicker">已选标签</view>
          <view class="tags-hero-title">{{ selected.scene }}</view>
          <!-- <view class="tags-hero-copy">当前风格是 {{ selected.style }}。预算已回到发布页里单独选择，这里只负责场景和风格。</view> -->

          <view class="tags-hero-chip-row">
            <view class="tags-hero-chip">{{ selected.scene }}</view>
            <view class="tags-hero-chip tags-hero-chip-soft">{{ selected.style }}</view>
          </view>
        </view>

        <view class="tags-section-card">
          <!-- <view class="tags-section-kicker">SCENE</view> -->
          <view class="tags-section-title">场景</view>
          <view class="tags-section-copy">先定义这套穿搭主要出现在哪类校园场景。</view>

          <view class="tags-chip-grid">
            <view
              v-for="item in sceneTags"
              :key="item"
              :class="['tags-chip', selected.scene === item ? 'tags-chip-active' : '']"
              @click="select('scene', item)"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="tags-section-card">
          <!-- <view class="tags-section-kicker">STYLE</view> -->
          <view class="tags-section-title">风格</view>
          <view class="tags-section-copy">再标明穿搭的视觉气质与搭配路线。</view>

          <view class="tags-chip-grid">
            <view
              v-for="item in styleTags"
              :key="item"
              :class="['tags-chip', selected.style === item ? 'tags-chip-active' : '']"
              @click="select('style', item)"
            >
              {{ item }}
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="tags-actions">
      <button class="tags-save-button" @click="save">保存标签并返回</button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')

function defaultSelection() {
  return {
    scene: '图书馆',
    style: '学院风',
    budget: ''
  }
}

function repairTagValue(value, fallback) {
  var text = String(value || '').trim()
  if (!text) {
    return fallback
  }
  if (text.indexOf('鍥句功') > -1) {
    return '图书馆'
  }
  if (text.indexOf('瀛﹂櫌') > -1) {
    return '学院风'
  }
  return text
}

export default {
  data: function() {
    return {
      sceneTags: ['图书馆', '早八', '社团活动', '约会', '通勤', '运动'],
      styleTags: ['学院风', '宽松休闲', '甜酷', '极简', '韩系', '清新'],
      selected: defaultSelection()
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
          scene: repairTagValue(stored[0], this.selected.scene),
          style: repairTagValue(stored[1], this.selected.style),
          budget: repairTagValue(stored[2], this.selected.budget)
        }
      }
    },
    loadTagOptions: function() {
      var self = this
      api.getTagOptions()
        .then(function(data) {
          self.sceneTags = data.sceneTags || self.sceneTags
          self.styleTags = data.styleTags || self.styleTags
        })
        .catch(function() {})
    },
    select: function(type, tag) {
      this.selected[type] = tag
    },
    goBack: function() {
      uni.navigateBack()
    },
    save: function() {
      var finalTags = [this.selected.scene, this.selected.style, this.selected.budget]
      uni.setStorageSync('campusfit_publish_tags', finalTags)
      uni.showToast({ title: '标签已保存', icon: 'none' })
      setTimeout(function() {
        uni.navigateBack()
      }, 260)
    }
  }
}
</script>

<style scoped>
.tags-shell {
  height: 100vh;
  padding: 0;
  background: #f5f6f7;
}

.tags-shell::before,
.tags-shell::after {
  display: none;
}

.tags-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(24rpx);
  box-shadow: 0 14rpx 34rpx rgba(44, 47, 48, 0.05);
}

.tags-topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: calc(env(safe-area-inset-top) + 18rpx) 24rpx 18rpx;
}

.tags-back-button,
.tags-topbar-spacer {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
}

.tags-back-button {
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(148, 163, 184, 0.1);
}

.tags-back-icon {
  color: #475569;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1;
}

.tags-topbar-title {
  color: #2c2f30;
  font-size: 30rpx;
  font-weight: 800;
}

.tags-scroll {
  height: 100vh;
}

.tags-content {
  padding: calc(env(safe-area-inset-top) + 116rpx) 24rpx calc(176rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.tags-hero-card,
.tags-section-card {
  padding: 28rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid rgba(171, 173, 174, 0.16);
  box-shadow: 0 18rpx 40rpx rgba(44, 47, 48, 0.06);
}

.tags-section-card {
  margin-top: 22rpx;
}

.tags-hero-card {
  background:
    radial-gradient(circle at top right, rgba(68, 165, 255, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 248, 250, 0.94));
}

.tags-hero-kicker,
.tags-section-kicker {
  display: inline-flex;
  align-items: center;
  color: #757778;
  font-family: var(--campus-font-data);
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
  text-transform: uppercase;
}

.tags-hero-title,
.tags-section-title {
  color: #2c2f30;
  font-weight: 800;
}

.tags-hero-title {
  margin-top: 16rpx;
  font-size: 40rpx;
  line-height: 1.2;
}

.tags-section-title {
  margin-top: 12rpx;
  font-size: 34rpx;
}

.tags-hero-copy,
.tags-section-copy {
  margin-top: 10rpx;
  color: #595c5d;
  font-size: 24rpx;
  line-height: 1.65;
}

.tags-hero-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.tags-hero-chip {
  padding: 14rpx 22rpx;
  border-radius: 999rpx;
  background: #005e9f;
  color: #edf3ff;
  font-size: 22rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 28rpx rgba(0, 94, 159, 0.18);
}

.tags-hero-chip-soft {
  background: #b1efd8;
  color: #1d5c4a;
  box-shadow: none;
}

.tags-chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.tags-chip {
  padding: 14rpx 22rpx;
  border-radius: 999rpx;
  background: #eef1f3;
  color: #595c5d;
  font-size: 22rpx;
  font-weight: 700;
  border: 2rpx solid transparent;
}

.tags-chip-active {
  border-color: rgba(0, 94, 159, 0.18);
  background: rgba(68, 165, 255, 0.12);
  color: #005e9f;
  box-shadow: 0 10rpx 24rpx rgba(0, 94, 159, 0.12);
}

.tags-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  padding: 18rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24rpx);
  box-shadow: 0 -12rpx 30rpx rgba(44, 47, 48, 0.05);
}

.tags-save-button {
  width: 100%;
  min-height: 92rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #005e9f 0%, #2498f5 58%, #7ec9ff 100%);
  color: #edf3ff;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: 0 20rpx 40rpx rgba(0, 94, 159, 0.2);
}
</style>
