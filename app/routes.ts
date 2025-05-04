import { index, layout, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  layout('routes/RootLayout.tsx', [
    index('routes/home.tsx'),

    layout('routes/admin/AdminLayout.tsx', [
      route('admin/', 'routes/admin/adminIndex.tsx'),
      route('admin/create-perfume-house', 'routes/admin/CreatePerfumeHousePage.tsx'),
      route('admin/create-perfume', 'routes/admin/CreatePerfumePage.tsx')
    ])
  ])
] satisfies RouteConfig
