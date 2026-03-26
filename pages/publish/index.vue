<template>
  <view class="page-shell publish-shell">
    <view class="publish-topbar">
      <view class="publish-topbar-inner">
        <view class="publish-topbar-left">
          <button class="publish-topbar-side" @click="handleTopBack">
            <text class="publish-topbar-close">×</text>
          </button>
          <text class="publish-topbar-brand">青搭</text>
        </view>

<!--        <view
          :class="['publish-topbar-action', isTopActionDisabled ? 'publish-topbar-action-disabled' : '']"
          @click="submitPost"
        >
          {{ topActionText }}
        </view> -->
      </view>
    </view>

    <scroll-view class="publish-scroll" scroll-y="true" show-scrollbar="false">
      <view class="publish-content">
        <view v-if="!loggedIn" class="publish-login-card">
          <view class="publish-login-badge">需要登录</view>
          <view class="publish-login-title">登录后开始发布穿搭</view>
          <view class="publish-login-copy">先上传图片，再整理标题、标签、预算和商品链接。</view>
          <view class="publish-login-actions">
            <button class="publish-secondary-button" @click="goLogin">去登录</button>
            <button class="publish-ghost-button" @click="saveDraft">保存草稿</button>
          </view>
        </view>

        <view v-else>
          <view :class="['publish-state-card', publishStateClass]">
            <view class="publish-state-dot"></view>
            <view class="publish-state-copy">{{ publishStateText }}</view>
            <view class="publish-state-link" @click="refreshComposer">刷新</view>
          </view>

          <view class="publish-section">
            <view class="publish-section-head">
              <view class="publish-section-title">发布内容</view>
              <view class="publish-section-note">最多添加 9 张图片</view>
            </view>

            <view class="publish-photo-grid">
              <view
                v-for="(item, index) in images"
                :key="item.id"
                class="publish-photo-card"
                @click="handleImageTap(index)"
              >
                <image class="publish-photo-image" :src="item.previewUrl || item.url" mode="aspectFill"></image>
                <view v-if="index === 0" class="publish-photo-cover-badge">主图</view>
                <view class="publish-photo-remove" @click.stop="removeImage(index)">删除</view>

                <view v-if="item.status === 'uploading'" class="publish-photo-mask">
                  <text class="publish-photo-mask-title">上传中</text>
                  <text class="publish-photo-mask-copy">请稍候...</text>
                </view>

                <view v-else-if="item.status === 'error'" class="publish-photo-mask publish-photo-mask-error">
                  <text class="publish-photo-mask-title">上传失败</text>
                  <text class="publish-photo-mask-copy">{{ item.errorMessage || '点击重试' }}</text>
                </view>
              </view>

              <view
                v-if="canChooseMoreImages"
                :class="['publish-photo-card', 'publish-photo-add', imageCount === 0 ? 'publish-photo-add-primary' : '']"
                @click="chooseImages"
              >
                <view class="publish-photo-add-icon">+</view>
                <view class="publish-photo-add-label">{{ imageCount === 0 ? '主图' : '添加图片' }}</view>
              </view>

              <view
                v-for="slot in uploadPlaceholderCount"
                :key="'placeholder-' + slot"
                class="publish-photo-card publish-photo-placeholder"
              >
                <view class="publish-photo-placeholder-icon"></view>
              </view>
            </view>
          </view>

          <view class="publish-form-section">
            <input
              v-model="form.title"
              class="publish-title-input"
              :placeholder="titlePlaceholder"
              placeholder-style="color: #dadddf;"
              maxlength="30"
            />
            <view class="publish-title-divider"></view>

            <view class="publish-desc-card">
              <textarea
                v-model="form.desc"
                class="publish-desc-input"
                :placeholder="descPlaceholder"
                placeholder-style="color: rgba(89, 92, 93, 0.45);"
                maxlength="200"
                cursor-spacing="36"
                auto-height
              ></textarea>
            </view>

            <view class="publish-inline-fields">
              <view class="publish-inline-field">
                <view class="publish-inline-icon">¥</view>
                <input
                  v-model="form.price"
                  class="publish-inline-input"
                  type="digit"
                  :placeholder="pricePlaceholder"
                  placeholder-style="color: rgba(89, 92, 93, 0.58);"
                />
              </view>

              <view class="publish-inline-field">
                <view class="publish-inline-icon publish-inline-icon-link">↗</view>
                <input
                  v-model="form.link"
                  class="publish-inline-input"
                  :placeholder="linkPlaceholder"
                  placeholder-style="color: rgba(89, 92, 93, 0.58);"
                />
              </view>
            </view>
          </view>

          <view class="publish-meta-section">
            <view class="publish-meta-label">场景 &amp; 风格</view>
            <view class="publish-chip-row">
              <view class="publish-chip publish-chip-primary" @click="chooseTags">{{ currentSceneTag }}</view>
              <view class="publish-chip publish-chip-muted" @click="chooseTags">{{ currentStyleTag }}</view>
              <view class="publish-chip publish-chip-add" @click="chooseTags">+ 添加风格</view>
            </view>
          </view>

          <view class="publish-meta-section">
            <view class="publish-meta-label">价格</view>
            <view class="publish-budget-row">
              <view
                :class="['publish-budget-chip', !currentBudgetTag ? 'publish-budget-chip-active' : '']"
                @click="setBudgetTag('')"
              >
                不填写
              </view>
              <view
                v-for="item in budgetOptions"
                :key="item"
                :class="['publish-budget-chip', currentBudgetTag === item ? 'publish-budget-chip-active' : '']"
                @click="setBudgetTag(item)"
              >
                {{ item }}
              </view>
            </view>
          </view>

          <view class="publish-activity-section">
            <view class="publish-activity-head">
              <view class="publish-meta-label">选择校园活动</view>
              <view class="publish-activity-link" @click="chooseActivity">查看全部</view>
            </view>

            <scroll-view class="publish-activity-scroll" scroll-x="true" show-scrollbar="false">
              <view v-if="activityPreviewList.length" class="publish-activity-row">
                <view
                  v-for="(item, index) in activityPreviewList"
                  :key="item.id"
                  :class="['publish-activity-card', selectedActivity && selectedActivity.id === item.id ? 'publish-activity-card-active' : '']"
                  @click="pickActivityInline(item)"
                >
                  <view :class="['publish-activity-cover', 'publish-activity-cover-' + (index % 3)]">
                    <image
                      v-if="item.coverImageUrl"
                      class="publish-activity-cover-image"
                      :src="item.coverImageUrl"
                      mode="aspectFill"
                    ></image>
                    <view class="publish-activity-cover-ambient"></view>
                    <view class="publish-activity-cover-mask"></view>

                    <view class="publish-activity-cover-top">
                      <view class="publish-activity-cover-badge">{{ item.badge || '活动' }}</view>
                      <view v-if="selectedActivity && selectedActivity.id === item.id" class="publish-activity-check">✓</view>
                    </view>

                    <view class="publish-activity-cover-scene">{{ item.scene || item.theme || 'Campus Activity' }}</view>
                  </view>

                  <view class="publish-activity-card-body">
                    <view class="publish-activity-card-title">{{ item.title || '未命名活动' }}</view>
                    <view class="publish-activity-card-copy">{{ item.period || item.statusCopy || item.summary || '点击选择这个活动' }}</view>
                  </view>
                </view>
              </view>

              <view v-else class="publish-activity-empty-inline">暂无可关联活动</view>
            </scroll-view>

            <view v-if="selectedActivity" class="publish-activity-summary">
              <view class="publish-activity-summary-title">{{ selectedActivity.title }}</view>
              <view class="publish-activity-summary-copy">{{ selectedActivity.summary || selectedActivity.theme || '已选择这个活动作为当前发布的关联专题。' }}</view>

              <view class="publish-activity-summary-meta">
                <view class="publish-activity-meta-chip">{{ selectedActivity.period || '待更新时间' }}</view>
                <view class="publish-activity-meta-chip publish-activity-meta-chip-soft">
                  {{ selectedActivity.status || selectedActivity.statusCopy || '可参与' }}
                </view>
              </view>

              <view class="publish-activity-clear" @click="clearActivity">取消选择</view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="loggedIn" class="publish-actions">
      <button
        class="publish-action-button publish-action-secondary"
        :disabled="mode !== 'edit' && savingDraft"
        :class="mode !== 'edit' && savingDraft ? 'publish-action-disabled' : ''"
        @click="secondaryAction"
      >
        {{ secondaryButtonText }}
      </button>

      <button
        class="publish-action-button publish-action-primary"
        :disabled="!isReadyToSubmit || submitting"
        :class="(!isReadyToSubmit || submitting) ? 'publish-action-disabled' : ''"
        @click="submitPost"
      >
        <text>{{ primaryButtonText }}</text>
        <text class="publish-action-arrow">↗</text>
      </button>
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
var DEFAULT_PUBLISH_TAGS = ['图书馆', '学院风', '']
var DEFAULT_BUDGET_OPTIONS = ['0-50', '50-100', '100-150', '150+']

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

