require('dotenv').config();
const { Pool } = require('pg');

function getPoolConfig() {
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
  };
}

async function run() {
  const pool = new Pool(getPoolConfig());

  try {
    console.log('Applying migration: subjects.code -> 4000 series, subjects.course_no -> legacy subject code');

    await pool.query('BEGIN');

    await pool.query(`
      ALTER TABLE public.subjects
      ADD COLUMN IF NOT EXISTS course_no TEXT;
    `);

    await pool.query(`
      UPDATE public.subjects
      SET course_no = code
      WHERE (course_no IS NULL OR btrim(course_no) = '')
        AND code IS NOT NULL;
    `);

    await pool.query(`
      WITH ordered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) AS rn
        FROM public.subjects
      )
      UPDATE public.subjects AS s
      SET code = (3999 + ordered.rn)::text
      FROM ordered
      WHERE s.id = ordered.id;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'subjects_course_no_key'
        ) THEN
          ALTER TABLE public.subjects
          ADD CONSTRAINT subjects_course_no_key UNIQUE (course_no);
        END IF;
      END
      $$;
    `);

    await pool.query('COMMIT');
    console.log('Migration applied successfully.');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
