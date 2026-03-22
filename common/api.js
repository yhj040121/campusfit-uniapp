var http = require('./request.js')
var session = require('./session.js')

function parseUploadResponse(rawData) {
  var payload = rawData
  if (typeof rawData === 'string') {
    try {
      payload = JSON.parse(rawData || '{}')
    } catch (error) {
      throw new Error('图片上传返回结果无法解析')
    }
  }
  payload = payload || {}
  if (payload.code === 0) {
    return payload.data
  }
  throw new Error(payload.message || '图片上传失败')
}

function uploadFileWithBaseUrl(baseUrl, filePath, apiPath, includeAuth) {
  return new Promise(function(resolve, reject) {
    var header = {}
    var token = session.getToken()
    if (includeAuth !== false && token) {
      header.Authorization = 'Bearer ' + token
    }
    uni.uploadFile({
      url: baseUrl + apiPath,
      filePath: filePath,
      name: 'file',
      timeout: 20000,
      header: header,
      success: function(response) {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error('HTTP ' + response.statusCode))
          return
        }
        try {
          resolve(parseUploadResponse(response.data))
        } catch (error) {
          reject(error)
        }
      },
      fail: function(error) {
        reject(new Error(error.errMsg || '图片上传失败'))
      }
    })
  })
}

function uploadFileByApiPath(filePath, apiPath, includeAuth) {
  return http.resolveBaseUrl(false)
    .then(function(baseUrl) {
      return uploadFileWithBaseUrl(baseUrl, filePath, apiPath, includeAuth)
    })
    .catch(function(error) {
      uni.removeStorageSync('campusfit_base_url')
      return http.resolveBaseUrl(true)
        .then(function(baseUrl) {
          return uploadFileWithBaseUrl(baseUrl, filePath, apiPath, includeAuth)
        })
        .catch(function() {
          throw error
        })
    })
}

function uploadPostImage(filePath) {
  return uploadFileByApiPath(filePath, '/api/uploads/images', true)
}

function uploadAvatarImage(filePath) {
  return uploadFileByApiPath(filePath, '/api/uploads/avatar', false)
}

function sendAuthCode(phone, scene) {
  return http.request({
    url: '/api/auth/send-code',
    method: 'POST',
    data: {
      phone: phone,
      scene: scene || 'auth'
    }
  })
}

function loginUser(phone, password, code) {
  return http.request({
    url: '/api/auth/login',
    method: 'POST',
    data: { phone: phone, password: password, code: code }
  })
}

function registerUser(payload) {
  return http.request({
    url: '/api/auth/register',
    method: 'POST',
    data: payload
  })
}

function getCurrentUser() {
  return http.request({
    url: '/api/auth/me',
    method: 'GET'
  })
}

function logoutUser() {
  return http.request({
    url: '/api/auth/logout',
    method: 'POST'
  })
}

function listRecommendations() {
  return http.request({
    url: '/api/posts/recommendations',
    method: 'GET'
  })
}

function listMyPosts() {
  return http.request({
    url: '/api/posts/mine',
    method: 'GET'
  })
}

function getPostForEdit(postId) {
  return http.request({
    url: '/api/posts/' + postId + '/edit',
    method: 'GET'
  })
}

function updatePost(postId, payload) {
  return http.request({
    url: '/api/posts/' + postId,
    method: 'PUT',
    data: payload
  })
}

function deletePost(postId) {
  return http.request({
    url: '/api/posts/' + postId + '/delete',
    method: 'POST'
  })
}

function shelfDownPost(postId) {
  return http.request({
    url: '/api/posts/' + postId + '/shelf-down',
    method: 'POST'
  })
}

function restorePost(postId) {
  return http.request({
    url: '/api/posts/' + postId + '/restore',
    method: 'POST'
  })
}

function listFavoritePosts() {
  return http.request({
    url: '/api/posts/favorites',
    method: 'GET'
  })
}

