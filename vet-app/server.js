const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL接続設定（環境変数またはデフォルト）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/vet_db',
});

// データベース接続テスト・テーブル自動作成
pool.query(`
  CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,
    reservation_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.log('DB初期化スキップまたはエラー:', err.message));

// 予約一覧取得API
api_path = '/api/reservations';
app.get('/api/reservations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reservations ORDER BY reservation_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'データベースエラーが発生しました' });
  }
});

// 予約登録API
app.post('/api/reservations', async (req, res) => {
  const { patient_name, reservation_date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO reservations (patient_name, reservation_date) VALUES (\$1, \$2) RETURNING *',
      [patient_name, reservation_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '予約登録に失敗しました' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
