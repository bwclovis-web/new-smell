import { ROUTE_PATH as CREATE_HOUSE } from '~/routes/admin/CreatePerfumeHousePage'
import { ROUTE_PATH as CREATE_PERFUME } from '~/routes/admin/CreatePerfumePage'
import { ROUTE_PATH as DATA_QUALITY } from '~/routes/admin/data-quality'
import { ROUTE_PATH as MY_SCENTS } from '~/routes/admin/MyScents'
import { ROUTE_PATH as WISHLIST } from '~/routes/admin/WishlistPage'
import { ROUTE_PATH as ALL_HOUSES } from '~/routes/behind-the-bottle'
import { ROUTE_PATH as ALL_PERFUMES } from '~/routes/the-vault'
import { ROUTE_PATH as AVAILABLE_PERFUMES } from '~/routes/the-exchange'

export const mainNavigation = [
  {
    id: '1',
    key: 'houses',
    label: 'Behind the Bottle',
    path: ALL_HOUSES
  },
  {
    id: '2',
    key: 'perfumes',
    label: 'Perfumes',
    path: ALL_PERFUMES
  },
  {
    id: '3',
    key: 'available',
    label: 'Available for Decanting',
    path: AVAILABLE_PERFUMES
  }
]

export const adminNavigation = [
  {
    id: '1',
    label: 'create house',
    path: CREATE_HOUSE
  },
  {
    id: '2',
    label: 'create perfume',
    path: CREATE_PERFUME
  },
  {
    id: '3',
    label: 'data quality',
    path: DATA_QUALITY
  }
]

export const profileNavigation = [
  {
    id: '1',
    label: 'My Wishlist',
    path: WISHLIST
  },
  {
    id: '2',
    label: 'My Scents',
    path: MY_SCENTS
  }
]
