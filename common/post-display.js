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

module.exports = {
  getDisplaySubtitle: getDisplaySubtitle
}
