<template>
  <view class="page-shell publish-shell">
    <view v-if="!loggedIn" class="hero-card publish-hero">
      <view class="publish-hero-head">
        <view class="hero-badge publish-hero-badge">需要登录</view>
      </view>
      <view class="hero-title publish-hero-title">登录后开始发布穿搭</view>
      <view class="hero-copy publish-hero-copy">先上传图片，再整理标题、标签和导购信息。</view>
      <view class="guest-actions publish-guest-actions">
        <button class="btn-primary" @click="goLogin">去登录</button>
        <button class="btn-ghost" @click="saveDraft">先存草稿</button>
      </view>
    </view>

    <view v-else>
      <view class="hero-card publish-hero">
        <view class="publish-hero-head">
          <view class="hero-badge publish-hero-badge">{{ mode === 'edit' ? '继续编辑' : '发布概览' }}</view>
          <view v-if="mode === 'edit'" class="publish-hero-link" @click="secondaryAction">退出</view>
        </view>
        <view class="hero-title publish-hero-title">{{ mode === 'edit' ? '把这条内容补完整' : '先上传图，再补标题和标签' }}</view>
        <view class="hero-copy publish-hero-copy">{{ mode === 'edit' ? '改完会直接更新原内容。' : '按顺序整理图片、描述、标签和导购信息。' }}</view>
        <view class="publish-hero-chips">
          <view class="publish-hero-chip">{{ uploadedImageCount }} 图</view>
          <view class="publish-hero-chip">{{ form.tags.length }} 标签</view>
          <view class="publish-hero-chip">{{ selectedActivity ? '已绑活动' : '未绑活动' }}</view>
        </view>
      </view>

      <view :class="['publish-inline-tip', publishStateClass]">
        <view class="publish-inline-copy">{{ publishStateText }}</view>
        <view class="float-link" @click="refreshComposer">刷新</view>
      </view>

      <view class="panel-card upload-card">
        <view class="section-head">
          <view>
            <view class="section-title" style="margin-top:0;">内容图片</view>
          </view>
          <view class="upload-tip">{{ uploadedImageCount }}/9</view>
        </view>

        <view class="upload-grid">
          <view
            v-for="(item, index) in images"
            :key="item.id"
            class="upload-item"
            @click="handleImageTap(index)"
          >
            <image class="upload-thumb" :src="item.previewUrl || item.url" mode="aspectFill"></image>
            <view v-if="index === 0" class="upload-cover-badge">封面</view>
            <view class="upload-remove" @click.stop="removeImage(index)">删除</view>
            <view v-if="item.status === 'uploading'" class="upload-mask">
              <text class="upload-mask-title">上传中</text>
              <text class="upload-mask-copy">请稍候...</text>
            </view>
            <view v-else-if="item.status === 'error'" class="upload-mask upload-mask-error">
              <text class="upload-mask-title">上传失败</text>
              <text class="upload-mask-copy">{{ item.errorMessage || '点击重试' }}</text>
            </view>
          </view>

          <view v-if="canChooseMoreImages" class="upload-add-card" @click="chooseImages">
            <view class="upload-add-mark">+</view>
            <view class="upload-add-title">添加图片</view>
          </view>
        </view>

        <view v-if="!uploadedImageCount && !uploadingCount" class="upload-hint">先上传至少1张图片后再发布。</view>
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

        <view class="form-label">{{ priceLabel }}</view>
        <input class="form-input" v-model="form.price" type="digit" :placeholder="pricePlaceholder" />

        <view class="form-label">商品导购链接</view>
        <input class="form-input" v-model="form.link" :placeholder="linkPlaceholder" />
      </view>

      <view class="action-row publish-actions">
        <button
          class="btn-secondary btn-half"
          :disabled="mode !== 'edit' && savingDraft"
          :class="mode !== 'edit' && savingDraft ? 'btn-disabled' : ''"
          @click="secondaryAction"
        >
          {{ mode === 'edit' ? '退出编辑' : (savingDraft ? '保存中...' : '保存草稿') }}
        </button>
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

