<template>
  <view class="page-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后才能发布校园穿搭内容</view>
      <view class="hero-copy">发布内容、商品导购追踪与创作者收益统计都依赖登录账号。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
      <button class="btn-ghost" style="margin-top:16rpx;" @click="saveDraft">保存本地草稿</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="page-title">发布穿搭</view>
        <view class="page-desc">上传图片、选择标签并提交商品链接，发布新的校园穿搭内容。</view>
      </view>

      <view class="hero-card">
        <view class="hero-badge">创作者收益中心</view>
        <view class="hero-title">内容种草 + 导购转化 + 品牌合作</view>
        <view class="hero-copy">优质穿搭内容可以参与合作商品佣金统计，并有机会获得后续校园合作邀约。</view>
      </view>

      <view class="panel-card">
        <view class="text-copy" style="margin-top:0;">{{ statusText }}</view>
      </view>

      <view class="panel-card">
        <view class="form-label">图片上传</view>
        <view class="upload-grid" style="margin-top:16rpx;">
          <view class="upload-box" v-for="n in 9" :key="n">{{ n <= imageCount ? '已添加' : '+' }}</view>
        </view>
      </view>

      <view class="panel-card">
        <view class="form-label">标题</view>
        <input class="form-input" v-model="form.title" placeholder="例如：适合早八的图书馆清爽穿搭" />
      </view>

      <view class="panel-card">
        <view class="form-label">描述</view>
        <textarea class="form-textarea" v-model="form.desc" maxlength="200" placeholder="简要描述这套穿搭的场景、预算和搭配亮点。"></textarea>
      </view>

      <view class="panel-card">
        <view class="meta-line" style="margin-top:0;">
          <view class="form-label">标签</view>
          <view class="float-link" @click="chooseTags">选择标签</view>
        </view>
        <view class="chip-row" style="margin-top:16rpx;">
          <view v-for="item in form.tags" :key="item" class="chip chip-active">{{ item }}</view>
        </view>
      </view>

      <view class="panel-card">
        <view class="form-label">商品链接</view>
        <input class="form-input" v-model="form.link" placeholder="粘贴外部电商商品链接" />
        <view class="sub-panel">
          <view class="text-copy" style="margin-top:0;">商品链接需经审核后，才会计入导购统计与佣金结算。</view>
        </view>
      </view>

      <view class="btn-row">
        <button class="btn-secondary btn-half" @click="saveDraft">保存草稿</button>
        <button class="btn-primary btn-half" :loading="submitting" @click="publishNow">{{ submitting ? '发布中...' : '立即发布' }}</button>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

var DRAFT_KEY = 'campusfit_publish_draft'

function buildImageUrls(count) {
  var list = []
  for (var i = 0; i < count; i += 1) {
    list.push('https://campusfit.example.com/mock/' + (i + 1) + '.jpg')
  }
  return list
}

function defaultForm() {
  return {
    title: '适合早八和图书馆的清爽穿搭',
    desc: '衬衫和针织马甲的组合很适合校园学习日，也能控制在学生预算内。',
    link: 'https://campusfit.example.com/product/new-look',
    tags: ['早八', '学院风', '100-150']
  }
}

function isAuthError(error) {
  return ((error && error.message) || '').toLowerCase().indexOf('login') > -1
}

function formatNow() {
  var date = new Date()
  var month = String(date.getMonth() + 1).padStart(2, '0')
  var day = String(date.getDate()).padStart(2, '0')
  var hours = String(date.getHours()).padStart(2, '0')
  var minutes = String(date.getMinutes()).padStart(2, '0')
  return date.getFullYear() + '-' + month + '-' + day + ' ' + hours + ':' + minutes
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      imageCount: 6,
      form: defaultForm(),
      statusText: '已准备好发布到后端服务。',
      submitting: false
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.restoreDraft()
    this.applyStoredTags()
    if (!this.loggedIn) {
      this.statusText = '当前为游客编辑模式，正式发布前需要先登录。'
    }
  },
  methods: {
    applyStoredTags: function() {
      var stored = uni.getStorageSync('campusfit_publish_tags')
      if (stored && stored.length) {
        this.form.tags = stored
      }
    },
    restoreDraft: function() {
      var draft = uni.getStorageSync(DRAFT_KEY)
      if (draft && draft.title) {
        this.form = Object.assign(defaultForm(), draft)
      }
    },
    chooseTags: function() {
      uni.navigateTo({ url: '/pages/tags/index' })
    },
    saveDraft: function() {
      var payload = Object.assign({}, this.form, { savedAt: formatNow() })
      uni.setStorageSync(DRAFT_KEY, payload)
      uni.showToast({ title: '草稿已保存', icon: 'none' })
      this.statusText = '已在当前设备保存本地草稿。'
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    publishNow: function() {
      var self = this
      if (self.submitting) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('发布新穿搭之前请先登录。')
        return
      }
      if (!self.form.title || !self.form.desc || !self.form.link || !self.form.tags.length) {
        uni.showToast({ title: '请先完善标题、描述、标签和商品链接', icon: 'none' })
        return
      }
      self.submitting = true
      api.createPost({
        title: self.form.title,
        desc: self.form.desc,
        imageUrls: buildImageUrls(self.imageCount),
        tags: self.form.tags,
        productLink: self.form.link
      })
        .then(function(result) {
          uni.removeStorageSync(DRAFT_KEY)
          self.statusText = '发布成功，后端已创建内容：' + (result.id || '')
          uni.showToast({ title: '发布成功', icon: 'none' })
          setTimeout(function() {
            uni.switchTab({ url: '/pages/index/index' })
          }, 400)
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.promptLogin('登录已过期，发布前请重新登录。')
            return
          }
          self.statusText = '发布失败，请检查后端服务或当前接口配置。'
          uni.showToast({ title: error.message || '发布失败', icon: 'none' })
        })
        .finally(function() {
          self.submitting = false
        })
    },
    promptLogin: function(message) {
      uni.showModal({
        title: '需要登录',
        content: message,
        confirmText: '去登录',
        cancelText: '稍后',
        success: function(result) {
          if (result.confirm) {
            uni.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
    }
  }
}
</script>

<style>
</style>
