<template>
  <view class="page-shell">
    <view class="hero-card">
      <view class="hero-badge">外部电商跳转</view>
      <view class="hero-title">离开 CampusFit 前请确认</view>
      <view class="hero-copy">你即将跳转到外部电商平台，查看商品与购买信息。</view>
    </view>

    <view class="panel-card">
      <view class="text-main">{{ post.product }}</view>
      <view class="text-copy">{{ post.platform }} | {{ post.price }}</view>
      <view class="note-box">理性消费提醒：请结合自身需求与预算，货比三家后再下单。</view>
      <view class="note-box">平台盈利方式：用户通过导购链接完成订单后，平台与创作者可能按规则获得佣金。</view>
      <view class="note-box">商品链接：{{ link }}</view>
    </view>

    <view class="btn-row">
      <button class="btn-secondary btn-half" @click="copyLink">复制链接</button>
      <button class="btn-primary btn-half" @click="jumpOut">确认跳转</button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')

function fallbackPost() {
  return {
    product: 'CampusFit 合作商品',
    platform: '外部平台',
    price: '￥39'
  }
}

export default {
  data: function() {
    return {
      postId: 'look1',
      post: fallbackPost(),
      link: 'https://campusfit.example.com/product/look1'
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
    this.link = 'https://campusfit.example.com/product/' + this.postId
    this.loadPost()
  },
  methods: {
    loadPost: function() {
      var self = this
      api.getPostDetail(self.postId)
        .then(function(detail) {
          self.post = {
            product: detail.product,
            platform: detail.platform,
            price: detail.price
          }
        })
        .catch(function() {
          self.post = fallbackPost()
        })
    },
    copyLink: function() {
      var self = this
      uni.setClipboardData({
        data: self.link,
        success: function() {
          uni.showToast({ title: '链接已复制', icon: 'none' })
        }
      })
    },
    jumpOut: function() {
      uni.showToast({ title: '演示模式下将跳转到外部电商页面', icon: 'none' })
    }
  }
}
</script>

<style>
</style>
