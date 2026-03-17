var homeTabs = ['推荐', '热门', '校园', '场景']
var sceneTags = ['早八', '图书馆', '社团', '约会', '通勤', '运动']
var styleTags = ['学院风', '松弛感', '甜酷风', '简约风', '韩系风', '清新风']
var budgetTags = ['50-100', '100-150', '150-200', '200+']

var outfits = [
  {
    id: 'look1',
    coverTag: '早八推荐',
    title: '图书馆早课也能轻松出片的清爽学院风',
    subtitle: '蓝白层次、预算友好、适合日常通勤',
    desc: '白衬衫叠穿浅蓝针织背心，搭配浅灰百褶裙和帆布鞋，整体干净又有校园氛围，适合早八、图书馆和课堂展示等场景。',
    user: '乔乔',
    avatar: '乔',
    avatarClass: '',
    school: '华东师范大学 · 大三',
    scene: '图书馆',
    style: '学院风',
    budget: '100-150',
    likes: 128,
    comments: 36,
    saves: 92,
    shares: 14,
    price: '¥139',
    product: '衬衫 + 针织背心 + 百褶裙',
    platform: '淘宝校园优选',
    profit: '平台导购佣金 8%',
    guideTip: '平台仅提供导购信息，请根据预算理性选择。'
  },
  {
    id: 'look2',
    coverTag: '热门穿搭',
    title: '社团活动不费力的元气运动混搭',
    subtitle: '连帽卫衣配工装裤，拍照很有少年感',
    desc: '浅绿卫衣配米白工装裤和运动鞋，颜色年轻，动作感强，适合社团纳新、操场打卡和课后活动。',
    user: '林夏',
    avatar: '林',
    avatarClass: 'soft',
    school: '上海大学 · 大二',
    scene: '运动',
    style: '松弛感',
    budget: '100-200',
    likes: 203,
    comments: 48,
    saves: 115,
    shares: 21,
    price: '¥179',
    product: '卫衣 + 工装裤 + 运动鞋',
    platform: '天猫精选',
    profit: '平台导购佣金 6%',
    guideTip: '活动场景建议优先考虑舒适度与耐穿性。'
  },
  {
    id: 'look3',
    coverTag: '校园精选',
    title: '约会场景也不浮夸的奶油色温柔系搭配',
    subtitle: '针织开衫、连衣裙和小白鞋的低门槛组合',
    desc: '奶油色开衫叠穿连衣裙，搭配小白鞋和帆布包，显得温柔清爽，特别适合周末约会、咖啡馆和校园漫步。',
    user: '鹿宁',
    avatar: '鹿',
    avatarClass: 'alt',
    school: '同济大学 · 研究生',
    scene: '约会',
    style: '清新风',
    budget: '150-200',
    likes: 176,
    comments: 31,
    saves: 142,
    shares: 19,
    price: '¥199',
    product: '针织开衫 + 连衣裙 + 小白鞋',
    platform: '京东校园馆',
    profit: '品牌合作分成',
    guideTip: '如需外出通勤，可加薄风衣提升实用性。'
  },
  {
    id: 'look4',
    coverTag: '预算友好',
    title: '50 元到 100 元也能搭出好看的课堂通勤感',
    subtitle: '基础款白T 和牛仔半裙，实穿不挑人',
    desc: '用最基础的白T搭浅蓝牛仔半裙，再加一双帆布鞋就能有很舒服的校园感，适合课堂、食堂和短距离通勤。',
    user: '安可',
    avatar: '安',
    avatarClass: 'soft',
    school: '复旦大学 · 大一',
    scene: '通勤',
    style: '简约风',
    budget: '50-100',
    likes: 98,
    comments: 19,
    saves: 87,
    shares: 10,
    price: '¥89',
    product: '白T + 牛仔半裙 + 帆布鞋',
    platform: '拼多多学生专场',
    profit: '平台导购佣金 5%',
    guideTip: '预算有限时可优先购入基础色单品，复用率更高。'
  },
  {
    id: 'look5',
    coverTag: '社团大片',
    title: '晚间活动也能稳住氛围感的甜酷层次穿搭',
    subtitle: '小皮鞋、短裙和衬衫叠穿，镜头表现很好',
    desc: '白衬衫搭深色短裙和针织马甲，再用小皮鞋拉出层次，适合社团晚会、主持活动和拍照场景。',
    user: '知夏',
    avatar: '知',
    avatarClass: '',
    school: '浙江大学 · 大三',
    scene: '社团',
    style: '甜酷风',
    budget: '150-220',
    likes: 155,
    comments: 27,
    saves: 101,
    shares: 16,
    price: '¥189',
    product: '衬衫 + 针织马甲 + 短裙',
    platform: '淘宝校园优选',
    profit: '品牌合作分成',
    guideTip: '如场景较正式，可把短裙替换成长裙增强稳重感。'
  },
  {
    id: 'look6',
    coverTag: '人气清单',
    title: '考试周舒服但不邋遢的轻松复习穿搭',
    subtitle: '针织开衫和阔腿裤是教室久坐的高频选择',
    desc: '低饱和蓝色开衫搭奶白阔腿裤，舒服耐看，适合考试周、图书馆自习和长时间学习。',
    user: '阿弥',
    avatar: '弥',
    avatarClass: 'alt',
    school: '南京大学 · 大四',
    scene: '早八',
    style: '韩系风',
    budget: '80-180',
    likes: 132,
    comments: 29,
    saves: 108,
    shares: 13,
    price: '¥149',
    product: '针织开衫 + 阔腿裤 + 乐福鞋',
    platform: '京东校园馆',
    profit: '平台导购佣金 6%',
    guideTip: '复习周建议避免过于复杂的搭配，把舒适放在第一位。'
  }
]

