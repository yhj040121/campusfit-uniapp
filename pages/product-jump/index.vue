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
      <view class="note-box">{{ jumpTipText }}</view>
      <view class="note-box">激励说明：{{ post.incentiveTip }}</view>
      <view v-if="showSafeReminder" class="note-box">理性消费提示：{{ post.guideTip }}</view>
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
var session = require('../../common/session.js')
var settingsStore = require('../../common/settings.js')

var JUMP_GUARD_KEY = 'campusfit_product_jump_guard_v1'
var JUMP_GUARD_TTL = 12 * 60 * 60 * 1000

function normalizeExternalUrl(url) {
  var value = String(url || '').trim()
  if (!value) {
    return ''
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    return value
  }
  if (value.indexOf('//') === 0) {
    return 'https:' + value
  }
  return 'https://' + value.replace(/^\/+/, '')
}

function readJumpGuardMap() {
  return uni.getStorageSync(JUMP_GUARD_KEY) || {}
}

function writeJumpGuardMap(map) {
  uni.setStorageSync(JUMP_GUARD_KEY, map || {})
}

function getViewerGuardId(postId) {
  var user = session.getUser() || {}
  var viewerKey = user.userId ? 'user-' + user.userId : 'guest'
  return viewerKey + ':' + String(postId || '')
}

function pruneJumpGuard(map) {
  var source = map || {}
  var result = {}
  var now = Date.now()
  var keys = Object.keys(source)
  for (var i = 0; i < keys.length; i += 1) {
    var key = keys[i]
    var entry = source[key]
    if (entry && entry.at && now - entry.at < JUMP_GUARD_TTL) {
      result[key] = entry
    }
  }
  return result
}

function hasRecentTrackedJump(postId) {
  var map = pruneJumpGuard(readJumpGuardMap())
  writeJumpGuardMap(map)
  var entry = map[getViewerGuardId(postId)]
  return !!(entry && entry.at)
}

function markTrackedJump(postId, url) {
  var map = pruneJumpGuard(readJumpGuardMap())
  map[getViewerGuardId(postId)] = {
    at: Date.now(),
    url: normalizeExternalUrl(url)
  }
  writeJumpGuardMap(map)
}

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
      jumping: false,
      recentTracked: false,
      settingMap: settingsStore.getSettingMap()
    }
  },
  computed: {
    showSafeReminder: function() {
      return this.settingMap.safe !== false
    },
    jumpTipText: function() {
      if (this.recentTracked) {
        return '当前设备近期已记录一次导购点击，再次前往不重复计数。'
      }
      return this.post.clickTip
    }
  },
  onLoad: function(options) {
    this.postId = (options && options.id) || 'look1'
    this.loadProductJump()
  },
  onShow: function() {
    this.settingMap = settingsStore.getSettingMap()
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
          self.link = normalizeExternalUrl(detail.jumpUrl || '')
          self.recentTracked = hasRecentTrackedJump(self.postId)
        })
        .catch(function() {
          self.post = fallbackPost()
          self.link = ''
          self.recentTracked = hasRecentTrackedJump(self.postId)
        })
    },
    copyLink: function() {
      var self = this
      self.link = normalizeExternalUrl(self.link)
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
    openExternalUrl: function(targetUrl) {
      var normalizedUrl = normalizeExternalUrl(targetUrl)
      if (!normalizedUrl) {
        return Promise.reject(new Error('当前暂无可用导购链接'))
      }
      return new Promise(function(resolve) {
        try {
          if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.openURL) {
            plus.runtime.openURL(normalizedUrl)
            resolve(true)
            return
          }
        } catch (error) {}
        try {
          if (typeof window !== 'undefined' && window.location && typeof window.location.assign === 'function') {
            window.location.assign(normalizedUrl)
            resolve(true)
            return
          }
        } catch (error) {}
        try {
          if (typeof document !== 'undefined' && document.body) {
            var anchor = document.createElement('a')
            anchor.href = normalizedUrl
            anchor.target = '_self'
            anchor.rel = 'noopener noreferrer'
            document.body.appendChild(anchor)
            anchor.click()
            document.body.removeChild(anchor)
            resolve(true)
            return
          }
        } catch (error) {}
        uni.setClipboardData({
          data: normalizedUrl,
          success: function() {
            uni.showToast({ title: '当前环境无法直接打开，链接已复制', icon: 'none' })
            resolve(false)
          },
          fail: function() {
            resolve(false)
          }
        })
      })
    },
    jumpOut: function() {
      var self = this
      if (self.jumping) {
        return
      }
      self.link = normalizeExternalUrl(self.link)
      if (!self.link) {
        uni.showToast({ title: '当前暂无可用导购链接', icon: 'none' })
        return
      }
      self.jumping = true
      if (hasRecentTrackedJump(self.postId)) {
        self.recentTracked = true
        self.openExternalUrl(self.link)
          .then(function(opened) {
            if (!opened) {
              return
            }
            uni.showToast({ title: '跳转成功', icon: 'none' })
          })
          .finally(function() {
            self.jumping = false
          })
        return
      }
      api.trackProductJump(self.postId)
        .then(function(detail) {
          var targetUrl = normalizeExternalUrl((detail && detail.jumpUrl) || self.link)
          self.link = targetUrl
          self.post.clickCount = Number((detail && detail.clickCount) || self.post.clickCount || 0)
          self.post.incentiveTip = (detail && detail.incentiveTip) || self.post.incentiveTip
          self.post.guideTip = (detail && detail.guideTip) || self.post.guideTip
          self.post.clickTip = (detail && detail.clickTip) || self.post.clickTip
          markTrackedJump(self.postId, targetUrl)
          self.recentTracked = true
          return self.openExternalUrl(targetUrl)
        })
        .catch(function(error) {
          return self.openExternalUrl(self.link)
            .then(function(opened) {
              if (opened) {
                uni.showToast({ title: '已继续前往，点击统计未成功', icon: 'none' })
                return
              }
              uni.showToast({ title: (error && error.message) || '跳转失败，请稍后重试', icon: 'none' })
            })
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
