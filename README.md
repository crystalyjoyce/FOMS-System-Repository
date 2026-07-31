# Capstone 1 and Project Management  
## AI-Powered Financial Intelligence Layer

This repository contains the backend development of the **AI-Powered Financial Intelligence Layer**, developed as part of the **Capstone 1 and Project Management** course requirements.

The project supports the **Finance Operations Management System (FOMS)** by providing AI-assisted duplicate document detection, manual document review, collection forecasting, and collection recommendations.

## Project Overview

The AI-Powered Financial Intelligence Layer is a separate decision-support system connected to FOMS through authorized read-only data access.

The AI layer analyzes financial documents and Accounts Receivable information but does not directly modify official financial records. All AI-generated results must still be reviewed and validated by authorized finance personnel.

This project demonstrates the application of:

- Capstone project development
- Project planning and management
- Requirements analysis
- Backend development
- Database integration
- Artificial intelligence
- API development
- Quality assurance
- Risk management
- Project documentation
- Team collaboration

## Main Features

### 1. Duplicate Document Detection

The system allows users to upload or scan financial documents such as:

- Invoices
- Official receipts
- Proof of payment documents

The AI layer compares the uploaded document with existing records and classifies it as:

- Possible Duplicate
- Needs Manual Review
- Unique Document

### 2. Manual Document Review

Documents with uncertain similarity results are sent to the manual review section.

Authorized users can:

- Compare the uploaded document with an existing document
- Review matched document information
- View the AI-generated similarity score
- Add review remarks
- Mark the document as Duplicate
- Mark the document as Unique

All manual review decisions are recorded in the review history.

### 3. Collection Forecasting

The AI layer analyzes Accounts Receivable records and provides:

- Overdue account prioritization
- Collection risk percentage
- Expected collection status
- Collection priority ranking
- Suggested follow-up actions

### 4. Collection Recommendations

The system provides recommended actions for overdue accounts, such as:

- Send a payment reminder
- Contact the client
- Schedule a follow-up
- Review the client’s payment history
- Prioritize high-risk overdue balances

These recommendations are for decision support only.

### 5. Review History

The system records document checking and manual review activities, including:

- Document name
- Document type
- AI detection result
- Similarity score
- Manual review decision
- Reviewer
- Review remarks
- Date and time of review

### 6. AI Activity Records

The system records important activities performed within the AI layer, such as:

- User login
- Document upload
- Document scanning
- Duplicate detection
- Manual review decisions
- Collection forecasting
- Collection recommendation generation

## Duplicate Detection Thresholds

The AI layer uses the following similarity thresholds:

- Possible Duplicate: 90% and above
- Needs Manual Review: 75% to 89%
- Unique Document: Below 75%

The similarity result is an AI-generated recommendation. Final validation must be completed by an authorized user.

## No-Touch Policy

The AI-Powered Financial Intelligence Layer follows a No-Touch Policy.

This means:

1. The AI layer must not directly modify official FOMS financial records.
2. AI-generated results are recommendations only.
3. Duplicate detection results require human validation.
4. Collection forecasts and recommendations require human evaluation.
5. Final financial actions must be completed by authorized finance personnel.
6. The AI layer must use read-only access when retrieving official FOMS data.
7. The AI layer must not automatically approve, reject, delete, or update financial transactions.
8. Authorized users remain responsible for all final decisions.

## Technology Stack

### Backend

- Python
- FastAPI
- REST API
- Pydantic
- Uvicorn

### AI and Data Processing

- Gemini AI
- Text Embeddings
- Cosine Similarity
- Pandas
- NumPy
- Scikit-learn
- RapidFuzz
- OCR or Document Text Extraction

### Databases

- PostgreSQL
- MongoDB

### Development Tools

- Git
- GitHub
- Docker
- Docker Compose
- Swagger/OpenAPI
- Visual Studio Code

## Database Purpose

### PostgreSQL

PostgreSQL is used for structured AI-layer records, including:

- Unique document records
- Duplicate document records
- Manual review history
- Collection forecasts
- Collection recommendations
- AI activity records

Example database name:

`foms_ai_db`

Example tables:

- `ai_unique_documents`
- `ai_duplicate_documents`
- `ai_review_history`
- `ai_collection_forecasts`
- `ai_collection_recommendations`
- `ai_audit_events`

### MongoDB

MongoDB is used for storing document embeddings and document analysis information.

Example collection:

`document_embeddings`

The collection may contain:

- Document ID
- Document type
- Extracted text
- Embedding values
- Similarity score
- Source record
- AI model used
- Date created

## System Architecture

```text
Finance Operations Management System
                |
                | Read-Only API
                v
AI-Powered Financial Intelligence Layer
                |
                |-- Duplicate Document Detection
                |-- Manual Document Review
                |-- Collection Forecasting
                |-- Collection Recommendations
                |-- AI Activity Records
                |
                v
       AI Results and Alerts
                |
                v
      AI Layer User Interface
