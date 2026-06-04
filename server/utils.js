const db = require('./db')

// Reusable fragment for fetching a schedule with its nested weeks and workouts
const SCHEDULE_SELECT = `
  SELECT
    ts.id, ts.name, ts.training_start_date, ts.created_at, ts.updated_at, ts.user_id,
    COALESCE(
      json_agg(
        json_build_object(
          'id', sw.id,
          'schedule_id', sw.schedule_id,
          'week_number', sw.week_number,
          'mileage_goal', sw.mileage_goal,
          'actual_mileage', sw.actual_mileage,
          'created_at', sw.created_at,
          'updated_at', sw.updated_at,
          'schedule_workouts', (
            SELECT COALESCE(
              json_agg(
                json_build_object(
                  'id', swo.id,
                  'week_id', swo.week_id,
                  'workout_id', swo.workout_id,
                  'completed', swo.completed,
                  'completed_date', swo.completed_date,
                  'completed_notes', swo.completed_notes,
                  'created_at', swo.created_at,
                  'workout_library', (
                    SELECT to_json(wl.*)
                    FROM workout_library wl
                    WHERE wl.id = swo.workout_id
                  )
                ) ORDER BY swo.created_at
              ), '[]'::json
            )
            FROM schedule_workouts swo
            WHERE swo.week_id = sw.id
          )
        ) ORDER BY sw.week_number
      ) FILTER (WHERE sw.id IS NOT NULL),
      '[]'::json
    ) AS schedule_weeks
  FROM training_schedules ts
  LEFT JOIN schedule_weeks sw ON sw.schedule_id = ts.id
`

async function fetchScheduleById(scheduleId) {
  const result = await db.query(
    SCHEDULE_SELECT + ' WHERE ts.id = $1 GROUP BY ts.id',
    [scheduleId]
  )
  return result.rows[0] || null
}

module.exports = { SCHEDULE_SELECT, fetchScheduleById }
