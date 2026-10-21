/**
 * The on-device database's schema, the local counterpart of `supabase/migrations/`.
 * Append a migration to change it; never edit one that has shipped, since phones that
 * already ran it won't run it again. Tables mirror their Supabase ones, minus `user_id`:
 * the whole file belongs to the one person using the phone. Primary keys match too, so
 * marking something twice is harmless here as it is there. Days are YYYY-MM-DD text and
 * times ISO text, which sort the same way they read.
 */
export class LocalSchema {
  static readonly FILE_NAME = 'tern.db';

  static readonly MIGRATIONS: readonly string[] = [
    // 1: everything the app stores
    `CREATE TABLE settings (
       id INTEGER PRIMARY KEY CHECK (id = 1),
       data TEXT NOT NULL,
       updated_at TEXT NOT NULL
     );

     CREATE TABLE food_entries (
       id TEXT PRIMARY KEY,
       logged_on TEXT NOT NULL,
       meal TEXT NOT NULL,
       name TEXT NOT NULL,
       brand TEXT,
       servings REAL NOT NULL,
       serving_label TEXT NOT NULL,
       calories REAL NOT NULL,
       protein REAL NOT NULL,
       carbs REAL NOT NULL,
       fat REAL NOT NULL,
       tier INTEGER NOT NULL,
       tier_overridden INTEGER NOT NULL DEFAULT 0,
       measure TEXT,
       created_at TEXT NOT NULL
     );
     CREATE INDEX food_entries_logged_on ON food_entries (logged_on);
     CREATE TABLE skipped_meals (
       day TEXT NOT NULL,
       meal TEXT NOT NULL,
       PRIMARY KEY (day, meal)
     );

     CREATE TABLE saved_meals (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       items TEXT NOT NULL,
       created_at TEXT NOT NULL,
       updated_at TEXT NOT NULL
     );

     CREATE TABLE weight_entries (
       id TEXT PRIMARY KEY,
       lb REAL NOT NULL,
       logged_at TEXT NOT NULL
     );
     CREATE INDEX weight_entries_logged_at ON weight_entries (logged_at);
     CREATE TABLE skipped_weigh_ins (day TEXT PRIMARY KEY);

     CREATE TABLE waypoint_events (
       source TEXT NOT NULL,
       day TEXT NOT NULL,
       points INTEGER NOT NULL,
       PRIMARY KEY (source, day)
     );
     CREATE INDEX waypoint_events_day ON waypoint_events (day);

     CREATE TABLE rest_days (day TEXT PRIMARY KEY);

     CREATE TABLE medication_doses (
       medication_id TEXT NOT NULL,
       day TEXT NOT NULL,
       PRIMARY KEY (medication_id, day)
     );

     CREATE TABLE water_entries (
       id TEXT PRIMARY KEY,
       oz REAL NOT NULL,
       logged_on TEXT NOT NULL,
       logged_at TEXT NOT NULL
     );
     CREATE INDEX water_entries_logged_on ON water_entries (logged_on);

     CREATE TABLE mood_checkins (
       day TEXT PRIMARY KEY,
       mood INTEGER NOT NULL,
       stress INTEGER NOT NULL,
       updated_at TEXT NOT NULL
     );

     CREATE TABLE meal_checkins (
       day TEXT NOT NULL,
       meal TEXT NOT NULL,
       fullness INTEGER NOT NULL,
       feeling INTEGER NOT NULL,
       note TEXT,
       updated_at TEXT NOT NULL,
       PRIMARY KEY (day, meal)
     );

     CREATE TABLE movement_entries (
       id TEXT PRIMARY KEY,
       day TEXT NOT NULL,
       activity TEXT NOT NULL,
       minutes INTEGER NOT NULL,
       effort TEXT,
       distance_m REAL,
       logged_at TEXT NOT NULL
     );
     CREATE INDEX movement_entries_day ON movement_entries (day)`,
  ];

  /** Every table holding the person's data, for export and "delete my data". */
  static readonly DATA_TABLES = [
    'settings',
    'food_entries',
    'skipped_meals',
    'saved_meals',
    'weight_entries',
    'skipped_weigh_ins',
    'waypoint_events',
    'rest_days',
    'medication_doses',
    'water_entries',
    'mood_checkins',
    'meal_checkins',
    'movement_entries',
  ] as const;
}
