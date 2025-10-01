# AnomFIN PHP Backend - Visual Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTP/HTTPS
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                        Web Server                                │
│                    (Apache/Nginx/PHP)                           │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
             │                               │
   ┌─────────▼──────────┐         ┌─────────▼──────────┐
   │  installation.php  │         │ test_backend.php   │
   │                    │         │                    │
   │  Setup Wizard      │         │  System Tests      │
   │  • Collect config  │         │  • PHP version     │
   │  • Test DB         │         │  • Extensions      │
   │  • Create .env     │         │  • Files check     │
   └─────────┬──────────┘         └────────────────────┘
             │
             │ Creates
             │
   ┌─────────▼──────────┐
   │     .env file      │
   │                    │
   │  Configuration:    │
   │  • DB credentials  │
   │  • AI API keys     │
   │  • Security keys   │
   └─────────┬──────────┘
             │
             │ Loaded by
             │
   ┌─────────▼──────────┐
   │   connect.php      │
   │                    │
   │  DB Connection:    │
   │  • Load .env       │
   │  • Singleton PDO   │
   │  • Connection test │
   └─────────┬──────────┘
             │
             │ Used by
             │
   ┌─────────▼──────────────────────────────────┐
   │           ai_connect.php                   │
   │                                            │
   │  AI Service Integration:                  │
   │  • Web Interface                          │
   │  • AJAX API Endpoints                     │
   │  • Query Management                       │
   │  • History Logging                        │
   └─────┬──────────────────────┬───────────────┘
         │                      │
         │                      │
         │                      │
   ┌─────▼──────────┐    ┌─────▼──────────┐
   │  MySQL/MariaDB │    │   OpenAI API   │
   │                │    │                │
   │  • User data   │    │  • AI queries  │
   │  • Query logs  │    │  • Responses   │
   │  • Analytics   │    │  • Models      │
   └────────────────┘    └────────────────┘
```

## File Flow Diagram

```
Installation Flow:
==================

1. test_backend.php
   │
   ├─ Check System Requirements
   │  ├─ PHP Version ✓
   │  ├─ Extensions ✓
   │  └─ Files ✓
   │
   └─ [Run Installation] Button
      │
      ▼
2. installation.php
   │
   ├─ Display Form
   │  ├─ Database Fields
   │  └─ AI API Fields
   │
   ├─ User Submits Form
   │
   ├─ Validate Inputs
   │  ├─ CSRF Token ✓
   │  ├─ Sanitize Inputs ✓
   │  └─ Format Check ✓
   │
   ├─ Test Database Connection
   │  └─ [Success/Fail]
   │
   └─ Create .env File (600 permissions)
      │
      ▼
3. .env Created
   │
   └─ Ready for Use!


Usage Flow:
===========

1. ai_connect.php
   │
   ├─ Include connect.php
   │  │
   │  ├─ Load .env
   │  └─ Create DB Connection
   │
   ├─ Display Interface
   │  ├─ Test Connection
   │  ├─ Send Query
   │  └─ View History
   │
   └─ Handle AJAX Requests
      │
      ├─ action=test
      │  └─ Test AI API
      │
      ├─ action=query
      │  ├─ Send to OpenAI
      │  └─ Log to Database
      │
      └─ action=history
         └─ Fetch from Database
```

## Data Flow

```
Query Processing:
=================

User Input
   │
   ├─ Web Interface (ai_connect.php)
   │
   ▼
AJAX Request
   │
   ├─ JSON: { csrf_token, message, system_prompt }
   │
   ▼
AIConnection Class
   │
   ├─ Validate CSRF Token
   ├─ Prepare Messages
   │
   ▼
cURL Request
   │
   ├─ Headers: Authorization Bearer API_KEY
   ├─ Body: { model, messages, max_tokens, temperature }
   │
   ▼
OpenAI API
   │
   ├─ Process Query
   ├─ Generate Response
   │
   ▼
Response
   │
   ├─ Parse JSON
   ├─ Extract Content
   │
   ▼
Database Logging (Parallel)
   │
   ├─ INSERT INTO ai_query_logs
   ├─ Store: query, response, model, IP, user_agent
   │
   ▼
Return to User
   │
   └─ Display Response
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Layer 1: Input                        │
│  • CSRF Token Validation                                │
│  • Input Sanitization (filter_input)                   │
│  • XSS Prevention (htmlspecialchars)                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Layer 2: Application                      │
│  • Session Management                                   │
│  • Rate Limiting (can be added)                        │
│  • Error Handling (no data leaks)                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 Layer 3: Database                        │
│  • Prepared Statements (SQL injection prevention)      │
│  • Connection Pooling                                  │
│  • Timeout Protection                                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Layer 4: File System                      │
│  • .env with 600 permissions                           │
│  • .gitignore protection                               │
│  • No direct file access                              │
└─────────────────────────────────────────────────────────┘
```

## Component Interaction Matrix

```
┌──────────────────┬──────────┬──────────┬──────────┬─────────┐
│                  │ .env.    │ connect. │install.  │ai_conn. │
│                  │ example  │ php      │ php      │ php     │
├──────────────────┼──────────┼──────────┼──────────┼─────────┤
│ .env.example     │    -     │    ✗     │    ✓     │    ✗    │
│ (template)       │          │          │ (reads)  │         │
├──────────────────┼──────────┼──────────┼──────────┼─────────┤
│ connect.php      │    ✗     │    -     │    ✗     │    ✓    │
│ (DB handler)     │          │          │          │(requires)│
├──────────────────┼──────────┼──────────┼──────────┼─────────┤
│ installation.php │    ✓     │    ✗     │    -     │    ✗    │
│ (setup)          │ (ref)    │          │          │         │
├──────────────────┼──────────┼──────────┼──────────┼─────────┤
│ ai_connect.php   │    ✗     │    ✓     │    ✗     │    -    │
│ (AI service)     │          │(requires)│          │         │
├──────────────────┼──────────┼──────────┼──────────┼─────────┤
│ test_backend.php │    ✗     │    ✓     │    ✗     │    ✗    │
│ (testing)        │          │  (opt)   │          │         │
└──────────────────┴──────────┴──────────┴──────────┴─────────┘

