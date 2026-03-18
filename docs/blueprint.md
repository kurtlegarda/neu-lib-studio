# **App Name**: NEU VisitFlow

## Core Features:

- Secure Google Authentication & User Profiles: Allow users to sign in securely using Google accounts (OAuth). On first login, prompt users to complete their profile (program, college, employee status) to create their Firestore user document. Implement checks for blocked users.
- Role-Based Access Control: Implement two roles ('user', 'admin') stored in Firestore. Protect admin-specific routes, redirecting unauthorized users. The system checks and enforces roles using a custom authentication hook.
- Personalized Visit Logging: Allow logged-in users to log their visits to the library by selecting a reason from a dropdown (with an 'Other' text input) and viewing their personal visit history, including a search filter for their own records.
- Admin Dashboard: Comprehensive Visit Management: Provide administrators with a dashboard displaying all visitor logs. This includes key visitor statistics (today, week, month, all-time), extensive filtering options by reason, college, employee status, and date range, a bar chart for daily visits, and an 'Export to PDF' function for filtered data.
- Admin Dashboard: User Management: Enable administrators to view a table of all registered users, manage their roles ('user'/'admin'), and block/unblock users by updating their 'isBlocked' status in Firestore.
- Admin Quick Visitor Check-in Tool: An administrative tool to quickly search for users by email or RFID, display their information, and log a visit on their behalf with a chosen reason. The tool determines if a user exists based on provided input and then allows logging.

## Style Guidelines:

- The primary brand color, Navy Blue, is #1A237E. This color is used for headers, key interactive elements, and prominent text, reflecting the university's official palette and a professional, academic atmosphere. The HSL value for this color is approximately (238, 69%, 29%).
- The background color is a very subtle and desaturated light blue-grey (#F5F6F8). This color provides a clean, bright backdrop that allows the primary Navy Blue to stand out, maintaining visual clarity and professionalism appropriate for an administrative system. This is derived from the primary color's hue with low saturation and high lightness.
- The accent color, Gold, is #FFD700. This vibrant shade is used sparingly for highlights, calls-to-action, and interactive elements to provide visual interest and reinforce branding, offering a strong contrast against the Navy Blue.
- The main font for both headlines and body text is 'Inter', a modern grotesque sans-serif. Its objective and neutral aesthetic ensures high readability across various UI components, fitting the application's clean and functional design.
- All icons across the application should be sourced from 'lucide-react'. This ensures a consistent, sharp, and modern iconographic style that integrates well with ShadCN UI components and maintains visual harmony.
- The application layout prioritizes full responsiveness, adapting seamlessly to mobile, tablet, and desktop views. Content is structured clearly using ShadCN Card components for data presentation and forms, ensuring usability on all screen sizes.
- Subtle loading spinners are implemented during data fetching operations. These visual cues enhance user experience by indicating active processes and reducing perceived wait times, contributing to a smoother interface.