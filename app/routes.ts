import { index, layout, route, type RouteConfig } from "@react-router/dev/routes"

export default [
  layout("routes/RootLayout.tsx", [
    index("routes/home.tsx"),
    route("behind-the-bottle/:letter?", "routes/behind-the-bottle.tsx"),
    route("perfume-house/:houseSlug", "routes/perfume-house.tsx"),

    route("the-vault/:letter?", "routes/the-vault.tsx"),
    route("trader/:id", "routes/trader-profile.tsx"),
    route("the-exchange", "routes/the-exchange.tsx"),
    route("perfume/:perfumeSlug", "routes/perfume.tsx"),
    route("terms-and-conditions", "routes/termsAndConditions.tsx"),
    route("about-us", "routes/about-us.tsx"),
    route("how-we-work", "routes/how-we-work.tsx"),
    route("contact-us", "routes/contact-us.tsx"),
    // Handle .well-known paths (e.g., Chrome DevTools requests)
    route(".well-known/*", "routes/.well-known.$.tsx"),
    // API ROUTES
    route("api/available-perfumes", "routes/api/available-perfumes.ts"),
    route("api/perfume-houses", "routes/api/houseLoader.ts"),
    route("api/perfume", "routes/api/perfumeLoader.ts"),
    route("api/deleteHouse", "routes/api/deleteHouse.ts"),
    route("api/deletePerfume", "routes/api/deletePerfume.ts"),
    route("api/getTag", "routes/api/tagLoader.ts"),
    route("api/houseSortLoader", "routes/api/houseSortLoader.ts"),
    route("api/perfumeSortLoader", "routes/api/perfumeSortLoader.ts"),
    route("api/createTag", "routes/api/createTag.ts"),
    route("api/wishlist", "routes/api/wishlist.tsx"),
    route("api/user-perfumes", "routes/api/user-perfumes.tsx"),
    route("api/log-out", "routes/api/logOut.ts"),
    route("api/more-perfumes", "routes/api/more-perfumes.ts"),
    route("api/data-quality", "routes/api/data-quality.tsx"),
    route("api/data-quality-houses", "routes/api/data-quality-houses.tsx"),
    route("api/houses-by-letter", "routes/api/houses-by-letter.ts"),
    route(
      "api/houses-by-letter-paginated",
      "routes/api/houses-by-letter-paginated.tsx"
    ),
    route("api/perfumes-by-letter", "routes/api/perfumes-by-letter.ts"),
    route("api/update-house-info", "routes/api/update-house-info.tsx"),
    route("api/ratings", "routes/api/ratings.tsx"),
    route("api/reviews", "routes/api/reviews.tsx"),
    route("api/trader-feedback", "routes/api/trader-feedback.tsx"),
    route("api/user-reviews", "routes/api/user-reviews.tsx"),
    route("my-reviews", "routes/my-reviews.tsx"),
    route("api/user-alerts/:userId", "routes/api/user-alerts.$userId.tsx"),
    route(
      "api/user-alerts/:alertId/read",
      "routes/api/user-alerts.$alertId.read.tsx"
    ),
    route(
      "api/user-alerts/:alertId/dismiss",
      "routes/api/user-alerts.$alertId.dismiss.tsx"
    ),
    route(
      "api/user-alerts/:userId/dismiss-all",
      "routes/api/user-alerts.$userId.dismiss-all.tsx"
    ),
    route(
      "api/user-alerts/:userId/preferences",
      "routes/api/user-alerts.$userId.preferences.tsx"
    ),
    route("api/error-analytics", "routes/api/error-analytics.tsx"),
    route("api/pending-submissions", "routes/api/pending-submissions.tsx"),
    route("api/contact-trader", "routes/api/contact-trader.tsx"),

    layout("routes/admin/AdminLayout.tsx", [
      route("admin/", "routes/admin/adminIndex.tsx"),
      route("admin/create-perfume-house", "routes/admin/CreatePerfumeHousePage.tsx"),
      route("admin/create-perfume", "routes/admin/CreatePerfumePage.tsx"),
      route("admin/perfume/:perfumeSlug/edit", "routes/admin/EditPerfumePage.tsx"),
      route(
        "admin/perfume-house/:houseSlug/edit",
        "routes/admin/EditPerfumeHousePage.tsx"
      ),
      route("admin/profile", "routes/admin/profilePage.tsx"),
      route("admin/wishlist", "routes/admin/WishlistPage.tsx"),
      route("admin/my-scents", "routes/admin/MyScents.tsx"),
      route("admin/data-quality", "routes/admin/data-quality.tsx"),
      route("admin/users", "routes/admin/users.tsx"),
      route("admin/security-monitor", "routes/admin/security-monitor.tsx"),
      route("admin/performance-admin", "routes/admin/performance-admin.tsx"),
      route("admin/error-analytics", "routes/admin.error-analytics.tsx"),
      route("admin/change-password", "routes/admin/change-password.tsx"),
      route("admin/pending-submissions", "routes/admin/pending-submissions.tsx"),
    ]),

    layout("routes/login/LoginLayout.tsx", [
      route("sign-up", "routes/login/SignUpPage.tsx"),
      route("sign-in", "routes/login/SignInPage.tsx"),
    ]),
  ]),
] satisfies RouteConfig
