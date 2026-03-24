require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

console.log('🚀 Тест подключения к PostgreSQL')
console.log('URL:', process.env.DATABASE_URL)

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Подключаемся...')
    await prisma.$connect()
    console.log('✅ УСПЕШНО ПОДКЛЮЧИЛИСЬ!')
    
    const result = await prisma.$queryRaw`SELECT 1+1 as sum`
    console.log('✅ Запрос выполнен:', result)
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()