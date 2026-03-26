<template>
  <view class="page-shell product-shell">
    <view class="hero-card product-hero">
      <view class="product-hero-top">
        <view class="hero-badge product-hero-badge">商品跳转确认</view>
        <view :class="['product-hero-chip', recentTracked ? 'product-hero-chip-repeat' : '']">
          {{ recentTracked ? '12 小时内已记录过一次点击' : '本次跳转会进入导购统计' }}
        </view>
      </view>
      <view class="hero-title product-hero-title">离开青搭前，再确认一次这件单品</view>
      <view class="hero-copy product-hero-copy">
        我们会保留平台、价格和激励说明，让导购链路更清楚，也避免用户在外链前丢失判断依据。
      </view>
      <view class="hero-card-row product-hero-row">
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">{{ platformShort }}</text>
          <text class="hero-card-pill-label">平台</text>
        </view>
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">{{ priceDisplay }}</text>
          <text class="hero-card-pill-label">价格</text>
        </view>
        <view class="hero-card-pill">
          <text class="hero-card-pill-value">{{ post.clickCount }}</text>
          <text class="hero-card-pill-label">累计点击</text>
        </view>
      </view>
    </view>

    <view class="panel-card product-spotlight-card">
      <view class="product-spotlight">
        <view class="product-orb product-orb-left"></view>
        <view class="product-orb product-orb-right"></view>
        <view class="product-spotlight-main">
          <view class="product-platform-line">{{ platformMeta }}</view>
          <view class="text-main product-title">{{ post.product }}</view>
          <view class="text-copy product-subtitle">{{ linkHostText }}</view>
        </view>
        <view class="product-price-pill">{{ priceDisplay }}</view>
      </view>

      <view class="product-meta-grid">
        <view class="product-meta-item">
          <view class="product-meta-label">导购统计</view>
          <view class="product-meta-value">{{ recentTracked ? '已记过' : '待记录' }}</view>
          <view class="product-meta-copy">当前设备短时间内不会重复计数。</view>
        </view>
        <view class="product-meta-item">
          <view class="product-meta-label">外部平台</view>
          <view class="product-meta-value">{{ platformShort }}</view>
          <view class="product-meta-copy">确认后会拉起外部链接继续浏览。</view>
        </view>
      </view>
    </view>

    <view class="panel-card product-notes-card">
      <view class="section-head product-section-head">
        <view>
          <view class="section-title product-section-title">跳转前确认</view>
          <view class="section-subtitle">把统计、激励和理性消费说明放在同一层，减少信息噪音。</view>
        </view>
      </view>

      <view class="note-box product-note-box">
        <view class="product-note-label">点击记录</view>
        <view class="product-note-text">{{ jumpTipText }}</view>
      </view>

      <view class="note-box product-note-box">
        <view class="product-note-label">激励说明</view>
        <view class="product-note-text">{{ post.incentiveTip }}</view>
      </view>

      <view v-if="showSafeReminder" class="note-box product-note-box">
        <view class="product-note-label">理性消费提示</view>
        <view class="product-note-text">{{ post.guideTip }}</view>
      </view>

      <view class="product-link-panel">
        <view class="product-link-head">
          <view class="product-link-label">跳转链接</view>
          <view class="product-link-domain">{{ linkHostText }}</view>
        </view>
        <view class="product-link-preview">{{ linkPreview }}</view>
        <view class="product-link-copy">
          {{ link ? '如果当前环境无法直接拉起外部平台，也可以先复制链接再打开。' : '当前还没有可用链接时，会保留复制按钮并给出提示。' }}
        </view>
      </view>
    </view>

    <view class="btn-row product-action-row">
      <button class="btn-secondary btn-half product-btn-secondary" @click="copyLink">复制链接</button>
      <button class="btn-primary btn-half product-btn-primary" :disabled="jumping" :class="jumping ? 'btn-disabled' : ''" @click="jumpOut">
        {{ jumping ? '跳转中...' : '继续前往' }}
      </button>
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

