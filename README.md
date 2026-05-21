# GigConnect

GigConnect is a modern, enterprise-grade hyperlocal freelance marketplace designed to connect world-class professionals with growing businesses right in their neighborhood.

## 🚀 Features
*   **Role-Based Dashboards:** Distinct and personalized interfaces for Clients, Freelancers, and Admans.
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

3.  **Run Development Servers**
    ```bash
    # Start backend
    cd server && npm run dev
    # Start frontend
    cd client && npm run dev
    ```
*(Note: The vite dev server proxies `/api` calls directly to the local node backend).*