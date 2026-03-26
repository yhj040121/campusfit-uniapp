function normalizeText(value) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).replace(/\s+/g, ' ').trim()
}

function getDisplaySubtitle(item) {
  if (!item) {
    return ''
  }
  var subtitle = normalizeText(item.subtitle)
  var desc = normalizeText(item.desc)
  var title = normalizeText(item.title)
  if (!subtitle) {
    return ''
  }
  if (subtitle === desc || subtitle === title) {
    return ''
  }
  return item.subtitle
}

function getDisplayCoverUrl(item) {
  if (!item) {
    return ''
  }
  if (item.coverImageUrl) {
    return item.coverImageUrl
  }
  if (item.coverUrl) {
    return item.coverUrl
  }
  if (item.imageUrl) {
    return item.imageUrl
  }
  if (item.thumbnailUrl) {
    return item.thumbnailUrl
  }
  if (item.posterUrl) {
    return item.posterUrl
  }
  var sources = item.imageUrls || item.images || item.pictures || item.photos || []
  if (!Array.isArray(sources)) {
    return ''
  }
  for (var i = 0; i < sources.length; i += 1) {
    if (!sources[i]) {
      continue
    }
    if (typeof sources[i] === 'string') {
      return sources[i]
    }
    if (sources[i].url) {
      return sources[i].url
    }
    if (sources[i].src) {
      return sources[i].src
    }
  }
  return ''
}

module.exports = {
  getDisplaySubtitle: getDisplaySubtitle,
  getDisplayCoverUrl: getDisplayCoverUrl
}
