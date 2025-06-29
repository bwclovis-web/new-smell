import { index, layout, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  layout('routes/RootLayout.tsx', [
    index('routes/home.tsx'),
    route('all-houses', 'routes/all-houses.tsx'),
    route('perfume-house/:houseId', 'routes/perfume-house.tsx'),

    route('all-perfumes', 'routes/all-perfumes.tsx'),
    route('trading-post', 'routes/trading-post.tsx'),
    route('perfume/:id', 'routes/perfume.tsx'),
    // API ROUTES
    route('api/available-perfumes', 'routes/api/available-perfumes.ts'),
    route('api/perfume-houses', 'routes/api/houseLoader.ts'),
    route('api/perfume', 'routes/api/perfumeLoader.ts'),
    route('api/deleteHouse', 'routes/api/deleteHouse.ts'),
    route('api/deletePerfume', 'routes/api/deletePerfume.ts'),
    route('api/getTag', 'routes/api/tagLoader.ts'),
    route('api/houseSortLoader', 'routes/api/houseSortLoader.ts'),
    route('api/createTag', 'routes/api/createTag.ts'),
    route('api/wishlist', 'routes/api/wishlist.tsx'),
    route('api/log-out', 'routes/api/logOut.ts'),
    route('api/more-perfumes', 'routes/api/more-perfumes.ts'),

    layout('routes/admin/AdminLayout.tsx', [
      route('admin/', 'routes/admin/adminIndex.tsx'),
      route('admin/create-perfume-house', 'routes/admin/CreatePerfumeHousePage.tsx'),
      route('admin/create-perfume', 'routes/admin/CreatePerfumePage.tsx'),
      route('admin/perfume/:id/edit', 'routes/admin/EditPerfumePage.tsx'),
      route('admin/perfume-house/:houseId/edit', 'routes/admin/EditPerfumeHousePage.tsx'),
      route('admin/profile', 'routes/admin/ProfilePage.tsx'),
      route('admin/wishlist', 'routes/admin/Wishlist.tsx'),
      route('admin/my-scents', 'routes/admin/MyScents.tsx')
    ]),

    layout('routes/login/LoginLayout.tsx', [
      route('sign-up', 'routes/login/SignUpPage.tsx'),
      route('sign-in', 'routes/login/SignInPage.tsx')
    ])
  ])
] satisfies RouteConfig