function repairTagValue(value, index) {
  var text = typeof value === 'string' ? value.trim() : ''
  if (!text) {
    return index < 2 ? (DEFAULT_PUBLISH_TAGS[index] || '') : ''
  }
  if (text.indexOf('鍥句功') > -1) {
    return '图书馆'
  }
  if (text.indexOf('瀛﹂櫌') > -1) {
    return '学院风'
  }
  return text
}

function normalizeTagList(tags) {
  var list = []
  for (var i = 0; i < 3; i += 1) {
    list.push(repairTagValue(tags && tags[i], i))
  }
  return list
}

function getTagValue(tags, index) {
  if (tags && tags[index]) {
    return tags[index]
  }
  return index < 2 ? (DEFAULT_PUBLISH_TAGS[index] || '') : ''
}

function buildBudgetOptions(selectedBudget) {
  var options = DEFAULT_BUDGET_OPTIONS.slice(0)
  if (selectedBudget && options.indexOf(selectedBudget) === -1) {
    options.push(selectedBudget)
  }
  return options
}

function isPublishSelectableActivity(activity) {
  return !!(activity && activity.id && activity.selectable !== false)
}

function buildActivityPreviewList(list, selectedActivity) {
  var source = (list || []).filter(isPublishSelectableActivity)
  var selectedId = selectedActivity && selectedActivity.id ? String(selectedActivity.id) : ''
  if (selectedActivity && selectedId && selectedActivity.selectable !== false) {
    var exists = false
    for (var i = 0; i < source.length; i += 1) {
      if (String(source[i] && source[i].id) === selectedId) {
        exists = true
        break
      }
    }
    if (!exists) {
      source.unshift(selectedActivity)
    }
  }
  return source.slice(0, 6)
}

