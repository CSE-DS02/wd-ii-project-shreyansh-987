# PDFify AI - Modern Dashboard

A modern, Canva-inspired dashboard for creating AI-powered PDFs and documents.

## Features

- **Modern Dashboard UI**: Clean, responsive design similar to Canva
- **AI-Powered Content Generation**: Create documents, presentations, and reports with OpenAI
- **User Authentication**: JWT-based login and registration
- **Project Management**: Save and manage your documents
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on all devices

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Custom components with modern UI patterns

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT Authentication
- OpenAI API integration

## Setup Instructions

### Prerequisites
- Node.js 16+
- MongoDB (local or MongoDB Atlas)
- OpenAI API key

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd pdfify-ai
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database
MONGODB_URI=mongodb://localhost:27017/pdfify-ai

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4

# React App
REACT_APP_API_URL=http://localhost:5000
```

### 3. Database Setup

#### Option A: Local MongoDB
Install MongoDB locally and start the service.

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string and update `MONGODB_URI`

### 4. OpenAI API Setup
1. Get your API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env` file

### 5. Run the Application

#### Development Mode
```bash
# Terminal 1: Start the backend
npm run server

# Terminal 2: Start the frontend
npm run dev
```

#### Production Build
```bash
npm run build
npm run server
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Projects
- `GET /api/projects` - Get user's projects
- `GET /api/projects/recent` - Get recent projects
- `POST /api/projects` - Create new project

### AI Services
- `POST /api/document` - Generate structured documents
- `POST /api/chat` - Chat with documents
- `POST /api/generate` - Generate content
- `POST /api/rewrite` - Rewrite text

## Project Structure

```
pdfify-ai/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── context/           # React context
│   ├── services/          # API services
│   └── ...
├── models/                # MongoDB models
├── middleware/            # Express middleware
├── backend/services/      # AI services
├── public/                # Static assets
├── dist/                  # Built frontend
├── webpack.config.js      # Webpack configuration
├── tailwind.config.js     # Tailwind configuration
└── server.js              # Express server
```

## Development

### Adding New Components
1. Create component in `src/components/`
2. Add styles to `src/App.css`
3. Import and use in `App.js`

### API Integration
1. Add methods to `src/services/api.js`
2. Use in components with the API service

### Database Models
1. Create models in `models/` directory
2. Update server.js with new routes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details