function trimText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function stripProtocol(url) {
  return trimText(url).replace(/^https?:\/\//i, '').replace(/^www\./i, '')
}

function extractHost(url) {
  var normalized = normalizeExternalUrl(url)
  if (!normalized) {
    return ''
  }
  try {
    if (typeof URL === 'function') {
      return new URL(normalized).hostname.replace(/^www\./i, '')
    }
  } catch (error) {}
  var match = normalized.match(/^https?:\/\/([^\/?#]+)/i)
  return match && match[1] ? match[1].replace(/^www\./i, '') : ''
}

function shortenText(value, limit) {
  var safeValue = trimText(value)
  if (!safeValue) {
    return ''
  }
  var max = Number(limit || 0)
  if (!max || safeValue.length <= max) {
    return safeValue
  }
  return safeValue.slice(0, max - 3) + '...'
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
        return '当前设备近期已记录过一次导购点击，再次前往不会重复计数，但仍可继续打开外部平台。'
      }
      return this.post.clickTip
    },
    platformShort: function() {
      var value = trimText(this.post.platform)
      if (!value) {
        return '待确认'
      }
      return shortenText(trimText(value.split('/')[0]), 6)
    },
    priceDisplay: function() {
      return trimText(this.post.price) || '待确认'
    },
    platformMeta: function() {
      var parts = []
      if (trimText(this.post.platform)) {
        parts.push(trimText(this.post.platform))
      }
      if (trimText(this.post.price)) {
        parts.push(trimText(this.post.price))
      }
      return parts.join(' · ') || '外部平台商品'
    },
    linkHostText: function() {
      return extractHost(this.link) || trimText(this.post.platform) || '外部平台'
    },
    linkPreview: function() {
      if (!this.link) {
        return '当前暂无可展示的外部链接'
      }
      return shortenText(stripProtocol(this.link), 72)
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

<style scoped>
.product-shell {
  min-height: 100vh;
  padding-top: 12rpx;
  padding-bottom: calc(104rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 8% 2%, rgba(255, 213, 103, 0.16), transparent 26%),
    radial-gradient(circle at 94% 0%, rgba(68, 165, 255, 0.16), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f5f6f7 46%, #f8f3eb 100%);
}

.product-shell::before {
  top: 108rpx;
  right: -84rpx;
  width: 220rpx;
  height: 220rpx;
  background: radial-gradient(circle, rgba(68, 165, 255, 0.16) 0%, rgba(68, 165, 255, 0) 72%);
}

.product-shell::after {
  bottom: 170rpx;
  left: -104rpx;
  width: 260rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(177, 239, 216, 0.22) 0%, rgba(177, 239, 216, 0) 72%);
}

.product-shell .hero-card,
.product-shell .panel-card {
  border-radius: 32rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 24rpx 52rpx rgba(25, 52, 87, 0.07);
  backdrop-filter: blur(24rpx);
}

.product-shell .hero-card {
  margin-bottom: 14rpx;
  background: linear-gradient(135deg, #1e74bf 0%, #3f8fe1 52%, #6aaef8 100%);
}

.product-shell .hero-card::after {
  content: '';
  position: absolute;
  right: -72rpx;
  top: -56rpx;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  filter: blur(16rpx);
}

.product-hero-top,
.product-link-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.product-hero-badge,
.product-hero-chip,
.product-shell .hero-title,
.product-shell .hero-copy,
.product-shell .hero-card-pill-value,
.product-shell .hero-card-pill-label {
  position: relative;
  z-index: 1;
}

.product-hero-badge {
  background: rgba(255, 255, 255, 0.16);
  color: #eef6ff;
}

.product-hero-chip {
  min-height: 44rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.14);
  color: rgba(238, 246, 255, 0.9);
  font-size: 19rpx;
  font-weight: 700;
  text-align: center;
}

.product-hero-chip-repeat {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.product-hero-title {
  color: #ffffff;
}

.product-hero-copy {
  color: rgba(238, 246, 255, 0.84);
}

.product-hero-row {
  gap: 10rpx;
  margin-top: 14rpx;
}

.product-shell .hero-card-pill {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.12);
}

.product-shell .hero-card-pill-value,
.product-shell .hero-card-pill-label {
  color: #eef6ff;
}

.product-spotlight-card,
.product-notes-card {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.84);
}

.product-spotlight {
  position: relative;
  overflow: hidden;
  padding: 24rpx;
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.24), transparent 24%),
    linear-gradient(145deg, rgba(245, 239, 231, 0.96) 0%, rgba(247, 250, 255, 0.96) 100%);
}

.product-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.product-orb-left {
  left: -36rpx;
  top: -26rpx;
  width: 140rpx;
  height: 140rpx;
  background: radial-gradient(circle, rgba(239, 99, 138, 0.18) 0%, rgba(239, 99, 138, 0) 72%);
}

.product-orb-right {
  right: -28rpx;
  bottom: -34rpx;
  width: 160rpx;
  height: 160rpx;
  background: radial-gradient(circle, rgba(68, 165, 255, 0.2) 0%, rgba(68, 165, 255, 0) 72%);
}

.product-spotlight-main,
.product-price-pill {
  position: relative;
  z-index: 1;
}

.product-platform-line {
  color: #6a788a;
  font-size: 21rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.product-title {
  margin-top: 14rpx;
  font-size: 40rpx;
  line-height: 1.2;
}

.product-subtitle {
  margin-top: 10rpx;
}

.product-price-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 76rpx;
  margin-top: 20rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, rgba(0, 94, 159, 0.1) 0%, rgba(68, 165, 255, 0.16) 100%);
  color: #1c5b98;
  font-size: 38rpx;
  font-weight: 800;
  font-family: var(--campus-font-data);
}