var comments = [
  { id: 'c1', name: '阿宁', avatar: '宁', avatarClass: 'alt', text: '这个配色太适合图书馆了，看起来很干净。', time: '2分钟前', likes: 16 },
  { id: 'c2', name: '小禾', avatar: '禾', avatarClass: 'soft', text: '预算区间也很友好，学生党真的会收藏。', time: '8分钟前', likes: 12 },
  { id: 'c3', name: '南枝', avatar: '南', avatarClass: '', text: '请问背心的版型偏宽松吗？', time: '20分钟前', likes: 10 },
  { id: 'c4', name: '元元', avatar: '元', avatarClass: 'alt', text: '希望多出一点晚秋校园穿搭合集。', time: '34分钟前', likes: 7 }
]

var likeUsers = [
  { id: 'l1', name: '小棠', avatar: '棠', avatarClass: 'soft', intro: '喜欢整理预算友好穿搭清单' },
  { id: 'l2', name: '可可', avatar: '可', avatarClass: 'alt', intro: '校园摄影爱好者' },
  { id: 'l3', name: '白桃', avatar: '桃', avatarClass: 'alt', intro: '偏爱学院风与韩系搭配' },
  { id: 'l4', name: '阿远', avatar: '远', avatarClass: 'soft', intro: '热衷研究平价鞋包' }
]

var followingUsers = [
  { id: 'u1', name: '木子', avatar: '木', avatarClass: 'soft', intro: '主打图书馆与课堂场景', active: true },
  { id: 'u2', name: '星野', avatar: '星', avatarClass: 'alt', intro: '偏爱社团活动穿搭', active: true },
  { id: 'u3', name: '今南', avatar: '今', avatarClass: 'soft', intro: '做平价鞋履推荐', active: false },
  { id: 'u4', name: '梨子', avatar: '梨', avatarClass: '', intro: '校园日常记录博主', active: true }
]

var fanUsers = [
  { id: 'f1', name: '若雨', avatar: '若', avatarClass: 'alt', intro: '喜欢校园清爽系搭配', active: true },
  { id: 'f2', name: '阿岚', avatar: '岚', avatarClass: 'alt', intro: '经常看预算 100 元内的分享', active: false },
  { id: 'f3', name: '米粒', avatar: '米', avatarClass: 'soft', intro: '准备做自己的校园账号', active: true },
  { id: 'f4', name: '晨晓', avatar: '晨', avatarClass: '', intro: '关注通勤和社团场景', active: false }
]

var drafts = [
  { id: 'd1', title: '下雨天早八通勤穿搭', time: '今天 14:20', tags: ['早八', '韩系风', '100-200'], note: '已上传 6 张图片，差商品链接未补充' },
  { id: 'd2', title: '社团主持穿搭备用方案', time: '昨天 21:16', tags: ['社团', '甜酷风', '150-220'], note: '文案已完成，还未设置推广合作说明' },
  { id: 'd3', title: '图书馆复习周穿搭', time: '周一 09:08', tags: ['图书馆', '简约风', '80-180'], note: '封面已选定，准备周末发布' }
]

var messages = [
  { id: 'm1', type: '互动消息', title: '你的穿搭被 18 人收藏', desc: '图书馆早八穿搭正在持续增长曝光，建议补充更多细节标签。', time: '刚刚' },
  { id: 'm2', type: '商业合作', title: '校园品牌邀约待确认', desc: '青芽服饰希望在 24 小时内与你确认春季专题合作，点击查看详情。', time: '5分钟前' },
  { id: 'm3', type: '系统通知', title: '商品链接审核通过', desc: '你提交的导购链接已通过审核，可正常参与平台佣金统计。', time: '12分钟前' },
  { id: 'm4', type: '评论提醒', title: '鹿宁评论了你的发布', desc: '她回复：想看你分享更多预算 100 元以内的穿搭。', time: '28分钟前' },
  { id: 'm5', type: '收益通知', title: '本周预计导购收益到账', desc: '你的导购内容本周预计结算 86.50 元，请留意收益中心。', time: '1小时前' }
]

var profile = {
  name: '乔乔',
  avatar: '乔',
  school: '华东师范大学 · 大三',
  sign: '记录大学生日常穿搭，也认真做理性消费推荐。',
  following: 198,
  followers: 1240,
  likes: 3580,
  income: '¥268.00',
  cooperation: 3
}

var searchHistory = ['图书馆穿搭', '早八', '学院风', '牛仔半裙', '白衬衫']
var hotSearches = ['春季学院风', '社团主持', '预算友好', '考试周穿搭', '奶油色约会']

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function getOutfitById(id) {
  for (var i = 0; i < outfits.length; i += 1) {
    if (outfits[i].id === id) {
      return outfits[i]
    }
  }
  return outfits[0]
}

module.exports = {
  homeTabs: homeTabs,
  sceneTags: sceneTags,
  styleTags: styleTags,
  budgetTags: budgetTags,
  outfits: outfits,
  comments: comments,
  likeUsers: likeUsers,
  followingUsers: followingUsers,
  fanUsers: fanUsers,
  drafts: drafts,
  messages: messages,
  profile: profile,
  searchHistory: searchHistory,
  hotSearches: hotSearches,
  clone: clone,
  getOutfitById: getOutfitById
}
