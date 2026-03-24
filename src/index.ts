import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// Проверка сервера
app.get('/', (req, res) => {
  res.json({ message: 'CRM API работает!' })
})

// ============= ПРОЕКТЫ (ПОЛНЫЙ CRUD) =============

// Получить все проекты (с фильтрацией)
app.get('/api/projects', async (req, res) => {
  try {
    const { statusId, priorityId, managerId, search } = req.query
    
    // Строим where для фильтрации
    const where: any = {}
    if (statusId) where.statusId = Number(statusId)
    if (priorityId) where.priorityId = Number(priorityId)
    if (managerId) where.managerId = Number(managerId)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } }
      ]
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        status: true,
        priority: true,
        manager: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    res.json(projects)
  } catch (error) {
    console.error('Ошибка:', error)
    res.status(500).json({ error: 'Ошибка при получении проектов' })
  }
})

// Получить один проект по ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        status: true,
        priority: true,
        manager: true,
        meetings: {
          include: {
            participants: {
              include: {
                employee: true
              }
            }
          }
        }
      }
    })
    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' })
    }
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении проекта' })
  }
})

// Создать новый проект
app.post('/api/projects', async (req, res) => {
  try {
    const {
      name,
      description,
      statusId,
      priorityId,
      managerId,
      startDate,
      deadlineDate,
      progress,
      clientName,
      clientContact,
      tags
    } = req.body

    // Валидация обязательных полей
    if (!name || !statusId || !priorityId) {
      return res.status(400).json({ 
        error: 'Необходимо указать название, статус и приоритет' 
      })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        statusId: Number(statusId),
        priorityId: Number(priorityId),
        managerId: managerId ? Number(managerId) : null,
        startDate: startDate ? new Date(startDate) : null,
        deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
        progress: progress ? Number(progress) : 0,
        clientName,
        clientContact,
        tags
      },
      include: {
        status: true,
        priority: true,
        manager: true
      }
    })
    res.status(201).json(project)
  } catch (error) {
    console.error('Ошибка создания:', error)
    res.status(500).json({ error: 'Ошибка при создании проекта' })
  }
})

// Обновить проект
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      description,
      statusId,
      priorityId,
      managerId,
      startDate,
      deadlineDate,
      actualStartDate,
      actualEndDate,
      budget,
      spentHours,
      progress,
      clientName,
      clientContact,
      tags
    } = req.body

    // Проверяем, существует ли проект
    const existingProject = await prisma.project.findUnique({
      where: { id: Number(id) }
    })

    if (!existingProject) {
      return res.status(404).json({ error: 'Проект не найден' })
    }

    const project = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        statusId: statusId ? Number(statusId) : undefined,
        priorityId: priorityId ? Number(priorityId) : undefined,
        managerId: managerId ? Number(managerId) : null,
        startDate: startDate ? new Date(startDate) : null,
        deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
        actualStartDate: actualStartDate ? new Date(actualStartDate) : null,
        actualEndDate: actualEndDate ? new Date(actualEndDate) : null,
        budget: budget ? Number(budget) : null,
        spentHours: spentHours ? Number(spentHours) : null,
        progress: progress ? Number(progress) : 0,
        clientName,
        clientContact,
        tags
      },
      include: {
        status: true,
        priority: true,
        manager: true
      }
    })
    res.json(project)
  } catch (error) {
    console.error('Ошибка обновления:', error)
    res.status(500).json({ error: 'Ошибка при обновлении проекта' })
  }
})

// Удалить проект
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Проверяем, есть ли связанные встречи
    const meetings = await prisma.meeting.findMany({
      where: { projectId: Number(id) }
    })

    if (meetings.length > 0) {
      // Сначала удаляем участников встреч
      for (const meeting of meetings) {
        await prisma.meetingParticipants.deleteMany({
          where: { meetingId: meeting.id }
        })
      }
      // Потом удаляем встречи
      await prisma.meeting.deleteMany({
        where: { projectId: Number(id) }
      })
    }

    // Удаляем проект
    await prisma.project.delete({
      where: { id: Number(id) }
    })
    
    res.json({ success: true, message: 'Проект удалён' })
  } catch (error) {
    console.error('Ошибка удаления:', error)
    res.status(500).json({ error: 'Ошибка при удалении проекта' })
  }
})

// ============= СОТРУДНИКИ =============

// Получить всех сотрудников
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { isActive: true }
    })
    res.json(employees)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении сотрудников' })
  }
})

