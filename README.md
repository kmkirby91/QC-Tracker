# QC Tracker

A comprehensive Quality Control tracking application for managing inspections, tests, and quality assurance processes.

## Features

- Track QC checks across multiple categories (inspection, testing, verification, validation, audit)
- Manage check status and priority levels
- User authentication and role-based access control
- Real-time updates and notifications
- File attachments and comments
- Dashboard with analytics and reporting

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- RESTful API architecture

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- React Query for data fetching
- Zustand for state management

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kmkirby91/QC-Tracker.git
cd QC-Tracker
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start MongoDB (if running locally)

2. Start the backend server:
```bash
cd backend
npm run dev
```

3. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

4. Open http://localhost:3000 in your browser

## Project Structure

```
QC-Tracker/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.js
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   └── package.json
├── database/
│   └── schema.sql
└── README.md
```

## API Endpoints

- `GET /api/health` - Health check
- More endpoints coming soon...

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.