var LEGACY_DRAFT_KEY = 'campusfit_publish_draft'
var ACTIVE_DRAFT_KEY = 'campusfit_active_draft_id'
var EDIT_POST_KEY = 'campusfit_edit_post_id'
var MAX_IMAGE_COUNT = 9
var MAX_FILE_SIZE = 10 * 1024 * 1024
var DEFAULT_PUBLISH_TAGS = ['图书馆', '学院风', '100-150']

function defaultForm() {
  return {
    title: '',
    desc: '',
    price: '',
    link: '',
    tags: DEFAULT_PUBLISH_TAGS.slice(0)
  }
}

function normalizePriceInput(value) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

function buildProductPrice(value) {
  var normalized = normalizePriceInput(value)
  if (!normalized) {
    return null
  }
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) {
    return null
  }
  var amount = Number(normalized)
  if (!isFinite(amount) || amount <= 0) {
    return null
  }
  return Number(amount.toFixed(2))
}

function hasValidProductPrice(value) {
  return buildProductPrice(value) !== null
}

function createImageId() {
  return 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function createImageItem(options) {
  var safeOptions = options || {}
  return {
    id: safeOptions.id || createImageId(),
    url: safeOptions.url || '',
    previewUrl: safeOptions.previewUrl || safeOptions.url || '',
    localPath: safeOptions.localPath || '',
    status: safeOptions.status || 'success',
    errorMessage: safeOptions.errorMessage || ''
  }
}

function buildImageItems(imageUrls) {
  var list = []
  if (!imageUrls || !imageUrls.length) {
    return list
  }
  for (var i = 0; i < imageUrls.length; i += 1) {
    if (imageUrls[i]) {
      list.push(createImageItem({
        url: imageUrls[i],
        previewUrl: imageUrls[i],
        status: 'success'
      }))
    }
  }
  return list
}

function collectImageUrls(images) {
  var list = []
  if (!images || !images.length) {
    return list
  }
  for (var i = 0; i < images.length; i += 1) {
    if (images[i] && images[i].status === 'success' && images[i].url) {
      list.push(images[i].url)
    }
  }
  return list
}

function hasListValue(list) {
  return !!(list && list.length)
}

function buildDraftPayload(vm) {
  return {
    title: vm.form.title,
    desc: vm.form.desc,
    imageUrls: collectImageUrls(vm.images),
    tags: vm.form.tags,
    productPrice: buildProductPrice(vm.form.price),
    productLink: vm.form.link,
    activityId: vm.selectedActivity ? vm.selectedActivity.id : ''
  }
}

function isAuthError(error) {
  var message = ((error && error.message) || '').toLowerCase()
  return message.indexOf('login') > -1 || message.indexOf('401') > -1 || message.indexOf('登录') > -1
}

function isDraftMissingError(error) {
  var message = String((error && error.message) || '')
  var lower = message.toLowerCase()
  return message.indexOf('404') > -1 || message.indexOf('\u672a\u627e\u5230\u5bf9\u5e94\u8349\u7a3f') > -1 || (lower.indexOf('draft') > -1 && lower.indexOf('not found') > -1)
}


export default {
  data: function() {
    return {
      loggedIn: session.isLoggedIn(),
      images: [],
      form: defaultForm(),
      selectedActivity: null,
      pageLoading: false,
      lastSavedAt: '',
      lastSuccessText: '',
      submitting: false,
      savingDraft: false,
      mode: 'create',
      editingId: '',
      currentDraftId: ''
    }
  },
  computed: {
    imageCount: function() {
      return this.images.length
    },
    uploadedImageCount: function() {
      return collectImageUrls(this.images).length
    },
    uploadingCount: function() {
      var count = 0
      for (var i = 0; i < this.images.length; i += 1) {
        if (this.images[i] && this.images[i].status === 'uploading') {
          count += 1
        }
      }
      return count
    },
    failedImageCount: function() {
      var count = 0
      for (var i = 0; i < this.images.length; i += 1) {
        if (this.images[i] && this.images[i].status === 'error') {
          count += 1
        }
      }
      return count
    },
    remainingImageCount: function() {
      return Math.max(0, MAX_IMAGE_COUNT - this.imageCount)
    },
    canChooseMoreImages: function() {
      return this.remainingImageCount > 0
    },
    submitLabel: function() {
      if (this.submitting) {
        return '提交中...'
      }
      return this.mode === 'edit' ? '提交修改审核' : '提交审核'
    },
    hasBasicFields: function() {
      return !!(this.form.title && this.form.desc && hasValidProductPrice(this.form.price) && this.form.link && this.form.tags && this.form.tags.length)
    },
    isReadyToSubmit: function() {
      return this.hasBasicFields && this.uploadedImageCount > 0 && !this.pageLoading && !this.uploadingCount && !this.failedImageCount
    },
    publishStateClass: function() {
      if (this.pageLoading || this.savingDraft || this.submitting || this.uploadingCount || this.failedImageCount) {
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
        return this.mode === 'edit' ? '正在加载当前编辑内容...' : '正在恢复草稿内容...'
      }
      if (this.uploadingCount) {
        return '正在上传 ' + this.uploadingCount + ' 张图片，请稍候...'
      }
      if (this.savingDraft) {
        return '正在把草稿同步到你的账号...'
      }
      if (this.submitting) {
        return this.mode === 'edit' ? '正在提交修改审核...' : '正在提交内容审核...'
      }
      if (this.failedImageCount) {
        return '有 ' + this.failedImageCount + ' 张图片上传失败，请点击图片重试或删除后继续。'
      }
      if (this.lastSuccessText) {
        return this.lastSuccessText
      }
      if (!this.uploadedImageCount) {
        return '先上传至少 1 张图片，首张会作为内容封面。'
      }
      if (!this.hasBasicFields && this.currentDraftId && this.lastSavedAt) {
        return '已恢复 ' + this.lastSavedAt + ' 保存的草稿，可继续补全后提交审核。'
      }
      if (!this.hasBasicFields) {
        return '还差一点点：补齐标题、描述、标签、商品价格和导购链接即可提交审核。'
      }
      return this.selectedActivity ? '信息已完整，提交后会带着活动专题一起进入审核。' : '信息已完整，提交后会进入内容审核。'
    },
    titlePlaceholder: function() {
      return '例如：适合图书馆和早八的清爽蓝白穿搭'
    },
    descPlaceholder: function() {
      return '写一下这套穿搭适合什么场景、预算大概多少、搭配亮点是什么。'
    },
    priceLabel: function() {
      return '商品价格'
    },
    pricePlaceholder: function() {
      return '例如：129 或 129.90'
    },
    linkPlaceholder: function() {
      return '粘贴真实商品导购链接'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.applyStoredTags()
    this.loadSelectedActivity()
    this.lastSuccessText = ''
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
      return
    }
    this.restoreActiveDraft(false)
  },
  methods: {
    applyStoredTags: function() {
      var stored = uni.getStorageSync('campusfit_publish_tags')
      if (stored && stored.length) {
        this.form.tags = stored
      }
    },
    loadSelectedActivity: function() {
      this.selectedActivity = activityStore.getSelectedActivity()
    },
    syncActiveDraftId: function(draftId) {
      this.currentDraftId = draftId || ''
      if (draftId) {
        uni.setStorageSync(ACTIVE_DRAFT_KEY, draftId)
        return
      }
      uni.removeStorageSync(ACTIVE_DRAFT_KEY)
    },
    clearActiveDraftState: function() {
      this.syncActiveDraftId('')
      this.lastSavedAt = ''
    },
    resetRecoveredDraftComposer: function() {
      activityStore.clearSelectedActivity()
      this.mode = 'create'
      this.editingId = ''
      this.images = []
      this.form = defaultForm()
      this.selectedActivity = null
      this.pageLoading = false
      this.lastSuccessText = ''
      uni.removeStorageSync(LEGACY_DRAFT_KEY)
      this.clearActiveDraftState()
      this.resetPublishTags()
    },
    resetPublishTags: function() {
      uni.setStorageSync('campusfit_publish_tags', DEFAULT_PUBLISH_TAGS.slice(0))
    },
    setImagesFromUrls: function(imageUrls) {
      this.images = buildImageItems(imageUrls)
    },
    findImageIndex: function(imageId) {
      for (var i = 0; i < this.images.length; i += 1) {
        if (this.images[i] && this.images[i].id === imageId) {
          return i
        }
      }
      return -1
    },
    replaceImageItem: function(imageId, patch) {
      var index = this.findImageIndex(imageId)
      if (index < 0) {
        return
      }
      this.images.splice(index, 1, Object.assign({}, this.images[index], patch || {}))
    },
    ensureImageQueueReady: function(actionText) {
      if (this.uploadingCount) {
        uni.showToast({ title: '请等待图片上传完成后再' + actionText, icon: 'none' })
        return false
      }
      if (this.failedImageCount) {
        uni.showToast({ title: '请先重试或删除上传失败的图片', icon: 'none' })
        return false
      }
      return true
    },
    applyDraftData: function(draft) {
      var base = defaultForm()
      this.mode = 'create'
      this.editingId = ''
      this.form = {
        title: draft.title || '',
        desc: draft.desc || '',
        price: normalizePriceInput(draft.productPrice),
        link: draft.productLink || base.link,
        tags: hasListValue(draft.tags) ? draft.tags : base.tags
      }
      this.setImagesFromUrls(draft.imageUrls || [])
      this.lastSavedAt = draft.savedAt || ''
      this.syncActiveDraftId(draft.id || '')
      uni.removeStorageSync(LEGACY_DRAFT_KEY)
      if (draft.activity) {
        this.selectedActivity = activityStore.selectActivity(draft.activity)
        return
      }
      activityStore.clearSelectedActivity()
      this.selectedActivity = null
    },
    restoreActiveDraft: function(forceReload) {
      var draftId = uni.getStorageSync(ACTIVE_DRAFT_KEY) || ''
      if (!draftId) {
        if (this.currentDraftId) {
          this.resetRecoveredDraftComposer()
        } else if (forceReload) {
          this.clearActiveDraftState()
        }
        return Promise.resolve(null)
      }
      if (!forceReload && this.currentDraftId === draftId) {
        return Promise.resolve(null)
      }
      return this.loadDraftDetail(draftId)
    },
    loadDraftDetail: function(draftId) {
      var self = this
      self.pageLoading = true
      self.lastSuccessText = ''
      return api.getDraftDetail(draftId)
        .then(function(draft) {
          self.applyDraftData(draft)
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            return
          }
          if (isDraftMissingError(error)) {
            if (uni.getStorageSync(ACTIVE_DRAFT_KEY) === draftId) {
              uni.removeStorageSync(ACTIVE_DRAFT_KEY)
            }
            self.resetRecoveredDraftComposer()
          } else {
            self.clearActiveDraftState()
          }
          uni.showToast({ title: error.message || '暂时无法读取草稿。', icon: 'none' })
        })
        .finally(function() {
          self.pageLoading = false
        })
    },
    resetCreateMode: function(clearEditStorage) {
      if (clearEditStorage !== false) {
        uni.removeStorageSync(EDIT_POST_KEY)
      }
      this.mode = 'create'
      this.editingId = ''
      this.images = []
      this.form = defaultForm()
      this.pageLoading = false
      this.lastSuccessText = ''
      this.selectedActivity = activityStore.getSelectedActivity()
      this.lastSavedAt = ''
      this.restoreActiveDraft(true)
    },
    clearComposerAfterSubmit: function() {
      uni.removeStorageSync(EDIT_POST_KEY)
      uni.removeStorageSync(LEGACY_DRAFT_KEY)
      this.resetPublishTags()
      this.clearActiveDraftState()
      activityStore.clearSelectedActivity()
      this.mode = 'create'
      this.editingId = ''
      this.images = []
      this.form = defaultForm()
      this.selectedActivity = null
      this.pageLoading = false
      this.lastSuccessText = ''
    },
    clearComposerAfterDraftSave: function() {
      uni.removeStorageSync(EDIT_POST_KEY)
      uni.removeStorageSync(LEGACY_DRAFT_KEY)
      this.resetPublishTags()
      this.clearActiveDraftState()
      activityStore.clearSelectedActivity()
      this.mode = 'create'
      this.editingId = ''
      this.images = []
      this.form = defaultForm()
      this.selectedActivity = null
      this.pageLoading = false
      this.lastSuccessText = '草稿已保存，发布页已清空，下次保存会新建一条草稿。'
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
            price: normalizePriceInput(post.productPrice),
            link: post.productLink || '',
            tags: hasListValue(post.tags) ? post.tags : defaultForm().tags
          }
          self.setImagesFromUrls(post.imageUrls || [])
          if (post.activity) {
            self.selectedActivity = activityStore.selectActivity(post.activity)
          } else {
            activityStore.clearSelectedActivity()
            self.selectedActivity = null
          }
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
    chooseImages: function() {
      var self = this
      if (!session.isLoggedIn()) {
        self.promptLogin('登录后才能上传图片并发布内容。')
        return
      }
      if (!self.canChooseMoreImages) {
        uni.showToast({ title: '最多上传 9 张图片', icon: 'none' })
        return
      }
      uni.chooseImage({
        count: self.remainingImageCount,
        sizeType: ['original'],
        sourceType: ['album', 'camera'],
        success: function(result) {
          var tempFilePaths = result.tempFilePaths || []
          var tempFiles = result.tempFiles || []
          var acceptedPaths = []
          var skippedCount = 0
          for (var i = 0; i < tempFilePaths.length; i += 1) {
            var tempFile = tempFiles[i] || {}
            var tempFilePath = tempFile.path || tempFile.tempFilePath || tempFilePaths[i]
            if (tempFile.size && tempFile.size > MAX_FILE_SIZE) {
              skippedCount += 1
              continue
            }
            if (tempFilePath) {
              acceptedPaths.push(tempFilePath)
            }
          }
          if (!tempFiles.length) {
            acceptedPaths = tempFilePaths.slice(0)
          }
          if (skippedCount) {
            uni.showToast({ title: '有 ' + skippedCount + ' 张图片超过 10MB，已跳过', icon: 'none' })
          }
          if (acceptedPaths.length) {
            self.uploadSelectedImages(acceptedPaths)
          }
        }
      })
    },
    uploadSelectedImages: function(filePaths) {
      var self = this
      var chain = Promise.resolve()
      for (var i = 0; i < filePaths.length; i += 1) {
        (function(filePath) {
          chain = chain.then(function() {
            var imageId = createImageId()
            self.images.push(createImageItem({
              id: imageId,
              localPath: filePath,
              previewUrl: filePath,
              status: 'uploading'
            }))
            return self.uploadImageById(imageId, filePath).catch(function() {
              return null
            })
          })
        })(filePaths[i])
      }
      return chain
    },
    uploadImageById: function(imageId, filePath) {
      var self = this
      return api.uploadPostImage(filePath)
        .then(function(result) {
          if (!result || !result.url) {
            throw new Error('图片上传成功但未返回可用链接')
          }
          self.replaceImageItem(imageId, {
            url: result.url,
            previewUrl: result.url,
            localPath: filePath,
            status: 'success',
            errorMessage: ''
          })
        })
        .catch(function(error) {
          self.replaceImageItem(imageId, {
            status: 'error',
            localPath: filePath,
            previewUrl: filePath,
            errorMessage: error.message || '上传失败'
          })
          uni.showToast({ title: error.message || '图片上传失败', icon: 'none' })
          throw error
        })
    },
    handleImageTap: function(index) {
      var item = this.images[index]
      if (!item) {
        return
      }
      if (item.status === 'uploading') {
        uni.showToast({ title: '图片上传中，请稍候', icon: 'none' })
        return
      }
      if (item.status === 'error') {
        this.retryImage(index)
        return
      }
      this.previewImages(index)
    },
    retryImage: function(index) {
      var item = this.images[index]
      if (!item || !item.localPath) {
        uni.showToast({ title: '当前图片无法重试，请重新选择', icon: 'none' })
        return
      }
      this.images.splice(index, 1, Object.assign({}, item, {
        status: 'uploading',
        errorMessage: ''
      }))
      this.uploadImageById(item.id, item.localPath).catch(function() {
        return null
      })
    },
    removeImage: function(index) {
      if (index < 0 || index >= this.images.length) {
        return
      }
      this.images.splice(index, 1)
      uni.showToast({ title: '图片已移除', icon: 'none' })
    },
    previewImages: function(index) {
      var current = this.images[index]
      if (!current) {
        return
      }
      var urls = []
      for (var i = 0; i < this.images.length; i += 1) {
        if (this.images[i] && (this.images[i].previewUrl || this.images[i].url)) {
          urls.push(this.images[i].previewUrl || this.images[i].url)
        }
      }
      if (!urls.length) {
        return
      }
      uni.previewImage({
        current: current.previewUrl || current.url,
        urls: urls
      })
    },
    clearActivity: function() {
      activityStore.clearSelectedActivity()
      this.selectedActivity = null
      uni.showToast({ title: '已清除活动绑定', icon: 'none' })
    },
    saveDraft: function() {
      var self = this
      if (self.savingDraft) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('\u767b\u5f55\u540e\u624d\u80fd\u628a\u8349\u7a3f\u540c\u6b65\u5230\u4f60\u7684\u8d26\u53f7\u3002')
        return
      }
      if (!self.ensureImageQueueReady('\u4fdd\u5b58\u8349\u7a3f')) {
        return
      }
      if (self.form.price && !hasValidProductPrice(self.form.price)) {
        uni.showToast({ title: '\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u5546\u54c1\u4ef7\u683c', icon: 'none' })
        return
      }
      self.savingDraft = true
      self.lastSuccessText = ''
      var payload = buildDraftPayload(self)
      var request = self.currentDraftId ? api.updateDraft(self.currentDraftId, payload) : api.createDraft(payload)
      request
        .then(function() {
          self.clearComposerAfterDraftSave()
          uni.showToast({ title: '\u5df2\u4fdd\u5b58\u8349\u7a3f', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.promptLogin('\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u540e\u7ee7\u7eed\u4fdd\u5b58\u8349\u7a3f\u3002')
            return
          }
          if (isDraftMissingError(error)) {
            self.clearActiveDraftState()
            uni.showToast({ title: '\u539f\u8349\u7a3f\u5df2\u4e0d\u5b58\u5728\uff0c\u518d\u70b9\u4e00\u6b21\u4fdd\u5b58\u4f1a\u65b0\u5efa\u8349\u7a3f', icon: 'none' })
            return
          }
          uni.showToast({ title: error.message || '\u8349\u7a3f\u4fdd\u5b58\u5931\u8d25', icon: 'none' })
        })
        .finally(function() {
          self.savingDraft = false
        })
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
        if (this.uploadingCount) {
          uni.showToast({ title: '请等待图片上传完成后再退出编辑', icon: 'none' })
          return
        }
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
      if (!self.ensureImageQueueReady('发布内容')) {
        return
      }
      if (!self.form.title || !self.form.desc || !hasValidProductPrice(self.form.price) || !self.form.link || !self.form.tags.length) {
        uni.showToast({ title: '请先补齐标题、描述、标签、商品价格和导购链接。', icon: 'none' })
        return
      }
      if (!self.uploadedImageCount) {
        uni.showToast({ title: '请至少上传 1 张图片', icon: 'none' })
        return
      }
      self.submitting = true
      self.lastSuccessText = ''
      var payload = buildDraftPayload(self)
      var isDraftPublish = self.mode === 'create' && !!self.currentDraftId
      var request = null
      if (self.mode === 'edit') {
        request = api.updatePost(self.editingId, payload)
      } else if (isDraftPublish) {
        request = api.publishDraft(self.currentDraftId, payload)
      } else {
        request = api.createPost(payload)
      }
      request
        .then(function() {
          if (self.mode === 'edit') {
            self.clearComposerAfterSubmit()
            self.lastSuccessText = '修改已提交审核，可在我的发布查看进度。'
            uni.showToast({ title: '已提交修改', icon: 'none' })
            setTimeout(function() {
              uni.navigateTo({ url: '/pages/my-posts/index' })
            }, 400)
            return
          }
          self.clearComposerAfterSubmit()
          self.lastSuccessText = '内容已提交审核，可在我的发布查看进度。'
          uni.showToast({ title: '已提交审核', icon: 'none' })
          setTimeout(function() {
            uni.navigateTo({ url: '/pages/my-posts/index' })
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
      if (this.uploadingCount) {
        uni.showToast({ title: '图片上传中，请稍候再刷新', icon: 'none' })
        return
      }
      this.applyStoredTags()
      this.loadSelectedActivity()
      this.lastSuccessText = ''
      if (!this.loggedIn) {
        uni.showToast({ title: '已刷新状态', icon: 'none' })
        return
      }
      var editId = uni.getStorageSync(EDIT_POST_KEY)
      if (editId) {
        this.loadEditPost(editId)
      } else {
        this.restoreActiveDraft(true)
      }
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

.publish-hero {
  margin-top: 10rpx;
  padding: 18rpx 18rpx;
  border-radius: 28rpx;
}

.publish-hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.publish-hero-badge {
  padding: 8rpx 14rpx;
  font-size: 18rpx;
}

.publish-hero-link {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.88);
  font-family: var(--campus-font-data);
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.publish-hero-title {
  max-width: 100%;
  margin-top: 10rpx;
  font-size: 36rpx;
  line-height: 1.14;
}

.publish-hero-copy {
  margin-top: 8rpx;
  max-width: 100%;
  font-size: 22rpx;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.publish-hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.publish-hero-chip {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.12);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
  font-size: 20rpx;
  font-weight: 700;
}

.publish-guest-actions {
  margin-top: 18rpx;
}

.publish-inline-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.86);
}

.publish-inline-copy {
  flex: 1;
  color: var(--campus-text-muted);
  font-size: 22rpx;
  line-height: 1.5;
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

.upload-card,
.form-card {
  margin-top: 24rpx;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.upload-item,
.upload-add-card {
  position: relative;
  min-height: 214rpx;
  border-radius: 28rpx;
  overflow: hidden;
}

.upload-item {
  background: rgba(239, 246, 251, 0.98);
}

.upload-thumb {
  width: 100%;
  height: 214rpx;
  display: block;
}

.upload-cover-badge {
  position: absolute;
  left: 14rpx;
  top: 14rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  color: var(--campus-text);
  font-size: 20rpx;
  font-weight: 700;
}

.upload-remove {
  position: absolute;
  right: 14rpx;
  top: 14rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(11, 24, 36, 0.56);
  color: #fff;
  font-size: 20rpx;
}

.upload-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8rpx;
  padding: 22rpx 20rpx;
  background: linear-gradient(180deg, rgba(15, 30, 45, 0.08) 0%, rgba(15, 30, 45, 0.76) 100%);
  color: #fff;
}

.upload-mask-error {
  background: linear-gradient(180deg, rgba(115, 35, 35, 0.08) 0%, rgba(115, 35, 35, 0.82) 100%);
}

.upload-mask-title {
  font-size: 26rpx;
  font-weight: 700;
}

.upload-mask-copy {
  font-size: 22rpx;
  line-height: 1.5;
}

.upload-add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border: 2rpx dashed rgba(89, 154, 191, 0.3);
  background:
    radial-gradient(circle at top, rgba(120, 222, 207, 0.28), transparent 58%),
    rgba(247, 251, 255, 0.96);
}

.upload-add-mark {
  width: 68rpx;
  height: 68rpx;
  border-radius: 24rpx;
  background: rgba(103, 191, 223, 0.14);
  color: #3f97c8;
  font-size: 42rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-add-title {
  color: var(--campus-text);
  font-size: 26rpx;
  font-weight: 700;
}

.upload-tip {
  color: var(--campus-text-muted);
  font-size: 22rpx;
}

.upload-hint {
  margin-top: 18rpx;
  color: var(--campus-text-muted);
  font-size: 22rpx;
  line-height: 1.6;
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

.publish-inline-tip {
  position: sticky;
  top: 16rpx;
  z-index: 4;
}

.upload-card,
.form-card {
  position: relative;
}

.upload-card {
  padding-top: 28rpx;
}

.form-card {
  padding-top: 24rpx;
}

.upload-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: 214rpx;
}

.upload-item {
  min-height: 214rpx;
}

.upload-item:first-child {
  grid-row: span 2;
}

.upload-item:first-child .upload-thumb {
  height: 446rpx;
}

.upload-add-card {
  grid-column: span 2;
  min-height: 120rpx;
}

.activity-binding-card,
.sub-panel {
  background:
    linear-gradient(135deg, rgba(201, 49, 91, 0.06), rgba(45, 87, 217, 0.05)),
    rgba(255, 250, 245, 0.94);
}
</style>