function buildDraftPayload(vm) {
  return {
    title: vm.form.title,
    desc: vm.form.desc,
    imageUrls: collectImageUrls(vm.images),
    tags: normalizeTagList(vm.form.tags),
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
      availableActivities: [],
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
    uploadPlaceholderCount: function() {
      var previewSlots = 6
      var usedSlots = this.imageCount + (this.canChooseMoreImages ? 1 : 0)
      return Math.max(0, previewSlots - usedSlots)
    },
    currentSceneTag: function() {
      return getTagValue(this.form.tags, 0)
    },
    currentStyleTag: function() {
      return getTagValue(this.form.tags, 1)
    },
    currentBudgetTag: function() {
      return getTagValue(this.form.tags, 2)
    },
    budgetOptions: function() {
      return buildBudgetOptions(this.currentBudgetTag)
    },
    activityPreviewList: function() {
      return buildActivityPreviewList(this.availableActivities, this.selectedActivity)
    },
    hasBasicFields: function() {
      return !!(this.form.title && this.form.desc && this.form.tags && this.form.tags.length)
    },
    hasValidOptionalPrice: function() {
      return !this.form.price || hasValidProductPrice(this.form.price)
    },
    isReadyToSubmit: function() {
      return this.hasBasicFields && this.hasValidOptionalPrice && this.uploadedImageCount > 0 && !this.pageLoading && !this.uploadingCount && !this.failedImageCount
    },
    isTopActionDisabled: function() {
      return !this.loggedIn || !this.isReadyToSubmit || this.submitting
    },
    topActionText: function() {
      return this.mode === 'edit' ? '提交修改' : '立即发布'
    },
    secondaryButtonText: function() {
      if (this.mode === 'edit') {
        return '退出编辑'
      }
      return this.savingDraft ? '保存中...' : '保存草稿'
    },
    primaryButtonText: function() {
      if (this.mode === 'edit') {
        return this.submitting ? '提交中...' : '立即更新'
      }
      return this.submitting ? '发布中...' : '立即发布'
    },
    publishStateClass: function() {
      if (this.pageLoading || this.savingDraft || this.submitting || this.uploadingCount || this.failedImageCount) {
        return 'publish-state-card-warning'
      }
      if (this.lastSuccessText) {
        return 'publish-state-card-success'
      }
      if (!this.isReadyToSubmit) {
        return 'publish-state-card-muted'
      }
      return 'publish-state-card-ready'
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
      if (!this.hasValidOptionalPrice) {
        return '商品价格格式不正确，可留空，或填写类似 129 / 129.90 的价格。'
      }
      if (!this.hasBasicFields && this.currentDraftId && this.lastSavedAt) {
        return '已恢复 ' + this.lastSavedAt + ' 保存的草稿，可继续补全后提交审核。'
      }
      if (!this.hasBasicFields) {
        return '还差一点点：补齐标题、描述和标签即可提交审核。商品价格和链接都可以按需填写。'
      }
      return this.selectedActivity ? '信息已完整，提交后会带着活动专题一起进入审核。' : '信息已完整，提交后会进入内容审核。'
    },
    titlePlaceholder: function() {
      return '添加标题'
    },
    descPlaceholder: function() {
      return '这一刻的想法...'
    },
    pricePlaceholder: function() {
      return '价格（可选）'
    },
    linkPlaceholder: function() {
      return '商品链接（可选）'
    }
  },
  onShow: function() {
    this.loggedIn = session.isLoggedIn()
    this.applyStoredTags()
    this.loadSelectedActivity()
    this.loadActivityOptions()
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
        this.form.tags = normalizeTagList(stored)
      }
    },
    loadSelectedActivity: function() {
      this.selectedActivity = activityStore.getSelectedActivity()
    },
    loadActivityOptions: function() {
      var self = this
      api.listActivities()
        .then(function(list) {
          self.availableActivities = (list || []).filter(isPublishSelectableActivity)
        })
        .catch(function() {
          self.availableActivities = []
        })
    },
    setPublishTags: function(tags) {
      var normalized = normalizeTagList(tags)
      this.form.tags = normalized
      uni.setStorageSync('campusfit_publish_tags', normalized)
    },
    setBudgetTag: function(tag) {
      var nextTag = this.currentBudgetTag === tag ? '' : tag
      this.setPublishTags([this.currentSceneTag, this.currentStyleTag, nextTag])
    },
    pickActivityInline: function(activity) {
      if (!activity || !activity.id) {
        return
      }
      if (activity.selectable === false) {
        uni.showToast({ title: '该活动当前不可在发布时选择', icon: 'none' })
        return
      }
      this.selectedActivity = activityStore.selectActivity(activity)
      uni.showToast({ title: '已选择活动', icon: 'none' })
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
        tags: hasListValue(draft.tags) ? normalizeTagList(draft.tags) : base.tags
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
            tags: hasListValue(post.tags) ? normalizeTagList(post.tags) : defaultForm().tags
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
        sizeType: ['compressed'],
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
      uni.showToast({ title: '已取消活动选择', icon: 'none' })
    },
    saveDraft: function() {
      var self = this
      if (self.savingDraft) {
        return
      }
      if (!session.isLoggedIn()) {
        self.promptLogin('登录后才能把草稿同步到你的账号。')
        return
      }
      if (!self.ensureImageQueueReady('保存草稿')) {
        return
      }
      if (self.form.price && !hasValidProductPrice(self.form.price)) {
        uni.showToast({ title: '请输入正确的商品价格', icon: 'none' })
        return
      }
      self.savingDraft = true
      self.lastSuccessText = ''
      var payload = buildDraftPayload(self)
      var request = self.currentDraftId ? api.updateDraft(self.currentDraftId, payload) : api.createDraft(payload)
      request
        .then(function() {
          self.clearComposerAfterDraftSave()
          uni.showToast({ title: '已保存草稿', icon: 'none' })
        })
        .catch(function(error) {
          if (isAuthError(error)) {
            session.clearSession()
            self.loggedIn = false
            self.promptLogin('登录状态已失效，请重新登录后继续保存草稿。')
            return
          }
          if (isDraftMissingError(error)) {
            self.clearActiveDraftState()
            uni.showToast({ title: '原草稿已不存在，再点一次保存会新建草稿', icon: 'none' })
            return
          }
          uni.showToast({ title: error.message || '草稿保存失败', icon: 'none' })
        })
        .finally(function() {
          self.savingDraft = false
        })
    },
    goLogin: function() {
      uni.navigateTo({ url: '/pages/login/index' })
    },
    hasPendingContent: function() {
      var baseTags = DEFAULT_PUBLISH_TAGS.join('|')
      var currentTags = normalizeTagList(this.form.tags).join('|')
      return !!(
        this.images.length ||
        this.form.title ||
        this.form.desc ||
        this.form.price ||
        this.form.link ||
        currentTags !== baseTags ||
        this.selectedActivity
      )
    },
    leaveComposer: function() {
      var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      if (this.mode === 'edit') {
        this.resetCreateMode(true)
        setTimeout(function() {
          uni.navigateTo({ url: '/pages/my-posts/index' })
        }, 80)
        return
      }
      if (pages && pages.length > 1) {
        uni.navigateBack({ delta: 1 })
        return
      }
      uni.switchTab({ url: '/pages/index/index' })
    },
    handleTopBack: function() {
      var self = this
      if (this.uploadingCount) {
        uni.showToast({ title: '图片上传中，请稍候再离开', icon: 'none' })
        return
      }
      if (this.mode !== 'edit' && !this.hasPendingContent()) {
        this.leaveComposer()
        return
      }
      uni.showModal({
        title: this.mode === 'edit' ? '退出编辑' : '放弃这次发布？',
        content: this.mode === 'edit' ? '当前修改还没有提交，确认退出编辑吗？' : '当前填写内容还没有发布，确认离开吗？',
        confirmText: '确认离开',
        cancelText: '继续编辑',
        success: function(result) {
          if (result.confirm) {
            self.leaveComposer()
          }
        }
      })
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
      if (!self.form.title || !self.form.desc || !self.form.tags.length) {
        uni.showToast({ title: '请先补齐标题、描述和标签。', icon: 'none' })
        return
      }
      if (self.form.price && !hasValidProductPrice(self.form.price)) {
        uni.showToast({ title: '请输入正确的商品价格，或留空。', icon: 'none' })
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
      this.loadActivityOptions()
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

<style scoped>
.publish-shell {
  height: 100vh;
  padding: 0;
  background: #f5f6f7;
}

.publish-shell::before,
.publish-shell::after {
  display: none;
}

.publish-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(24rpx);
  box-shadow: 0 14rpx 36rpx rgba(44, 47, 48, 0.06);
}

.publish-topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: calc(env(safe-area-inset-top) + 18rpx) 24rpx 18rpx;
}

