<template>
  <view></view>
</template>

<script>
export default {
  onLaunch: function() {
    if (!uni.getStorageSync('campusfit_publish_tags')) {
      uni.setStorageSync('campusfit_publish_tags', ['图书馆', '学院风', '100-150'])
    }
  }
}
</script>

<style>
@import './common/theme.css';

page {
  background: #f7efe7;
  color: var(--campus-text);
  font-family: var(--campus-font-body);
}
</style>
