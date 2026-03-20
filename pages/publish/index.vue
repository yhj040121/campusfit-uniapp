<template>
  <view class="page-shell publish-shell">
    <view v-if="!loggedIn" class="hero-card publish-hero">
      <view class="hero-badge">需要登录</view>
      <view class="hero-title">登录后发布你的校园穿搭</view>
      <view class="hero-copy">你的标题、描述、标签、活动绑定和导购链接会在这里一起完成，形成完整的内容发布闭环。</view>
      <view class="guest-actions">
        <button class="btn-primary" @click="goLogin">去登录</button>
        <button class="btn-ghost" @click="saveDraft">先存草稿</button>
      </view>
    </view>

    <view v-else>
      <view class="page-header">
        <view class="campus-ribbon">{{ mode === 'edit' ? '编辑内容' : '发布穿搭' }}</view>
        <view class="page-title">{{ mode === 'edit' ? '继续完善这条已发布内容' : '把穿搭灵感整理成一条完整内容' }}</view>
        <view class="page-desc">{{ mode === 'edit' ? '你可以继续修改标题、描述、标签、活动和商品链接。' : '从图片展示位到活动专题、预算标签与商品导购，这里会帮你把一次发布整理清楚。' }}</view>
      </view>

      <view class="hero-card publish-hero">
        <view class="meta-line publish-hero-top" style="margin-top:0; align-items:flex-start;">
          <view>
            <view class="hero-badge">{{ mode === 'edit' ? '编辑模式' : '创作工作台' }}</view>
            <view class="hero-title publish-hero-title">{{ mode === 'edit' ? '当前正在修改已发布内容' : '标题 + 描述 + 标签 + 导购链接' }}</view>
            <view class="hero-copy">{{ mode === 'edit' ? '编辑完成后会直接更新原内容，不会重复创建。' : '整理好基础信息后，就能快速发布一条适合校园场景浏览的穿搭内容。' }}</view>
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
            <text class="hero-metric-label">展示位</text>
          </view>
          <view class="hero-metric">
            <text class="hero-metric-value">{{ selectedActivity ? '已绑定' : '未绑定' }}</text>
            <text class="hero-metric-label">活动状态</text>
          </view>
        </view>
      </view>

      <view :class="['publish-inline-tip', publishStateClass]">
        <view class="publish-inline-copy">{{ publishStateText }}</view>
        <view class="float-link" @click="refreshComposer">刷新</view>
      </view>

      <view class="panel-card upload-card">
        <view class="section-head">
          <view>
            <view class="section-title" style="margin-top:0;">图片展示位</view>
            <view class="section-subtitle">当前先用示意图位承接发布流程，后续会接入真实上传能力</view>
          </view>
          <view class="upload-tip">最多 9 张</view>
        </view>
        <view class="upload-grid">
          <view class="upload-slot" v-for="n in 9" :key="'slot-' + n">
            <view class="upload-index">{{ n }}</view>
            <view class="upload-copy">{{ n <= imageCount ? '已准备' : '待添加' }}</view>
          </view>
        </view>
      </view>

      <view class="panel-card">
        <view class="section-head">
          <view>
            <view class="section-title" style="margin-top:0;">标签与分类</view>
            <view class="section-subtitle">用场景、风格、预算把内容归到更准确的位置</view>
          </view>
          <view class="float-link" @click="chooseTags">选择标签</view>
        </view>
        <view class="chip-row">
          <view class="chip chip-active" v-for="tag in form.tags" :key="tag">{{ tag }}</view>
        </view>
      </view>

      <view class="panel-card">
        <view class="section-head">
          <view>
            <view class="section-title" style="margin-top:0;">活动 / 专题</view>
            <view class="section-subtitle">把内容绑定到校园专题活动里，获得更清晰的曝光入口</view>
          </view>
          <view class="float-link" @click="chooseActivity">选择活动</view>
        </view>

        <view v-if="selectedActivity" class="activity-binding-card">
          <view class="list-title">{{ selectedActivity.title }}</view>
          <view class="list-copy">{{ selectedActivity.summary }}</view>
          <view class="chip-row" style="margin-top:16rpx;">
            <view class="chip chip-active">{{ selectedActivity.period }}</view>
            <view class="chip chip-outline">{{ selectedActivity.status }}</view>
          </view>
          <view class="note-box">活动奖励：{{ selectedActivity.reward }}</view>
          <view class="float-link" style="margin-top:16rpx;" @click="clearActivity">清除绑定</view>
        </view>

        <view v-else class="sub-panel">
          <view class="sub-panel-title">还没有绑定活动</view>
          <view class="text-copy" style="margin-top:8rpx;">可以先去活动中心报名，再带着选中的活动回到发布页，形成更完整的创作链路。</view>
        </view>
      </view>

      <view class="panel-card form-card">
        <view class="form-label">标题</view>
        <input class="form-input" v-model="form.title" :placeholder="titlePlaceholder" maxlength="30" />

        <view class="form-label">穿搭描述</view>
        <textarea class="form-textarea" v-model="form.desc" :placeholder="descPlaceholder" maxlength="200"></textarea>

        <view class="form-label">商品导购链接</view>
        <input class="form-input" v-model="form.link" :placeholder="linkPlaceholder" />
      </view>

      <view class="action-row publish-actions">
        <button class="btn-secondary btn-half" @click="secondaryAction">{{ mode === 'edit' ? '退出编辑' : '保存草稿' }}</button>
        <button
          class="btn-primary btn-half"
          :disabled="!isReadyToSubmit || submitting"
          :class="(!isReadyToSubmit || submitting) ? 'btn-disabled' : ''"
          @click="submitPost"
        >
          {{ submitLabel }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
var api = require('../../common/api.js')
var activityStore = require('../../common/activity.js')
var session = require('../../common/session.js')

var DRAFT_KEY = 'campusfit_publish_draft'
var EDIT_POST_KEY = 'campusfit_edit_post_id'

function defaultForm() {
  return {
    title: '',
    desc: '',
    link: 'https://campusfit.example.com/product/new-look',
    tags: ['早八', '清爽通勤', '100-150']
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
        return this.mode === 'edit' ? '保存中...' : '发布中...'
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
        return 'publish-inline-tip-success'
      }
      if (!this.isReadyToSubmit) {
        return 'publish-inline-tip-muted'
      }
      return 'publish-inline-tip-ready'
    },
    publishStateText: function() {
      if (this.pageLoading) {
        return '正在加载当前编辑内容...'
      }
      if (this.submitting) {
        return this.mode === 'edit' ? '正在保存修改...' : '正在发布内容...'
      }
      if (this.lastSuccessText) {
        return this.lastSuccessText
      }
      if (!this.isReadyToSubmit) {
        return '还差一点点：补齐标题、描述、标签和导购链接即可发布。'
      }
      return this.selectedActivity ? '信息已完整，带着活动专题一起发布吧。' : '信息已完整，可以直接发布。'
    },
    titlePlaceholder: function() {
      return '例如：适合图书馆和早八的清爽蓝白穿搭'
    },
    descPlaceholder: function() {
      return '写一下这套穿搭适合什么场景、预算大概多少、搭配亮点是什么。'
    },
    linkPlaceholder: function() {
      return '粘贴商品导购链接'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.applyStoredTags()
    this.loadSelectedActivity()
    var editId = uni.getStorageSync(EDIT_POST_KEY)
    if (!this.loggedIn) {
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
        if (draft.selectedActivity) {
          this.selectedActivity = activityStore.selectActivity(draft.selectedActivity)
        }
      } else {
        this.lastSavedAt = ''
      }
    },
    loadSelectedActivity: function() {
      this.selectedActivity = activityStore.getSelectedActivity()
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
      this.selectedActivity = activityStore.getSelectedActivity()
      this.restoreDraft()
    },
    loadEditPost: function(postId) {
      var self = this
      self.pageLoading = true
      self.lastSuccessText = ''
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
          self.selectedActivity = post.activity ? activityStore.selectActivity(post.activity) : activityStore.getSelectedActivity()
          self.imageCount = post.imageUrls && post.imageUrls.length ? post.imageUrls.length : 1
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            return
          }
          uni.removeStorageSync(EDIT_POST_KEY)
          self.mode = 'create'
          self.editingId = ''
          uni.showToast({ title: error.message || '暂时无法读取编辑内容。', icon: 'none' })
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
      activityStore.clearSelectedActivity()
      this.selectedActivity = null
      uni.showToast({ title: '已清除活动绑定', icon: 'none' })
    },
    saveDraft: function() {
      var payload = Object.assign({}, this.form, {
        savedAt: formatNow(),
        selectedActivity: this.selectedActivity || null
      })
      uni.setStorageSync(DRAFT_KEY, payload)
      this.lastSavedAt = payload.savedAt
      this.lastSuccessText = '草稿已经保存，下次可以继续接着编辑。'
      uni.showToast({ title: '已保存草稿', icon: 'none' })
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
        self.promptLogin('登录后才能继续发布这条内容。')
        return
      }
      if (!self.form.title || !self.form.desc || !self.form.link || !self.form.tags.length) {
        uni.showToast({ title: '请先补齐标题、描述、标签和导购链接。', icon: 'none' })
        return
      }
      self.submitting = true
      self.lastSuccessText = ''
      var payload = {
        title: self.form.title,
        desc: self.form.desc,
        imageUrls: buildImageUrls(self.imageCount),
        tags: self.form.tags,
        productLink: self.form.link,
        activityId: self.selectedActivity ? self.selectedActivity.id : ''
      }
      var request = self.mode === 'edit' ? api.updatePost(self.editingId, payload) : api.createPost(payload)
      request
        .then(function() {
          uni.removeStorageSync(DRAFT_KEY)
          activityStore.clearSelectedActivity()
          self.selectedActivity = null
          self.lastSavedAt = ''
          if (self.mode === 'edit') {
            uni.removeStorageSync(EDIT_POST_KEY)
            self.lastSuccessText = '这条内容已经更新成功。'
            uni.showToast({ title: '已保存修改', icon: 'none' })
            self.mode = 'create'
            self.editingId = ''
            setTimeout(function() {
              uni.switchTab({ url: '/pages/profile/index' })
            }, 400)
            return
          }
          self.lastSuccessText = '新的穿搭内容已经创建成功。'
          uni.showToast({ title: '发布成功', icon: 'none' })
          setTimeout(function() {
            uni.switchTab({ url: '/pages/index/index' })
          }, 400)
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.promptLogin('登录状态已失效，请重新登录后继续。')
            return
          }
          uni.showToast({ title: error.message || '发布失败', icon: 'none' })
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
      uni.showToast({ title: '已刷新状态', icon: 'none' })
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
.publish-shell {
  padding-bottom: 48rpx;
}

.guest-actions,
.publish-actions {
  display: flex;
  gap: 18rpx;
  margin-top: 24rpx;
}

.publish-hero-top {
  justify-content: space-between;
}

.publish-hero-title {
  max-width: 460rpx;
}

.publish-inline-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 18rpx;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.86);
}

