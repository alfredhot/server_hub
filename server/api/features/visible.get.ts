export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const visible = await visibleFeatures(user)
  return visible.map(({ feature, permissions }) => ({
    key: feature.key,
    title: feature.title,
    description: feature.description,
    icon: feature.icon,
    route: feature.route,
    comingSoon: feature.comingSoon ?? false,
    external: feature.external ?? false,
    permissions
  }))
})
