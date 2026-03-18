# NEU VisitFlow - Library Visitor Log System

A full-stack web application built for New Era University (NEU) to track and manage library visitors.

## Features
- **Secure Google Sign-In**: Restricted access for university personnel.
- **Role-Based Access Control**: Admin and User roles with different permissions.
- **Visit Logging**: Simple and intuitive form for users to record their library visits.
- **Admin Dashboard**: Real-time statistics, advanced filtering, and trend visualization.
- **User Management**: Admins can block users or promote them to admin roles.
- **Quick Check-in**: Admin tool to log visits for users via email or RFID.
- **Report Generation**: Export filtered data to professional PDF reports.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, ShadCN UI.
- **Backend**: Firebase Authentication, Cloud Firestore.
- **Charts**: Recharts.
- **Reports**: jsPDF, autoTable.

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up Firebase:
    - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
    - Enable **Google Auth** and **Cloud Firestore**.
    - Copy your Firebase config and paste them into a `.env.local` file.
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:9002](http://localhost:9002) in your browser.

## Deployment
This app is ready to be deployed on Vercel. Connect your repository and add the environment variables to the Vercel dashboard.

---
© 2024 New Era University Library System