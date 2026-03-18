var http = require('./request.js')

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

function createPost(payload) {
  return http.request({
    url: '/api/posts',
    method: 'POST',
    data: payload
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

function listMessages() {
  return http.request({
    url: '/api/messages',
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
  listRecommendations: listRecommendations,
  listMyPosts: listMyPosts,
  getPostForEdit: getPostForEdit,
  updatePost: updatePost,
  deletePost: deletePost,
  listFavoritePosts: listFavoritePosts,
  searchPosts: searchPosts,
  getPostDetail: getPostDetail,
  createPost: createPost,
  listComments: listComments,
  createComment: createComment,
  listLikeUsers: listLikeUsers,
  toggleLike: toggleLike,
  toggleFavorite: toggleFavorite,
  getMyProfile: getMyProfile,
  getMyProfileForEdit: getMyProfileForEdit,
  updateMyProfile: updateMyProfile,
  listFollows: listFollows,
  toggleFollow: toggleFollow,
  getTagOptions: getTagOptions,
  listMessages: listMessages,
  markMessageRead: markMessageRead,
  markAllMessagesRead: markAllMessagesRead,
  getActiveBaseUrl: http.getActiveBaseUrl,
  resolveBaseUrl: http.resolveBaseUrl
}
