<template>
  <view class="page-shell">
    <view class="page-header">
      <view class="page-title">CampusFit 校园首页</view>
      <view class="page-desc">面向大学生的校园穿搭社交导购应用，结合真实穿搭灵感、标签发现与电商导购转化。</view>
    </view>

    <view class="search-bar" @click="goSearch">
      <view class="search-icon">S</view>
      <view class="search-text">搜索场景、单品、博主或预算</view>
    </view>

    <view class="panel-card" style="margin-top:18rpx;">
      <view class="text-main">后端连接状态</view>
      <view class="text-copy">{{ statusText }}</view>
    </view>

    <view class="section-title">内容频道</view>
    <view class="chip-row">
      <view
        v-for="item in tabs"
        :key="item"
        :class="['chip', activeTab === item ? 'chip-active' : 'chip-outline']"
        @click="activeTab = item"
      >
        {{ item }}
      </view>
    </view>

    <view class="hero-card">
      <view class="hero-badge">本周专题</view>
      <view class="hero-title">适合校园高频场景的清爽春季穿搭</view>
      <view class="hero-copy">围绕早八、图书馆、社团活动与日常约会等场景，快速查看符合学生预算的穿搭推荐。</view>
    </view>

    <view class="section-title">穿搭信息流</view>
    <view v-if="outfits.length">
      <view class="look-card" v-for="item in outfits" :key="item.id" @click="goDetail(item.id)">
        <view class="look-cover">
          <view class="cover-tag">{{ item.coverTag }}</view>
          <view class="cover-title">{{ item.title }}</view>
          <view class="cover-copy">{{ item.subtitle }}</view>
        </view>
        <view class="text-main" style="margin-top:18rpx; font-size:28rpx;">{{ item.scene }} | {{ item.style }} | 预算 {{ item.budget }}</view>
        <view class="text-copy">{{ item.desc }}</view>
        <view class="meta-line">
          <view class="meta-left">
            <view :class="['avatar', item.avatarClass]">{{ item.avatar }}</view>
            <view>
              <view class="meta-name">{{ item.user }}</view>
              <view class="meta-school">{{ item.school }}</view>
            </view>
          </view>
          <view class="stats-line">
            <view class="stat-text">点赞 {{ item.likes }}</view>
            <view class="stat-text">评论 {{ item.comments }}</view>
            <view class="stat-text">收藏 {{ item.saves }}</view>
          </view>
        </view>
      </view>
    </view>
    <view v-else class="panel-card">
      <view class="section-title" style="margin-top:0;">暂无推荐内容</view>
      <view class="text-copy">后端接口连通后，推荐穿搭内容将在这里展示。</view>
    </view>

    <view class="section-title">原型快捷入口</view>
    <view class="grid-menu">
      <view class="grid-item" v-for="item in demos" :key="item.path" @click="goPage(item.path)">
        <view class="grid-title">{{ item.title }}</view>
        <view class="grid-copy">{{ item.copy }}</view>
      </view>
    </view>

    <view class="bottom-gap"></view>
  </view>
</template>

<script>
var api = require('../../common/api.js')

function fallbackRecommendations() {
  return [
    {
      id: 'look1',
      coverTag: '图书馆精选',
      title: '适合早八与图书馆的叠穿造型',
      subtitle: '蓝白层次清爽干净，适合学生日常路线。',
      desc: '白衬衫叠穿浅蓝针织马甲，搭配灰色百褶裙，既上镜又好穿。',
      user: '乔乔',
      avatar: 'Q',
      avatarClass: 'soft',
      school: '华东师范大学 | 大三',
      scene: '图书馆',
      style: '学院风',
      budget: '100-150',
      likes: 128,
      comments: 36,
      saves: 92
    },
    {
      id: 'look2',
      coverTag: '社团活力',
      title: '社团活动和下午校园散步穿搭',
      subtitle: '宽松版型搭配青春色彩，舒适又有活力。',
      desc: '薄荷连帽卫衣搭配乳白色工装裤，很适合社团招新和校园散步。',
      user: '安宁',
      avatar: 'A',
      avatarClass: 'alt',
      school: '上海大学 | 大二',
      scene: '社团活动',
      style: '运动休闲',
      budget: '50-100',
      likes: 96,
      comments: 18,
      saves: 54
    }
  ]
}

export default {
  data: function() {
    return {
      tabs: ['推荐', '热门', '校园', '场景'],
      activeTab: '推荐',
      outfits: [],
      statusText: '正在连接后端服务...',
      demos: [
        { title: '启动页', copy: '查看品牌入口与启动体验', path: '/pages/splash/index' },
        { title: '登录', copy: '手机号验证码登录', path: '/pages/login/index' },
        { title: '注册', copy: '完善校园身份信息', path: '/pages/register/index' },
        { title: '搜索结果', copy: '查看筛选后的穿搭结果', path: '/pages/results/index?keyword=%E5%9B%BE%E4%B9%A6%E9%A6%86' },
        { title: '我的发布', copy: '管理已发布的穿搭内容', path: '/pages/my-posts/index' },
        { title: '消息通知', copy: '查看互动与收益提醒', path: '/pages/messages/index' }
      ]
    }
  },
  onShow: function() {
    this.loadRecommendations()
  },
  methods: {
    loadRecommendations: function() {
      var self = this
      api.listRecommendations()
        .then(function(list) {
          self.outfits = list || []
          self.statusText = '已连接后端：' + (api.getActiveBaseUrl() || '后端服务')
        })
        .catch(function() {
          self.outfits = fallbackRecommendations()
          self.statusText = '后端暂时不可用，已显示本地演示推荐内容。'
        })
    },
    goSearch: function() {
      uni.switchTab({ url: '/pages/search/index' })
    },
    goDetail: function(id) {
      uni.navigateTo({ url: '/pages/detail/index?id=' + id })
    },
    goPage: function(path) {
      uni.navigateTo({ url: path })
    }
  }
}
</script>

<style>
</style>