Legend: ✓ = Uses/Requires, ✗ = No direct interaction
```

## Database Schema Overview

```sql
┌─────────────────────────────────────────────────────────────────┐
│                      ai_query_logs                              │
├──────────────────┬──────────────────────────────────────────────┤
│ Column           │ Type                  │ Description          │
├──────────────────┼──────────────────────┼─────────────────────┤
│ id               │ INT AUTO_INCREMENT   │ Primary key         │
│ query_text       │ TEXT NOT NULL        │ User's question     │
│ response_text    │ TEXT NOT NULL        │ AI's response       │
│ model            │ VARCHAR(100)         │ AI model used       │
│ created_at       │ TIMESTAMP            │ Query timestamp     │
│ ip_address       │ VARCHAR(45)          │ Client IP           │
│ user_agent       │ TEXT                 │ Browser info        │
├──────────────────┴──────────────────────┴─────────────────────┤
│ Indexes:                                                        │
│  - PRIMARY KEY (id)                                            │
│  - INDEX idx_created_at (created_at)                           │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoint Map

```
ai_connect.php API Endpoints:
==============================

POST /ai_connect.php?action=test
├─ Input: { csrf_token }
├─ Process: Test OpenAI connection
└─ Output: { success, message, details }

POST /ai_connect.php?action=query
├─ Input: { csrf_token, message, system_prompt }
├─ Process: 
│  ├─ Send to OpenAI API
│  ├─ Receive response
│  └─ Log to database
└─ Output: { success, response, model, usage }

POST /ai_connect.php?action=history
├─ Input: { csrf_token }
├─ Process: Query database for recent logs
└─ Output: { success, history: [...] }
```

## File Size & Complexity

```
File                      Size      Lines    Complexity
──────────────────────────────────────────────────────────
.env.example              468 B      22      ⬜ Simple
connect.php               4.2 KB    172      ⬜⬜ Moderate
installation.php         16.3 KB    357      ⬜⬜⬜ Complex
ai_connect.php           21.9 KB    526      ⬜⬜⬜⬜ Advanced
test_backend.php          9.9 KB    273      ⬜⬜ Moderate
PHP_BACKEND_README.md     8.0 KB    306      📝 Documentation
QUICK_START.md            4.7 KB    182      📝 Documentation
IMPLEMENTATION_DETAILS   10.5 KB    427      📝 Documentation
──────────────────────────────────────────────────────────
TOTAL                    76.0 KB   2,265    
```

## Error Handling Flow

```
User Action
   │
   ▼
Try Block
   │
   ├─ Success Path
   │  └─ Return Result
   │
   ├─ PDOException (Database)
   │  ├─ Log error
   │  ├─ Generic user message
   │  └─ Return error response
   │
   ├─ cURL Error (Network)
   │  ├─ Log error
   │  ├─ User-friendly message
   │  └─ Return error response
   │
   └─ General Exception
      ├─ Log error
      ├─ Safe error message
      └─ Return error response
```

## Testing Checklist

```
✓ PHP Syntax Validation
  ✓ connect.php
  ✓ installation.php
  ✓ ai_connect.php
  ✓ test_backend.php

✓ Security Features
  ✓ CSRF protection implemented
  ✓ Input sanitization active
  ✓ SQL injection prevention
  ✓ XSS prevention
  ✓ .env file protection

✓ Functionality
  ✓ Environment loading works
  ✓ Database connection works
  ✓ Installation wizard works
  ✓ AI service integration works
  ✓ Query logging works

✓ Documentation
  ✓ README complete
  ✓ Quick start guide
  ✓ Implementation details
  ✓ Code comments
  ✓ API documentation
```

## Deployment Steps

```
1. Prerequisites
   ├─ Install PHP 7.4+
   ├─ Install MySQL/MariaDB
   ├─ Install required PHP extensions
   └─ Configure web server

2. Upload Files
   ├─ Copy PHP files to web root
   ├─ Copy .env.example
   └─ Set permissions (644 for PHP, 755 for directories)

3. Database Setup
   ├─ Create database
   ├─ Create user
   └─ Grant privileges

4. Run Installation
   ├─ Navigate to test_backend.php
   ├─ Verify requirements
   ├─ Run installation.php
   └─ Fill configuration form

5. Verify
   ├─ Check .env created (600 permissions)
   ├─ Test database connection
   ├─ Test AI connection
   └─ View query history

6. Production
   ├─ Set APP_ENV=production
   ├─ Set APP_DEBUG=false
   ├─ Enable HTTPS
   ├─ Remove/protect test_backend.php
   └─ Set up monitoring
```

## System Requirements Summary

```
Software Requirements:
├─ PHP 7.4 or higher
├─ MySQL 5.7+ / MariaDB 10.2+
├─ Apache/Nginx web server
└─ PHP Extensions:
   ├─ pdo
   ├─ pdo_mysql
   ├─ curl
   ├─ json
   └─ mbstring

API Requirements:
├─ OpenAI API key
├─ Internet connection
└─ Outbound HTTPS access

Server Requirements:
├─ Read/write permissions
├─ SSL certificate (production)
└─ 512MB RAM minimum
```

---

**This visual overview provides a comprehensive understanding of the entire PHP backend system for AnomFIN website.**

© 2025 AnomFIN - All rights reserved
