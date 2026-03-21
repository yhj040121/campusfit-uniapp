<template>
  <view class="page-shell product-shell">
    <view class="hero-card product-hero">
      <view class="hero-badge">商品跳转确认</view>
      <view class="hero-title">即将离开 CampusFit 前往外部平台</view>
      <view class="hero-copy">在跳转前再确认一次商品名称、价格和平台信息，同时说明点击统计与创作激励规则，帮助用户更清楚地完成导购链路。</view>
    </view>

    <view class="product-card">
      <view class="text-main">{{ post.product }}</view>
      <view class="text-copy">{{ post.platform }} · {{ post.price }}</view>
      <view class="product-price">{{ post.price }}</view>
      <view class="note-box">{{ post.clickTip }}</view>
      <view class="note-box">激励说明：{{ post.incentiveTip }}</view>
      <view class="note-box">理性消费提示：{{ post.guideTip }}</view>
      <view class="note-box">当前累计导购点击：{{ post.clickCount }}</view>
      <view class="note-box">跳转链接：{{ link }}</view>
    </view>

    <view class="btn-row">
      <button class="btn-secondary btn-half" @click="copyLink">复制链接</button>
      <button class="btn-primary btn-half" :disabled="jumping" :class="jumping ? 'btn-disabled' : ''" @click="jumpOut">{{ jumping ? '跳转中...' : '继续前往' }}</button>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')

function fallbackPost() {
  return {
    product: 'CampusFit 推荐单品',
    platform: '外部电商平台',
    price: '￥39',
    guideTip: '请结合预算、使用频率和场景需求理性选购。',
    incentiveTip: '商家推广费会按平台规则拆分为服务费和激励池，创作者激励主要参考互动、质量与合规表现。',
    clickTip: '本次跳转会记录为导购点击，并与点赞、评论、收藏一起影响内容传播分析和后续创作激励。',
    clickCount: 0
  }
}

export default {
  data: function() {
    return {
      postId: 'look1',
      post: fallbackPost(),
      link: '',
      jumping: false
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
    this.loadProductJump()
  },
  methods: {
    loadProductJump: function() {
      var self = this
      api.getProductJumpInfo(self.postId)
        .then(function(detail) {
          self.post = {
            product: detail.product,
            platform: detail.platform,
            price: detail.price,
            guideTip: detail.guideTip,
            incentiveTip: detail.incentiveTip,
            clickTip: detail.clickTip,
            clickCount: Number(detail.clickCount || 0)
          }
          self.link = detail.jumpUrl || ''
        })
        .catch(function() {
          self.post = fallbackPost()
          self.link = ''
        })
    },
    copyLink: function() {
      var self = this
      if (!self.link) {
        uni.showToast({ title: '当前暂无可复制链接', icon: 'none' })
        return
      }
      uni.setClipboardData({
        data: self.link,
        success: function() {
          uni.showToast({ title: '链接已复制', icon: 'none' })
        }
      })
    },
    jumpOut: function() {
      var self = this
      if (self.jumping) {
        return
      }
      if (!self.link) {
        uni.showToast({ title: '当前暂无可用导购链接', icon: 'none' })
        return
      }
      self.jumping = true
      api.trackProductJump(self.postId)
        .then(function(detail) {
          var targetUrl = detail.jumpUrl || self.link
          self.link = targetUrl
          self.post.clickCount = Number(detail.clickCount || self.post.clickCount || 0)
          self.post.incentiveTip = detail.incentiveTip || self.post.incentiveTip
          self.post.guideTip = detail.guideTip || self.post.guideTip
          self.post.clickTip = detail.clickTip || self.post.clickTip
          if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.openURL) {
            plus.runtime.openURL(targetUrl)
            return
          }
          if (typeof window !== 'undefined' && window.open) {
            window.open(targetUrl, '_blank')
            return
          }
          uni.setClipboardData({
            data: targetUrl,
            success: function() {
              uni.showToast({ title: '链接已复制，请手动打开', icon: 'none' })
            }
          })
        })
        .catch(function(error) {
          uni.showToast({ title: error.message || '跳转失败，请稍后重试', icon: 'none' })
        })
        .finally(function() {
          self.jumping = false
        })
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
