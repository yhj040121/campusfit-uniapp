<template>
  <view class="page-shell">
    <view v-if="!loggedIn" class="hero-card">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后才能发布或编辑穿搭内容</view>
      <view class="hero-copy">发布内容、商品导购追踪与创作者收益统计都依赖登录账号。</view>
      <button class="btn-primary" style="margin-top:24rpx;" @click="goLogin">去登录</button>
      <button class="btn-ghost" style="margin-top:16rpx;" @click="saveDraft">保存本地草稿</button>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="page-title">{{ mode === 'edit' ? '编辑穿搭' : '发布穿搭' }}</view>
        <view class="page-desc">{{ mode === 'edit' ? '修改已发布内容的标题、描述、标签和商品链接。' : '上传图片、选择标签并提交商品链接，发布新的校园穿搭内容。' }}</view>
      </view>

      <view class="hero-card">
        <view class="meta-line" style="margin-top:0; align-items:flex-start;">
          <view>
            <view class="hero-badge">{{ mode === 'edit' ? '编辑模式' : '创作者收益中心' }}</view>
            <view class="hero-title">{{ mode === 'edit' ? '已发布内容支持再次修改' : '内容种草 + 导购转化 + 品牌合作' }}</view>
            <view class="hero-copy">{{ mode === 'edit' ? '编辑后会同步更新穿搭信息与导购商品。' : '优质穿搭内容可以参与合作商品佣金统计，并有机会获得后续校园合作邀约。' }}</view>
          </view>
          <view v-if="mode === 'edit'" class="float-link" @click="exitEditMode">退出编辑</view>
        </view>
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
        <input class="form-input" v-model="form.title" :placeholder="titlePlaceholder" />
      </view>

      <view class="panel-card">
        <view class="form-label">描述</view>
        <textarea class="form-textarea" v-model="form.desc" maxlength="200" :placeholder="descPlaceholder"></textarea>
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
        <input class="form-input" v-model="form.link" :placeholder="linkPlaceholder" />
        <view class="sub-panel">
          <view class="text-copy" style="margin-top:0;">商品链接需经审核后，才会计入导购统计与佣金结算。</view>
        </view>
      </view>

      <view class="btn-row">
        <button class="btn-secondary btn-half" @click="secondaryAction">{{ mode === 'edit' ? '退出编辑' : '保存草稿' }}</button>
        <button class="btn-primary btn-half" :loading="submitting" @click="submitPost">{{ submitLabel }}</button>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var session = require('../../common/session.js')

var DRAFT_KEY = 'campusfit_publish_draft'
var EDIT_POST_KEY = 'campusfit_edit_post_id'

function defaultForm() {
  return {
    title: '',
    desc: '',
    link: 'https://campusfit.example.com/product/new-look',
    tags: ['早八', '学院风', '100-150']
  }
}

function buildImageUrls(count) {
  var list = []
  for (var i = 0; i < count; i += 1) {
    list.push('https://campusfit.example.com/mock/' + (i + 1) + '.jpg')
  }
  return list
}

function formatNow() {
  var date = new Date()
  var month = String(date.getMonth() + 1).padStart(2, '0')
  var day = String(date.getDate()).padStart(2, '0')
  var hours = String(date.getHours()).padStart(2, '0')
  var minutes = String(date.getMinutes()).padStart(2, '0')
  return date.getFullYear() + '-' + month + '-' + day + ' ' + hours + ':' + minutes
}

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      imageCount: 6,
      form: defaultForm(),
      statusText: '已准备好发布到后端服务。',
      submitting: false,
      mode: 'create',
      editingId: ''
    }
  },
  computed: {
    submitLabel: function() {
      if (this.submitting) {
        return this.mode === 'edit' ? '更新中...' : '发布中...'
      }
      return this.mode === 'edit' ? '保存修改' : '立即发布'
    },
    titlePlaceholder: function() {
      return '例如：适合早八的图书馆清爽穿搭'
    },
    descPlaceholder: function() {
      return '简要描述这套穿搭的场景、预算和搭配亮点。'
    },
    linkPlaceholder: function() {
      return '粘贴外部电商商品链接'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.applyStoredTags()
    var editId = uni.getStorageSync(EDIT_POST_KEY)
    if (!this.loggedIn) {
      this.statusText = '当前为游客编辑模式，正式发布前需要先登录。'
      return
    }
    if (editId) {
      if (this.mode !== 'edit' || this.editingId !== editId) {
        this.loadEditPost(editId)
      }
      return
    }
    if (this.mode === 'edit') {
      this.resetCreateMode(false)
    }
    this.restoreDraft()
    this.statusText = '已准备好发布到后端服务。'
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
    resetCreateMode: function(clearEditStorage) {
      if (clearEditStorage !== false) {
        uni.removeStorageSync(EDIT_POST_KEY)
      }
      this.mode = 'create'
      this.editingId = ''
      this.imageCount = 6
      this.form = defaultForm()
      this.restoreDraft()
      this.statusText = '已准备好发布到后端服务。'
    },
    loadEditPost: function(postId) {
      var self = this
      self.statusText = '正在加载待编辑内容...'
      api.getPostForEdit(postId)
        .then(function(post) {
          self.mode = 'edit'
          self.editingId = post.id || postId
          self.form = {
            title: post.title || '',
            desc: post.desc || '',
            link: post.productLink || '',
            tags: post.tags && post.tags.length ? post.tags : defaultForm().tags
          }
          self.imageCount = post.imageUrls && post.imageUrls.length ? post.imageUrls.length : 1
          self.statusText = '已载入待编辑的发布内容。'
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.statusText = '登录已过期，请重新登录。'
            return
          }
          uni.removeStorageSync(EDIT_POST_KEY)
          self.mode = 'create'
          self.editingId = ''
          self.statusText = error.message || '加载编辑内容失败'
          uni.showToast({ title: self.statusText, icon: 'none' })
        })
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
    exitEditMode: function() {
      this.resetCreateMode(true)
      uni.showToast({ title: '已退出编辑', icon: 'none' })
    },
    secondaryAction: function() {
      if (this.mode === 'edit') {
        this.exitEditMode()
        return
      }
      this.saveDraft()
    },
    submitPost: function() {
      var self = this
      if (self.submitting) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('发布或修改穿搭之前请先登录。')
        return
      }
      if (!self.form.title || !self.form.desc || !self.form.link || !self.form.tags.length) {
        uni.showToast({ title: '请先完善标题、描述、标签和商品链接', icon: 'none' })
        return
      }
      self.submitting = true
      var payload = {
        title: self.form.title,
        desc: self.form.desc,
        imageUrls: buildImageUrls(self.imageCount),
        tags: self.form.tags,
        productLink: self.form.link
      }
      var request = self.mode === 'edit' ? api.updatePost(self.editingId, payload) : api.createPost(payload)
      request
        .then(function(result) {
          uni.removeStorageSync(DRAFT_KEY)
          if (self.mode === 'edit') {
            uni.removeStorageSync(EDIT_POST_KEY)
            self.statusText = '修改已保存，内容编号：' + (result.id || '')
            uni.showToast({ title: '修改成功', icon: 'none' })
            self.mode = 'create'
            self.editingId = ''
            setTimeout(function() {
              uni.switchTab({ url: '/pages/profile/index' })
            }, 400)
            return
          }
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
          self.statusText = error.message || '提交失败，请检查后端服务或稍后再试。'
          uni.showToast({ title: error.message || '提交失败', icon: 'none' })
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