.publish-topbar-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
}

.publish-topbar-side {
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(148, 163, 184, 0.1);
}

.publish-topbar-close {
  color: #64748b;
  font-size: 38rpx;
  font-weight: 500;
  line-height: 1;
}

.publish-topbar-brand {
  color: #005e9f;
  font-size: 32rpx;
  font-weight: 800;
  letter-spacing: -0.8rpx;
}

.publish-topbar-action {
  flex-shrink: 0;
  color: #005e9f;
  font-size: 24rpx;
  font-weight: 800;
}

.publish-topbar-action-disabled {
  opacity: 0.42;
}

.publish-scroll {
  height: 100vh;
}

.publish-content {
  padding: calc(env(safe-area-inset-top) + 116rpx) 24rpx calc(194rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.publish-login-card,
.publish-section,
.publish-form-section,
.publish-meta-section,
.publish-activity-section {
  margin-top: 22rpx;
  padding: 28rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid rgba(171, 173, 174, 0.16);
  box-shadow: 0 18rpx 40rpx rgba(44, 47, 48, 0.06);
}

.publish-login-card,
.publish-section {
  margin-top: 0;
}

.publish-login-card {
  background:
    radial-gradient(circle at top right, rgba(68, 165, 255, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 248, 250, 0.94));
}

.publish-login-badge,
.publish-meta-label {
  display: inline-flex;
  align-items: center;
  color: #757778;
  font-family: var(--campus-font-data);
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
  text-transform: uppercase;
}

.publish-login-title {
  margin-top: 16rpx;
  color: #2c2f30;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.2;
}

.publish-login-copy {
  margin-top: 12rpx;
  color: #595c5d;
  font-size: 25rpx;
  line-height: 1.7;
}

.publish-login-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 22rpx;
}

.publish-secondary-button,
.publish-ghost-button,
.publish-action-button {
  min-height: 92rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
}

.publish-secondary-button,
.publish-ghost-button {
  flex: 1;
}

.publish-secondary-button {
  background: linear-gradient(135deg, #005e9f 0%, #2498f5 100%);
  color: #edf3ff;
  box-shadow: 0 18rpx 34rpx rgba(37, 99, 235, 0.18);
}

.publish-ghost-button {
  background: #eef1f3;
  color: #4f5964;
}

.publish-state-card {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  border: 1rpx solid rgba(171, 173, 174, 0.16);
  box-shadow: 0 12rpx 28rpx rgba(44, 47, 48, 0.04);
}

.publish-state-dot {
  width: 14rpx;
  height: 14rpx;
  margin-top: 10rpx;
  border-radius: 999rpx;
  background: #abadae;
  flex-shrink: 0;
}

.publish-state-copy {
  flex: 1;
  color: #595c5d;
  font-size: 24rpx;
  line-height: 1.6;
}

.publish-state-link,
.publish-activity-link,
.publish-activity-clear {
  color: #005e9f;
  font-size: 24rpx;
  font-weight: 700;
}

.publish-state-card-muted {
  background: rgba(255, 255, 255, 0.92);
}

.publish-state-card-muted .publish-state-dot {
  background: #abadae;
}

.publish-state-card-ready {
  background: rgba(177, 239, 216, 0.22);
  border-color: rgba(41, 102, 84, 0.14);
}

.publish-state-card-ready .publish-state-dot {
  background: #296654;
}

.publish-state-card-success {
  background: rgba(68, 165, 255, 0.12);
  border-color: rgba(0, 94, 159, 0.12);
}

.publish-state-card-success .publish-state-dot {
  background: #005e9f;
}

.publish-state-card-warning {
  background: rgba(253, 211, 77, 0.14);
  border-color: rgba(112, 89, 0, 0.12);
}

.publish-state-card-warning .publish-state-dot {
  background: #705900;
}

.publish-section-head,
.publish-activity-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}

.publish-section-title {
  color: #2c2f30;
  font-size: 34rpx;
  font-weight: 800;
}

.publish-section-note {
  color: #757778;
  font-size: 21rpx;
}

.publish-photo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 22rpx;
}

