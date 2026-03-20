<template>
  <view class="page-shell drafts-shell">
    <view class="page-header">
      <view class="campus-ribbon">草稿箱</view>
      <view class="page-title">把暂时没写完的内容先收进创作抽屉里</view>
      <view class="page-desc">草稿会保存在本地，你可以随时回到发布页继续编辑，不会打断当前的创作节奏。</view>
    </view>

    <view v-if="drafts.length">
      <view class="filter-summary-card">
        <view class="summary-kicker">草稿状态</view>
        <view class="summary-line">当前共 {{ drafts.length }} 条本地草稿，可继续编辑或删除。</view>
      </view>

      <view class="list-card draft-card" v-for="item in drafts" :key="item.id">
        <view class="list-title">{{ item.title }}</view>
        <view class="list-copy">{{ item.note }}</view>
        <view class="chip-row" style="margin-top:16rpx;">
          <view class="chip chip-outline" v-for="tag in item.tags" :key="tag">{{ tag }}</view>
        </view>
        <view class="meta-line">
          <view class="list-meta">{{ item.time }}</view>
          <view class="float-link" @click="continueEdit(item)">继续编辑</view>
        </view>
        <view class="divider-line"></view>
        <view class="meta-line" style="margin-top:0;">
          <view class="text-copy" style="margin-top:0;">草稿仅保存在当前设备</view>
          <view class="float-link" @click="removeDraft(item.id)">删除草稿</view>
        </view>
      </view>
    </view>

    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">还没有保存草稿</view>
      <view class="text-copy">可以在发布页先保存一版内容，再回到这里继续补图、改文案或调整标签。</view>
      <button class="btn-primary" style="margin-top:20rpx;" @click="goPublish">去发布页</button>
    </view>
  </view>
</template>

<script>
var DRAFT_KEY = 'campusfit_publish_draft'

function normalizeDraft(raw) {
  if (!raw || !raw.title) {
    return null
  }
  return {
    id: 'draft-local-1',
    title: raw.title,
    note: raw.desc || '这条草稿还没有补充描述。',
    tags: raw.tags || [],
    time: raw.savedAt || '刚刚保存'
  }
}

export default {
  data: function() {
    return {
      drafts: []
    }
  },
  onShow: function() {
    this.loadDrafts()
  },
  methods: {
    loadDrafts: function() {
      var raw = uni.getStorageSync(DRAFT_KEY)
      var draft = normalizeDraft(raw)
      this.drafts = draft ? [draft] : []
    },
    continueEdit: function() {
      uni.showToast({ title: '正在返回发布页', icon: 'none' })
      setTimeout(function() {
        uni.switchTab({ url: '/pages/publish/index' })
      }, 300)
    },
    removeDraft: function() {
      uni.removeStorageSync(DRAFT_KEY)
      this.loadDrafts()
      uni.showToast({ title: '草稿已删除', icon: 'none' })
    },
    goPublish: function() {
      uni.switchTab({ url: '/pages/publish/index' })
    }
  }
}
</script>

<style>
.draft-card {
  margin-top: 18rpx;
}
</style>
