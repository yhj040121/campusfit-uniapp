<template>
  <view class="page-shell product-shell">
    <view class="hero-card product-hero">
      <view class="hero-badge">商品跳转确认</view>
      <view class="hero-title">即将离开 CampusFit 前往外部平台</view>
      <view class="hero-copy">在跳转前再确认一次商品名称、价格和平台信息，同时保留理性消费提示，帮助用户更清楚地完成导购链路。</view>
    </view>

    <view class="product-card">
      <view class="text-main">{{ post.product }}</view>
      <view class="text-copy">{{ post.platform }} · {{ post.price }}</view>
      <view class="product-price">{{ post.price }}</view>
      <view class="note-box">平台会记录这次导购跳转，用于后续统计内容转化与收益结算。</view>
      <view class="note-box">请先确认商品是否符合当前预算与需求，再理性决定是否继续前往购买。</view>
      <view class="note-box">跳转链接：{{ link }}</view>
    </view>

    <view class="btn-row">
      <button class="btn-secondary btn-half" @click="copyLink">复制链接</button>
      <button class="btn-primary btn-half" @click="jumpOut">继续前往</button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')

function fallbackPost() {
  return {
    product: 'CampusFit 推荐单品',
    platform: '外部电商平台',
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
      uni.showToast({ title: '演示环境下不真正跳转外部平台', icon: 'none' })
    }
  }
}
</script>

<style>
.product-shell {
  padding-bottom: 120rpx;
}

.product-price {
  margin-top: 18rpx;
}
</style>
