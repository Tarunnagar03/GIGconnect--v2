# GigConnect

GigConnect is a modern, enterprise-grade hyperlocal freelance marketplace designed to connect world-class professionals with growing businesses right in their neighborhood.

## 🚀 Features
*   **Role-Based Dashboards:** Distinct and personalized interfaces for Clients, Freelancers, and Admins.
*   **End-to-End Escrow & Payments:** Integrated with Stripe for secure milestone and fixed payments.
*   **Real-time Collaboration:** Live chat, presence tracking, and file attachments powered by Socket.io.
*   **Project Pipeline:** Kanban-style visual tracking for proposals and active jobs.
*   **AI Integration:** Smart-matching of gigs based on skills and automated cover letter generation.

## 📦 Installation & Setup

1.  **Clone & Install Dependencies**
    ```bash
    cd server && npm install
    cd ../client && npm install
    ```
2.  **Environment Variables**
    Ensure you configure your `.env` securely in the `/server` directory (MongoDB, JWT, Stripe).

3. Navigate to the project directory:
   ```bash
   cd gigconnect-v2
   ```

4. Install dependencies for both client and server:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

5. Set up environment variables:
   - Create `.env` files in both `client` and `server` directories.
   - Add the required keys (e.g., `MONGO_URI`, `JWT_SECRET`, `STRIPE_KEYS`).

6. Start the development servers:
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
