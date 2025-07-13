// Debug environment variables
console.log('Environment check:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL:', process.env.DATABASE_URL)
console.log('All env vars containing "DATABASE":', Object.keys(process.env).filter(key => key.includes('DATABASE')).map(key => `${key}: ${process.env[key]}`))
