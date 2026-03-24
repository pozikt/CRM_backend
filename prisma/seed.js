require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')
  console.log('📁 База данных:', process.env.DATABASE_URL)

  try {
    // Очищаем существующие данные в правильном порядке
    console.log('🧹 Очищаем старые данные...')
    
    await prisma.meetingParticipants.deleteMany()
    await prisma.meeting.deleteMany()
    await prisma.project.deleteMany()
    await prisma.employee.deleteMany()
    await prisma.user.deleteMany()
    await prisma.projectStatus.deleteMany()
    await prisma.projectPriority.deleteMany()
    
    console.log('✅ Очистка завершена')

    // ===== СПРАВОЧНИКИ =====
    
    // Приоритеты
    const priorities = await prisma.projectPriority.createMany({
      data: [
        { name: 'Высокий', order: 1, color: '#FF4444' },
        { name: 'Средний', order: 2, color: '#FFBB33' },
        { name: 'Низкий', order: 3, color: '#00C851' },
        { name: 'Без приоритета', order: 4, color: '#AAAAAA' }
      ]
    })
    console.log('✅ Приоритеты созданы')

    // Статусы
    const statuses = await prisma.projectStatus.createMany({
      data: [
        { name: 'Черновик', isDefault: true },
        { name: 'В работе', isDefault: false },
        { name: 'На паузе', isDefault: false },
        { name: 'Завершён', isDefault: false },
        { name: 'Отменён', isDefault: false },
        { name: 'На согласовании', isDefault: false },
        { name: 'Тестирование', isDefault: false }
      ]
    })
    console.log('✅ Статусы созданы')

    // Получаем ID для связей
    const priorityMap = {
      high: await prisma.projectPriority.findFirst({ where: { name: 'Высокий' } }),
      medium: await prisma.projectPriority.findFirst({ where: { name: 'Средний' } }),
      low: await prisma.projectPriority.findFirst({ where: { name: 'Низкий' } }),
      none: await prisma.projectPriority.findFirst({ where: { name: 'Без приоритета' } })
    }

    const statusMap = {
      draft: await prisma.projectStatus.findFirst({ where: { name: 'Черновик' } }),
      progress: await prisma.projectStatus.findFirst({ where: { name: 'В работе' } }),
      pause: await prisma.projectStatus.findFirst({ where: { name: 'На паузе' } }),
      completed: await prisma.projectStatus.findFirst({ where: { name: 'Завершён' } }),
      cancelled: await prisma.projectStatus.findFirst({ where: { name: 'Отменён' } }),
      review: await prisma.projectStatus.findFirst({ where: { name: 'На согласовании' } }),
      testing: await prisma.projectStatus.findFirst({ where: { name: 'Тестирование' } })
    }

    // ===== СОТРУДНИКИ =====
    
    const employees = await prisma.employee.createMany({
      data: [
        { fullName: 'Иванов Иван Иванович', role: 'PM', telegram: '@ivanov_pm', email: 'ivanov@company.ru', isActive: true },
        { fullName: 'Петрова Мария Сергеевна', role: 'Dev', telegram: '@petrova_dev', email: 'petrova@company.ru', isActive: true },
        { fullName: 'Сидоров Алексей Петрович', role: 'Design', telegram: '@sidorov_design', email: 'sidorov@company.ru', isActive: true },
        { fullName: 'Козлова Елена Дмитриевна', role: 'Dev', telegram: '@kozlova_dev', email: 'kozlova@company.ru', isActive: true },
        { fullName: 'Морозов Дмитрий Александрович', role: 'PM', telegram: '@morozov_pm', email: 'morozov@company.ru', isActive: true },
        { fullName: 'Волкова Анна Игоревна', role: 'Intern', telegram: '@volkova_intern', email: 'volkova@company.ru', isActive: true },
        { fullName: 'Соколов Павел Андреевич', role: 'Dev', telegram: '@sokolov_dev', email: 'sokolov@company.ru', isActive: false },
        { fullName: 'Новикова Татьяна Сергеевна', role: 'Design', telegram: '@novikova_design', email: 'novikova@company.ru', isActive: true },
        { fullName: 'Фёдоров Артём Валерьевич', role: 'Dev', telegram: '@fedorov_dev', email: 'fedorov@company.ru', isActive: true }
      ]
    })
    console.log('✅ Сотрудники созданы')

    // Получаем всех сотрудников для назначения
    const allEmployees = await prisma.employee.findMany()
    const [ivanov, petrova, sidorov, kozlova, morozov, volkova, sokolov, novikova, fedorov] = allEmployees

    // ===== ПРОЕКТЫ =====
    
    const projects = [
      // Активные проекты
      {
        name: 'Разработка CRM для банка',
        description: 'Создание системы управления взаимоотношениями с клиентами для регионального банка. Включает модули: клиентская база, кредитный конвейер, отчётность.',
        statusId: statusMap.progress.id,
        priorityId: priorityMap.high.id,
        managerId: ivanov.id,
        startDate: new Date('2025-01-15'),
        deadlineDate: new Date('2025-06-30'),
        progress: 65,
        clientName: 'АО "Банк Развитие"',
        clientContact: 'project@bank.ru',
        tags: 'bank,finance,crm'
      },
      {
        name: 'Интернет-магазин электроники',
        description: 'Разработка e-commerce платформы с каталогом, корзиной, интеграцией с 1С и платёжными системами.',
        statusId: statusMap.progress.id,
        priorityId: priorityMap.high.id,
        managerId: morozov.id,
        startDate: new Date('2025-02-01'),
        deadlineDate: new Date('2025-08-15'),
        progress: 40,
        clientName: 'ООО "ТехноМир"',
        clientContact: 'shop@technomir.ru',
        tags: 'ecommerce,retail'
      },
      {
        name: 'Мобильное приложение для доставки еды',
        description: 'React Native приложение для iOS и Android. Заказ еды, отслеживание курьера, интеграция с картами.',
        statusId: statusMap.testing.id,
        priorityId: priorityMap.high.id,
        managerId: ivanov.id,
        startDate: new Date('2025-03-10'),
        deadlineDate: new Date('2025-07-01'),
        progress: 85,
        clientName: 'ООО "ФудЭкспресс"',
        clientContact: 'dev@foodexpress.ru',
        tags: 'mobile,food,react-native'
      },

      // Проекты на паузе
      {
        name: 'Автоматизация складского учёта',
        description: 'WMS система для логистического центра. Управление запасами, сканерами ШК, интеграция с 1С.',
        statusId: statusMap.pause.id,
        priorityId: priorityMap.medium.id,
        managerId: morozov.id,
        startDate: new Date('2024-11-01'),
        deadlineDate: new Date('2025-05-01'),
        progress: 30,
        clientName: 'АО "Логистик-Центр"',
        clientContact: 'it@logistic.ru',
        tags: 'logistics,wms'
      },
      {
        name: 'Корпоративный портал',
        description: 'Внутренний портал для сотрудников с новостями, документами, заявками на отпуск.',
        statusId: statusMap.pause.id,
        priorityId: priorityMap.medium.id,
        managerId: ivanov.id,
        startDate: new Date('2025-01-20'),
        deadlineDate: new Date('2025-06-01'),
        progress: 25,
        clientName: 'Внутренний проект',
        clientContact: 'hr@company.ru',
        tags: 'internal,portal'
      },

      // Завершённые проекты
      {
        name: 'Редизайн сайта компании',
        description: 'Обновление дизайна и улучшение UX корпоративного сайта, адаптивная вёрстка.',
        statusId: statusMap.completed.id,
        priorityId: priorityMap.low.id,
        managerId: sidorov.id,
        startDate: new Date('2024-09-01'),
        deadlineDate: new Date('2024-12-15'),
        actualEndDate: new Date('2024-12-10'),
        progress: 100,
        clientName: 'ООО "Ромашка"',
        clientContact: 'info@romashka.ru',
        tags: 'design,website'
      },
      {
        name: 'Интеграция с платежным шлюзом',
        description: 'Подключение нового платёжного провайдера к существующему интернет-магазину.',
        statusId: statusMap.completed.id,
        priorityId: priorityMap.high.id,
        managerId: petrova.id,
        startDate: new Date('2024-10-10'),
        deadlineDate: new Date('2024-11-30'),
        actualEndDate: new Date('2024-11-25'),
        progress: 100,
        clientName: 'ООО "ТехноМир"',
        clientContact: 'shop@technomir.ru',
        tags: 'payment,integration'
      },

      // Черновики
      {
        name: 'Чат-бот для поддержки',
        description: 'Telegram бот для автоматизации ответов на частые вопросы клиентов.',
        statusId: statusMap.draft.id,
        priorityId: priorityMap.medium.id,
        managerId: fedorov.id,
        startDate: null,
        deadlineDate: null,
        progress: 0,
        clientName: 'Внутренний проект',
        clientContact: 'support@company.ru',
        tags: 'bot,telegram'
      },
      {
        name: 'Аналитическая панель',
        description: 'Дашборд для руководства с ключевыми метриками продаж в реальном времени.',
        statusId: statusMap.draft.id,
        priorityId: priorityMap.high.id,
        managerId: kozlova.id,
        startDate: null,
        deadlineDate: null,
        progress: 0,
        clientName: 'Внутренний проект',
        clientContact: 'ceo@company.ru',
        tags: 'analytics,dashboard'
      },

      // На согласовании
      {
        name: 'Облачное хранилище для клиентов',
        description: 'Разработка white-label облачного хранилища с файловым менеджером и шарингом.',
        statusId: statusMap.review.id,
        priorityId: priorityMap.high.id,
        managerId: morozov.id,
        startDate: new Date('2025-03-01'),
        deadlineDate: new Date('2025-09-01'),
        progress: 15,
        clientName: 'ООО "КлаудСервис"',
        clientContact: 'sales@cloudservice.ru',
        tags: 'cloud,storage'
      },

      // Отменённые
      {
        name: 'Разработка игры',
        description: 'Мобильная игра в жанре головоломки. Проект закрыт из-за смены приоритетов.',
        statusId: statusMap.cancelled.id,
        priorityId: priorityMap.none.id,
        managerId: sokolov.id,
        startDate: new Date('2024-06-01'),
        deadlineDate: new Date('2024-12-01'),
        actualEndDate: new Date('2024-08-15'),
        progress: 20,
        clientName: 'Стартап',
        clientContact: 'founder@game.ru',
        tags: 'game,cancelled'
      }
    ]

    for (const projectData of projects) {
      await prisma.project.create({ data: projectData })
    }
    console.log(`✅ Создано ${projects.length} проектов`)

    // ===== ВСТРЕЧИ =====
    
    const allProjects = await prisma.project.findMany()
    
    // Создаём встречи для некоторых проектов
    const meetings = [
      {
        title: 'Стартовое совещание',
        scheduledDateTime: new Date('2025-01-16T11:00:00'),
        status: 'held',
        meetingLink: 'https://zoom.us/j/123456',
        notes: 'Обсудили требования, распределили задачи',
        projectId: allProjects[0].id,
        participants: [ivanov.id, petrova.id, sidorov.id]
      },
      {
        title: 'Еженедельный статус',
        scheduledDateTime: new Date('2025-03-05T10:30:00'),
        status: 'held',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        notes: 'Демонстрация текущих результатов',
        projectId: allProjects[0].id,
        participants: [ivanov.id, petrova.id]
      },
      {
        title: 'Планирование спринта',
        scheduledDateTime: new Date('2025-03-12T14:00:00'),
        status: 'planned',
        meetingLink: 'https://zoom.us/j/654321',
        notes: 'Планирование задач на следующий спринт',
        projectId: allProjects[1].id,
        participants: [morozov.id, kozlova.id, fedorov.id]
      },
      {
        title: 'Демо заказчику',
        scheduledDateTime: new Date('2025-03-01T15:00:00'),
        status: 'held',
        meetingLink: 'https://zoom.us/j/789012',
        notes: 'Показали прототип, получен положительный отзыв',
        projectId: allProjects[2].id,
        participants: [ivanov.id, kozlova.id]
      },
      {
        title: 'Ретроспектива',
        scheduledDateTime: new Date('2025-02-28T16:00:00'),
        status: 'cancelled',
        meetingLink: null,
        notes: 'Отменено из-за болезни участников',
        projectId: allProjects[3].id,
        participants: [morozov.id, petrova.id]
      }
    ]

    for (const meetingData of meetings) {
      const { participants, ...meetingInfo } = meetingData
      const meeting = await prisma.meeting.create({ data: meetingInfo })
      
      // Добавляем участников
      for (const employeeId of participants) {
        await prisma.meetingParticipants.create({
          data: {
            meetingId: meeting.id,
            employeeId
          }
        })
      }
    }
    
    console.log(`✅ Создано ${meetings.length} встреч`)

    console.log('\n🎉 База данных успешно заполнена!')
    console.log(`📊 Итого:`)
    console.log(`   - ${await prisma.projectPriority.count()} приоритетов`)
    console.log(`   - ${await prisma.projectStatus.count()} статусов`)
    console.log(`   - ${await prisma.employee.count()} сотрудников`)
    console.log(`   - ${await prisma.project.count()} проектов`)
    console.log(`   - ${await prisma.meeting.count()} встреч`)

  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()