.publish-inline-copy {
  flex: 1;
  color: var(--campus-muted);
  font-size: 24rpx;
  line-height: 1.7;
}

.publish-inline-tip-muted {
  border: 1rpx dashed rgba(106, 156, 192, 0.22);
}

.publish-inline-tip-ready {
  background: rgba(240, 251, 247, 0.92);
}

.publish-inline-tip-success {
  background: rgba(237, 248, 255, 0.96);
}

.hero-float-link {
  color: rgba(255, 255, 255, 0.92);
  font-size: 24rpx;
  font-weight: 600;
}

.upload-card,
.form-card {
  margin-top: 24rpx;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.upload-slot {
  min-height: 146rpx;
  padding: 22rpx 16rpx;
  border-radius: 24rpx;
  background: rgba(243, 248, 252, 0.96);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.upload-index {
  color: var(--campus-text);
  font-size: 30rpx;
  font-weight: 700;
}

.upload-copy,
.upload-tip {
  color: var(--campus-muted);
  font-size: 22rpx;
}

.activity-binding-card {
  margin-top: 18rpx;
  padding: 26rpx;
  border-radius: 28rpx;
  background: rgba(244, 249, 255, 0.94);
}

.sub-panel {
  margin-top: 18rpx;
  padding: 26rpx;
  border-radius: 28rpx;
  background: rgba(248, 251, 255, 0.92);
}

.sub-panel-title {
  color: var(--campus-text);
  font-size: 28rpx;
  font-weight: 700;
}

.form-label {
  margin-top: 20rpx;
  margin-bottom: 12rpx;
  color: var(--campus-text);
  font-size: 24rpx;
  font-weight: 700;
}

.form-label:first-child {
  margin-top: 0;
}

.form-input,
.form-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 22rpx 24rpx;
  border-radius: 22rpx;
  background: rgba(246, 250, 253, 0.96);
  color: var(--campus-text);
  font-size: 26rpx;
}

.form-textarea {
  min-height: 220rpx;
}
</style>