function searchPosts(keyword, filters) {
  var safeFilters = filters || {}
  var query = [
    'keyword=' + encodeURIComponent(keyword || ''),
    'scene=' + encodeURIComponent(safeFilters.scene || ''),
    'style=' + encodeURIComponent(safeFilters.style || ''),
    'budget=' + encodeURIComponent(safeFilters.budget || '')
  ].join('&')
  return http.request({
    url: '/api/posts/search?' + query,
    method: 'GET'
  })
}

function getPostDetail(id) {
  return http.request({
    url: '/api/posts/' + id,
    method: 'GET'
  })
}

function getProductJumpInfo(postId) {
  return http.request({
    url: '/api/posts/' + postId + '/product-jump',
    method: 'GET'
  })
}

function trackProductJump(postId) {
  return http.request({
    url: '/api/posts/' + postId + '/product-jump/track',
    method: 'POST'
  })
}

function createPost(payload) {
  return http.request({
    url: '/api/posts',
    method: 'POST',
    data: payload
  })
}

function listDrafts() {
  return http.request({
    url: '/api/drafts',
    method: 'GET'
  })
}

function getDraftDetail(draftId) {
  return http.request({
    url: '/api/drafts/' + draftId,
    method: 'GET'
  })
}

function createDraft(payload) {
  return http.request({
    url: '/api/drafts',
    method: 'POST',
    data: payload
  })
}

function updateDraft(draftId, payload) {
  return http.request({
    url: '/api/drafts/' + draftId,
    method: 'PUT',
    data: payload
  })
}

function deleteDraft(draftId) {
  return http.request({
    url: '/api/drafts/' + draftId,
    method: 'DELETE'
  })
}

function publishDraft(draftId, payload) {
  return http.request({
    url: '/api/drafts/' + draftId + '/publish',
    method: 'POST',
    data: payload || {}
  })
}

function listComments(postId) {
  return http.request({
    url: '/api/posts/' + postId + '/comments',
    method: 'GET'
  })
}

function createComment(postId, payload) {
  var safePayload = typeof payload === 'string' ? { content: payload } : (payload || {})
  return http.request({
    url: '/api/posts/' + postId + '/comments',
    method: 'POST',
    data: safePayload
  })
}

function deleteComment(postId, commentId) {
  return http.request({
    url: '/api/posts/' + postId + '/comments/' + commentId + '/delete',
    method: 'POST'
  })
}

function toggleCommentLike(postId, commentId) {
  return http.request({
    url: '/api/posts/' + postId + '/comments/' + commentId + '/like',
    method: 'POST'
  })
}

function listLikeUsers(postId) {
  return http.request({
    url: '/api/posts/' + postId + '/likes',
    method: 'GET'
  })
}

function toggleLike(postId) {
  return http.request({
    url: '/api/posts/' + postId + '/like',
    method: 'POST'
  })
}

function toggleFavorite(postId) {
  return http.request({
    url: '/api/posts/' + postId + '/favorite',
    method: 'POST'
  })
}

function getMyProfile() {
  return http.request({
    url: '/api/profile/me',
    method: 'GET'
  })
}

function getMyProfileForEdit() {
  return http.request({
    url: '/api/profile/me/edit',
    method: 'GET'
  })
}

function getMyIncentiveCenter() {
  return http.request({
    url: '/api/profile/incentives',
    method: 'GET'
  })
}

function requestIncentiveWithdraw(amount) {
  return http.request({
    url: '/api/profile/incentives/withdraw',
    method: 'POST',
    data: amount ? { amount: amount } : {}
  })
}

function updateMyProfile(payload) {
  return http.request({
    url: '/api/profile/me',
    method: 'PUT',
    data: payload
  })
}

function listFollows(type) {
  return http.request({
    url: '/api/profile/follows?type=' + encodeURIComponent(type || 'following'),
    method: 'GET'
  })
}

function toggleFollow(targetUserId) {
  return http.request({
    url: '/api/profile/follows/' + targetUserId,
    method: 'POST'
  })
}

function getTagOptions() {
  return http.request({
    url: '/api/tags/options',
    method: 'GET'
  })
}

function listActivities() {
  return http.request({
    url: '/api/activities',
    method: 'GET'
  })
}