// Создать сотрудника
app.post('/api/employees', async (req, res) => {
  try {
    const { fullName, role, telegram, email, notes } = req.body
    
    if (!fullName || !role) {
      return res.status(400).json({ 
        error: 'Необходимо указать ФИО и роль' 
      })
    }

    const employee = await prisma.employee.create({
      data: {
        fullName,
        role,
        telegram,
        email,
        notes,
        isActive: true
      }
    })
    res.status(201).json(employee)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании сотрудника' })
  }
})

// Обновить сотрудника
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { fullName, role, telegram, email, isActive, notes } = req.body

    const employee = await prisma.employee.update({
      where: { id: Number(id) },
      data: {
        fullName,
        role,
        telegram,
        email,
        isActive,
        notes
      }
    })
    res.json(employee)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении сотрудника' })
  }
})

// ============= ВСТРЕЧИ =============

// Получить все встречи
app.get('/api/meetings', async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      include: {
        project: {
          select: { id: true, name: true }
        },
        participants: {
          include: {
            employee: {
              select: { id: true, fullName: true }
            }
          }
        }
      },
      orderBy: {
        scheduledDateTime: 'desc'
      }
    })
    res.json(meetings)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении встреч' })
  }
})

// Создать встречу
app.post('/api/meetings', async (req, res) => {
  try {
    const { title, scheduledDateTime, projectId, meetingLink, notes, participantIds } = req.body

    if (!title || !scheduledDateTime || !projectId) {
      return res.status(400).json({ 
        error: 'Необходимо указать название, дату и проект' 
      })
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        scheduledDateTime: new Date(scheduledDateTime),
        projectId: Number(projectId),
        meetingLink,
        notes,
        status: 'planned'
      }
    })

    // Добавляем участников, если они указаны
    if (participantIds && participantIds.length > 0) {
      for (const employeeId of participantIds) {
        await prisma.meetingParticipants.create({
          data: {
            meetingId: meeting.id,
            employeeId: Number(employeeId)
          }
        })
      }
    }

    res.status(201).json(meeting)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании встречи' })
  }
})

// Добавить участника на встречу
app.post('/api/meetings/:meetingId/participants/:employeeId', async (req, res) => {
  try {
    const { meetingId, employeeId } = req.params
    const participant = await prisma.meetingParticipants.create({
      data: {
        meetingId: Number(meetingId),
        employeeId: Number(employeeId)
      }
    })
    res.json(participant)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при добавлении участника' })
  }
})

// Удалить участника со встречи
app.delete('/api/meetings/:meetingId/participants/:employeeId', async (req, res) => {
  try {
    const { meetingId, employeeId } = req.params
    await prisma.meetingParticipants.deleteMany({
      where: {
        meetingId: Number(meetingId),
        employeeId: Number(employeeId)
      }
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении участника' })
  }
})

// ============= СПРАВОЧНИКИ =============

// Получить все статусы проектов
app.get('/api/statuses', async (req, res) => {
  try {
    const statuses = await prisma.projectStatus.findMany()
    res.json(statuses)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении статусов' })
  }
})

// Создать новый статус
app.post('/api/statuses', async (req, res) => {
  try {
    const { name, isDefault } = req.body
    const status = await prisma.projectStatus.create({
      data: { name, isDefault: isDefault || false }
    })
    res.status(201).json(status)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании статуса' })
  }
})

// Получить все приоритеты
app.get('/api/priorities', async (req, res) => {
  try {
    const priorities = await prisma.projectPriority.findMany({
      orderBy: { order: 'asc' }
    })
    res.json(priorities)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении приоритетов' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`)
  console.log(`📚 API доступно по адресу http://localhost:${PORT}/api`)
  console.log(`\n📌 Доступные endpoints:`)
  console.log(`   GET    /api/projects              - список проектов`)
  console.log(`   GET    /api/projects/:id           - проект по ID`)
  console.log(`   POST   /api/projects              - создать проект`)
  console.log(`   PUT    /api/projects/:id           - обновить проект`)
  console.log(`   DELETE /api/projects/:id           - удалить проект`)
  console.log(`   GET    /api/employees              - список сотрудников`)
  console.log(`   GET    /api/meetings               - список встреч`)
  console.log(`   GET    /api/statuses               - список статусов`)
  console.log(`   GET    /api/priorities             - список приоритетов`)
})