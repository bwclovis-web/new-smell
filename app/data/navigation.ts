import { ROUTE_PATH as ABOUT_US } from "~/routes/about-us"
import { ROUTE_PATH as CONTACT_US } from "~/routes/contact-us"
// Inline path to avoid circular dependency (route imports pull in navigation via layout/components)
const ERROR_ANALYTICS = "/admin/error-analytics"
import { ROUTE_PATH as CHANGE_PASSWORD } from "~/routes/admin/change-password"
import { ROUTE_PATH as CREATE_HOUSE } from "~/routes/admin/CreatePerfumeHousePage"
import { ROUTE_PATH as CREATE_PERFUME } from "~/routes/admin/CreatePerfumePage"
import { ROUTE_PATH as DATA_QUALITY } from "~/routes/admin/data-quality"
import { ROUTE_PATH as MY_SCENTS } from "~/routes/admin/MyScents"
import { ROUTE_PATH as PENDING_SUBMISSIONS } from "~/routes/admin/pending-submissions"
import { ROUTE_PATH as PERFORMANCE_ADMIN } from "~/routes/admin/performance-admin"
import { ROUTE_PATH as SECURITY_MONITOR } from "~/routes/admin/security-monitor"
import { ROUTE_PATH as USERS } from "~/routes/admin/users"
import { ROUTE_PATH as WISHLIST } from "~/routes/admin/WishlistPage"
import { ROUTE_PATH as HOW_WE_WORK } from "~/routes/how-we-work"
import { ROUTE_PATH as AVAILABLE_PERFUMES } from "~/routes/the-exchange"
import { ROUTE_PATH as ALL_PERFUMES } from "~/routes/the-vault"

const ALL_HOUSES = "/behind-the-bottle"

export const mainNavigation = [
  {
    id: "1",
    key: "houses",
    label: "Behind the Bottle",
    path: ALL_HOUSES,
  },
  {
    id: "2",
    key: "perfumes",
    label: "Perfumes",
    path: ALL_PERFUMES,
  },
  {
    id: "3",
    key: "available",
    label: "Available for Decanting",
    path: AVAILABLE_PERFUMES,
  },
]

export const aboutNavigation = [
  {
    id: "1",
    key: "aboutUs",
    label: "About Us",
    path: ABOUT_US,
  },
  {
    id: "2",
    key: "howWeWork",
    label: "How We Work",
    path: HOW_WE_WORK,
  },
  {
    id: "3",
    key: "contactUs",
    label: "Contact Us",
    path: CONTACT_US,
  },
]

export const adminNavigation = [
  {
    id: "1",
    label: "create house",
    key: "createHouse",
    path: CREATE_HOUSE,
  },
  {
    id: "2",
    label: "create perfume",
    key: "createPerfume",
    path: CREATE_PERFUME,
  },
  {
    id: "3",
    label: "data quality",
    key: "dataQuality",
    path: DATA_QUALITY,
  },
  {
    id: "4",
    label: "user management",
    key: "userManagement",
    path: USERS,
  },
  {
    id: "5",
    label: "security monitor",
    key: "securityMonitor",
    path: SECURITY_MONITOR,
  },
  {
    id: "6",
    label: "performance admin",
    key: "performanceAdmin",
    path: PERFORMANCE_ADMIN,
  },
  {
    id: "7",
    label: "error analytics",
    key: "errorAnalytics",
    path: ERROR_ANALYTICS,
  },
  {
    id: "8",
    label: "pending submissions",
    key: "pendingSubmissions",
    path: PENDING_SUBMISSIONS,
  },
]

export const profileNavigation = [
  {
    id: "1",
    label: "My Wishlist",
    key: "wishlist",
    path: WISHLIST,
  },
  {
    id: "2",
    label: "My Scents",
    key: "myScents",
    path: MY_SCENTS,
  },
  {
    id: "3",
    label: "Change Password",
    key: "changePassword",
    path: CHANGE_PASSWORD,
  },
]