function listFeaturedActivities() {
  return http.request({
    url: '/api/activities/featured',
    method: 'GET'
  })
}

function getLatestAnnouncement() {
  return http.request({
    url: '/api/announcements/latest',
    method: 'GET'
  })
}

function getAnnouncementDetail(announcementId) {
  return http.request({
    url: '/api/announcements/' + announcementId,
    method: 'GET'
  })
}

function listMyActivities() {
  return http.request({
    url: '/api/activities/mine',
    method: 'GET'
  })
}

function getMyActivitySummary() {
  return http.request({
    url: '/api/activities/summary',
    method: 'GET'
  })
}

function toggleActivityJoin(activityId) {
  return http.request({
    url: '/api/activities/' + activityId + '/join-toggle',
    method: 'POST'
  })
}

function listMessages() {
  return http.request({
    url: '/api/messages',
    method: 'GET'
  })
}

function getUnreadMessageCount() {
  return http.request({
    url: '/api/messages/unread-count',
    method: 'GET'
  })
}

function markMessageRead(messageId) {
  return http.request({
    url: '/api/messages/' + messageId + '/read',
    method: 'POST'
  })
}

function markAllMessagesRead() {
  return http.request({
    url: '/api/messages/read-all',
    method: 'POST'
  })
}

function deleteMessage(messageId) {
  return http.request({
    url: '/api/messages/' + messageId + '/delete',
    method: 'POST'
  })
}

function deleteReadMessages() {
  return http.request({
    url: '/api/messages/delete-read',
    method: 'POST'
  })
}

module.exports = {
  sendAuthCode: sendAuthCode,
  loginUser: loginUser,
  registerUser: registerUser,
  getCurrentUser: getCurrentUser,
  logoutUser: logoutUser,
  uploadPostImage: uploadPostImage,
  uploadAvatarImage: uploadAvatarImage,
  listRecommendations: listRecommendations,
  listMyPosts: listMyPosts,
  getPostForEdit: getPostForEdit,
  updatePost: updatePost,
  deletePost: deletePost,
  shelfDownPost: shelfDownPost,
  restorePost: restorePost,
  listFavoritePosts: listFavoritePosts,
  searchPosts: searchPosts,
  getPostDetail: getPostDetail,
  getProductJumpInfo: getProductJumpInfo,
  trackProductJump: trackProductJump,
  createPost: createPost,
  listDrafts: listDrafts,
  getDraftDetail: getDraftDetail,
  createDraft: createDraft,
  updateDraft: updateDraft,
  deleteDraft: deleteDraft,
  publishDraft: publishDraft,
  listComments: listComments,
  createComment: createComment,
  deleteComment: deleteComment,
  toggleCommentLike: toggleCommentLike,
  listLikeUsers: listLikeUsers,
  toggleLike: toggleLike,
  toggleFavorite: toggleFavorite,
  getMyProfile: getMyProfile,
  getMyProfileForEdit: getMyProfileForEdit,
  getMyIncentiveCenter: getMyIncentiveCenter,
  requestIncentiveWithdraw: requestIncentiveWithdraw,
  updateMyProfile: updateMyProfile,
  listFollows: listFollows,
  toggleFollow: toggleFollow,
  getTagOptions: getTagOptions,
  listActivities: listActivities,
  listFeaturedActivities: listFeaturedActivities,
  getLatestAnnouncement: getLatestAnnouncement,
  getAnnouncementDetail: getAnnouncementDetail,
  listMyActivities: listMyActivities,
  getMyActivitySummary: getMyActivitySummary,
  toggleActivityJoin: toggleActivityJoin,
  listMessages: listMessages,
  getUnreadMessageCount: getUnreadMessageCount,
  markMessageRead: markMessageRead,
  markAllMessagesRead: markAllMessagesRead,
  deleteMessage: deleteMessage,
  deleteReadMessages: deleteReadMessages,
  getActiveBaseUrl: http.getActiveBaseUrl,
  resolveBaseUrl: http.resolveBaseUrl
}