.publish-photo-card {
  position: relative;
  height: 206rpx;
  overflow: hidden;
  border-radius: 24rpx;
  background: #ffffff;
}

.publish-photo-image {
  width: 100%;
  height: 100%;
  display: block;
}

.publish-photo-cover-badge {
  position: absolute;
  left: 14rpx;
  top: 14rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #005e9f;
  font-size: 18rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
}

.publish-photo-remove {
  position: absolute;
  right: 14rpx;
  top: 14rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(12, 15, 16, 0.56);
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 700;
}

.publish-photo-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8rpx;
  padding: 18rpx;
  background: linear-gradient(180deg, rgba(12, 15, 16, 0.08) 0%, rgba(12, 15, 16, 0.76) 100%);
}

.publish-photo-mask-error {
  background: linear-gradient(180deg, rgba(179, 27, 37, 0.1) 0%, rgba(87, 0, 8, 0.82) 100%);
}

.publish-photo-mask-title {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 800;
}

.publish-photo-mask-copy {
  color: rgba(255, 255, 255, 0.88);
  font-size: 20rpx;
  line-height: 1.5;
}

.publish-photo-add,
.publish-photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.publish-photo-add {
  border: 2rpx dashed rgba(171, 173, 174, 0.46);
  background: rgba(255, 255, 255, 0.72);
}

