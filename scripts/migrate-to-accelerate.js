// Migration script to transfer data from local PostgreSQL to Prisma Accelerate
// This script will migrate all data and generate slugs for houses and perfumes

import { PrismaClient } from '@prisma/client'
// Define the slug utility function inline since we can't import TypeScript directly
const createUrlSlug = (name) => {
  if (!name || typeof name !== 'string') {
    return ''
  }

  return name
    // First decode any URL-encoded characters
    .replace(/%20/g, ' ')
    // Replace spaces and other separators with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove any characters that aren't letters, numbers, or hyphens
    .replace(/[^a-zA-Z0-9\-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Convert to lowercase for consistency
    .toLowerCase()
}

// Local database connection (source)
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Toaster69@localhost:5432/new_scent'
    }
  }
})

// Accelerate database connection (destination)
const acceleratePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiNjAyM2MyMjMtNzc1YS00MTA1LWExMmYtZWZjNzg1MjJlOWJmIiwidGVuYW50X2lkIjoiYTk4Nzc2ZTVmNzEzNWVlZWNiMzIwYTMwMjc3ZWFiNzk1ZjkxYjlmZDM3ODNlNzJmMzNlZDgwZDM2YzU0YzNjMSIsImludGVybmFsX3NlY3JldCI6IjU0NTQyODg0LTY0ZDItNGEyNS04YTgxLTY1ODgwOTUwYzFmNyJ9.kd6Lq7bADQ59I_7Kj0sKC_Co1-19NFpNx-5cMSKOG6o'
    }
  }
})

// Track migrated records for reference
const migratedHouses = new Map()
const migratedPerfumes = new Map()

async function migrateUsers() {
  console.log('🔄 Migrating users...')
  
  const users = await localPrisma.user.findMany()
  console.log(`Found ${users.length} users to migrate`)
  
  for (const user of users) {
    try {
      await acceleratePrisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      })
      console.log(`✅ Migrated user: ${user.email}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  User already exists: ${user.email}`)
      } else {
        console.error(`❌ Error migrating user ${user.email}:`, error.message)
      }
    }
  }
  
  console.log('✅ Users migration completed')
}

async function migratePerfumeHouses() {
  console.log('🔄 Migrating perfume houses...')
  
  const houses = await localPrisma.perfumeHouse.findMany()
  console.log(`Found ${houses.length} perfume houses to migrate`)
  
  for (const house of houses) {
    try {
      const slug = createUrlSlug(house.name)
      
      const newHouse = await acceleratePrisma.perfumeHouse.create({
        data: {
          id: house.id,
          name: house.name,
          slug: slug,
          description: house.description,
          image: house.image,
          website: house.website,
          country: house.country,
          founded: house.founded,
          email: house.email,
          phone: house.phone,
          address: house.address,
          type: house.type,
          createdAt: house.createdAt,
          updatedAt: house.updatedAt
        }
      })
      
      migratedHouses.set(house.id, newHouse.id)
      console.log(`✅ Migrated house: ${house.name} -> ${slug}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  House already exists: ${house.name}`)
        // Try to find the existing house
        const existingHouse = await acceleratePrisma.perfumeHouse.findUnique({
          where: { name: house.name }
        })
        if (existingHouse) {
          migratedHouses.set(house.id, existingHouse.id)
        }
      } else {
        console.error(`❌ Error migrating house ${house.name}:`, error.message)
      }
    }
  }
  
  console.log('✅ Perfume houses migration completed')
}

