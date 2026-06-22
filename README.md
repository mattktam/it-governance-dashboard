# IT Governance Dashboard

A comprehensive AWS cost management and IT governance dashboard built with Next.js and Node.js/Express.

## Overview

This project provides real-time visibility into AWS spending, service costs, and cost trends with an intuitive web-based interface.

## Architecture

### Frontend (`/frontend`)
- **Framework**: Next.js 16.2.9 with React 19
- **Styling**: Tailwind CSS
- **Port**: 3000
- **Features**:
  - Real-time AWS cost visualization
  - Top spenders ranking
  - Cost spike detection
  - Time-range filtering (7d, 14d, 30d)
  - Service cost breakdown by owner and application

### Backend (`/backend`)
- **Framework**: Express.js
- **AWS Integration**: AWS Cost Explorer API, Resource Groups Tagging API
- **Port**: 3001
- **Features**:
  - AWS cost data aggregation
  - Service cost analysis
  - Cost spike detection
  - Resource tagging and metadata

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- AWS Account with Cost Explorer access
- AWS credentials configured

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mattktam/it-governance-dashboard.git
   cd it-governance-dashboard
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file in the backend directory:
   ```env
   AWS_REGION=ca-central-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   PORT=3001
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

#### Start Backend
```bash
cd backend
npm start
# Server runs on http://localhost:3001
```

#### Start Frontend (in a new terminal)
```bash
cd frontend
npm run dev
# Dashboard runs on http://localhost:3000
```

Visit `http://localhost:3000` to view the dashboard.

## Environment Variables

### Backend (`.env`)
- `AWS_REGION` - AWS region (default: ca-central-1)
- `AWS_ACCESS_KEY_ID` - AWS IAM access key
- `AWS_SECRET_ACCESS_KEY` - AWS IAM secret key
- `PORT` - Backend server port (default: 3001)

## API Endpoints

- `GET /api/costs?days=<days>` - Get cost data for specified days
- `GET /api/spikes` - Get cost spikes (yesterday vs today)
- `GET /api/tags` - Get available AWS resource tags

## Features

- 📊 Real-time AWS cost tracking
- 💰 Service-level cost breakdown
- 🏆 Top spender rankings
- 📈 Cost trend analysis
- ⚠️ Cost spike detection
- 🏷️ Resource tagging and ownership
- 🎯 Cost center tracking

## Development

### Tech Stack
- React 19 with TypeScript
- Next.js 16 with App Router
- Tailwind CSS 4 for styling
- Express.js backend
- AWS SDK v2

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd backend
npm start
```

## Notes

- The AWS SDK v2 is deprecated; consider migrating to AWS SDK v3
- Ensure AWS credentials have appropriate permissions for Cost Explorer and Resource Groups Tagging APIs
- The dashboard falls back to mock data if AWS connection is unavailable

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
