<template>
  <view class="page-shell">
    <view class="page-header">
      <view class="page-title">草稿箱</view>
      <view class="page-desc">继续编辑未完成的穿搭内容，或在最终发布前清理本地草稿。</view>
    </view>

    <view v-if="drafts.length">
      <view class="list-card" v-for="item in drafts" :key="item.id">
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
          <view class="text-copy" style="margin-top:0;">已保存在本设备</view>
          <view class="float-link" @click="removeDraft(item.id)">删除</view>
        </view>
      </view>
    </view>

    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">暂无本地草稿</view>
      <view class="text-copy">保存发布草稿后，它将在这里显示，方便稍后继续编辑。</view>
      <button class="btn-primary" style="margin-top:20rpx;" @click="goPublish">创建草稿</button>
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
    note: raw.desc || '暂无描述',
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
    continueEdit: function(item) {
      uni.showToast({ title: '草稿已载入发布页', icon: 'none' })
      setTimeout(function() {
        uni.switchTab({ url: '/pages/publish/index' })
      }, 300)
    },
    removeDraft: function(id) {
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
</style>