.publish-photo-add-primary {
  border-color: rgba(0, 94, 159, 0.22);
  background:
    radial-gradient(circle at top, rgba(68, 165, 255, 0.16), transparent 56%),
    rgba(255, 255, 255, 0.86);
}

.publish-photo-add-icon {
  width: 68rpx;
  height: 68rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 94, 159, 0.1);
  color: #005e9f;
  font-size: 40rpx;
  font-weight: 500;
  line-height: 1;
}

.publish-photo-add-label {
  margin-top: 10rpx;
  color: #005e9f;
  font-size: 18rpx;
  font-weight: 800;
  letter-spacing: 3rpx;
  text-transform: uppercase;
}

.publish-photo-placeholder {
  border: 1rpx solid rgba(171, 173, 174, 0.12);
  background: rgba(255, 255, 255, 0.56);
}

.publish-photo-placeholder-icon {
  position: relative;
  width: 52rpx;
  height: 40rpx;
  border: 3rpx solid rgba(171, 173, 174, 0.44);
  border-radius: 12rpx;
}

.publish-photo-placeholder-icon::before {
  content: '';
  position: absolute;
  top: 8rpx;
  right: 10rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: rgba(171, 173, 174, 0.44);
}

.publish-photo-placeholder-icon::after {
  content: '';
  position: absolute;
  left: 8rpx;
  bottom: 8rpx;
  width: 24rpx;
  height: 12rpx;
  border-left: 3rpx solid rgba(171, 173, 174, 0.44);
  border-bottom: 3rpx solid rgba(171, 173, 174, 0.44);
  transform: skewX(-22deg) rotate(-18deg);
}

