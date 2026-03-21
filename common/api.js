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

function uploadFileWithBaseUrl(baseUrl, filePath) {
  return new Promise(function(resolve, reject) {
    var header = {}
    var token = session.getToken()
    if (token) {
      header.Authorization = 'Bearer ' + token
    }
    uni.uploadFile({
      url: baseUrl + '/api/uploads/images',
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

function uploadPostImage(filePath) {
  return http.resolveBaseUrl(false)
    .then(function(baseUrl) {
      return uploadFileWithBaseUrl(baseUrl, filePath)
    })
    .catch(function(error) {
      uni.removeStorageSync('campusfit_base_url')
      return http.resolveBaseUrl(true)
        .then(function(baseUrl) {
          return uploadFileWithBaseUrl(baseUrl, filePath)
        })
        .catch(function() {
          throw error
        })
    })
}

function loginUser(phone, code) {
  return http.request({
    url: '/api/auth/login',
    method: 'POST',
    data: { phone: phone, code: code }
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

function createComment(postId, content) {
  return http.request({
    url: '/api/posts/' + postId + '/comments',
    method: 'POST',
    data: { content: content }
  })
}

function deleteComment(postId, commentId) {
  return http.request({
    url: '/api/posts/' + postId + '/comments/' + commentId + '/delete',
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

module.exports = {
  loginUser: loginUser,
  registerUser: registerUser,
  getCurrentUser: getCurrentUser,
  logoutUser: logoutUser,
  uploadPostImage: uploadPostImage,
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
  listMyActivities: listMyActivities,
  getMyActivitySummary: getMyActivitySummary,
  toggleActivityJoin: toggleActivityJoin,
  listMessages: listMessages,
  getUnreadMessageCount: getUnreadMessageCount,
  markMessageRead: markMessageRead,
  markAllMessagesRead: markAllMessagesRead,
  getActiveBaseUrl: http.getActiveBaseUrl,
  resolveBaseUrl: http.resolveBaseUrl
}
