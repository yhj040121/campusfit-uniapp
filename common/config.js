var H5_BASE_URLS = ['http://127.0.0.1:8080']
var APP_BASE_URLS = ['http://10.0.2.2:8080', 'http://10.0.3.2:8080', 'http://127.0.0.1:8080']

function getBaseUrlCandidates() {
    var custom = uni.getStorageSync('campusfit_custom_base_url')
    var list = []
    if (custom) {
        list.push(custom)
    }
    // #ifdef H5
    return list.concat(H5_BASE_URLS)
    // #endif
    // #ifndef H5
    return list.concat(APP_BASE_URLS)
    // #endif
}

module.exports = {
    getBaseUrlCandidates: getBaseUrlCandidates
}
