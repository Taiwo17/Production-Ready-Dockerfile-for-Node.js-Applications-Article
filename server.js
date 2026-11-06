const express = require('express')
const mysql = require('mysql2/promise')
require('dotenv').config()

const server = express()
const PORT = process.env.PORT || 3000

server.use(express.json())

// Database setup
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
})

// Check database connection
async function testConnection() {
  try {
    const connection = await db.getConnection()
    console.log('Connected to MySQL successfully')
    connection.release()
  } catch (error) {
    console.error('Database connection failed:', error.message)
  }
}

testConnection()

// Validation
function validateRecipe(data) {
  if (!data.title || typeof data.title !== 'string') {
    return 'Title is required and must be a string'
  }

  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    return 'Ingredients must be a non-empty array'
  }

  return null
}

// Home route
server.get('/', (req, res) => {
  res.status(200).json({
    message: 'Home route',
  })
})

// Create recipe
server.post('/api/recipes', async (req, res) => {
  try {
    const error = validateRecipe(req.body)

    if (error) {
      return res.status(400).json({ error })
    }

    const { title, ingredients } = req.body

    const [result] = await db.execute(
      'INSERT INTO recipes (title, ingredients) VALUES (?, ?)',
      [title, JSON.stringify(ingredients)],
    )

    res.status(201).json({
      id: result.insertId,
      title,
      ingredients,
    })
  } catch (error) {
    console.error('Create recipe error:', error.message)
    res.status(500).json({ error: 'Database error' })
  }
})

// Get all recipes
server.get('/api/recipes', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM recipes')
    res.status(200).json(rows)
  } catch (error) {
    console.error('Fetch recipes error:', error.message)
    res.status(500).json({ error: 'Database error' })
  }
})

// Get single recipe
server.get('/api/recipes/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM recipes WHERE id = ?', [
      req.params.id,
    ])

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Recipe not found',
      })
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error('Fetch recipe error:', error.message)
    res.status(500).json({ error: 'Database error' })
  }
})

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Recipe server running on port ${PORT}`)
})
