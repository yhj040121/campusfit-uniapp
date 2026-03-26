var DEPLOYED_API_BASE_URL = 'https://api.yuhaojie.cn'
var LOCALHOST_BASE_URL = 'http://127.0.0.1:8080'
var LOCAL_LAN_BASE_URL = 'http://192.168.31.193:8080'
var H5_BASE_URLS = [DEPLOYED_API_BASE_URL, LOCALHOST_BASE_URL, 'http://localhost:8080', LOCAL_LAN_BASE_URL]
var APP_BASE_URLS = [DEPLOYED_API_BASE_URL, LOCAL_LAN_BASE_URL, 'http://10.0.2.2:8080', 'http://10.0.3.2:8080', LOCALHOST_BASE_URL]

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



