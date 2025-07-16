# AusJobs - Australian Job Search Platform

AusJobs is a comprehensive job search platform specifically designed for the Australian market. This AI-powered application connects job seekers with employers across Australia, offering entry-level opportunities and advanced resume optimization tools. Whether you're a newcomer to Australia or an experienced professional, AusJobs simplifies the job search process with intelligent matching and localized features.

## Key Features

- **🔍 Advanced Job Search**: Search and filter jobs by title, location, job type, and salary range
- **📍 Location-Based Filtering**: Browse opportunities across Australian states and cities
- **📄 AI-Powered Resume Analysis**: Upload, review, and optimize resumes for the Australian job market
- **👤 User Authentication**: Secure registration and login system with session management
- **💳 Payment Integration**: Stripe-powered payment system for premium career advice services
- **📱 Responsive Design**: Modern, mobile-first interface built with Tailwind CSS
- **🏢 Employer Services**: Job posting and candidate management tools
- **💼 Career Advice**: Professional consultation services and career guidance
- **🎯 Personalized Experience**: Customized job recommendations and user profiles

## Technology Stack

### Frontend
- **React 18** - Modern JavaScript framework
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible UI components
- **shadcn/ui** - Beautiful, reusable components
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **Stripe.js** - Payment processing integration
- **Lucide React** - Icon library
- **PDF.js** - PDF viewing capabilities

### Backend
- **Flask** - Python web framework
- **PyMongo** - MongoDB driver for Python
- **Flask-Session** - Server-side session support
- **Flask-Bcrypt** - Password hashing
- **Flask-CORS** - Cross-origin resource sharing
- **GridFS** - MongoDB file storage system
- **Redis** - Session storage and caching
- **Python Slugify** - URL-friendly string generation

### Database & Infrastructure
- **MongoDB** - Document-based database
- **Redis** - In-memory data structure store
- **GridFS** - File storage system for large files

## Installation and Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v4.4 or higher)
- **Redis** (v6.0 or higher)

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/ausjobs
   SECRET_KEY=your-secret-key-here
   REDIS_URL=redis://127.0.0.1:6379
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   ```

5. **Start the Flask server:**
   ```bash
   python server.py
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

### Database Setup

1. **Start MongoDB and Redis services:**
   ```bash
   # MongoDB (varies by OS)
   mongod

   # Redis
   redis-server
   ```

2. **The application will automatically create necessary collections on first run.**

## Project Structure

```
australia_jobs/
├── backend/                    # Flask backend application
│   ├── auth/                  # Authentication blueprints and logic
│   ├── cities/                # City management endpoints
│   ├── jobs/                  # Job-related API endpoints
│   ├── jobtypes/              # Job type management
│   ├── resume/                # Resume upload and processing
│   ├── states/                # State/location management
│   ├── users/                 # User management endpoints
│   ├── constants.py           # Application constants
│   ├── extensions.py          # Flask extension initialization
│   ├── requirements.txt       # Python dependencies
│   └── server.py             # Main Flask application
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── atoms/         # Basic UI elements
│   │   │   ├── molecules/     # Composed components
│   │   │   ├── organisms/     # Complex components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── datasets/          # Static data files
│   │   ├── imgs/             # Image assets
│   │   ├── lib/              # Utility functions
│   │   ├── pages/            # Application pages/routes
│   │   ├── App.jsx           # Main application component
│   │   ├── httpClient.js     # Axios configuration
│   │   └── main.jsx          # Application entry point
│   ├── package.json          # Node.js dependencies
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── vite.config.js        # Vite build configuration
└── README.md                  # Project documentation
```

## Usage Examples

### Basic Job Search
```javascript
// Search for jobs by title and location
const searchJobs = async (title, location) => {
  const response = await httpClient.get(
    `http://localhost:5000/jobs/get?title=${title}&location=${location}`
  );
  return response.data;
};
```

### User Authentication
```javascript
// User login
const loginUser = async (email, password) => {
  const response = await httpClient.post(
    "http://localhost:5000/auth/login",
    { email, password }
  );
  return response.data;
};

// Get current user
const getCurrentUser = async () => {
  const response = await httpClient.get(
    "http://localhost:5000/auth/@me"
  );
  return response.data;
};
```

### Resume Upload
```javascript
// Upload resume file
const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await httpClient.post(
    "http://localhost:5000/resume/upload",
    formData
  );
  return response.data;
};
```

### Running the Application

1. **Start all services:**
   ```bash
   # Terminal 1: Backend
   cd backend && python server.py

   # Terminal 2: Frontend
   cd frontend && npm run dev

   # Terminal 3: MongoDB
   mongod

   # Terminal 4: Redis
   redis-server
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/@me` - Get current user

### Jobs
- `GET /jobs/get` - Search jobs
- `GET /jobs/:slug` - Get job details
- `POST /jobs/add` - Add new job

### Resume
- `POST /resume/upload` - Upload resume
- `GET /resume/current` - Get current user's resume

### Locations
- `GET /cities/get_main` - Get major cities
- `GET /states/get_all` - Get all states

## Contributing Guidelines

We welcome contributions to AusJobs! Please follow these guidelines:

### Getting Started
1. **Fork the repository** and create a new branch for your feature
2. **Clone your fork** locally and set up the development environment
3. **Make your changes** following our coding standards

### Code Standards
- **Frontend**: Use ESLint configuration provided in `.eslintrc.cjs`
- **Backend**: Follow PEP 8 Python style guidelines
- **Components**: Use functional components with hooks
- **API**: Follow RESTful conventions

### Pull Request Process
1. **Update documentation** for any new features
2. **Add tests** for new functionality where applicable
3. **Ensure all tests pass** and the application builds successfully
4. **Submit a pull request** with a clear description of changes

### Reporting Issues
- Use GitHub Issues to report bugs or request features
- Provide detailed reproduction steps for bugs
- Include screenshots for UI-related issues

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Support

For support, please contact the development team or create an issue in the GitHub repository.

**Made with ❤️ for the Australian job market** 