async function migratePerfumes() {
  console.log('🔄 Migrating perfumes...')
  
  const perfumes = await localPrisma.perfume.findMany({
    include: {
      perfumeHouse: true
    }
  })
  console.log(`Found ${perfumes.length} perfumes to migrate`)
  
  for (const perfume of perfumes) {
    try {
      const slug = createUrlSlug(perfume.name)
      
      // Get the migrated house ID
      let perfumeHouseId = null
      if (perfume.perfumeHouseId) {
        perfumeHouseId = migratedHouses.get(perfume.perfumeHouseId)
        if (!perfumeHouseId) {
          console.log(`⚠️  House not found for perfume ${perfume.name}, skipping house relation`)
        }
      }
      
      const newPerfume = await acceleratePrisma.perfume.create({
        data: {
          id: perfume.id,
          name: perfume.name,
          slug: slug,
          description: perfume.description,
          image: perfume.image,
          perfumeHouseId: perfumeHouseId,
          createdAt: perfume.createdAt,
          updatedAt: perfume.updatedAt
        }
      })
      
      migratedPerfumes.set(perfume.id, newPerfume.id)
      console.log(`✅ Migrated perfume: ${perfume.name} -> ${slug}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Perfume already exists: ${perfume.name}`)
        // Try to find the existing perfume
        const existingPerfume = await acceleratePrisma.perfume.findUnique({
          where: { name: perfume.name }
        })
        if (existingPerfume) {
          migratedPerfumes.set(perfume.id, existingPerfume.id)
        }
      } else {
        console.error(`❌ Error migrating perfume ${perfume.name}:`, error.message)
      }
    }
  }
  
  console.log('✅ Perfumes migration completed')
}

async function migratePerfumeNotes() {
  console.log('🔄 Migrating perfume notes...')
  
  const notes = await localPrisma.perfumeNotes.findMany()
  console.log(`Found ${notes.length} perfume notes to migrate`)
  
  for (const note of notes) {
    try {
      await acceleratePrisma.perfumeNotes.create({
        data: {
          id: note.id,
          name: note.name,
          perfumeOpenId: note.perfumeOpenId ? migratedPerfumes.get(note.perfumeOpenId) : null,
          perfumeHeartId: note.perfumeHeartId ? migratedPerfumes.get(note.perfumeHeartId) : null,
          perfumeCloseId: note.perfumeCloseId ? migratedPerfumes.get(note.perfumeCloseId) : null,
          createdAt: note.createdAt
        }
      })
      console.log(`✅ Migrated note: ${note.name}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Note already exists: ${note.name}`)
      } else {
        console.error(`❌ Error migrating note ${note.name}:`, error.message)
      }
    }
  }
  
  console.log('✅ Perfume notes migration completed')
}

async function migrateUserPerfumes() {
  console.log('🔄 Migrating user perfumes...')
  
  const userPerfumes = await localPrisma.userPerfume.findMany()
  console.log(`Found ${userPerfumes.length} user perfumes to migrate`)
  
  for (const userPerfume of userPerfumes) {
    try {
      await acceleratePrisma.userPerfume.create({
        data: {
          id: userPerfume.id,
          userId: userPerfume.userId,
          perfumeId: migratedPerfumes.get(userPerfume.perfumeId) || userPerfume.perfumeId,
          amount: userPerfume.amount,
          available: userPerfume.available,
          price: userPerfume.price,
          placeOfPurchase: userPerfume.placeOfPurchase,
          tradePrice: userPerfume.tradePrice,
          tradePreference: userPerfume.tradePreference,
          tradeOnly: userPerfume.tradeOnly,
          type: userPerfume.type,
          createdAt: userPerfume.createdAt
        }
      })
      console.log(`✅ Migrated user perfume: ${userPerfume.id}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  User perfume already exists: ${userPerfume.id}`)
      } else {
        console.error(`❌ Error migrating user perfume ${userPerfume.id}:`, error.message)
      }
    }
  }
  
  console.log('✅ User perfumes migration completed')
}

async function migrateUserPerfumeRatings() {
  console.log('🔄 Migrating user perfume ratings...')
  
  const ratings = await localPrisma.userPerfumeRating.findMany()
  console.log(`Found ${ratings.length} user perfume ratings to migrate`)
  
  for (const rating of ratings) {
    try {
      await acceleratePrisma.userPerfumeRating.create({
        data: {
          id: rating.id,
          userId: rating.userId,
          perfumeId: migratedPerfumes.get(rating.perfumeId) || rating.perfumeId,
          gender: rating.gender,
          longevity: rating.longevity,
          overall: rating.overall,
          priceValue: rating.priceValue,
          sillage: rating.sillage,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt
        }
      })
      console.log(`✅ Migrated rating: ${rating.id}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Rating already exists: ${rating.id}`)
      } else {
        console.error(`❌ Error migrating rating ${rating.id}:`, error.message)
      }
    }
  }
  
  console.log('✅ User perfume ratings migration completed')
}

