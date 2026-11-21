-- TnaviCRM MySQL Schema (production)
CREATE DATABASE IF NOT EXISTS tnavicrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tnavicrm;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(160) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, role ENUM('admin','manager','employee','viewer') DEFAULT 'employee',
  phone VARCHAR(30), designation VARCHAR(120), active BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
  id CHAR(36) PRIMARY KEY, name VARCHAR(200) NOT NULL, address VARCHAR(300), location VARCHAR(150), city VARCHAR(100), area VARCHAR(150),
  type VARCHAR(60), totalArea DECIMAL(12,2), frontage DECIMAL(10,2), roadConnectivity VARCHAR(200), parking VARCHAR(200), floors VARCHAR(60),
  expectedRent DECIMAL(14,2), securityDeposit DECIMAL(14,2), ownerName VARCHAR(150), ownerContact VARCHAR(40), ownerEmail VARCHAR(160),
  status ENUM('Available','Under Negotiation','Leased') DEFAULT 'Available', description TEXT, assignedTo CHAR(36),
  images JSON, attachments JSON, createdBy CHAR(36), createdByName VARCHAR(120),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status), INDEX idx_city (city), INDEX idx_type (type)
);

CREATE TABLE IF NOT EXISTS brands (
  id CHAR(36) PRIMARY KEY, name VARCHAR(200) NOT NULL, companyName VARCHAR(200), brandName VARCHAR(200), website VARCHAR(255),
  category VARCHAR(120), corporateOffice VARCHAR(255), regionalOffice VARCHAR(255), contactPerson VARCHAR(150), designation VARCHAR(120),
  email VARCHAR(160), mobile VARCHAR(40), relationshipManager CHAR(36), requirements JSON, interestLevel VARCHAR(30), status VARCHAR(30) DEFAULT 'Active',
  createdBy CHAR(36), createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id CHAR(36) PRIMARY KEY, title VARCHAR(250) NOT NULL, brandId CHAR(36), propertyId CHAR(36), source VARCHAR(80),
  status ENUM('New','Contacted','Interested','Negotiation','Approved','Rejected') DEFAULT 'New', assignedTo CHAR(36),
  notes TEXT, followUpDate DATE, createdBy CHAR(36), createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status), INDEX idx_brand (brandId), INDEX idx_property (propertyId)
);

CREATE TABLE IF NOT EXISTS meetings (
  id CHAR(36) PRIMARY KEY, title VARCHAR(250) NOT NULL, brandId CHAR(36), propertyId CHAR(36), date DATE, time VARCHAR(20),
  venue VARCHAR(255), purpose VARCHAR(255), participants JSON, responsible CHAR(36), agenda TEXT, minutes TEXT,
  status VARCHAR(30) DEFAULT 'Scheduled', type VARCHAR(40) DEFAULT 'Meeting',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communications (
  id CHAR(36) PRIMARY KEY, brandId CHAR(36), propertyId CHAR(36), type ENUM('Phone Call','Email','WhatsApp','Meeting','Site Visit','Other') DEFAULT 'Phone Call',
  date DATE, time VARCHAR(20), employeeId CHAR(36), notes TEXT, feedback TEXT, nextFollowUp DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposals (
  id CHAR(36) PRIMARY KEY, title VARCHAR(250) NOT NULL, brandId CHAR(36), propertyId CHAR(36), proposedRent DECIMAL(14,2),
  securityDeposit DECIMAL(14,2), leasePeriod INT, escalation VARCHAR(120), terms TEXT, stage VARCHAR(40) DEFAULT 'Draft',
  status VARCHAR(30) DEFAULT 'Draft', counterOffers JSON, assignedTo CHAR(36),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leases (
  id CHAR(36) PRIMARY KEY, propertyId CHAR(36), brandId CHAR(36), tenantName VARCHAR(200), commencementDate DATE, expiryDate DATE,
  monthlyRent DECIMAL(14,2), securityDeposit DECIMAL(14,2), escalation VARCHAR(120), renewalDate DATE, status VARCHAR(30) DEFAULT 'Active', agreementDoc VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id CHAR(36) PRIMARY KEY, title VARCHAR(250) NOT NULL, category VARCHAR(80), propertyId CHAR(36), brandId CHAR(36),
  fileName VARCHAR(255), fileUrl VARCHAR(500), notes TEXT, uploadedBy CHAR(36),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY, title VARCHAR(250) NOT NULL, assignedTo CHAR(36), brandId CHAR(36), propertyId CHAR(36),
  priority ENUM('Low','Medium','High') DEFAULT 'Medium', status ENUM('Pending','In Progress','Completed') DEFAULT 'Pending',
  dueDate DATE, description TEXT, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY, userId CHAR(36), title VARCHAR(250), message TEXT, type VARCHAR(40), relatedId CHAR(36), `read` BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activityLogs (
  id CHAR(36) PRIMARY KEY, userId CHAR(36), userName VARCHAR(150), action VARCHAR(60), entity VARCHAR(60), entityId CHAR(36), details TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