.publish-title-input {
  width: 100%;
  min-height: 64rpx;
  color: #2c2f30;
  font-size: 46rpx;
  font-weight: 800;
  line-height: 1.2;
}

.publish-title-divider {
  height: 2rpx;
  margin-top: 12rpx;
  background: rgba(218, 221, 223, 0.72);
}

.publish-desc-card {
  margin-top: 22rpx;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: inset 0 0 0 1rpx rgba(171, 173, 174, 0.08);
}

.publish-desc-input {
  width: 100%;
  min-height: 148rpx;
  color: #2c2f30;
  font-size: 26rpx;
  line-height: 1.7;
}

.publish-inline-fields {
  display: flex;
  gap: 12rpx;
  margin-top: 14rpx;
}

.publish-inline-field {
  flex: 1;
  min-width: 0;
  min-height: 92rpx;
  padding: 0 22rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  background: #eef1f3;
}

.publish-inline-icon {
  width: 46rpx;
  height: 46rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.92);
  color: #6b7280;
  font-size: 24rpx;
  font-weight: 700;
}

.publish-inline-icon-link {
  font-size: 22rpx;
}

.publish-inline-input {
  flex: 1;
  min-width: 0;
  color: #2c2f30;
  font-size: 25rpx;
}

.publish-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.publish-chip {
  max-width: 100%;
  padding: 14rpx 22rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.publish-chip-primary {
  background: #005e9f;
  color: #edf3ff;
  box-shadow: 0 12rpx 28rpx rgba(0, 94, 159, 0.2);
}

.publish-chip-muted {
  background: #e0e3e4;
  color: #595c5d;
}

.publish-chip-add {
  background: #b1efd8;
  color: #1d5c4a;
}

.publish-budget-row {
  display: flex;
  gap: 10rpx;
  margin-top: 18rpx;
}

.publish-budget-chip {
  flex: 1;
  min-width: 0;
  min-height: 84rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(171, 173, 174, 0.24);
  color: #595c5d;
  font-size: 22rpx;
  font-weight: 800;
  background: #ffffff;
}

.publish-budget-chip-active {
  border: 3rpx solid #005e9f;
  color: #005e9f;
  background: rgba(68, 165, 255, 0.12);
}

.publish-activity-scroll {
  width: 100%;
  margin-top: 18rpx;
  white-space: nowrap;
}

.publish-activity-row {
  display: inline-flex;
  gap: 14rpx;
  padding-bottom: 8rpx;
}

.publish-activity-card {
  width: 236rpx;
  overflow: hidden;
  border-radius: 26rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 28rpx rgba(44, 47, 48, 0.06);
}

.publish-activity-card-active {
  box-shadow: 0 0 0 3rpx rgba(0, 94, 159, 0.16), 0 16rpx 32rpx rgba(0, 94, 159, 0.14);
}

.publish-activity-cover {
  position: relative;
  height: 152rpx;
  overflow: hidden;
}

.publish-activity-cover-0 {
  background: linear-gradient(135deg, #3b82f6 0%, #38bdf8 100%);
}

.publish-activity-cover-1 {
  background: linear-gradient(135deg, #2f855a 0%, #63b3ed 100%);
}

.publish-activity-cover-2 {
  background: linear-gradient(135deg, #0f172a 0%, #475569 100%);
}

.publish-activity-cover-image,
.publish-activity-cover-mask,
.publish-activity-cover-ambient {
  position: absolute;
  inset: 0;
}

.publish-activity-cover-image {
  width: 100%;
  height: 100%;
  display: block;
}

.publish-activity-cover-ambient {
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.2), transparent 26%),
    radial-gradient(circle at 82% 0%, rgba(255, 255, 255, 0.18), transparent 32%);
}

.publish-activity-cover-mask {
  background: linear-gradient(180deg, rgba(12, 15, 16, 0.12) 0%, rgba(12, 15, 16, 0.48) 100%);
}

.publish-activity-cover-top {
  position: absolute;
  left: 16rpx;
  right: 16rpx;
  top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.publish-activity-cover-badge {
  max-width: 150rpx;
  padding: 8rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 800;
}

.publish-activity-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  color: #005e9f;
  font-size: 22rpx;
  font-weight: 900;
}

.publish-activity-cover-scene {
  position: absolute;
  left: 16rpx;
  right: 16rpx;
  bottom: 16rpx;
  color: rgba(255, 255, 255, 0.92);
  font-size: 20rpx;
  font-weight: 700;
}

.publish-activity-card-body {
  padding: 18rpx 16rpx 20rpx;
}

.publish-activity-card-title {
  color: #2c2f30;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.35;
}

.publish-activity-card-copy {
  margin-top: 8rpx;
  color: #757778;
  font-size: 20rpx;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.publish-activity-empty-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 188rpx;
  padding: 0 28rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  color: #757778;
  font-size: 24rpx;
}

.publish-activity-summary {
  margin-top: 18rpx;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, rgba(68, 165, 255, 0.12), rgba(177, 239, 216, 0.18));
}

.publish-activity-summary-title {
  color: #2c2f30;
  font-size: 28rpx;
  font-weight: 800;
}

.publish-activity-summary-copy {
  margin-top: 10rpx;
  color: #595c5d;
  font-size: 23rpx;
  line-height: 1.6;
}

.publish-activity-summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}

.publish-activity-meta-chip {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.88);
  color: #2c2f30;
  font-size: 20rpx;
  font-weight: 700;
}

.publish-activity-meta-chip-soft {
  background: rgba(0, 94, 159, 0.08);
  color: #005e9f;
}

.publish-activity-clear {
  margin-top: 16rpx;
}

.publish-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  gap: 14rpx;
  padding: 18rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24rpx);
  box-shadow: 0 -12rpx 30rpx rgba(44, 47, 48, 0.05);
}

.publish-action-button {
  flex: 1;
}

.publish-action-secondary {
  background: #e0e3e4;
  color: #595c5d;
}

.publish-action-primary {
  flex: 1.6;
  gap: 10rpx;
  background: linear-gradient(135deg, #005e9f 0%, #2498f5 58%, #7ec9ff 100%);
  color: #edf3ff;
  box-shadow: 0 20rpx 40rpx rgba(0, 94, 159, 0.24);
}

.publish-action-arrow {
  font-size: 24rpx;
  font-weight: 700;
}

.publish-action-disabled {
  opacity: 0.56;
  box-shadow: none;
}
</style>