async function migrateUserPerfumeReviews() {
  console.log('🔄 Migrating user perfume reviews...')
  
  const reviews = await localPrisma.userPerfumeReview.findMany()
  console.log(`Found ${reviews.length} user perfume reviews to migrate`)
  
  for (const review of reviews) {
    try {
      await acceleratePrisma.userPerfumeReview.create({
        data: {
          id: review.id,
          userId: review.userId,
          perfumeId: migratedPerfumes.get(review.perfumeId) || review.perfumeId,
          review: review.review,
          createdAt: review.createdAt
        }
      })
      console.log(`✅ Migrated review: ${review.id}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Review already exists: ${review.id}`)
      } else {
        console.error(`❌ Error migrating review ${review.id}:`, error.message)
      }
    }
  }
  
  console.log('✅ User perfume reviews migration completed')
}

async function migrateUserPerfumeWishlists() {
  console.log('🔄 Migrating user perfume wishlists...')
  
  const wishlists = await localPrisma.userPerfumeWishlist.findMany()
  console.log(`Found ${wishlists.length} user perfume wishlists to migrate`)
  
  for (const wishlist of wishlists) {
    try {
      await acceleratePrisma.userPerfumeWishlist.create({
        data: {
          id: wishlist.id,
          userId: wishlist.userId,
          isPublic: wishlist.isPublic,
          perfumeId: migratedPerfumes.get(wishlist.perfumeId) || wishlist.perfumeId,
          createdAt: wishlist.createdAt
        }
      })
      console.log(`✅ Migrated wishlist: ${wishlist.id}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Wishlist already exists: ${wishlist.id}`)
      } else {
        console.error(`❌ Error migrating wishlist ${wishlist.id}:`, error.message)
      }
    }
  }
  
  console.log('✅ User perfume wishlists migration completed')
}

async function migrateUserPerfumeComments() {
  console.log('🔄 Migrating user perfume comments...')
  
  const comments = await localPrisma.userPerfumeComment.findMany()
  console.log(`Found ${comments.length} user perfume comments to migrate`)
  
  for (const comment of comments) {
    try {
      await acceleratePrisma.userPerfumeComment.create({
        data: {
          id: comment.id,
          userId: comment.userId,
          perfumeId: migratedPerfumes.get(comment.perfumeId) || comment.perfumeId,
          userPerfumeId: comment.userPerfumeId,
          comment: comment.comment,
          isPublic: comment.isPublic,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        }
      })
      console.log(`✅ Migrated comment: ${comment.id}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Comment already exists: ${comment.id}`)
      } else {
        console.error(`❌ Error migrating comment ${comment.id}:`, error.message)
      }
    }
  }
  
  console.log('✅ User perfume comments migration completed')
}

async function migrateWishlistNotifications() {
  console.log('🔄 Migrating wishlist notifications...')
  
  const notifications = await localPrisma.wishlistNotification.findMany()
  console.log(`Found ${notifications.length} wishlist notifications to migrate`)
  
  for (const notification of notifications) {
    try {
      await acceleratePrisma.wishlistNotification.create({
        data: {
          id: notification.id,
          userId: notification.userId,
          perfumeId: migratedPerfumes.get(notification.perfumeId) || notification.perfumeId,
          notifiedAt: notification.notifiedAt
        }
      })
      console.log(`✅ Migrated notification: ${notification.id}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Notification already exists: ${notification.id}`)
      } else {
        console.error(`❌ Error migrating notification ${notification.id}:`, error.message)
      }
    }
  }
  
  console.log('✅ Wishlist notifications migration completed')
}

async function main() {
  console.log('🚀 Starting migration from local PostgreSQL to Prisma Accelerate...')
  console.log('📊 This will migrate all data and generate slugs for houses and perfumes')
  
  try {
    // Migrate in order to respect foreign key constraints
    await migrateUsers()
    await migratePerfumeHouses()
    await migratePerfumes()
    await migratePerfumeNotes()
    await migrateUserPerfumes()
    await migrateUserPerfumeRatings()
    await migrateUserPerfumeReviews()
    await migrateUserPerfumeWishlists()
    await migrateUserPerfumeComments()
    await migrateWishlistNotifications()
    
    console.log('🎉 Migration completed successfully!')
    console.log(`📈 Migrated ${migratedHouses.size} houses and ${migratedPerfumes.size} perfumes`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await localPrisma.$disconnect()
    await acceleratePrisma.$disconnect()
  }
}

main()
