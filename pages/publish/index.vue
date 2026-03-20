<template>
  <view class="page-shell publish-shell">
    <view v-if="!loggedIn" class="hero-card publish-hero">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后才能发布或编辑穿搭内容</view>
      <view class="hero-copy">发布内容、商品导购追踪与创作者收益统计，都需要绑定到你的账号下才会完整生效。</view>
      <view class="guest-actions">
        <button class="btn-primary" @click="goLogin">去登录</button>
        <button class="btn-ghost" @click="saveDraft">保存本地草稿</button>
      </view>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">{{ mode === 'edit' ? '编辑工作台' : '发布工作台' }}</view>
        <view class="page-title">{{ mode === 'edit' ? '把已发布内容继续打磨' : '把一套校园穿搭整理成可发布内容' }}</view>
        <view class="page-desc">{{ mode === 'edit' ? '在不打断原有链路的前提下，更新标题、描述、标签与导购链接。' : '把图片、文案、标签和商品线索收纳进同一张创作卡片，发布后就能进入社区与导购闭环。' }}</view>
      </view>

      <view class="hero-card publish-hero">
        <view class="meta-line publish-hero-top" style="margin-top:0; align-items:flex-start;">
          <view>
            <view class="hero-badge">{{ mode === 'edit' ? '编辑模式' : '创作者收益中心' }}</view>
            <view class="hero-title publish-hero-title">{{ mode === 'edit' ? '已发布内容支持再次修改' : '内容种草 + 导购转化 + 品牌合作' }}</view>
            <view class="hero-copy">{{ mode === 'edit' ? '编辑后的内容会同步刷新社区展示与商品导购信息。' : '优质校园穿搭不仅能获得点赞收藏，也能为导购跳转与后续合作提供数据基础。' }}</view>
          </view>
          <view v-if="mode === 'edit'" class="hero-float-link" @click="exitEditMode">退出编辑</view>
        </view>
        <view class="hero-metrics">
          <view class="hero-metric">
            <text class="hero-metric-value">{{ form.tags.length }}</text>
            <text class="hero-metric-label">已选标签</text>
          </view>
          <view class="hero-metric">
            <text class="hero-metric-value">{{ imageCount }}</text>
            <text class="hero-metric-label">模拟图片</text>
          </view>
          <view class="hero-metric">
            <text class="hero-metric-value">{{ mode === 'edit' ? '更新' : '发布' }}</text>
            <text class="hero-metric-label">当前动作</text>
          </view>
        </view>
      </view>

      <view class="panel-card publish-status">
        <view class="section-head">
          <view>
            <view class="text-main">同步状态</view>
            <view class="section-subtitle">创作流程与后端交互</view>
          </view>
          <view class="note-stamp">DRAFT</view>
        </view>
        <view class="text-copy">{{ statusText }}</view>
      </view>

      <view :class="['status-banner', publishStateClass]">
        <view class="status-banner-head">
          <view>
            <view class="status-banner-title">发布准备度</view>
            <view class="status-banner-copy">{{ publishStateText }}</view>
          </view>
          <view class="status-link" @click="refreshComposer">重置检查</view>
        </view>
        <view class="status-grid two-col">
          <view class="status-item">
            <view class="status-item-label">已完成字段</view>
            <text class="status-item-value">{{ readyCount }}/4</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">当前模式</view>
            <text class="status-item-value">{{ mode === 'edit' ? '编辑中' : '新发布' }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">活动绑定</view>
            <text class="status-item-value">{{ selectedActivity ? '已绑定' : '未绑定' }}</text>
          </view>
          <view class="status-item">
            <view class="status-item-label">草稿状态</view>
            <text class="status-item-value">{{ draftStateText }}</text>
          </view>
        </view>
      </view>

      <view class="panel-card upload-card">
        <view class="section-head">
          <view>
            <view class="section-title" style="margin-top:0;">图片区域</view>
            <view class="section-subtitle">先用占位块模拟上传状态，后面再接 OSS</view>
          </view>
          <view class="upload-tip">最多 9 张</view>
        </view>
        <view class="upload-grid">
          <view class="upload-box" v-for="n in 9" :key="n">
            <view class="upload-symbol">{{ n <= imageCount ? '已添加' : '+' }}</view>
            <view class="upload-copy">{{ n <= imageCount ? '封面候选' : '待上传' }}</view>
          </view>
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

      <view class="panel-card tags-card">
        <view class="section-head">
          <view>
            <view class="form-label">标签</view>
            <view class="section-subtitle">建议至少覆盖场景、风格、预算</view>
          </view>
          <view class="float-link" @click="chooseTags">选择标签</view>
        </view>
        <view class="chip-row tags-row">
          <view v-for="item in form.tags" :key="item" class="chip chip-active">{{ item }}</view>
        </view>
      </view>

      <view class="panel-card activity-binding-card">
        <view class="section-head">
          <view>
            <view class="form-label">活动 / 专题</view>
            <view class="section-subtitle">补齐文档中的活动参与模块，发布前可先绑定一个活动</view>
          </view>
          <view class="float-link" @click="chooseActivity">选择活动</view>
        </view>
        <view v-if="selectedActivity" class="product-card selected-activity-card">
          <view class="text-main">{{ selectedActivity.title }}</view>
          <view class="text-copy">{{ selectedActivity.summary }}</view>
          <view class="chip-row" style="margin-top:16rpx;">
            <view class="chip chip-active">{{ selectedActivity.period }}</view>
            <view class="chip chip-outline">{{ selectedActivity.status }}</view>
          </view>
          <view class="note-box">活动激励：{{ selectedActivity.reward }}</view>
          <view class="float-link" style="margin-top:16rpx;" @click="clearActivity">清除绑定</view>
        </view>
        <view v-else class="sub-panel">
          <view class="sub-panel-title">当前还没有绑定活动</view>
          <view class="text-copy" style="margin-top:8rpx;">建议将优质内容和专题活动绑定，后续更容易承接审核、激励和活动统计。</view>
        </view>
      </view>

      <view class="panel-card">
        <view class="form-label">商品链接</view>
        <input class="form-input" v-model="form.link" :placeholder="linkPlaceholder" />
        <view class="sub-panel">
          <view class="sub-panel-title">审核提示</view>
          <view class="text-copy" style="margin-top:8rpx;">商品链接需要通过审核后，才会计入导购统计与佣金结算。</view>
        </view>
      </view>

      <view class="action-board">
        <button class="btn-secondary btn-half" @click="secondaryAction">{{ mode === 'edit' ? '退出编辑' : '保存草稿' }}</button>
        <button class="btn-primary btn-half" :class="!isReadyToSubmit && !submitting ? 'btn-disabled' : ''" :disabled="!isReadyToSubmit && !submitting" :loading="submitting" @click="submitPost">{{ submitLabel }}</button>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var activity = require('../../common/activity.js')
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
      selectedActivity: null,
      statusText: '已准备好发布到后端服务。',
      pageLoading: false,
      lastSavedAt: '',
      lastSuccessText: '',
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
    readyCount: function() {
      var count = 0
      if (this.form.title) count += 1
      if (this.form.desc) count += 1
      if (this.form.link) count += 1
      if (this.form.tags && this.form.tags.length) count += 1
      return count
    },
    isReadyToSubmit: function() {
      return this.readyCount === 4 && !this.pageLoading
    },
    publishStateClass: function() {
      if (this.pageLoading || this.submitting) {
        return 'status-banner-warning'
      }
      if (this.lastSuccessText) {
        return 'status-banner-success'
      }
      if (!this.isReadyToSubmit) {
        return 'status-banner-info'
      }
      return 'status-banner-success'
    },
    publishStateText: function() {
      if (this.pageLoading) {
        return '正在同步编辑内容与活动绑定信息，请稍等一下。'
      }
      if (this.submitting) {
        return this.mode === 'edit' ? '正在提交修改，请稍等。' : '正在创建内容，请稍等。'
      }
      if (this.lastSuccessText) {
        return this.lastSuccessText
      }
      if (!this.isReadyToSubmit) {
        return '标题、描述、标签和商品链接全部补齐后，发布按钮会进入最佳可用状态。'
      }
      return '主要字段已经准备完整，可以直接继续发布或保存修改。'
    },
    titlePlaceholder: function() {
      return '例如：适合早八的图书馆清爽穿搭'
    },
    descPlaceholder: function() {
      return '简要描述这套穿搭的场景、预算和搭配亮点。'
    },
    linkPlaceholder: function() {
      return '粘贴外部电商商品链接'
    },
    draftStateText: function() {
      return this.lastSavedAt ? '已保存' : '未保存'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.applyStoredTags()
    this.loadSelectedActivity()
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
    this.lastSuccessText = ''
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
        this.lastSavedAt = draft.savedAt || ''
        if (draft.activityId) {
          this.selectedActivity = activity.selectActivity(draft.activityId)
        }
      } else {
        this.lastSavedAt = ''
      }
    },
    loadSelectedActivity: function() {
      this.selectedActivity = activity.getSelectedActivity()
    },
    resetCreateMode: function(clearEditStorage) {
      if (clearEditStorage !== false) {
        uni.removeStorageSync(EDIT_POST_KEY)
      }
      this.mode = 'create'
      this.editingId = ''
      this.imageCount = 6
      this.form = defaultForm()
      this.pageLoading = false
      this.lastSuccessText = ''
      this.selectedActivity = activity.getSelectedActivity()
      this.restoreDraft()
      this.statusText = '已准备好发布到后端服务。'
    },
    loadEditPost: function(postId) {
      var self = this
      self.pageLoading = true
      self.lastSuccessText = ''
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
          self.selectedActivity = activity.getPostActivity(self.editingId, post)
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
        .finally(function() {
          self.pageLoading = false
        })
    },
    chooseTags: function() {
      uni.navigateTo({ url: '/pages/tags/index' })
    },
    chooseActivity: function() {
      uni.navigateTo({ url: '/pages/activity/index?pick=1' })
    },
    clearActivity: function() {
      activity.clearSelectedActivity()
      this.selectedActivity = null
      uni.showToast({ title: '已清除活动绑定', icon: 'none' })
    },
    saveDraft: function() {
      var payload = Object.assign({}, this.form, {
        savedAt: formatNow(),
        activityId: this.selectedActivity ? this.selectedActivity.id : ''
      })
      uni.setStorageSync(DRAFT_KEY, payload)
      this.lastSavedAt = payload.savedAt
      this.lastSuccessText = '草稿已保存在当前设备，稍后可以继续回来完善内容。'
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
      self.lastSuccessText = ''
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
          var targetId = self.mode === 'edit' ? self.editingId : (result && result.id)
          if (self.selectedActivity && targetId) {
            activity.bindPostToActivity(targetId, self.selectedActivity.id)
          }
          uni.removeStorageSync(DRAFT_KEY)
          self.lastSavedAt = ''
          if (self.mode === 'edit') {
            uni.removeStorageSync(EDIT_POST_KEY)
            self.statusText = '修改已保存，内容编号：' + (result.id || '')
            self.lastSuccessText = '修改已提交成功，返回个人中心后即可继续查看更新后的内容状态。'
            uni.showToast({ title: '修改成功', icon: 'none' })
            self.mode = 'create'
            self.editingId = ''
            setTimeout(function() {
              uni.switchTab({ url: '/pages/profile/index' })
            }, 400)
            return
          }
          self.statusText = '发布成功，后端已创建内容：' + (result.id || '')
          self.lastSuccessText = '发布成功，这条穿搭已经进入社区链路并可继续承接导购与活动绑定。'
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
    refreshComposer: function() {
      this.applyStoredTags()
      this.loadSelectedActivity()
      this.restoreDraft()
      this.lastSuccessText = ''
      this.statusText = this.isReadyToSubmit ? '已准备好发布到后端服务。' : '已刷新当前创作状态，请继续补齐关键字段。'
      uni.showToast({ title: '已刷新创作状态', icon: 'none' })
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

<style scoped>
.publish-shell {
  padding-top: 34rpx;
}

.campus-ribbon {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.84);
  color: #4699cf;
  font-size: 22rpx;
  letter-spacing: 2rpx;
  box-shadow: 0 12rpx 24rpx rgba(80, 150, 193, 0.1);
}

.publish-hero {
  margin-top: 20rpx;
}

.publish-hero-top {
  gap: 22rpx;
}

.publish-hero-title {
  max-width: 520rpx;
}

.hero-float-link {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 22rpx;
}

.hero-metrics,
.guest-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.hero-metric {
  flex: 1;
  padding: 18rpx 16rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.16);
}

