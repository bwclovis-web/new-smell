import path from 'path'

import { ROUTE_PATH as CREATE_HOUSE } from '~/routes/admin/CreatePerfumeHousePage'
import { ROUTE_PATH as CREATE_PERFUME } from '~/routes/admin/CreatePerfumePage'
import { ROUTE_PATH as MY_SCENTS } from '~/routes/admin/MyScents'
import { ROUTE_PATH as WISHLIST } from '~/routes/admin/Wishlist'
import { ROUTE_PATH as ALL_HOUSES } from '~/routes/all-houses'
import { ROUTE_PATH as ALL_PERFUMES } from '~/routes/all-perfumes'

export const mainNavigation = [
  {
    id: '1',
    key: 'houses',
    label: 'Perfume Houses',
    path: ALL_HOUSES
  },
  {
    id: '2',
    key: 'perfumes',
    label: 'Perfumes',
    path: ALL_PERFUMES
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
