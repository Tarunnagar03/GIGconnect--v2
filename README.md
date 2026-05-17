# GigConnect v2

GigConnect is a platform designed to connect freelancers and clients, enabling seamless collaboration on projects. This repository contains the second version of the platform, featuring enhanced functionality, modern design, and improved performance.

## Features

### For Clients:
- Post gigs with detailed descriptions, budgets, and required skills.
- Browse and hire freelancers based on their profiles and proposals.
- Manage ongoing projects and track milestones.
- Secure payments through Stripe integration.
- Review freelancers after project completion.

### For Freelancers:
- Create and manage profiles showcasing skills and experience.
- Browse available gigs and submit proposals.
- Track assigned projects and deliverables.
- Receive payments securely through the platform.
- Get recommendations for gigs matching your skills.

### Admin Dashboard:
- Manage users, gigs, and transactions.
- View platform statistics and generate reports.
- Handle contact messages and oversee platform activity.

## Tech Stack

### Frontend:
- **React**: For building the user interface.
- **React Router**: For navigation.
- **Tailwind CSS**: For styling.
- **Vite**: For fast development and build.

### Backend:
- **Node.js**: For server-side logic.
- **Express.js**: For building RESTful APIs.
- **MongoDB**: For database management.
- **Mongoose**: For MongoDB object modeling.
- **Socket.IO**: For real-time communication.
- **Stripe**: For payment processing.

### DevOps:
- **GitHub**: For version control.
- **Heroku/Other Hosting Services**: For deployment.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Tarunnagar03/GIGconnect--v2.git
   ```

2. Navigate to the project directory:
   ```bash
   cd gigconnect-v2
   ```

3. Install dependencies for both client and server:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

4. Set up environment variables:
   - Create `.env` files in both `client` and `server` directories.
   - Add the required keys (e.g., `MONGO_URI`, `JWT_SECRET`, `STRIPE_KEYS`).

5. Start the development servers:
   ```bash
   npm run dev
   ```

## Folder Structure

```
.
├── client/                # Frontend code
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Application pages
│   │   ├── context/      # Context API for state management
│   │   ├── utils/        # Utility functions
│   └── public/           # Static assets
├── server/                # Backend code
│   ├── controllers/      # API controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Middleware functions
│   ├── utils/            # Utility functions
│   └── config/           # Configuration files
└── README.md              # Project documentation
```

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contact

For any inquiries or support, please contact:
- **Name**: Tarun Nagar
- **Email**: [youremail@example.com](mailto:youremail@example.com)
- **GitHub**: [Tarunnagar03](https://github.com/Tarunnagar03)