.hero-metric-value {
  display: block;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 700;
}

.hero-metric-label {
  display: block;
  margin-top: 8rpx;
  color: rgba(255, 255, 255, 0.84);
  font-size: 22rpx;
}

.guest-actions button {
  flex: 1;
}

.publish-status,
.upload-card,
.tags-card,
.activity-binding-card {
  margin-top: 18rpx;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}

.note-stamp,
.upload-tip {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(67, 198, 157, 0.14);
  color: #34a77f;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.upload-tip {
  background: rgba(255, 180, 107, 0.16);
  color: #d18a45;
  letter-spacing: 1rpx;
}

.upload-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 14rpx 0;
  margin-top: 18rpx;
}

.upload-box {
  width: 31.5%;
  min-height: 176rpx;
  padding: 18rpx 12rpx;
  border-radius: 24rpx;
  border: 1rpx dashed rgba(109, 154, 190, 0.24);
  background: linear-gradient(135deg, rgba(87, 189, 240, 0.12) 0%, rgba(105, 215, 175, 0.14) 100%);
  text-align: center;
  box-sizing: border-box;
}

.upload-symbol {
  margin-top: 26rpx;
  color: #46a0da;
  font-size: 28rpx;
  font-weight: 700;
}

.upload-copy {
  margin-top: 12rpx;
  color: #6a8193;
  font-size: 22rpx;
}

.tags-row {
  margin-top: 18rpx;
}

.selected-activity-card {
  margin-top: 16rpx;
}

.sub-panel {
  margin-top: 18rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(244, 249, 252, 0.88);
  border: 1rpx dashed rgba(109, 154, 190, 0.2);
}

.sub-panel-title {
  color: #4a9fd5;
  font-size: 22rpx;
  font-weight: 700;
}

.action-board {
  display: flex;
  gap: 16rpx;
  margin-top: 22rpx;
}
</style>