.product-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 16rpx;
}

.product-meta-item {
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  border: 1rpx solid rgba(191, 208, 226, 0.28);
  background: rgba(245, 248, 252, 0.92);
}

.product-meta-label {
  color: #7c8797;
  font-size: 20rpx;
  line-height: 1.4;
}

.product-meta-value {
  margin-top: 8rpx;
  color: #223247;
  font-size: 28rpx;
  font-weight: 800;
}

.product-meta-copy {
  margin-top: 8rpx;
  color: #6a788a;
  font-size: 20rpx;
  line-height: 1.5;
}

.product-section-head {
  margin-top: 0;
}

.product-section-title {
  margin-top: 0;
}

.product-note-box {
  margin-top: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  border: 2rpx solid rgba(191, 208, 226, 0.24);
  background: rgba(250, 252, 255, 0.86);
}

.product-note-label {
  color: #1f63ac;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.product-note-text {
  margin-top: 10rpx;
  color: #66768a;
  font-size: 22rpx;
  line-height: 1.65;
}

.product-link-panel {
  margin-top: 14rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background:
    linear-gradient(135deg, rgba(68, 165, 255, 0.08) 0%, rgba(177, 239, 216, 0.12) 100%),
    rgba(255, 255, 255, 0.88);
  border: 2rpx solid rgba(191, 208, 226, 0.28);
}

.product-link-label {
  color: #223247;
  font-size: 22rpx;
  font-weight: 800;
}

.product-link-domain {
  min-height: 42rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(68, 165, 255, 0.1);
  color: #1f63ac;
  font-size: 18rpx;
  font-weight: 700;
}

.product-link-preview {
  margin-top: 12rpx;
  color: #2a3a50;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-all;
}

.product-link-copy {
  margin-top: 10rpx;
  color: #6a788a;
  font-size: 20rpx;
  line-height: 1.6;
}

.product-action-row {
  position: sticky;
  bottom: calc(18rpx + env(safe-area-inset-bottom));
  z-index: 20;
  margin-top: 18rpx;
  padding: 12rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 20rpx 44rpx rgba(25, 52, 87, 0.08);
  backdrop-filter: blur(24rpx);
}

.product-btn-primary {
  box-shadow: 0 18rpx 34rpx rgba(0, 94, 159, 0.16);
}

.product-btn-secondary {
  background: rgba(68, 165, 255, 0.1);
  color: #1f63ac;
  border-color: transparent;
}

@media (max-width: 375px) {
  .product-hero-top,
  .product-link-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .product-meta-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .product-price-pill {
    font-size: 34rpx;
  }
}
</style>
