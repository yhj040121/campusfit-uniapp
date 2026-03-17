<template>
  <view></view>
</template>

<script>
export default {
  onLaunch: function() {
    if (!uni.getStorageSync('campusfit_publish_tags')) {
      uni.setStorageSync('campusfit_publish_tags', ['早八', '学院风', '100-150'])
    }
  }
}
</script>

<style>
@import './common/theme.css';

page {
  background: #f4f8fb;
  color: #243240;
  font-family: PingFang SC, Microsoft YaHei, sans-serif;
}
</style>
