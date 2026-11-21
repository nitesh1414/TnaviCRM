-- MySQL 8 JSON-record store used by DB_DRIVER=mysql (separate from the illustrative relational schema.sql).
CREATE TABLE IF NOT EXISTS crm_records (
  collection VARCHAR(64) NOT NULL,
  id VARCHAR(64) NOT NULL,
  data JSON NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  PRIMARY KEY (collection,id),
  KEY idx_collection_created (collection,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS crm_settings (
  id TINYINT PRIMARY KEY,
  data JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
